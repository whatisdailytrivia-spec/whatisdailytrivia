const express = require("express");
const path    = require("path");
const cron    = require("node-cron");
const crypto  = require("crypto");
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
const etHour = () => parseInt(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hour12: false }).format(new Date()), 10);

// ET date minus one day (YYYY-MM-DD).
const etYesterday = () => {
  const d = new Date(getESTDate() + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

// Resolve which question-date a player is answering. Players west of ET finish
// "their" day after midnight ET, so we honor a client-supplied date — but only:
//   - today (ET), or
//   - yesterday (ET) during the overnight window before the next 6am ET drop.
// This makes per-player local-midnight deadlines work WITHOUT allowing anyone to
// backfill older questions for points. Anything else collapses to today.
const resolveQDate = (body) => {
  const today = getESTDate();
  const d = body && typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : today;
  if (d === today) return today;
  if (d === etYesterday() && etHour() < 6) return d;
  return today;
};

// ─── Daily cron — 6:00 AM Eastern ────────────────────────────────────────────

// Idempotent daily publish — shared by the in-process cron and the external
// /api/publish trigger. Safe to call repeatedly: it won't publish before 6am ET
// (unless forced) and won't republish once today's question already exists.
async function publishDaily(force = false) {
  const dateStr  = getESTDate();
  const monthKey = getESTMonthKey();
  const dayNum   = parseInt(dateStr.slice(8), 10);
  await finalizeAnalytics();
  if (!force && etHour() < 6) return { ok: true, skipped: "before_6am_ET", date: dateStr };
  if (await dbGet(`question:${dateStr}`)) return { ok: true, already: true, date: dateStr };
  const override = await dbGet(`qoverride:${dateStr}`);
  if (override) {
    await dbSet(`question:${dateStr}`, override);
    await updateArchive(dateStr, JSON.parse(override));
    await dbDelete("cron_alert");
    return { ok: true, published: "override", date: dateStr };
  }
  const bankRaw = await dbGet(`question_bank:${monthKey}`);
  if (!bankRaw) { await setCronAlert("no_bank", `No bank for ${monthKey}`, dateStr); return { ok: false, error: "no_bank", date: dateStr }; }
  const bank     = JSON.parse(bankRaw);
  const question = bank[dayNum - 1];
  if (!question || !question.question || question.answer === "N/A" ||
      question.question === "Past question — not published.") {
    await setCronAlert("no_question", `No valid question at index ${dayNum - 1}`, dateStr);
    return { ok: false, error: "no_question", date: dateStr };
  }
  const published = { ...question, id: `q_${dateStr}`, publishedAt: Date.now() };
  await dbSet(`question:${dateStr}`, JSON.stringify(published));
  await updateArchive(dateStr, question);
  await dbDelete("cron_alert");
  const daysLeft = bank.filter((q, i) => i >= dayNum && q && q.question &&
    q.answer !== "N/A" && q.question !== "Past question — not published.").length;
  if (daysLeft <= 3) await setCronAlert("bank_low", `Only ${daysLeft} question(s) left in ${monthKey}`, dateStr);
  return { ok: true, published: question.answer, date: dateStr, daysLeft };
}

cron.schedule("0 6 * * *", async () => {
  try { const r = await publishDaily(); console.log(`[CRON daily] ${JSON.stringify(r)}`); }
  catch (e) { console.error("[CRON daily] Error:", e.message); await setCronAlert("error", e.message, getESTDate()); }
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
    funFact: q.funFact || null,
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

// ─── Auth helpers ─────────────────────────────────────────────────────────────
// Passwords are hashed (scrypt + per-user salt) and kept in cred:<username>, which
// the storage API never serves. The public users blob carries profile only.

const hashPw = (pw) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(pw), salt, 64).toString("hex");
  return `${salt}:${hash}`;
};
const verifyPw = (pw, stored) => {
  if (!stored || typeof stored !== "string" || stored.indexOf(":") < 0) return false;
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(String(pw), salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex"), b = Buffer.from(test, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
// Remove plaintext passwords from the users blob before it ever leaves the server.
const stripUserSecrets = (value) => {
  try {
    const u = JSON.parse(value);
    for (const k in u) { if (u[k] && typeof u[k] === "object") delete u[k].password; }
    return JSON.stringify(u);
  } catch (e) { return value; }
};
// Remove the answer from a question/archive payload before it leaves the server.
const stripAnswer = (value) => {
  try { const o = JSON.parse(value); delete o.answer; delete o.displayAnswer; delete o.aliases; delete o.funFact; return JSON.stringify(o); }
  catch (e) { return value; }
};
// Null out a legacy plaintext password at rest (atomic, scoped to one record).
const scrubPassword = (username) =>
  evalJson(OBJ_MERGE_LUA, "users", [String(username), JSON.stringify({ password: null }), "merge"]);

// ─── Storage API routes ───────────────────────────────────────────────────────

app.get("/api/storage/:key", async (req, res) => {
  try {
    const key = req.params.key;
    if (key.indexOf("cred:") === 0) return res.status(403).json({ error: "Forbidden" });
    let value = await dbGet(key);
    if (value === null) return res.status(404).json({ error: "Not found" });
    if (key === "users") value = stripUserSecrets(value);
    else if (key.indexOf("question:") === 0) value = stripAnswer(value);
    else if (key.indexOf("archive:") === 0) {
      const d = key.slice("archive:".length);
      if (d >= getESTDate()) value = stripAnswer(value);   // reveal only past days' answers
    }
    res.json({ key, value });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Server-only keys: the client never writes these (cred: is written by the auth
// routes, halloffame: by the monthly cron, launch_date is read-only on the client).
// Blocking them here closes the open-write hole on /api/storage that would otherwise
// let a crafted request overwrite a credential (account takeover), forge a past
// monthly winner, or tamper with the analytics anchor.
const NO_CLIENT_WRITE = ["cred:", "halloffame:", "launch_date"];

app.post("/api/storage", async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "key is required" });
    if (NO_CLIENT_WRITE.some((pre) => key === pre || key.indexOf(pre) === 0))
      return res.status(403).json({ error: "Protected key" });
    await dbSet(key, value);
    res.json({ key, value });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/storage/:key", async (req, res) => {
  try {
    const key = req.params.key;
    const PROTECTED = ["users", "cred:", "leaderboard:", "submissions:", "question:", "question_bank", "archive", "halloffame:", "analytics_series", "launch_date"];
    if (PROTECTED.some((pre) => key === pre || key.indexOf(pre) === 0)) return res.status(403).json({ error: "Protected key" });
    await dbDelete(key);
    res.json({ key, deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/storage", async (req, res) => {
  try {
    const keys = (await dbList(req.query.prefix || "")).filter((k) => k.indexOf("cred:") !== 0);
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

// ─── Grading (server-authoritative) ──────────────────────────────────────────
// The answer never reaches the browser; correctness, the speed clock, scoring,
// the daily first-correct, streaks, leaderboards, groups and history are all
// computed and written here so none of it can be forged client-side.

const GRACE_PERIOD = 15, DECAY_RATE = 0.01, SCORE_FLOOR = 0.25;
const calcMultiplier = (s) => Math.max(SCORE_FLOOR, 1 - Math.max(0, s - GRACE_PERIOD) * DECAY_RATE);
// Normalize for answer matching: lowercase, strip punctuation, drop a leading
// article ("the"/"a"/"an"), and singularize words so "Grammys" == "Grammy Awards".
const stemWord = (w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
const normalize = (s) => String(s || "").toLowerCase().replace(/-/g, " ").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim().replace(/^(the|a|an)\s+/, "").split(" ").map(stemWord).join(" ");
const checkAnswer = (u, c, aliases = []) => {
  const un = normalize(u);
  if (!un) return false;
  const targets = [c, ...(aliases || [])].map(normalize);
  return targets.some((cn) => {
    if (!cn) return false;
    if (un === cn || un.indexOf(cn) >= 0 || cn.indexOf(un) >= 0) return true;
    const words = cn.split(" ").filter((w) => w.length > 3);
    return words.length > 0 && words.filter((w) => un.indexOf(w) >= 0).length >= Math.ceil(words.length * 0.7);
  });
};
const EXCLUDED_USERS = ["tommyf10"];
const isExcludedUser = (u) => EXCLUDED_USERS.indexOf(String(u || "").toLowerCase()) >= 0;

// Atomically record a submission (one per user per day) and report how many real
// players were already correct before it — used for the daily first-correct medal.
const SUBMIT_LUA = `
local cur = redis.call('GET', KEYS[1])
local obj = {}
if cur and #cur > 0 then obj = cjson.decode(cur) end
local user = ARGV[1]
if obj[user] ~= nil then
  return cjson.encode({ dup = true, existing = obj[user] })
end
local exc = {}
local el = cjson.decode(ARGV[3])
for i = 1, #el do exc[el[i]] = true end
local count = 0
for k, v in pairs(obj) do
  if type(v) == 'table' and v.isCorrect and not exc[string.lower(k)] then count = count + 1 end
end
obj[user] = cjson.decode(ARGV[2])
redis.call('SET', KEYS[1], cjson.encode(obj))
return cjson.encode({ created = true, priorCorrect = count })
`;

// Start the answer clock — first reveal wins (SET NX), cannot be reset by refresh.
app.post("/api/start", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "username required" });
    const key = `start:${resolveQDate(req.body)}:${username}`;
    await redis(["SET", key, String(Date.now()), "NX"]);
    const stored = await dbGet(key);
    res.json({ ok: true, startedAt: stored ? parseInt(stored, 10) : Date.now() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Grade a submission entirely on the server.
app.post("/api/grade", async (req, res) => {
  try {
    const { username, guess } = req.body;
    if (!username) return res.status(400).json({ error: "username required" });
    const date = resolveQDate(req.body), month = date.slice(0, 7);

    const qRaw = await dbGet(`question:${date}`);
    if (!qRaw) return res.json({ ok: false, error: "no_question" });
    const q = JSON.parse(qRaw);
    if (!q || q.id === "q1" || !q.points) return res.json({ ok: false, error: "not_gradable" });
    const reveal = q.displayAnswer || q.answer;

    // Server-authoritative timing
    const startRaw = await dbGet(`start:${date}:${username}`);
    const startMs = startRaw ? parseInt(startRaw, 10) : Date.now();
    const responseTime = Math.max(0, Math.round((Date.now() - startMs) / 1000));
    const speedMult = calcMultiplier(responseTime);

    const correct = checkAnswer(guess || "", q.answer, q.aliases || []);
    const excluded = isExcludedUser(username);
    const base = q.points;
    const pts = correct ? Math.min(base, Math.round(base * speedMult)) : 0;

    const sub = {
      answer: String(guess || ""), isCorrect: correct, points: pts, basePoints: base,
      speedMult: Math.round(speedMult * 100), time: new Date().toISOString(), responseTime,
    };

    // Atomic insert (one submission per user per day) + prior-correct count
    const ins = await evalJson(SUBMIT_LUA, `submissions:${date}`, [String(username), JSON.stringify(sub), JSON.stringify(EXCLUDED_USERS)]);
    if (ins && ins.dup) return res.json({ ok: true, already: true, result: ins.existing || {}, displayAnswer: reveal });
    const isFirstCorrect = correct && !excluded && ins.priorCorrect === 0;

    // Profile / streak (server-owned)
    const usersRaw = await dbGet("users");
    const usersObj = usersRaw ? JSON.parse(usersRaw) : {};
    const rec = usersObj[username] || {};
    const streak = correct ? ((rec.streak || 0) + 1) : 0;
    await evalJson(OBJ_MERGE_LUA, "users", [String(username), JSON.stringify({ streak }), "merge"]);

    // Global leaderboard (hosts tracked but scored 0)
    const lbRaw = await dbGet(`leaderboard:${month}`);
    const lb = lbRaw ? JSON.parse(lbRaw) : [];
    const exLb = lb.find((e) => e.username === username);
    const entry = exLb
      ? { ...exLb, points: excluded ? 0 : (exLb.points + pts), correct: (exLb.correct || 0) + (correct ? 1 : 0), streak, answered: (exLb.answered || 0) + 1 }
      : { username, displayName: rec.displayName || "", state: rec.state || "", points: excluded ? 0 : pts, correct: correct ? 1 : 0, streak, answered: 1 };
    await evalJson(ARR_UPSERT_LUA, `leaderboard:${month}`, [String(username), JSON.stringify(entry)]);

    // Archive first-correct (informational)
    if (isFirstCorrect) {
      try { const arcRaw = await dbGet(`archive:${date}`); if (arcRaw) { const a = JSON.parse(arcRaw); a.goldWinner = username; await dbSet(`archive:${date}`, JSON.stringify(a)); } } catch (e) {}
    }

    // Group leaderboards — membership read from the authoritative user record
    const groups = Array.isArray(rec.groups) ? rec.groups : [];
    for (const code of groups) {
      try {
        if (correct && !excluded) await evalJson(ARR_APPEND_LUA, `groupsub:${code}:${date}`, [String(username)]);
        const gRaw = await dbGet(`grouplb:${code}:${month}`);
        const glb = gRaw ? JSON.parse(gRaw) : [];
        const gex = glb.find((e) => e.username === username);
        const gentry = gex
          ? { ...gex, points: excluded ? 0 : (gex.points + pts), correct: (gex.correct || 0) + (correct ? 1 : 0), streak, answered: (gex.answered || 0) + 1 }
          : { username, state: rec.state || "", points: excluded ? 0 : pts, correct: correct ? 1 : 0, streak, answered: 1 };
        await evalJson(ARR_UPSERT_LUA, `grouplb:${code}:${month}`, [String(username), JSON.stringify(gentry)]);
      } catch (e) {}
    }

    // History (server-owned personal stats)
    let prev = null;
    try { const hRaw = await dbGet(`history:${username}`); prev = hRaw ? JSON.parse(hRaw) : null; } catch (e) {}
    prev = prev || { totalAnswered: 0, totalCorrect: 0, totalPoints: 0, firstCorrects: 0, goldCorrects: 0, silverCorrects: 0, bronzeCorrects: 0, bestStreak: 0, responseTimes: [], categoryStats: {}, dailyLog: [] };
    const cat = q.category || "Wildcard";
    const cs = (prev.categoryStats && prev.categoryStats[cat]) || { answered: 0, correct: 0 };
    const history = {
      ...prev,
      totalAnswered: prev.totalAnswered + 1,
      totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
      totalPoints: prev.totalPoints + pts,
      bestStreak: Math.max(prev.bestStreak || 0, streak),
      firstCorrects: (prev.firstCorrects != null ? prev.firstCorrects : (prev.goldCorrects || 0)) + (isFirstCorrect ? 1 : 0),
      responseTimes: [...(prev.responseTimes || []), responseTime].slice(-90),
      categoryStats: { ...(prev.categoryStats || {}), [cat]: { answered: cs.answered + 1, correct: cs.correct + (correct ? 1 : 0) } },
      dailyLog: [...((prev.dailyLog || []).slice(-89)), { date, correct, points: pts, responseTime, category: cat }],
    };
    await dbSet(`history:${username}`, JSON.stringify(history));

    res.json({ ok: true, result: sub, displayAnswer: reveal, funFact: q.funFact || null, isFirstCorrect, streak, history });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reveal today's answer — ONLY to a user who has already submitted today.
app.get("/api/reveal", async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: "username required" });
    const date = resolveQDate({ date: req.query.date });
    const subsRaw = await dbGet(`submissions:${date}`);
    const subs = subsRaw ? JSON.parse(subsRaw) : {};
    if (!subs[username]) return res.json({ ok: false });   // not answered → no reveal
    const qRaw = await dbGet(`question:${date}`);
    if (!qRaw) return res.json({ ok: false });
    const q = JSON.parse(qRaw);
    res.json({ ok: true, displayAnswer: q.displayAnswer || q.answer, funFact: q.funFact || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Auth routes ──────────────────────────────────────────────────────────────

// Register: atomically claim the username (profile only) + store hashed credential.
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, profile } = req.body;
    if (!username || !password || !profile) return res.status(400).json({ error: "username, password, profile required" });
    const claim = await evalJson(OBJ_MERGE_LUA, "users", [String(username), JSON.stringify(profile), "setnx"]);
    if (claim && claim.taken) return res.json({ ok: false, taken: true });
    await dbSet(`cred:${username}`, JSON.stringify({ hash: hashPw(password), email: profile.email || "" }));
    res.json({ ok: true, user: profile });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Login: verify server-side; never returns the password. Lazy-migrates legacy
// plaintext accounts to a hashed credential on first successful login.
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    const usersRaw = await dbGet("users");
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    const rec = users[username];
    if (!rec) return res.json({ ok: false });
    const credRaw = await dbGet(`cred:${username}`);
    let valid = false;
    if (credRaw) {
      valid = verifyPw(password, JSON.parse(credRaw).hash);
    } else if (rec.password != null) {
      valid = String(rec.password) === String(password);
      if (valid) {
        await dbSet(`cred:${username}`, JSON.stringify({ hash: hashPw(password), email: rec.email || "" }));
        await scrubPassword(username);
      }
    }
    if (!valid) return res.json({ ok: false });
    const safe = Object.assign({}, rec); delete safe.password;
    res.json({ ok: true, user: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Change password: requires the current password, updates the hashed credential.
app.post("/api/change-password", async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    if (!username || !currentPassword || !newPassword) return res.status(400).json({ error: "missing fields" });
    const usersRaw = await dbGet("users");
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    const rec = users[username];
    if (!rec) return res.json({ ok: false, error: "not found" });
    const credRaw = await dbGet(`cred:${username}`);
    let ok = false;
    if (credRaw) ok = verifyPw(currentPassword, JSON.parse(credRaw).hash);
    else if (rec.password != null) ok = String(rec.password) === String(currentPassword);
    if (!ok) return res.json({ ok: false, error: "wrong current password" });
    await dbSet(`cred:${username}`, JSON.stringify({ hash: hashPw(newPassword), email: rec.email || "" }));
    await scrubPassword(username);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Scheduled-task endpoints (token-protected; called by GitHub Actions) ─────
const checkTaskToken = (req) => {
  const want = process.env.ADMIN_TASK_TOKEN;
  if (!want) return false; // fail closed if unconfigured
  const got = String(req.headers["x-task-token"] || "");
  const a = Buffer.from(got), b = Buffer.from(String(want));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// External daily drop — idempotent, Eastern-correct. Fires the question even if
// the in-process cron missed (e.g. instance asleep), and wakes the instance.
app.post("/api/publish", async (req, res) => {
  if (!checkTaskToken(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const force = req.query.force === "1" || (req.body && req.body.force === true);
    res.json(await publishDaily(force));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Re-grade a day's submissions with the CURRENT answer-matching logic. Applies score
// deltas only for submissions that flip incorrect -> correct, using the canonical
// scoring (calcMultiplier + base points). Idempotent: each fixed submission is marked
// .regraded so re-running never double-counts. Does NOT alter streaks or the daily
// first-correct medal (those are order/date-dependent and left as originally recorded).
// Token-protected (same x-task-token as /api/publish). Pass ?dry=1 to preview.
app.post("/api/regrade/:date", async (req, res) => {
  if (!checkTaskToken(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const date = req.params.date, month = date.slice(0, 7);
    const dry = req.query.dry === "1";
    const qRaw = await dbGet(`question:${date}`);
    if (!qRaw) return res.json({ ok: false, error: "no_question" });
    const q = JSON.parse(qRaw);
    if (!q || !q.points) return res.json({ ok: false, error: "not_gradable" });
    const cat = q.category || "Wildcard";
    const subsRaw = await dbGet(`submissions:${date}`);
    if (!subsRaw) return res.json({ ok: false, error: "no_submissions" });
    const subs = JSON.parse(subsRaw);

    const changed = [];
    for (const [username, sub] of Object.entries(subs)) {
      if (!sub || sub.regraded || sub.isCorrect) continue;
      if (!checkAnswer(sub.answer || "", q.answer, q.aliases || [])) continue;
      const excluded = isExcludedUser(username);
      const speedMult = calcMultiplier(sub.responseTime || 0);
      const pts = excluded ? 0 : Math.min(q.points, Math.round(q.points * speedMult));
      changed.push({ username, pts, excluded, speedMult, sub });
    }

    if (dry) return res.json({ ok: true, dryRun: true, wouldChange: changed.map((c) => ({ user: c.username, answer: c.sub.answer, points: c.pts })) });
    if (!changed.length) return res.json({ ok: true, changed: 0, note: "nothing to regrade" });

    // 1) Flip the submissions and persist once.
    for (const c of changed) { c.sub.isCorrect = true; c.sub.points = c.pts; c.sub.speedMult = Math.round(c.speedMult * 100); c.sub.regraded = true; }
    await dbSet(`submissions:${date}`, JSON.stringify(subs));

    // 2) Apply per-user deltas to leaderboard / history / group boards.
    for (const c of changed) {
      const username = c.username, pts = c.pts, excluded = c.excluded;
      const usersRaw = await dbGet("users"); const usersObj = usersRaw ? JSON.parse(usersRaw) : {};
      const rec = usersObj[username] || {};

      const lbRaw = await dbGet(`leaderboard:${month}`); const lb = lbRaw ? JSON.parse(lbRaw) : [];
      const ex = lb.find((e) => e.username === username);
      const entry = ex
        ? { ...ex, points: excluded ? (ex.points || 0) : ((ex.points || 0) + pts), correct: (ex.correct || 0) + 1 }
        : { username, displayName: rec.displayName || "", state: rec.state || "", points: excluded ? 0 : pts, correct: 1, streak: rec.streak || 0, answered: 1 };
      await evalJson(ARR_UPSERT_LUA, `leaderboard:${month}`, [String(username), JSON.stringify(entry)]);

      try {
        const hRaw = await dbGet(`history:${username}`);
        if (hRaw) {
          const h = JSON.parse(hRaw);
          h.totalCorrect = (h.totalCorrect || 0) + 1;
          h.totalPoints = (h.totalPoints || 0) + pts;
          const cs = (h.categoryStats && h.categoryStats[cat]) || { answered: 0, correct: 0 };
          h.categoryStats = { ...(h.categoryStats || {}), [cat]: { answered: cs.answered, correct: cs.correct + 1 } };
          if (Array.isArray(h.dailyLog)) h.dailyLog = h.dailyLog.map((d) => (d && d.date === date ? { ...d, correct: true, points: pts } : d));
          await dbSet(`history:${username}`, JSON.stringify(h));
        }
      } catch (e) {}

      const groups = Array.isArray(rec.groups) ? rec.groups : [];
      for (const code of groups) {
        try {
          if (!excluded) await evalJson(ARR_APPEND_LUA, `groupsub:${code}:${date}`, [String(username)]);
          const gRaw = await dbGet(`grouplb:${code}:${month}`); const glb = gRaw ? JSON.parse(gRaw) : [];
          const gex = glb.find((e) => e.username === username);
          const gentry = gex
            ? { ...gex, points: excluded ? (gex.points || 0) : ((gex.points || 0) + pts), correct: (gex.correct || 0) + 1 }
            : { username, state: rec.state || "", points: excluded ? 0 : pts, correct: 1, streak: rec.streak || 0, answered: 1 };
          await evalJson(ARR_UPSERT_LUA, `grouplb:${code}:${month}`, [String(username), JSON.stringify(gentry)]);
        } catch (e) {}
      }
    }

    res.json({ ok: true, changed: changed.length, users: changed.map((c) => ({ user: c.username, points: c.pts })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Full backup dump — token-protected; the backup workflow encrypts the result.
app.get("/api/export", async (req, res) => {
  if (!checkTaskToken(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const keys = await dbList("");
    const data = {};
    for (let i = 0; i < keys.length; i += 100) {
      const chunk = keys.slice(i, i + 100);
      const vals = await redis(["MGET", ...chunk]);
      chunk.forEach((k, j) => { data[k] = vals[j]; });
    }
    res.json({ exportedAt: new Date().toISOString(), date: getESTDate(), count: keys.length, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Daily story image hosting (powers the IG-story email) ----
// Upload (token-protected): the daily job pushes the PNG with curl, e.g.
//   curl --data-binary @story.png -H "Content-Type: image/png" \
//        -H "x-task-token: $TOKEN" https://<host>/api/story-image/2026-06-17
// Stored as base64 in Redis (storyimg:<date>), auto-expiring after ~40 days.
app.post("/api/story-image/:date", express.raw({ type: "*/*", limit: "12mb" }), async (req, res) => {
  if (!checkTaskToken(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const date = String(req.params.date || "").replace(/\.(png|jpe?g)$/i, "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "bad date" });
    if (!req.body || !req.body.length) return res.status(400).json({ error: "no image data" });
    const b64 = Buffer.from(req.body).toString("base64");
    await redis(["SET", `storyimg:${date}`, b64, "EX", "3456000"]);
    res.json({ ok: true, date, bytes: req.body.length, url: `/story/${date}.png` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Public image serve — lets the stored story render inline in the email and be
// saved on a phone. No auth (the image is meant to be public marketing).
app.get("/story/:name", async (req, res) => {
  try {
    const date = String(req.params.name || "").replace(/\.(png|jpe?g)$/i, "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(404).end();
    const b64 = await dbGet(`storyimg:${date}`);
    if (!b64) return res.status(404).end();
    const buf = Buffer.from(b64, "base64");
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(buf);
  } catch (e) { res.status(500).end(); }
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
