const express = require("express");
const path    = require("path");
const cron    = require("node-cron");
const app     = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

const DB_URL = process.env.REPLIT_DB_URL;
if (!DB_URL) console.error("REPLIT_DB_URL not found.");

// ─── Replit DB helpers ────────────────────────────────────────────────────────

const dbGet = async (key) => {
  const res = await fetch(`${DB_URL}/${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  return res.text();
};

const dbSet = async (key, value) => {
  await fetch(DB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
  });
};

const dbDelete = async (key) => {
  await fetch(`${DB_URL}/${encodeURIComponent(key)}`, { method: "DELETE" });
};

const dbList = async (prefix = "") => {
  const res  = await fetch(`${DB_URL}?prefix=${encodeURIComponent(prefix)}&encode=true`);
  const text = await res.text();
  return text.split("\n").filter(Boolean).map(decodeURIComponent);
};

// ─── Date helpers (always EST / America/New_York) ─────────────────────────────

const getESTDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()); // → "2026-06-15"

const getESTMonthKey = () => getESTDate().slice(0, 7); // → "2026-06"

// ─── Daily cron — 6:00 AM Eastern, every day ─────────────────────────────────
// Publishes today's question from the monthly bank (or manual override).

cron.schedule("0 6 * * *", async () => {
  const dateStr  = getESTDate();
  const monthKey = getESTMonthKey();
  const dayNum   = parseInt(dateStr.slice(8), 10);

  console.log(`[CRON daily] Running for ${dateStr} (day ${dayNum} of ${monthKey})`);

  try {
    // 1. Manual override takes priority
    const override = await dbGet(`qoverride:${dateStr}`);
    if (override) {
      await dbSet(`question:${dateStr}`, override);
      await updateArchive(dateStr, JSON.parse(override));
      await dbDelete("cron_alert");
      console.log(`[CRON daily] Published manual override for ${dateStr}`);
      return;
    }

    // 2. Pull from monthly bank
    const bankRaw = await dbGet(`question_bank:${monthKey}`);
    if (!bankRaw) {
      await setCronAlert("no_bank", `No question bank loaded for ${monthKey}`, dateStr);
      return;
    }

    const bank     = JSON.parse(bankRaw);
    const question = bank[dayNum - 1];

    if (!question || !question.question || question.answer === "N/A" ||
        question.question === "Past question — not published.") {
      await setCronAlert("no_question", `No valid question at index ${dayNum - 1} for ${monthKey}`, dateStr);
      return;
    }

    // 3. Publish
    const published = { ...question, id: `q_${dateStr}`, publishedAt: Date.now() };
    await dbSet(`question:${dateStr}`, JSON.stringify(published));
    await updateArchive(dateStr, question);
    await dbDelete("cron_alert");

    // 4. Warn if bank runs out in the next 3 days
    const daysLeft = bank.filter((q, i) => i >= dayNum && q && q.question &&
      q.answer !== "N/A" && q.question !== "Past question — not published.").length;
    if (daysLeft <= 3) {
      await setCronAlert("bank_low", `Only ${daysLeft} question(s) remaining in ${monthKey} bank`, dateStr);
    }

    console.log(`[CRON daily] Published "${question.answer}" for ${dateStr}`);
  } catch (e) {
    console.error("[CRON daily] Error:", e.message);
    await setCronAlert("error", e.message, dateStr);
  }
}, { timezone: "America/New_York" });

// ─── Monthly cron — midnight on the 1st (Eastern) ────────────────────────────
// Archives last month's leaderboard to Hall of Fame, logs the winner.

cron.schedule("0 0 1 * *", async () => {
  console.log("[CRON monthly] Running monthly reset...");
  try {
    // Derive previous month key
    const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

    const lbRaw = await dbGet(`leaderboard:${prevMonthKey}`);
    if (lbRaw) {
      const lb = JSON.parse(lbRaw);
      if (lb.length > 0) {
        await dbSet(`halloffame:${prevMonthKey}`, lbRaw);
        console.log(`[CRON monthly] Hall of Fame: ${prevMonthKey} winner → ${lb[0].username} (${lb[0].points} pts)`);
      }
    }
    console.log("[CRON monthly] Done.");
  } catch (e) {
    console.error("[CRON monthly] Error:", e.message);
  }
}, { timezone: "America/New_York" });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function updateArchive(dateStr, q) {
  const entry = {
    date: dateStr,
    question: q.question,
    answer: q.answer,
    displayAnswer: q.displayAnswer || q.answer,
    category: q.category || "Wildcard",
    points: q.points || 200,
  };
  await dbSet(`archive:${dateStr}`, JSON.stringify(entry));
  const idxRaw = await dbGet("archive_index");
  const idx    = idxRaw ? JSON.parse(idxRaw) : [];
  if (!idx.includes(dateStr)) {
    await dbSet("archive_index", JSON.stringify([dateStr, ...idx]));
  }
}

async function setCronAlert(type, message, dateStr) {
  const alert = { type, message, date: dateStr, ts: Date.now() };
  await dbSet("cron_alert", JSON.stringify(alert));
  console.error(`[CRON daily] ALERT (${type}): ${message}`);
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
  console.log(`Cron jobs scheduled: daily 6am EST + monthly reset on 1st`);
});
