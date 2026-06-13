import { useState, useEffect } from "react";

const apiStorage = {
  get: async (key) => {
    const res = await fetch(`/api/storage/${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error("not found");
    return res.json();
  },
  set: async (key, value) => {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return res.json();
  },
  delete: async (key) => {
    const res = await fetch(`/api/storage/${encodeURIComponent(key)}`, { method: "DELETE" });
    return res.json();
  },
  list: async (prefix = "") => {
    const res = await fetch(`/api/storage?prefix=${encodeURIComponent(prefix)}`);
    return res.json();
  },
};

const ADMIN_PASSWORD = "whatis2026";
const GOLD = "#C9A84C";
const BLACK = "#0A0A0A";
const OFF_WHITE = "#F5F3EE";
const SURFACE = "#141414";
const SURFACE2 = "#1E1E1E";
const SURFACE3 = "#282828";
const TEXT_SEC = "#9A9590";
const TEXT_MUTED = "#5A5550";
const SANS = "system-ui,-apple-system,'DM Sans',sans-serif";
const SERIF = "Georgia,serif";

const MEDAL = {
  gold:   { emoji: "🥇", label: "First",  multiplier: 0.10 },
  silver: { emoji: "🥈", label: "Second", multiplier: 0.05 },
  bronze: { emoji: "🥉", label: "Third",  multiplier: 0.03 },
};
const getMedal = (pos) => pos === 0 ? "gold" : pos === 1 ? "silver" : pos === 2 ? "bronze" : null;

const SAMPLE = { id: "q1", question: "This financial instrument allows investors to pool capital and gain exposure to real estate without directly owning property — and is required by law to distribute at least 90% of its taxable income to shareholders.", answer: "REIT", displayAnswer: "A Real Estate Investment Trust (REIT)", category: "Finance", points: 200 };

const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const monthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const daysLeft = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate() - d.getDate(); };
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g,"").replace(/\s+/g," ").trim();
const checkAnswer = (u, c) => {
  const un = normalize(u), cn = normalize(c);
  if (un === cn || un.includes(cn) || cn.includes(un)) return true;
  const words = cn.split(" ").filter(w => w.length > 3);
  return words.filter(w => un.includes(w)).length >= Math.ceil(words.length * 0.7);
};
const isYesterdayOrOlder = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  return d < today;
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 700);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const CAT = {
  Finance: { bg: "rgba(201,168,76,0.12)", text: GOLD },
  Geopolitics: { bg: "rgba(76,175,125,0.1)", text: "#4CAF7D" },
  Sports: { bg: "rgba(100,149,237,0.12)", text: "#6495ED" },
  Science: { bg: "rgba(147,112,219,0.12)", text: "#9370DB" },
  History: { bg: "rgba(205,133,63,0.12)", text: "#CD853F" },
  Psychology: { bg: "rgba(255,105,180,0.1)", text: "#FF69B4" },
  Wildcard: { bg: "rgba(200,80,80,0.1)", text: "#E05C5C" },
};

const s = {
  app: { background: BLACK, minHeight: "100vh", color: OFF_WHITE, fontFamily: SANS },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${SURFACE2}`, position: "sticky", top: 0, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(10px)", zIndex: 100 },
  logo: { fontFamily: SERIF, fontSize: "1.2rem", fontWeight: 700, color: OFF_WHITE, display: "flex", alignItems: "center", gap: 8 },
  icon: { width: 32, height: 32, borderRadius: "50%", border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontFamily: SERIF, fontSize: "1rem", fontWeight: 700, flexShrink: 0 },
  tab: { padding: "7px 11px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", border: "none", background: "transparent", color: TEXT_SEC, fontFamily: SANS },
  tabActive: { background: SURFACE2, color: GOLD },
  main: { maxWidth: 680, margin: "0 auto", padding: "28px 16px 80px" },
  card: { background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 10, padding: "22px", marginBottom: 12, position: "relative", overflow: "hidden" },
  accent: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${GOLD},${SURFACE3})` },
  label: { fontFamily: "'Courier New',monospace", fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginBottom: 6 },
  h1: { fontFamily: SANS, fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.5, marginBottom: 8, color: OFF_WHITE },
  h2: { fontFamily: SERIF, fontSize: "1.2rem", fontWeight: 700, marginBottom: 12 },
  input: { width: "100%", background: SURFACE2, border: `1px solid ${SURFACE3}`, borderRadius: 6, padding: "11px 14px", color: OFF_WHITE, fontFamily: SANS, fontSize: "0.88rem", outline: "none", boxSizing: "border-box" },
  btn: { background: GOLD, color: BLACK, border: "none", borderRadius: 6, padding: "11px 20px", fontFamily: SANS, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" },
  btnSec: { background: "transparent", color: GOLD, border: `1px solid ${SURFACE3}`, borderRadius: 6, padding: "8px 16px", fontFamily: SANS, fontWeight: 500, fontSize: "0.8rem", cursor: "pointer" },
  badge: { display: "inline-block", padding: "2px 9px", borderRadius: 100, fontSize: "0.65rem", fontFamily: "'Courier New',monospace", letterSpacing: "0.08em" },
  mono: { fontFamily: "'Courier New',monospace" },
  divider: { border: "none", borderTop: `1px solid ${SURFACE3}`, margin: "24px 0" },
  lbRow: { display: "grid", gridTemplateColumns: "30px 1fr auto", alignItems: "center", gap: 10, padding: "11px 14px", background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 8, marginBottom: 6 },
};

const TABS = [
  { id: "play", label: "Today's Question" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "groups", label: "Groups" },
  { id: "archive", label: "Archive" },
  { id: "rules", label: "Rules" },
  { id: "contact", label: "Contact" },
  { id: "admin", label: "Admin" },
];

export default function App() {
  const [tab, setTab] = useState("play");
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [question, setQuestion] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [uR, qR, sR, lR] = await Promise.allSettled([
        apiStorage.get("users"), apiStorage.get(`question:${todayKey()}`),
        apiStorage.get(`submissions:${todayKey()}`), apiStorage.get(`leaderboard:${monthKey()}`),
      ]);
      if (uR.status === "fulfilled" && uR.value) setUsers(JSON.parse(uR.value.value));
      if (qR.status === "fulfilled" && qR.value) setQuestion(JSON.parse(qR.value.value));
      else setQuestion(SAMPLE);
      if (sR.status === "fulfilled" && sR.value) setSubmissions(JSON.parse(sR.value.value));
      if (lR.status === "fulfilled" && lR.value) setLeaderboard(JSON.parse(lR.value.value));
      const saved = localStorage.getItem("whatis_user");
      if (saved) setUser(JSON.parse(saved));
    } catch (e) { setQuestion(SAMPLE); }
    setLoading(false);
  };

  const saveUsers = async (u) => { setUsers(u); await apiStorage.set("users", JSON.stringify(u)); };
  const saveLB = async (lb) => { setLeaderboard(lb); await apiStorage.set(`leaderboard:${monthKey()}`, JSON.stringify(lb)); };

  const goTab = (id) => { setTab(id); setMenuOpen(false); };

  if (loading) return (
    <div style={{ ...s.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...s.icon, width: 48, height: 48, fontSize: "1.6rem", margin: "0 auto 12px" }}>?</div>
        <div style={{ ...s.mono, fontSize: "0.72rem", color: TEXT_SEC, letterSpacing: "0.1em" }}>LOADING...</div>
      </div>
    </div>
  );

  return (
    <div style={s.app}>
      <nav style={s.nav}>
        <div style={s.logo}>
          <div style={s.icon}>?</div>
          <span>WhatIs<span style={{ color: GOLD, fontStyle: "italic" }}>...</span></span>
        </div>
        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user && <div style={{ ...s.badge, background: SURFACE2, border: `1px solid ${SURFACE3}`, color: GOLD }}>🔥 {user.streak || 0}</div>}
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "transparent", border: `1px solid ${SURFACE3}`, borderRadius: 6, padding: "7px 10px", cursor: "pointer", color: OFF_WHITE, fontSize: "1rem", lineHeight: 1 }}>
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {TABS.map(t => (
                <button key={t.id} style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }} onClick={() => goTab(t.id)}>{t.label}</button>
              ))}
            </div>
            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ ...s.badge, background: SURFACE2, border: `1px solid ${SURFACE3}`, color: GOLD }}>🔥 {user.streak || 0}</div>
                <button style={{ ...s.btnSec, padding: "5px 10px", fontSize: "0.72rem" }} onClick={() => { setUser(null); localStorage.removeItem("whatis_user"); }}>Sign out</button>
              </div>
            )}
          </>
        )}
      </nav>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{ background: SURFACE, borderBottom: `1px solid ${SURFACE3}`, zIndex: 99, position: "sticky", top: 61 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => goTab(t.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "14px 20px", background: tab === t.id ? SURFACE2 : "transparent", border: "none", borderBottom: `1px solid ${SURFACE3}`, color: tab === t.id ? GOLD : OFF_WHITE, fontFamily: SANS, fontSize: "0.9rem", cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
          {user && (
            <button onClick={() => { setUser(null); localStorage.removeItem("whatis_user"); setMenuOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "14px 20px", background: "transparent", border: "none", color: "#E05C5C", fontFamily: SANS, fontSize: "0.9rem", cursor: "pointer" }}>
              Sign out
            </button>
          )}
        </div>
      )}

      <div style={s.main}>
        {tab === "play"        && <PlayTab user={user} setUser={setUser} users={users} saveUsers={saveUsers} question={question} submissions={submissions} setSubmissions={setSubmissions} leaderboard={leaderboard} saveLB={saveLB} />}
        {tab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard} user={user} />}
        {tab === "groups"      && <GroupsTab user={user} setUser={setUser} saveUsers={saveUsers} users={users} />}
        {tab === "archive"     && <ArchiveTab />}
        {tab === "rules"       && <RulesTab />}
        {tab === "contact"     && <ContactTab />}
        {tab === "admin"       && <AdminTab adminUnlocked={adminUnlocked} setAdminUnlocked={setAdminUnlocked} question={question} setQuestion={setQuestion} />}
      </div>
    </div>
  );
}

function PlayTab({ user, setUser, users, saveUsers, question, submissions, setSubmissions, leaderboard, saveLB }) {
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", state: "" });
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [viewStart] = useState(Date.now());
  const [history, setHistory] = useState(null);
  const answered = user && submissions[user.username];

  useEffect(() => { if (user) loadHistory(user.username); }, [user?.username]);

  const loadHistory = async (username) => {
    try { const r = await apiStorage.get(`history:${username}`); if (r) setHistory(JSON.parse(r.value)); } catch (e) {}
  };

  const doAuth = () => {
    setError("");
    if (authMode === "register") {
      if (!form.username || !form.email || !form.password || !form.state) return setError("All fields required.");
      if (users[form.username]) return setError("Username taken.");
      const nu = { username: form.username, email: form.email, password: form.password, state: form.state, streak: 0, joined: todayKey() };
      saveUsers({ ...users, [form.username]: nu });
      setUser(nu); localStorage.setItem("whatis_user", JSON.stringify(nu));
    } else {
      const f = users[form.username];
      if (!f || f.password !== form.password) return setError("Invalid username or password.");
      setUser(f); localStorage.setItem("whatis_user", JSON.stringify(f));
    }
    setForm({ username: "", email: "", password: "", state: "" });
  };

  const submit = async () => {
    if (!answer.trim()) return;
    const responseTime = Math.round((Date.now() - viewStart) / 1000);
    const correct = checkAnswer(answer, question.answer);
    const base = question.points || 200;
    const globalCorrectCount = Object.values(submissions).filter(s => s.isCorrect).length;
    const globalMedal = correct ? getMedal(globalCorrectCount) : null;
    const globalBonus = correct && globalMedal ? Math.round(base * MEDAL[globalMedal].multiplier) : 0;
    const pts = correct ? base + globalBonus : 0;
    const sub = { answer, isCorrect: correct, points: pts, basePoints: base, bonusPoints: globalBonus, medal: globalMedal, time: new Date().toISOString(), responseTime };
    const newSubs = { ...submissions, [user.username]: sub };
    setSubmissions(newSubs);
    await apiStorage.set(`submissions:${todayKey()}`, JSON.stringify(newSubs));
    const streak = correct ? (user.streak || 0) + 1 : 0;
    const nu = { ...user, streak };
    setUser(nu); localStorage.setItem("whatis_user", JSON.stringify(nu));
    await saveUsers({ ...users, [user.username]: { ...users[user.username], streak } });
    const ex = leaderboard.find(e => e.username === user.username);
    const medalUpdate = globalMedal ? { [`${globalMedal}Corrects`]: ((ex?.[`${globalMedal}Corrects`] || 0) + 1) } : {};
    let newLB;
    if (ex) newLB = leaderboard.map(e => e.username === user.username ? { ...e, points: e.points + pts, correct: e.correct + (correct ? 1 : 0), streak, answered: e.answered + 1, ...medalUpdate } : e);
    else newLB = [...leaderboard, { username: user.username, state: user.state || "", points: pts, correct: correct ? 1 : 0, streak, answered: 1, goldCorrects: 0, silverCorrects: 0, bronzeCorrects: 0, ...medalUpdate }];
    newLB.sort((a, b) => b.points - a.points);
    await saveLB(newLB);

    // Update archive with gold winner
    if (globalMedal === "gold" && correct) {
      try {
        const arcR = await apiStorage.get(`archive:${todayKey()}`).catch(() => null);
        if (arcR) {
          const entry = JSON.parse(arcR.value);
          await apiStorage.set(`archive:${todayKey()}`, JSON.stringify({ ...entry, goldWinner: user.username }));
        }
      } catch (e) {}
    }

    // Group leaderboards
    const userGroups = user.groups || [];
    for (const code of userGroups) {
      try {
        const gsubR = await apiStorage.get(`groupsub:${code}:${todayKey()}`).catch(() => null);
        const gsub = gsubR ? JSON.parse(gsubR.value) : [];
        const groupMedal = correct ? getMedal(gsub.length) : null;
        const groupBonus = correct && groupMedal ? Math.round(base * MEDAL[groupMedal].multiplier) : 0;
        const groupPts = correct ? base + groupBonus : 0;
        if (correct) await apiStorage.set(`groupsub:${code}:${todayKey()}`, JSON.stringify([...gsub, user.username]));
        const gR = await apiStorage.get(`grouplb:${code}:${monthKey()}`).catch(() => null);
        let glb = gR ? JSON.parse(gR.value) : [];
        const gex = glb.find(e => e.username === user.username);
        const gMedalUpdate = groupMedal ? { [`${groupMedal}Corrects`]: ((gex?.[`${groupMedal}Corrects`] || 0) + 1) } : {};
        if (gex) glb = glb.map(e => e.username === user.username ? { ...e, points: e.points + groupPts, correct: e.correct + (correct ? 1 : 0), streak, answered: e.answered + 1, ...gMedalUpdate } : e);
        else glb = [...glb, { username: user.username, state: user.state || "", points: groupPts, correct: correct ? 1 : 0, streak, answered: 1, goldCorrects: 0, silverCorrects: 0, bronzeCorrects: 0, ...gMedalUpdate }];
        glb.sort((a, b) => b.points - a.points);
        await apiStorage.set(`grouplb:${code}:${monthKey()}`, JSON.stringify(glb));
      } catch (e) {}
    }

    // Update history
    const prev = history || { totalAnswered: 0, totalCorrect: 0, totalPoints: 0, goldCorrects: 0, silverCorrects: 0, bronzeCorrects: 0, bestStreak: 0, responseTimes: [], categoryStats: {}, dailyLog: [] };
    const cat = question.category || "Wildcard";
    const catStats = prev.categoryStats[cat] || { answered: 0, correct: 0 };
    const allTimes = [...(prev.responseTimes || []), responseTime].slice(-90);
    const updatedHistory = {
      ...prev,
      totalAnswered: prev.totalAnswered + 1,
      totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
      totalPoints: prev.totalPoints + pts,
      goldCorrects: (prev.goldCorrects || 0) + (globalMedal === "gold" ? 1 : 0),
      silverCorrects: (prev.silverCorrects || 0) + (globalMedal === "silver" ? 1 : 0),
      bronzeCorrects: (prev.bronzeCorrects || 0) + (globalMedal === "bronze" ? 1 : 0),
      bestStreak: Math.max(prev.bestStreak || 0, streak),
      responseTimes: allTimes,
      categoryStats: { ...prev.categoryStats, [cat]: { answered: catStats.answered + 1, correct: catStats.correct + (correct ? 1 : 0) } },
      dailyLog: [...(prev.dailyLog || []).slice(-89), { date: todayKey(), correct, points: pts, responseTime, category: cat }],
    };
    setHistory(updatedHistory);
    await apiStorage.set(`history:${user.username}`, JSON.stringify(updatedHistory));
    setResult(sub);
  };

  const cat = CAT[question?.category] || CAT.Wildcard;

  if (!user) return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ ...s.icon, width: 52, height: 52, fontSize: "1.7rem", margin: "0 auto 12px", borderWidth: 3 }}>?</div>
        <div style={{ fontFamily: SERIF, fontSize: "1.6rem", fontWeight: 700, marginBottom: 6 }}>WhatIs<span style={{ color: GOLD, fontStyle: "italic" }}>...</span></div>
        <div style={{ color: TEXT_SEC, fontSize: "0.85rem" }}>One question. Every day. Top scorer wins $100.</div>
      </div>
      <div style={s.card}>
        <div style={s.accent} />
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setAuthMode(m); setError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 6, border: authMode === m ? `1px solid ${GOLD}` : `1px solid ${SURFACE3}`, background: authMode === m ? "rgba(201,168,76,0.1)" : "transparent", color: authMode === m ? GOLD : TEXT_SEC, fontFamily: SANS, fontWeight: 500, cursor: "pointer", fontSize: "0.85rem" }}>
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <input style={s.input} placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} onKeyDown={e => e.key === "Enter" && doAuth()} />
          {authMode === "register" && <input style={s.input} placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />}
          <input style={s.input} placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === "Enter" && doAuth()} />
          {authMode === "register" && (
            <select style={s.input} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
              <option value="">Select your state...</option>
              {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"].map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          )}
          {error && <div style={{ color: "#E05C5C", fontSize: "0.82rem" }}>{error}</div>}
          <button style={{ ...s.btn, width: "100%", marginTop: 4 }} onClick={doAuth}>{authMode === "login" ? "Sign in" : "Create account"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ ...s.label, marginBottom: 3 }}>{todayKey()} · Daily Question</div>
          <div style={{ color: TEXT_SEC, fontSize: "0.8rem" }}>{daysLeft()} days left · {new Date().toLocaleString("default", { month: "long" })}</div>
        </div>
        <div style={{ ...s.badge, background: cat.bg, color: cat.text }}>{question?.category}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 }}>
        {[{ v: leaderboard.length, l: "Players", gold: true }, { v: `${user?.streak || 0}🔥`, l: "Streak" }, { v: "$100", l: "Prize", gold: true }].map((x, i) => (
          <div key={i} style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontFamily: SERIF, fontSize: "1.35rem", fontWeight: 700, color: x.gold ? GOLD : OFF_WHITE }}>{x.v}</div>
            <div style={{ ...s.mono, fontSize: "0.62rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4 }}>{x.l}</div>
          </div>
        ))}
      </div>
      <div style={s.card}>
        <div style={s.accent} />
        <div style={s.label}>Today's question · {question?.points || 200} pts</div>
        <div style={s.h1}>{question?.question}</div>
      </div>
      {!answered && !result && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: SERIF, fontSize: "1rem", color: GOLD, fontStyle: "italic", marginBottom: 8 }}>"What is..."</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={s.input} placeholder="Type your answer..." value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
            <button style={{ ...s.btn, whiteSpace: "nowrap" }} onClick={submit}>Submit</button>
          </div>
        </div>
      )}
      {(result || answered) && (() => {
        const sub = result || submissions[user?.username];
        const ok = sub?.isCorrect;
        return (
          <div style={{ padding: "13px 16px", borderRadius: 8, marginTop: 8, marginBottom: 18, fontWeight: 500, background: ok ? "rgba(76,175,125,0.1)" : "rgba(224,92,92,0.1)", border: `1px solid ${ok ? "rgba(76,175,125,0.3)" : "rgba(224,92,92,0.3)"}`, color: ok ? "#4CAF7D" : "#E05C5C" }}>
            {ok ? "✓ Correct!" : "✗ Not quite — try again tomorrow."}
            <div style={{ marginTop: 6, fontFamily: SERIF, fontSize: "0.9rem", color: OFF_WHITE, fontStyle: "italic" }}>What is... {question?.displayAnswer || question?.answer}</div>
            {ok && sub?.medal && MEDAL[sub.medal] && (
              <div style={{ marginTop: 7, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 100, padding: "3px 11px" }}>
                <span>{MEDAL[sub.medal].emoji}</span><span style={{ ...s.mono, fontSize: "0.7rem", color: GOLD }}>{MEDAL[sub.medal].label} correct! +{sub.bonusPoints} bonus pts</span>
              </div>
            )}
            {ok && <div style={{ ...s.mono, fontSize: "0.75rem", color: "#4CAF7D", marginTop: 5 }}>{sub?.medal ? `+${sub.basePoints} + ${sub.bonusPoints} bonus = ${sub.points} pts` : `+${sub?.points} pts`}</div>}
          </div>
        );
      })()}
      <hr style={s.divider} />
      <div style={{ ...s.label, marginBottom: 12 }}>Top 5 this month</div>
      {leaderboard.length === 0
        ? <div style={{ color: TEXT_MUTED, fontSize: "0.85rem", padding: "12px 0" }}>No scores yet — be the first to answer!</div>
        : leaderboard.slice(0, 5).map((e, i) => <LBRow key={e.username} entry={e} rank={i + 1} isMe={e.username === user?.username} />)
      }
      {history && (
        <div style={{ marginTop: 28 }}>
          <hr style={s.divider} />
          <div style={{ ...s.label, marginBottom: 14 }}>My all-time stats</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 14 }}>
            {[
              { v: history.totalAnswered, l: "Played" },
              { v: history.totalCorrect, l: "Correct" },
              { v: history.totalAnswered > 0 ? `${Math.round((history.totalCorrect / history.totalAnswered) * 100)}%` : "—", l: "Accuracy" },
              { v: history.bestStreak || 0, l: "Best streak 🔥" },
              { v: history.goldCorrects || 0, l: "🥇 First" },
              { v: (history.silverCorrects || 0) + (history.bronzeCorrects || 0), l: "🥈🥉 2nd/3rd" },
            ].map((x, i) => (
              <div key={i} style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 8, padding: "11px 13px" }}>
                <div style={{ fontFamily: SERIF, fontSize: "1.2rem", fontWeight: 700, color: OFF_WHITE }}>{x.v}</div>
                <div style={{ ...s.mono, fontSize: "0.6rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4, lineHeight: 1.3 }}>{x.l}</div>
              </div>
            ))}
          </div>
          {Object.keys(history.categoryStats || {}).length > 0 && (
            <div>
              <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>By category</div>
              {Object.entries(history.categoryStats).sort((a,b) => b[1].answered - a[1].answered).map(([cat, stats]) => {
                const pct = Math.round((stats.correct / stats.answered) * 100);
                const c = CAT[cat] || CAT.Wildcard;
                return (
                  <div key={cat} style={{ display: "grid", gridTemplateColumns: "90px 1fr 50px 38px", alignItems: "center", gap: 8, padding: "7px 13px", background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 7, marginBottom: 5 }}>
                    <div style={{ fontSize: "0.76rem", color: c.text, fontWeight: 500 }}>{cat}</div>
                    <div style={{ background: SURFACE2, borderRadius: 100, height: 5, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: c.text, borderRadius: 100 }} />
                    </div>
                    <div style={{ ...s.mono, fontSize: "0.68rem", color: TEXT_SEC, textAlign: "right" }}>{stats.correct}/{stats.answered}</div>
                    <div style={{ ...s.mono, fontSize: "0.68rem", color: pct >= 70 ? "#4CAF7D" : pct >= 40 ? GOLD : "#E05C5C", textAlign: "right", fontWeight: 600 }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LBRow({ entry, rank, isMe }) {
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return (
    <div style={{ ...s.lbRow, border: `1px solid ${rank === 1 ? "rgba(201,168,76,0.4)" : isMe ? "rgba(201,168,76,0.25)" : SURFACE3}` }}>
      <div style={{ ...s.mono, fontSize: "0.8rem", color: rank <= 3 ? GOLD : TEXT_MUTED, textAlign: "center" }}>{medals[rank] || rank}</div>
      <div>
        <div style={{ fontWeight: 500, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {entry.username}
          {entry.state && <span style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, background: SURFACE2, border: `1px solid ${SURFACE3}`, borderRadius: 4, padding: "1px 5px" }}>{entry.state}</span>}
          {isMe && <span style={{ color: GOLD, fontSize: "0.68rem" }}>(you)</span>}
          {entry.goldCorrects > 0 && <span style={{ ...s.mono, fontSize: "0.65rem", color: "#FFD700", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 100, padding: "1px 5px" }}>🥇{entry.goldCorrects}</span>}
          {entry.silverCorrects > 0 && <span style={{ ...s.mono, fontSize: "0.65rem", color: "#C0C0C0", background: "rgba(192,192,192,0.1)", border: "1px solid rgba(192,192,192,0.2)", borderRadius: 100, padding: "1px 5px" }}>🥈{entry.silverCorrects}</span>}
          {entry.bronzeCorrects > 0 && <span style={{ ...s.mono, fontSize: "0.65rem", color: "#CD7F32", background: "rgba(205,127,50,0.1)", border: "1px solid rgba(205,127,50,0.2)", borderRadius: 100, padding: "1px 5px" }}>🥉{entry.bronzeCorrects}</span>}
        </div>
        <div style={{ ...s.mono, fontSize: "0.67rem", color: TEXT_MUTED, marginTop: 2 }}>🔥{entry.streak || 0} · {entry.correct || 0}/{entry.answered || 0} correct</div>
      </div>
      <div style={{ ...s.mono, fontSize: "0.85rem", fontWeight: 500, color: GOLD }}>{entry.points} pts</div>
    </div>
  );
}

function LeaderboardTab({ leaderboard, user }) {
  return (
    <div>
      <div style={s.label}>Monthly leaderboard</div>
      <div style={s.h2}>{new Date().toLocaleString("default", { month: "long" })} {new Date().getFullYear()}</div>
      <div style={{ color: TEXT_SEC, fontSize: "0.82rem", marginBottom: 20 }}>{daysLeft()} days remaining · Top scorer wins $100</div>
      <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ ...s.mono, fontSize: "0.65rem", color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>🏆 Monthly Prize</div>
          <div style={{ fontFamily: SERIF, fontSize: "1.2rem", fontWeight: 700 }}>$100 Visa Gift Card</div>
          <div style={{ color: TEXT_SEC, fontSize: "0.8rem", marginTop: 3 }}>Top scorer wins at month end</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: SERIF, fontSize: "2rem", fontWeight: 700, color: GOLD, lineHeight: 1 }}>{daysLeft()}</div>
          <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, textTransform: "uppercase", marginTop: 3 }}>Days left</div>
        </div>
      </div>
      {leaderboard.length === 0
        ? <div style={{ ...s.card, textAlign: "center", padding: "36px" }}><div style={{ color: TEXT_MUTED, fontSize: "0.85rem" }}>No scores yet.</div></div>
        : leaderboard.map((e, i) => <LBRow key={e.username} entry={e} rank={i + 1} isMe={e.username === user?.username} />)
      }
    </div>
  );
}

function ArchiveTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadArchive(); }, []);

  const loadArchive = async () => {
    setLoading(true);
    try {
      const r = await apiStorage.get("archive_index");
      if (r) {
        const index = JSON.parse(r.value); // array of date strings, newest first
        const results = await Promise.allSettled(index.map(d => apiStorage.get(`archive:${d}`)));
        const loaded = results
          .map((res, i) => {
            if (res.status === "fulfilled" && res.value) {
              try { return JSON.parse(res.value.value); } catch(e) { return null; }
            }
            return null;
          })
          .filter(Boolean)
          .sort((a, b) => b.date.localeCompare(a.date));
        setEntries(loaded);
      }
    } catch (e) {}
    setLoading(false);
  };

  const formatDate = (d) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) return <div style={{ color: TEXT_MUTED, fontSize: "0.85rem", padding: "40px 0", textAlign: "center" }}>Loading archive...</div>;

  return (
    <div>
      <div style={s.label}>Question history</div>
      <div style={s.h2}>Archive</div>
      <div style={{ color: TEXT_SEC, fontSize: "0.82rem", marginBottom: 22 }}>Past questions and winners. Answers revealed the day after.</div>
      {entries.length === 0 && (
        <div style={{ ...s.card, textAlign: "center", padding: "40px" }}>
          <div style={{ color: TEXT_MUTED, fontSize: "0.85rem" }}>No archived questions yet. Check back after the first question goes live.</div>
        </div>
      )}
      {entries.map(e => {
        const reveal = isYesterdayOrOlder(e.date);
        const cat = CAT[e.category] || CAT.Wildcard;
        const ptLabels = { 100: "Easy", 200: "Medium", 300: "Hard", 400: "Expert" };
        const ptColors = { 100: "#4CAF7D", 200: "#6495ED", 300: GOLD, 400: "#E05C5C" };
        return (
          <div key={e.date} style={s.card}>
            <div style={s.accent} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
              <div style={{ ...s.mono, fontSize: "0.68rem", color: TEXT_MUTED }}>{formatDate(e.date)}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ ...s.badge, background: cat.bg, color: cat.text }}>{e.category}</span>
                {e.points && <span style={{ ...s.badge, background: `${ptColors[e.points]}18`, color: ptColors[e.points] }}>{ptLabels[e.points] || e.points}</span>}
                {e.date === todayKey() && <span style={{ ...s.badge, background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", color: GOLD }}>Today</span>}
              </div>
            </div>
            <div style={{ fontSize: "0.88rem", lineHeight: 1.6, color: OFF_WHITE, marginBottom: 10 }}>{e.question}</div>
            {reveal ? (
              <div>
                <div style={{ ...s.mono, fontSize: "0.75rem", color: GOLD, marginBottom: 4 }}>✓ {e.displayAnswer || e.answer}</div>
                {e.goldWinner && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 100, padding: "3px 10px", marginTop: 4 }}>
                    <span style={{ fontSize: "0.8rem" }}>🥇</span>
                    <span style={{ ...s.mono, fontSize: "0.68rem", color: "#FFD700" }}>First correct: {e.goldWinner}</span>
                  </div>
                )}
                {!e.goldWinner && <div style={{ ...s.mono, fontSize: "0.68rem", color: TEXT_MUTED }}>No winner recorded</div>}
              </div>
            ) : (
              <div style={{ ...s.mono, fontSize: "0.72rem", color: TEXT_MUTED, fontStyle: "italic" }}>Answer revealed tomorrow</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupsTab({ user, setUser, saveUsers, users }) {
  // view: "home" | "create" | "join" | "group"
  const [view, setView] = useState("home");
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupData, setGroupData] = useState({});
  const [groupLBs, setGroupLBs] = useState({});
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const genCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") + "-" +
           Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  useEffect(() => { if (user) loadGroups(); else setLoading(false); }, [user?.username]);

  const loadGroups = async () => {
    setLoading(true);
    const codes = user.groups || [];
    if (!codes.length) { setLoading(false); return; }
    const results = await Promise.allSettled([
      ...codes.map(c => apiStorage.get(`group:${c}`)),
      ...codes.map(c => apiStorage.get(`grouplb:${c}:${monthKey()}`)),
    ]);
    const gd = {}, glb = {};
    codes.forEach((c, i) => {
      if (results[i].status === "fulfilled" && results[i].value) try { gd[c] = JSON.parse(results[i].value.value); } catch(e) {}
      const lbIdx = codes.length + i;
      if (results[lbIdx].status === "fulfilled" && results[lbIdx].value) try { glb[c] = JSON.parse(results[lbIdx].value.value); } catch(e) {}
    });
    setGroupData(gd); setGroupLBs(glb); setLoading(false);
  };

  const createGroup = async () => {
    setCreateError("");
    if (!createName.trim()) return setCreateError("Enter a group name.");
    if (createName.length > 30) return setCreateError("Max 30 characters.");
    setCreating(true);
    const code = genCode();
    const group = { code, name: createName.trim(), createdBy: user.username, created: todayKey(), members: [user.username] };
    await apiStorage.set(`group:${code}`, JSON.stringify(group));
    const updatedGroups = [...(user.groups || []), code];
    const nu = { ...user, groups: updatedGroups };
    await saveUsers({ ...users, [user.username]: { ...users[user.username], groups: updatedGroups } });
    setUser(nu); localStorage.setItem("whatis_user", JSON.stringify(nu));
    setGroupData({ ...groupData, [code]: group });
    setGroupLBs({ ...groupLBs, [code]: [] });
    setCreateName(""); setCreating(false);
    setCreateSuccess(code);
  };

  const joinGroup = async () => {
    setJoinError("");
    const code = joinCode.toUpperCase().trim();
    if (!code) return setJoinError("Enter an invite code.");
    if (user.groups?.includes(code)) return setJoinError("You're already in this group.");
    try {
      const r = await apiStorage.get(`group:${code}`);
      if (!r) return setJoinError("Group not found. Check the code and try again.");
      const group = JSON.parse(r.value);
      if (!group.members.includes(user.username)) { group.members.push(user.username); await apiStorage.set(`group:${code}`, JSON.stringify(group)); }
      const updatedGroups = [...(user.groups || []), code];
      const nu = { ...user, groups: updatedGroups };
      await saveUsers({ ...users, [user.username]: { ...users[user.username], groups: updatedGroups } });
      setUser(nu); localStorage.setItem("whatis_user", JSON.stringify(nu));
      const lbR = await apiStorage.get(`grouplb:${code}:${monthKey()}`).catch(() => null);
      const grp = { ...groupData, [code]: group };
      const glb = { ...groupLBs, [code]: lbR ? JSON.parse(lbR.value) : [] };
      setGroupData(grp); setGroupLBs(glb);
      setJoinCode("");
      // Go straight to the group leaderboard
      setActiveGroup(code); setView("group");
    } catch(e) { setJoinError("Something went wrong. Try again."); }
  };

  if (!user) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontFamily: SERIF, fontSize: "1.15rem", color: OFF_WHITE, marginBottom: 6 }}>Sign in to access Groups</div>
      <div style={{ color: TEXT_SEC, fontSize: "0.85rem" }}>Create or join private leaderboards with friends and family.</div>
    </div>
  );

  if (loading) return <div style={{ color: TEXT_MUTED, fontSize: "0.85rem", padding: "40px 0", textAlign: "center" }}>Loading...</div>;

  // ── Group leaderboard view ──────────────────────────────────────────────
  if (view === "group" && activeGroup) {
    const g = groupData[activeGroup];
    const lb = groupLBs[activeGroup] || [];
    if (!g) return null;
    return (
      <div>
        <button onClick={() => { setView("home"); setActiveGroup(null); setCreateSuccess(""); }} style={{ ...s.btnSec, marginBottom: 20, display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem" }}>← Groups</button>
        <div style={s.label}>Group leaderboard</div>
        <div style={s.h2}>{g.name}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ color: TEXT_SEC, fontSize: "0.8rem" }}>{g.members.length} member{g.members.length !== 1 ? "s" : ""} · {new Date().toLocaleString("default", { month: "long" })}</div>
        </div>
        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "11px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "0.8rem", color: TEXT_SEC }}>Invite code — share to add members</div>
          <div style={{ ...s.mono, fontSize: "1rem", fontWeight: 700, color: GOLD, letterSpacing: "0.15em" }}>{g.code}</div>
        </div>
        {lb.length === 0
          ? <div style={{ ...s.card, textAlign: "center", padding: "36px" }}><div style={{ color: TEXT_MUTED, fontSize: "0.85rem" }}>No scores yet — answer today's question to get started!</div></div>
          : lb.map((e, i) => <LBRow key={e.username} entry={e} rank={i + 1} isMe={e.username === user.username} />)
        }
      </div>
    );
  }

  // ── Create group view ───────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div>
        <button onClick={() => { setView("home"); setCreateName(""); setCreateError(""); setCreateSuccess(""); }} style={{ ...s.btnSec, marginBottom: 24, display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem" }}>← Back</button>
        <div style={s.label}>New group</div>
        <div style={{ ...s.h2, marginBottom: 6 }}>Create a Group</div>
        <div style={{ color: TEXT_SEC, fontSize: "0.83rem", marginBottom: 24 }}>Give your group a name — you'll get an invite code to share with members.</div>
        {createSuccess ? (
          <div>
            <div style={{ background: "rgba(76,175,125,0.1)", border: "1px solid rgba(76,175,125,0.3)", borderRadius: 10, padding: "24px", textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: "1.6rem", marginBottom: 10 }}>🎉</div>
              <div style={{ color: "#4CAF7D", fontWeight: 600, fontSize: "1rem", marginBottom: 6 }}>Group created!</div>
              <div style={{ color: TEXT_SEC, fontSize: "0.83rem", marginBottom: 16 }}>Share this code with anyone you want to invite:</div>
              <div style={{ ...s.mono, fontSize: "2rem", fontWeight: 700, color: GOLD, letterSpacing: "0.2em", marginBottom: 4 }}>{createSuccess}</div>
              <div style={{ ...s.mono, fontSize: "0.68rem", color: TEXT_MUTED }}>Members enter this code under Groups → Join a Group</div>
            </div>
            <button style={{ ...s.btn, width: "100%" }} onClick={() => { setActiveGroup(createSuccess); setView("group"); setCreateSuccess(""); }}>
              View group leaderboard →
            </button>
          </div>
        ) : (
          <div style={s.card}>
            <div style={s.accent} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Group name</div>
                <input style={s.input} placeholder="e.g. The Johnson Family, Work Friends..." value={createName} maxLength={30} onChange={e => { setCreateName(e.target.value); setCreateError(""); }} onKeyDown={e => e.key === "Enter" && createGroup()} autoFocus />
                <div style={{ ...s.mono, fontSize: "0.63rem", color: TEXT_MUTED, marginTop: 4 }}>{createName.length}/30</div>
              </div>
              {createError && <div style={{ color: "#E05C5C", fontSize: "0.8rem" }}>{createError}</div>}
              <button style={{ ...s.btn, width: "100%", marginTop: 4 }} onClick={createGroup} disabled={creating}>{creating ? "Creating..." : "Create group"}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Join group view ─────────────────────────────────────────────────────
  if (view === "join") {
    return (
      <div>
        <button onClick={() => { setView("home"); setJoinCode(""); setJoinError(""); }} style={{ ...s.btnSec, marginBottom: 24, display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem" }}>← Back</button>
        <div style={s.label}>Join a group</div>
        <div style={{ ...s.h2, marginBottom: 6 }}>Enter Invite Code</div>
        <div style={{ color: TEXT_SEC, fontSize: "0.83rem", marginBottom: 24 }}>Ask the group creator for their 6-character invite code and enter it below.</div>
        <div style={s.card}>
          <div style={s.accent} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Invite code</div>
              <input
                style={{ ...s.input, textTransform: "uppercase", letterSpacing: "0.18em", fontFamily: "'Courier New',monospace", fontSize: "1.1rem", textAlign: "center" }}
                placeholder="XXX-XXX"
                value={joinCode}
                maxLength={7}
                onChange={e => { setJoinCode(e.target.value); setJoinError(""); }}
                onKeyDown={e => e.key === "Enter" && joinGroup()}
                autoFocus
              />
            </div>
            {joinError && <div style={{ color: "#E05C5C", fontSize: "0.8rem" }}>{joinError}</div>}
            <button style={{ ...s.btn, width: "100%", marginTop: 4 }} onClick={joinGroup}>Join group</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Home view ───────────────────────────────────────────────────────────
  const userGroupCodes = user.groups || [];
  return (
    <div>
      <div style={s.label}>Private leaderboards</div>
      <div style={{ ...s.h2, marginBottom: 20 }}>Groups</div>

      {/* Existing groups */}
      {userGroupCodes.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          {userGroupCodes.map(code => {
            const g = groupData[code];
            const lb = groupLBs[code] || [];
            const myEntry = lb.find(e => e.username === user.username);
            const myRank = myEntry ? lb.indexOf(myEntry) + 1 : null;
            if (!g) return null;
            return (
              <div key={code} onClick={() => { setActiveGroup(code); setView("group"); }} style={{ ...s.card, cursor: "pointer", marginBottom: 8 }}>
                <div style={s.accent} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: "1rem", fontWeight: 700, marginBottom: 4 }}>{g.name}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ ...s.mono, fontSize: "0.67rem", color: TEXT_MUTED }}>{g.members.length} member{g.members.length !== 1 ? "s" : ""}</div>
                      <div style={{ ...s.badge, background: SURFACE2, border: `1px solid ${SURFACE3}`, color: TEXT_MUTED, fontSize: "0.62rem" }}>{g.code}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {myRank && <div style={{ fontFamily: SERIF, fontSize: "1.4rem", fontWeight: 700, color: GOLD, lineHeight: 1 }}>#{myRank}</div>}
                    {myEntry && <div style={{ ...s.mono, fontSize: "0.7rem", color: TEXT_SEC, marginTop: 2 }}>{myEntry.points} pts</div>}
                    {!myEntry && <div style={{ ...s.mono, fontSize: "0.7rem", color: TEXT_MUTED }}>No score yet</div>}
                  </div>
                </div>
              </div>
            );
          })}
          <hr style={s.divider} />
        </div>
      )}

      {/* Main CTAs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div onClick={() => setView("create")} style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
          onMouseLeave={e => e.currentTarget.style.borderColor = SURFACE3}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>➕</div>
          <div style={{ fontFamily: SERIF, fontSize: "1rem", fontWeight: 700, color: OFF_WHITE, marginBottom: 6 }}>Create a Group</div>
          <div style={{ color: TEXT_SEC, fontSize: "0.78rem", lineHeight: 1.5 }}>Start a private leaderboard and invite your crew</div>
        </div>
        <div onClick={() => setView("join")} style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
          onMouseLeave={e => e.currentTarget.style.borderColor = SURFACE3}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>🔗</div>
          <div style={{ fontFamily: SERIF, fontSize: "1rem", fontWeight: 700, color: OFF_WHITE, marginBottom: 6 }}>Join a Group</div>
          <div style={{ color: TEXT_SEC, fontSize: "0.78rem", lineHeight: 1.5 }}>Enter an invite code to join an existing group</div>
        </div>
      </div>
    </div>
  );
}

function RulesTab() {
  const rules = [
    { icon: "📅", text: "One question drops daily. One submission per account." },
    { icon: "🥇", text: "First correct answer receives 10% bonus. Second gets 5%. Third gets 3%." },
    { icon: "🏆", text: "Highest score at month end wins. Ties broken by fastest average answer time." },
    { icon: "💰", text: "$100 Visa Gift Card awarded monthly. Winner contacted via Instagram DM within 48 hours." },
    { icon: "📲", text: "Must follow @whatis_dailytrivia on Instagram to claim the prize." },
    { icon: "🗓️", text: "Scores reset on the 1st of each month. Every player starts fresh." },
    { icon: "👥", text: "Create or join private Groups for a side competition with friends and family." },
  ];
  const tiers = [
    { l: "Easy", p: 100, b: "+10", c: "#4CAF7D" },
    { l: "Medium", p: 200, b: "+20", c: "#6495ED" },
    { l: "Hard", p: 300, b: "+30", c: GOLD },
    { l: "Expert", p: 400, b: "+40", c: "#E05C5C" },
  ];
  const sched = [
    { d: "Mon", cat: "Finance", c: GOLD },
    { d: "Tue", cat: "History", c: "#CD853F" },
    { d: "Wed", cat: "Geopolitics", c: "#4CAF7D" },
    { d: "Thu", cat: "Science", c: "#9370DB" },
    { d: "Fri", cat: "Sports", c: "#6495ED" },
    { d: "Sat", cat: "Psychology", c: "#FF69B4" },
    { d: "Sun", cat: "Wildcard", c: "#E05C5C" },
  ];
  return (
    <div>
      <div style={s.label}>How it works</div>
      <div style={{ ...s.h2, marginBottom: 20 }}>Rules</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
        {rules.map((r, i) => (
          <div key={i} style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 8, padding: "11px 14px", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: "0.95rem", flexShrink: 0 }}>{r.icon}</span>
            <span style={{ fontSize: "0.83rem", color: TEXT_SEC, lineHeight: 1.5 }}>{r.text}</span>
          </div>
        ))}
      </div>
      <div style={s.label}>Point values</div>
      <div style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 10, overflow: "hidden", marginTop: 8, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {tiers.map((t, i) => (
            <div key={t.l} style={{ padding: "13px 8px", textAlign: "center", borderRight: i < 3 ? `1px solid ${SURFACE3}` : "none" }}>
              <div style={{ ...s.mono, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: t.c, marginBottom: 6 }}>{t.l}</div>
              <div style={{ fontFamily: SERIF, fontSize: "1.3rem", fontWeight: 700, color: OFF_WHITE, lineHeight: 1 }}>{t.p}</div>
              <div style={{ ...s.mono, fontSize: "0.6rem", color: TEXT_MUTED, marginTop: 3 }}>pts</div>
              <div style={{ ...s.mono, fontSize: "0.62rem", color: t.c, marginTop: 6, opacity: 0.85 }}>⚡ {t.b}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${SURFACE3}`, padding: "8px 13px" }}>
          <span style={{ ...s.mono, fontSize: "0.67rem", color: TEXT_MUTED }}>🥇+10% · 🥈+5% · 🥉+3% for first three correct answers</span>
        </div>
      </div>
      <div style={s.label}>Weekly schedule</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginTop: 8, marginBottom: 24 }}>
        {sched.map(x => (
          <div key={x.d} style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 7, padding: "9px 3px", textAlign: "center" }}>
            <div style={{ ...s.mono, fontSize: "0.58rem", color: TEXT_MUTED, marginBottom: 4, textTransform: "uppercase" }}>{x.d}</div>
            <div style={{ fontSize: "0.65rem", color: x.c, fontWeight: 500, lineHeight: 1.3 }}>{x.cat}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "13px 16px", textAlign: "center" }}>
        <div style={{ fontSize: "0.83rem", color: TEXT_SEC }}>Questions? DM us on Instagram <span style={{ color: GOLD }}>@whatis_dailytrivia</span></div>
      </div>
    </div>
  );
}

function ContactTab() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) return;
    await apiStorage.set(`contact:${Date.now()}`, JSON.stringify({ ...form, date: todayKey() }));
    setSent(true);
  };

  return (
    <div>
      <div style={s.label}>Get in touch</div>
      <div style={{ ...s.h2, marginBottom: 6 }}>Contact Us</div>
      <div style={{ color: TEXT_SEC, fontSize: "0.83rem", marginBottom: 24 }}>Questions, feedback, or sponsorship inquiries — we'd love to hear from you.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <a href="https://www.instagram.com/whatis_dailytrivia" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ fontSize: "1.3rem" }}>📲</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 3, color: OFF_WHITE }}>Instagram</div>
            <div style={{ color: GOLD, fontSize: "0.78rem", lineHeight: 1.4 }}>@whatis_dailytrivia</div>
          </div>
        </a>
        <a href="mailto:whatisdailytrivia@gmail.com" style={{ textDecoration: "none", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ fontSize: "1.3rem" }}>✉️</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 3, color: OFF_WHITE }}>Email</div>
            <div style={{ color: GOLD, fontSize: "0.78rem", wordBreak: "break-all" }}>whatisdailytrivia@gmail.com</div>
          </div>
        </a>
      </div>

      {sent ? (
        <div style={{ background: "rgba(76,175,125,0.1)", border: "1px solid rgba(76,175,125,0.3)", borderRadius: 10, padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>✓</div>
          <div style={{ color: "#4CAF7D", fontWeight: 600, marginBottom: 4 }}>Message received!</div>
          <div style={{ color: TEXT_SEC, fontSize: "0.83rem" }}>We'll get back to you soon.</div>
        </div>
      ) : (
        <div style={s.card}>
          <div style={s.accent} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Name</div>
              <input style={s.input} placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Email</div>
              <input style={s.input} type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Message</div>
              <textarea style={{ ...s.input, minHeight: 110, resize: "vertical", lineHeight: 1.6 }} placeholder="What's on your mind?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>
            <button style={{ ...s.btn, width: "100%", marginTop: 4 }} onClick={handleSubmit}>Send message</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminTab({ adminUnlocked, setAdminUnlocked, question, setQuestion }) {
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [qForm, setQForm] = useState({ question: "", answer: "", displayAnswer: "", category: "Finance", points: 200 });
  const [saved, setSaved] = useState(false);
  const [bank, setBank] = useState([]);
  const [launchDate, setLaunchDate] = useState("");
  const [launchSaved, setLaunchSaved] = useState(false);
  const [bankJson, setBankJson] = useState("");
  const [bankImported, setBankImported] = useState(false);
  const [bankError, setBankError] = useState("");
  const [section, setSection] = useState("scheduler");
  const [adminUsers, setAdminUsers] = useState({});
  const [adminHistories, setAdminHistories] = useState({});
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [userSaved, setUserSaved] = useState(false);

  useEffect(() => { if (adminUnlocked) loadAdminData(); }, [adminUnlocked]);

  const loadAdminData = async () => {
    try {
      const [bR, lR, uR] = await Promise.allSettled([apiStorage.get("question_bank"), apiStorage.get("launch_date"), apiStorage.get("users")]);
      if (bR.status === "fulfilled" && bR.value) setBank(JSON.parse(bR.value.value));
      if (lR.status === "fulfilled" && lR.value) setLaunchDate(lR.value.value);
      if (uR.status === "fulfilled" && uR.value) {
        const parsedUsers = JSON.parse(uR.value.value);
        setAdminUsers(parsedUsers);
        const histResults = await Promise.allSettled(Object.keys(parsedUsers).map(u => apiStorage.get(`history:${u}`)));
        const histories = {};
        Object.keys(parsedUsers).forEach((u, i) => {
          if (histResults[i].status === "fulfilled" && histResults[i].value) try { histories[u] = JSON.parse(histResults[i].value.value); } catch(e) {}
        });
        setAdminHistories(histories);
      }
    } catch (e) {}
  };

  const unlock = () => { if (pw === ADMIN_PASSWORD) { setAdminUnlocked(true); setPwErr(""); } else setPwErr("Incorrect password."); };

  const getDayNum = () => {
    if (!launchDate) return null;
    const launch = new Date(launchDate); const today = new Date();
    today.setHours(0,0,0,0); launch.setHours(0,0,0,0);
    return Math.floor((today - launch) / 86400000) + 1;
  };

  const getQ = (n) => (!bank.length || n < 1 || n > bank.length) ? null : bank[n - 1];

  const publishQuestion = async (q) => {
    const full = { ...q, id: `q_${todayKey()}` };
    setQuestion(full);
    setQForm({ question: q.question, answer: q.answer, displayAnswer: q.displayAnswer, category: q.category, points: q.points });
    await apiStorage.set(`question:${todayKey()}`, JSON.stringify(full));

    // Update archive
    const archiveEntry = { date: todayKey(), question: q.question, answer: q.answer, displayAnswer: q.displayAnswer, category: q.category, points: q.points };
    await apiStorage.set(`archive:${todayKey()}`, JSON.stringify(archiveEntry));
    try {
      const idxR = await apiStorage.get("archive_index").catch(() => null);
      const idx = idxR ? JSON.parse(idxR.value) : [];
      if (!idx.includes(todayKey())) await apiStorage.set("archive_index", JSON.stringify([todayKey(), ...idx]));
    } catch(e) {}

    setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const saveManualQ = async () => {
    if (!qForm.question || !qForm.answer) return;
    await publishQuestion(qForm);
  };

  const saveLaunch = async () => {
    await apiStorage.set("launch_date", launchDate);
    setLaunchSaved(true); setTimeout(() => setLaunchSaved(false), 2000);
  };

  const importBank = async () => {
    setBankError("");
    try {
      const parsed = JSON.parse(bankJson);
      if (!Array.isArray(parsed) || !parsed.length) throw new Error("Must be a non-empty array.");
      if (!parsed[0].question || !parsed[0].answer) throw new Error("Items need 'question' and 'answer' fields.");
      await apiStorage.set("question_bank", JSON.stringify(parsed));
      setBank(parsed); setBankJson(""); setBankImported(true); setTimeout(() => setBankImported(false), 3000);
    } catch (e) { setBankError(e.message); }
  };

  const dayNum = getDayNum();
  const todayQ = getQ(dayNum);
  const ptC = { 100: "#4CAF7D", 200: "#6495ED", 300: GOLD, 400: "#E05C5C" };
  const ptL = { 100: "Easy", 200: "Medium", 300: "Hard", 400: "Expert" };

  if (!adminUnlocked) return (
    <div style={{ maxWidth: 380, margin: "0 auto" }}>
      <div style={s.label}>Admin Access</div>
      <div style={s.h2}>Enter admin password</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <input style={s.input} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && unlock()} />
        {pwErr && <div style={{ color: "#E05C5C", fontSize: "0.82rem" }}>{pwErr}</div>}
        <button style={{ ...s.btn, width: "100%" }} onClick={unlock}>Unlock</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={s.label}>Admin Panel</div>
      <div style={{ display: "flex", gap: 5, marginBottom: 22, flexWrap: "wrap" }}>
        {[["scheduler","📅 Scheduler"],["manual","✏️ Manual"],["import","📥 Import"],["users","👥 Users"]].map(([k, l]) => (
          <button key={k} onClick={() => setSection(k)} style={{ padding: "7px 12px", borderRadius: 6, border: section === k ? `1px solid ${GOLD}` : `1px solid ${SURFACE3}`, background: section === k ? "rgba(201,168,76,0.1)" : "transparent", color: section === k ? GOLD : TEXT_SEC, fontFamily: SANS, fontWeight: 500, fontSize: "0.78rem", cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {section === "scheduler" && (
        <div>
          <div style={{ ...s.mono, fontSize: "0.67rem", color: TEXT_MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Launch date</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
            <input style={s.input} type="date" value={launchDate} onChange={e => setLaunchDate(e.target.value)} />
            <button style={{ ...s.btn, whiteSpace: "nowrap" }} onClick={saveLaunch}>{launchSaved ? "✓ Saved" : "Set date"}</button>
          </div>
          {!bank.length && <div style={{ background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: 8, padding: "14px 18px", marginBottom: 18, color: "#E05C5C", fontSize: "0.85rem" }}>No question bank imported yet.</div>}
          {bank.length > 0 && launchDate && todayQ && (
            <div>
              <div style={s.label}>Today — Day {dayNum}</div>
              <div style={{ ...s.card, marginBottom: 18 }}>
                <div style={s.accent} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ ...s.badge, background: (CAT[todayQ.category] || CAT.Wildcard).bg, color: (CAT[todayQ.category] || CAT.Wildcard).text }}>{todayQ.category}</span>
                    <span style={{ ...s.badge, background: `${ptC[todayQ.points]}18`, color: ptC[todayQ.points] }}>{ptL[todayQ.points]} · {todayQ.points}pts</span>
                  </div>
                  {saved && <span style={{ ...s.mono, fontSize: "0.72rem", color: "#4CAF7D" }}>✓ Live</span>}
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 500, lineHeight: 1.5, marginBottom: 10 }}>{todayQ.question}</div>
                <div style={{ ...s.mono, fontSize: "0.75rem", color: GOLD, marginBottom: 2 }}>Answer: {todayQ.answer}</div>
                <div style={{ ...s.mono, fontSize: "0.75rem", color: TEXT_SEC, marginBottom: 14 }}>Display: {todayQ.displayAnswer}</div>
                <button style={{ ...s.btn, width: "100%" }} onClick={() => publishQuestion(todayQ)}>{saved ? "✓ Published!" : "⚡ Publish today's question"}</button>
              </div>
            </div>
          )}
          {bank.length > 0 && launchDate && !todayQ && (
            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "14px 18px", color: GOLD, fontSize: "0.85rem" }}>
              {dayNum < 1 ? `Launch date is in the future.` : `Day ${dayNum} is beyond your question bank.`}
            </div>
          )}
          {bank.length > 0 && !launchDate && (
            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "14px 18px", color: GOLD, fontSize: "0.85rem" }}>Set your launch date above.</div>
          )}
        </div>
      )}

      {section === "manual" && (
        <div>
          <div style={{ color: TEXT_SEC, fontSize: "0.85rem", marginBottom: 18 }}>Manually set today's question for {todayKey()}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["Question","question","textarea"],["Accepted answer","answer","input"],["Display answer","displayAnswer","input"]].map(([label, key, type]) => (
              <div key={key}>
                <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                {type === "textarea"
                  ? <textarea style={{ ...s.input, minHeight: 90, resize: "vertical", lineHeight: 1.6 }} value={qForm[key]} onChange={e => setQForm({ ...qForm, [key]: e.target.value })} />
                  : <input style={s.input} value={qForm[key]} onChange={e => setQForm({ ...qForm, [key]: e.target.value })} />
                }
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</div>
                <select style={s.input} value={qForm.category} onChange={e => setQForm({ ...qForm, category: e.target.value })}>
                  {Object.keys(CAT).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Points</div>
                <select style={s.input} value={qForm.points} onChange={e => setQForm({ ...qForm, points: Number(e.target.value) })}>
                  <option value={100}>100 — Easy</option>
                  <option value={200}>200 — Medium</option>
                  <option value={300}>30