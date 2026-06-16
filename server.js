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
  await finalizeAnalytics();
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

// ─── Analytics finalizer — durable, append-only daily rollup ──────────────────
// Mirrors the in-app builder: writes one immutable snapshot per past day to
// analytics_series, computed from permanent keys (submissions:DATE, archive:DATE,
// account join dates). Runs every morning so history is captured automatically.

const addDaysKey = (key, n) => {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
};

async function finalizeAnalytics() {
  try {
    const today     = getESTDate();
    const yesterday = addDaysKey(today, -1);

    const seriesRaw = await dbGet("analytics_series");
    let series = seriesRaw ? JSON.parse(seriesRaw) : [];
    const have = new Set(series.map(p => p.date));

    const usersRaw = await dbGet("users");
    const users = usersRaw ? Object.values(JSON.parse(usersRaw)) : [];
    const joined = users.map(u => u.joined).filter(Boolean).sort();

    let startDate = await dbGet("launch_date");
    if (!startDate && joined.length) startDate = joined[0];
    if (!startDate) return;

    let changed = false, cur = startDate, guard = 0;
    while (cur <= yesterday && guard < 800) {
      if (!have.has(cur)) {
        let subs = {}, arc = {};
        const sRaw = await dbGet(`submissions:${cur}`);
        if (sRaw) { try { subs = JSON.parse(sRaw); } catch (e) {} }
        const aRaw = await dbGet(`archive:${cur}`);
        if (aRaw) { try { arc = JSON.parse(aRaw); } catch (e) {} }
        const arr = Object.values(subs);
        const answers = arr.length;
        const correct = arr.filter(x => x && x.isCorrect).length;
        series.push({
          date: cur,
          totalAccounts: users.filter(u => u.joined && u.joined <= cur).length,
          newAccounts:   users.filter(u => u.joined === cur).length,
          activeUsers: answers, answers, correct,
          category: arc.category || null,
          points: arc.points != null ? arc.points : null,
        });
        changed = true;
      }
      cur = addDaysKey(cur, 1); guard++;
    }
    if (changed) {
      series.sort((a, b) => a.date.localeCompare(b.date));
      await dbSet("analytics_series", JSON.stringify(series));
      console.log(`[CRON daily] Analytics finalized through ${yesterday} (${series.length} days stored)`);
    }
  } catch (e) {
    console.error("[CRON daily] Analytics finalize error:", e.message);
  }
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

// ─── Atomic write routes (Redis EVAL) ─────────────────────────────────────────
// Redis runs each Lua script atomically, so a field/entry update touches only its
// own slot — two near-simultaneous writers (two signups, the 6am answer rush) can
// no longer overwrite each other the way a client read-modify-write of a shared
// JSON blob does. The client falls back to its old path if any of these fail.

const OBJ_MERGE_LUA = `
local cur = redis.call('GET', KEYS[1])
local obj = {}
if cur and #cur > 0 then obj = cjson.decode(cur) end
local field, mode = ARGV[1], ARGV[3]
if mode == 'setnx' then
  if obj[field] ~= nil then return cjson.encode({ ok = false, taken = true }) end
  obj[field] = cjson.decode(ARGV[2])
elseif mode == 'merge' then
  local f = obj[field]
  if type(f) ~= 'table' then f = {} end
  local patch = cjson.decode(ARGV[2])
  for k, v in pairs(patch) do f[k] = v end
  obj[field] = f
elseif mode == 'del' then
  obj[field] = nil
else
  obj[field] = cjson.decode(ARGV[2])
end
local has = false
for _ in pairs(obj) do has = true break end
redis.call('SET', KEYS[1], has and cjson.encode(obj) or '{}')
return cjson.encode({ ok = true })
`;

const ARR_UPSERT_LUA = `
local cur = redis.call('GET', KEYS[1])
local arr = {}
if cur and #cur > 0 then arr = cjson.decode(cur) end
local entry = cjson.decode(ARGV[2])
local out = {}
for i = 1, #arr do
  if arr[i].username ~= ARGV[1] then out[#out + 1] = arr[i] end
end
out[#out + 1] = entry
table.sort(out, function(a, b) return (a.points or 0) > (b.points or 0) end)
redis.call('SET', KEYS[1], cjson.encode(out))
return cjson.encode({ ok = true })
`;

const ARR_APPEND_LUA = `
local cur = redis.call('GET', KEYS[1])
local arr = {}
if cur and #cur > 0 then arr = cjson.decode(cur) end
for i = 1, #arr do if arr[i] == ARGV[1] then return cjson.encode({ ok = true }) end end
arr[#arr + 1] = ARGV[1]
redis.call('SET', KEYS[1], cjson.encode(arr))
return cjson.encode({ ok = true })
`;

const evalJson = async (script, key, args) => {
  const result = await redis(["EVAL", script, "1", key, ...args]);
  try { return JSON.parse(result); } catch (e) { return { ok: true }; }
};

// Merge one field into an object-blob: modes set | setnx | merge | del
app.post("/api/merge", async (req, res) => {
  try {
    const { key, field, value, mode } = req.body;
    if (!key || field == null) return res.status(400).json({ error: "key and field required" });
    const valJson = mode === "del" ? "null" : JSON.stringify(value == null ? null : value);
    res.json(await evalJson(OBJ_MERGE_LUA, key, [String(field), valJson, mode || "set"]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Insert/replace one entry (matched by username) in an array-blob, sorted by points desc
app.post("/api/upsert", async (req, res) => {
  try {
    const { key, username, entry } = req.body;
    if (!key || !username || !entry) return res.status(400).json({ error: "key, username, entry required" });
    res.json(await evalJson(ARR_UPSERT_LUA, key, [String(username), JSON.stringify(entry)]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Append a value to an array-blob if not already present
app.post("/api/append", async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value == null) return res.status(400).json({ error: "key and value required" });
    res.json(await evalJson(ARR_APPEND_LUA, key, [String(value)]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`WhatIs... server running on port ${PORT}`);
  console.log(`DB: ${UPSTASH_URL ? "Upstash Redis connected" : "NO DB CONFIGURED"}`);
  console.log(`Cron: daily 6am EST (publish + analytics) + monthly reset`);
});
