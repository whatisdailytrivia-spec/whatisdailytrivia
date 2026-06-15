const express = require("express");
const path    = require("path");
const cron    = require("node-cron");
const app     = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

// ─── Upstash Redis helpers ────────────────────────────────────────────────────

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
}

const redis = async (cmd) => {
  const res = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
};

const dbGet = async (key) => {
  const result = await redis(["GET", key]);
  return result === null ? null : result;
};

const dbSet = async (key, value) => {
  await redis(["SET", key, value]);
};

const dbDelete = async (key) => {
  await redis(["DEL", key]);
};

const dbList = async (prefix = "") => {
  const pattern = prefix ? `${prefix}*` : "*";
  const keys = [];
  let cursor = "0";
  do {
    const result = await redis(["SCAN", cursor, "MATCH", pattern, "COUNT", "200"]);
    cursor = String(result[0]);
    if (result[1] && result[1].length) keys.push(...result[1]);
  } while (cursor !== "0");
  return keys;
};

// ─── Date helpers (always EST) ────────────────────────────────────────────────

const getESTDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());

const getESTMonthKey = () => getESTDate().slice(0, 7);

// ─── Daily cron — 6:00 AM Eastern ────────────────────────────────────────────

cron.schedule("0 6 * * *", async () => {
  const dateStr  = getESTDate();
  const monthKey = getESTMonthKey();
  const dayNum   = parseInt(dateStr.slice(8), 10);
  console.log(`[CRON daily] Running for ${dateStr} (day ${dayNum})`);
  try {
    const override = await dbGet(`qoverride:${dateStr}`);
    if (override) {
      await dbSet(`question:${dateStr}`, override);
      await updateArchive(dateStr, JSON.parse(override));
      await dbDelete("cron_alert");
      return console.log(`[CRON daily] Published override for ${dateStr}`);
    }
    const bankRaw = await dbGet(`question_bank:${monthKey}`);
    if (!bankRaw) return await setCronAlert("no_bank", `No bank for ${monthKey}`, dateStr);
    const bank     = JSON.parse(bankRaw);
    const question = bank[dayNum - 1];
    if (!question || !question.question || question.answer === "N/A" ||
        question.question === "Past question — not published.")
      return await setCronAlert("no_question", `No valid question at index ${dayNum - 1}`, dateStr);
    const published = { ...question, id: `q_${dateStr}`, publishedAt: Date.now() };
    await dbSet(`question:${dateStr}`, JSON.stringify(published));
    await updateArchive(dateStr, question);
    await dbDelete("cron_alert");
    const daysLeft = bank.filter((q, i) => i >= dayNum && q && q.question &&
      q.answer !== "N/A" && q.question !== "Past question — not published.").length;
    if (daysLeft <= 3) await setCronAlert("bank_low", `Only ${daysLeft} question(s) left in ${monthKey}`, dateStr);
    console.log(`[CRON daily] Published "${question.answer}" for ${dateStr}`);
  } catch (e) {
    console.error("[CRON daily] Error:", e.message);
    await setCronAlert("error", e.message, dateStr);
  }
}, { timezone: "America/New_York" });

// ─── Monthly cron — midnight on the 1st ──────────────────────────────────────

cron.schedule("0 0 1 * *", async () => {
  console.log("[CRON monthly] Archiving leaderboard...");
  try {
    const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    const lbRaw = await dbGet(`leaderboard:${prevKey}`);
    if (lbRaw) {
      const lb = JSON.parse(lbRaw);
      if (lb.length > 0) {
        await dbSet(`halloffame:${prevKey}`, lbRaw);
        console.log(`[CRON monthly] Winner: ${lb[0].username} (${lb[0].points} pts)`);
      }
    }
    console.log("[CRON monthly] Done.");
  } catch (e) { console.error("[CRON monthly] Error:", e.message); }
}, { timezone: "America/New_York" });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function updateArchive(dateStr, q) {
  await dbSet(`archive:${dateStr}`, JSON.stringify({
    date: dateStr,
    question: q.question,
    answer: q.answer,
    displayAnswer: q.displayAnswer || q.answer,
    category: q.category || "Wildcard",
    points: q.points || 200,
  }));
  const idxRaw = await dbGet("archive_index");
  const idx    = idxRaw ? JSON.parse(idxRaw) : [];
  if (!idx.includes(dateStr)) await dbSet("archive_index", JSON.stringify([dateStr, ...idx]));
}

async function setCronAlert(type, message, dateStr) {
  await dbSet("cron_alert", JSON.stringify({ type, message, date: dateStr, ts: Date.now() }));
  console.error(`[CRON] ALERT (${type}): ${message}`);
}

// ─── Storage API routes ───────────────────────────────────────────────────────

app.get("/api/storage/:key", async (req, res) => {
  try {
    const value = await dbGet(req.params.key);
    if (value === null) return res.status(404).json({ error: "Not found" });
    res.json({ key: req.params.key, value });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/storage", async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "key is required" });
    await dbSet(key, value);
    res.json({ key, value });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/storage/:key", async (req, res) => {
  try {
    await dbDelete(req.params.key);
    res.json({ key: req.params.key, deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/storage", async (req, res) => {
  try {
    const keys = await dbList(req.query.prefix || "");
    res.json({ keys });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`WhatIs... server running on port ${PORT}`);
  console.log(`DB: ${UPSTASH_URL ? "Upstash Redis connected" : "NO DB CONFIGURED"}`);
  console.log(`Cron: daily 6am EST + monthly reset`);
});
