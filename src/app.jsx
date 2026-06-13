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

const s = {
  app: { background: BLACK, minHeight: "100vh", color: OFF_WHITE, fontFamily: "'DM Sans','Segoe UI',sans-serif" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: `1px solid ${SURFACE2}`, position: "sticky", top: 0, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(10px)", zIndex: 100 },
  logo: { fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 700, color: OFF_WHITE, display: "flex", alignItems: "center", gap: 10 },
  icon: { width: 34, height: 34, borderRadius: "50%", border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontFamily: "Georgia,serif", fontSize: "1.1rem", fontWeight: 700 },
  tab: { padding: "8px 14px", borderRadius: 6, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", border: "none", background: "transparent", color: TEXT_SEC, fontFamily: "inherit" },
  tabActive: { background: SURFACE2, color: GOLD },
  main: { maxWidth: 700, margin: "0 auto", padding: "36px 20px 80px" },
  card: { background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 10, padding: "28px", marginBottom: 14, position: "relative", overflow: "hidden" },
  accent: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${GOLD},${SURFACE3})` },
  label: { fontFamily: "'Courier New',monospace", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginBottom: 8 },
  h1: { fontFamily: "Georgia,serif", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.35, marginBottom: 8 },
  h2: { fontFamily: "Georgia,serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: 14 },
  input: { width: "100%", background: SURFACE2, border: `1px solid ${SURFACE3}`, borderRadius: 6, padding: "12px 15px", color: OFF_WHITE, fontFamily: "inherit", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" },
  btn: { background: GOLD, color: BLACK, border: "none", borderRadius: 6, padding: "12px 22px", fontFamily: "inherit", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" },
  btnSec: { background: "transparent", color: GOLD, border: `1px solid ${SURFACE3}`, borderRadius: 6, padding: "9px 18px", fontFamily: "inherit", fontWeight: 500, fontSize: "0.82rem", cursor: "pointer" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: 100, fontSize: "0.68rem", fontFamily: "'Courier New',monospace", letterSpacing: "0.08em" },
  mono: { fontFamily: "'Courier New',monospace" },
  divider: { border: "none", borderTop: `1px solid ${SURFACE3}`, margin: "28px 0" },
  lbRow: { display: "grid", gridTemplateColumns: "34px 1fr auto", alignItems: "center", gap: 12, padding: "12px 16px", background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 8, marginBottom: 7 },
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

export default function App() {
  const [tab, setTab] = useState("play");
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [question, setQuestion] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

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

  if (loading) return (
    <div style={{ ...s.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...s.icon, width: 52, height: 52, fontSize: "1.7rem", margin: "0 auto 14px" }}>?</div>
        <div style={{ ...s.mono, fontSize: "0.75rem", color: TEXT_SEC, letterSpacing: "0.1em" }}>LOADING...</div>
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
        <div style={{ display: "flex", gap: 4 }}>
          {[["play","Today"],["leaderboard","Leaderboard"],["rules","Rules"],["admin","Admin"]].map(([id, label]) => (
            <button key={id} style={{ ...s.tab, ...(tab === id ? s.tabActive : {}) }} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ ...s.badge, background: SURFACE2, border: `1px solid ${SURFACE3}`, color: GOLD }}>🔥 {user.streak || 0}</div>
            <button style={{ ...s.btnSec, padding: "5px 10px", fontSize: "0.72rem" }} onClick={() => { setUser(null); localStorage.removeItem("whatis_user"); }}>Sign out</button>
          </div>
        )}
      </nav>
      <div style={s.main}>
        {tab === "play" && <PlayTab user={user} setUser={setUser} users={users} saveUsers={saveUsers} question={question} submissions={submissions} setSubmissions={setSubmissions} leaderboard={leaderboard} saveLB={saveLB} />}
        {tab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard} user={user} />}
        {tab === "rules" && <RulesTab />}
        {tab === "admin" && <AdminTab adminUnlocked={adminUnlocked} setAdminUnlocked={setAdminUnlocked} question={question} setQuestion={setQuestion} />}
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
  const answered = user && submissions[user.username];

  const doAuth = () => {
    setError("");
    if (authMode === "register") {
      if (!form.username || !form.email || !form.password || !form.state) return setError("All fields required.");
      if (users[form.username]) return setError("Username taken.");
      const nu = { username: form.username, email: form.email, password: form.password, state: form.state, streak: 0 };
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
    const correct = checkAnswer(answer, question.answer);
    const base = question.points || 200;
    const isFirst = correct && !Object.values(submissions).some(s => s.isCorrect);
    const bonus = isFirst ? Math.round(base * 0.1) : 0;
    const pts = correct ? base + bonus : 0;
    const sub = { answer, isCorrect: correct, points: pts, basePoints: base, bonusPoints: bonus, isFirstCorrect: isFirst, time: new Date().toISOString() };
    const newSubs = { ...submissions, [user.username]: sub };
    setSubmissions(newSubs);
    await apiStorage.set(`submissions:${todayKey()}`, JSON.stringify(newSubs));
    const streak = correct ? (user.streak || 0) + 1 : 0;
    const nu = { ...user, streak };
    setUser(nu); localStorage.setItem("whatis_user", JSON.stringify(nu));
    await saveUsers({ ...users, [user.username]: { ...users[user.username], streak } });
    const ex = leaderboard.find(e => e.username === user.username);
    let newLB;
    if (ex) newLB = leaderboard.map(e => e.username === user.username ? { ...e, points: e.points + pts, correct: e.correct + (correct ? 1 : 0), streak, answered: e.answered + 1, firstCorrects: (e.firstCorrects || 0) + (isFirst ? 1 : 0) } : e);
    else newLB = [...leaderboard, { username: user.username, state: user.state || "", points: pts, correct: correct ? 1 : 0, streak, answered: 1, firstCorrects: isFirst ? 1 : 0 }];
    newLB.sort((a, b) => b.points - a.points);
    await saveLB(newLB);
    setResult(sub);
  };

  const cat = CAT[question?.category] || CAT.Wildcard;

  if (!user) return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ ...s.icon, width: 56, height: 56, fontSize: "1.8rem", margin: "0 auto 14px", borderWidth: 3 }}>?</div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: "1.7rem", fontWeight: 700, marginBottom: 8 }}>WhatIs<span style={{ color: GOLD, fontStyle: "italic" }}>...</span></div>
        <div style={{ color: TEXT_SEC, fontSize: "0.875rem" }}>One question. Every day. Top scorer wins $100.</div>
      </div>
      <div style={s.card}>
        <div style={s.accent} />
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setAuthMode(m); setError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 6, border: authMode === m ? `1px solid ${GOLD}` : `1px solid ${SURFACE3}`, background: authMode === m ? "rgba(201,168,76,0.1)" : "transparent", color: authMode === m ? GOLD : TEXT_SEC, fontFamily: "inherit", fontWeight: 500, cursor: "pointer", fontSize: "0.85rem" }}>
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={s.input} placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} onKeyDown={e => e.key === "Enter" && doAuth()} />
          {authMode === "register" && <input style={s.input} placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} onKeyDown={e => e.key === "Enter" && doAuth()} />}
          {authMode === "register" && (
            <select style={s.input} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
              <option value="">Select your state...</option>
              {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"].map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          )}
          <input style={s.input} placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === "Enter" && doAuth()} />
          {error && <div style={{ color: "#E05C5C", fontSize: "0.82rem" }}>{error}</div>}
          <button style={{ ...s.btn, width: "100%", marginTop: 4 }} onClick={doAuth}>{authMode === "login" ? "Sign in" : "Create account"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ ...s.label, marginBottom: 4 }}>{todayKey()} · Daily Question</div>
          <div style={{ color: TEXT_SEC, fontSize: "0.82rem" }}>{daysLeft()} days left · {new Date().toLocaleString("default", { month: "long" })}</div>
        </div>
        <div style={{ ...s.badge, background: cat.bg, color: cat.text }}>{question?.category}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 22 }}>
        {[{ v: leaderboard.length, l: "Players this month", gold: true }, { v: `${user?.streak || 0}🔥`, l: "Your streak" }, { v: "$100", l: "Monthly prize", gold: true }].map((x, i) => (
          <div key={i} style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: "1.5rem", fontWeight: 700, color: x.gold ? GOLD : OFF_WHITE }}>{x.v}</div>
            <div style={{ ...s.mono, fontSize: "0.65rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{x.l}</div>
          </div>
        ))}
      </div>
      <div style={s.card}>
        <div style={s.accent} />
        <div style={s.label}>Today's question · {question?.points || 200} pts</div>
        <div style={s.h1}>{question?.question}</div>
      </div>
      {!answered && !result && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "1.05rem", color: GOLD, fontStyle: "italic", marginBottom: 10 }}>"What is..."</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input style={s.input} placeholder="Type your answer..." value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
            <button style={{ ...s.btn, whiteSpace: "nowrap" }} onClick={submit}>Submit</button>
          </div>
        </div>
      )}
      {(result || answered) && (() => {
        const sub = result || submissions[user?.username];
        const ok = sub?.isCorrect;
        return (
          <div style={{ padding: "14px 18px", borderRadius: 8, marginTop: 10, marginBottom: 22, fontWeight: 500, background: ok ? "rgba(76,175,125,0.1)" : "rgba(224,92,92,0.1)", border: `1px solid ${ok ? "rgba(76,175,125,0.3)" : "rgba(224,92,92,0.3)"}`, color: ok ? "#4CAF7D" : "#E05C5C" }}>
            {ok ? "✓ Correct!" : "✗ Not quite — try again tomorrow."}
            <div style={{ marginTop: 8, fontFamily: "Georgia,serif", fontSize: "0.95rem", color: OFF_WHITE, fontStyle: "italic" }}>What is... {question?.displayAnswer || question?.answer}</div>
            {ok && sub?.isFirstCorrect && (
              <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 100, padding: "3px 12px" }}>
                <span>⚡</span><span style={{ ...s.mono, fontSize: "0.72rem", color: GOLD }}>First correct! +{sub.bonusPoints} bonus pts</span>
              </div>
            )}
            {ok && <div style={{ ...s.mono, fontSize: "0.78rem", color: "#4CAF7D", marginTop: 6 }}>{sub?.isFirstCorrect ? `+${sub.basePoints} + ${sub.bonusPoints} bonus = ${sub.points} pts` : `+${sub?.points} pts`}</div>}
          </div>
        );
      })()}
      <hr style={s.divider} />
      <div style={{ ...s.label, marginBottom: 14 }}>Top 5 this month</div>
      {leaderboard.length === 0
        ? <div style={{ color: TEXT_MUTED, fontSize: "0.875rem", padding: "16px 0" }}>No scores yet — be the first to answer!</div>
        : leaderboard.slice(0, 5).map((e, i) => <LBRow key={e.username} entry={e} rank={i + 1} isMe={e.username === user?.username} />)
      }
    </div>
  );
}

function LBRow({ entry, rank, isMe }) {
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return (
    <div style={{ ...s.lbRow, border: `1px solid ${rank === 1 ? "rgba(201,168,76,0.4)" : isMe ? "rgba(201,168,76,0.25)" : SURFACE3}` }}>
      <div style={{ ...s.mono, fontSize: "0.82rem", color: rank <= 3 ? GOLD : TEXT_MUTED, textAlign: "center" }}>{medals[rank] || rank}</div>
      <div>
        <div style={{ fontWeight: 500, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 7 }}>
          {entry.username}
          {entry.state && <span style={{ ...s.mono, fontSize: "0.68rem", color: TEXT_MUTED, background: SURFACE2, border: `1px solid ${SURFACE3}`, borderRadius: 4, padding: "1px 6px" }}>{entry.state}</span>}
          {isMe && <span style={{ color: GOLD, fontSize: "0.72rem" }}>(you)</span>}
          {entry.firstCorrects > 0 && <span style={{ ...s.mono, fontSize: "0.68rem", color: GOLD, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 100, padding: "1px 6px" }}>⚡{entry.firstCorrects}</span>}
        </div>
        <div style={{ ...s.mono, fontSize: "0.7rem", color: TEXT_MUTED, marginTop: 2 }}>🔥{entry.streak || 0} · {entry.correct || 0}/{entry.answered || 0} correct</div>
      </div>
      <div style={{ ...s.mono, fontSize: "0.88rem", fontWeight: 500, color: GOLD }}>{entry.points} pts</div>
    </div>
  );
}

function LeaderboardTab({ leaderboard, user }) {
  return (
    <div>
      <div style={s.label}>Monthly leaderboard</div>
      <div style={s.h2}>{new Date().toLocaleString("default", { month: "long" })} {new Date().getFullYear()}</div>
      <div style={{ color: TEXT_SEC, fontSize: "0.82rem", marginBottom: 22 }}>{daysLeft()} days remaining · Top scorer wins $100</div>
      <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "18px 22px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ ...s.mono, fontSize: "0.68rem", color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>🏆 Monthly Prize</div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 700 }}>$100 Visa Gift Card</div>
          <div style={{ color: TEXT_SEC, fontSize: "0.82rem", marginTop: 4 }}>Top scorer wins at month end</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "2.3rem", fontWeight: 700, color: GOLD, lineHeight: 1 }}>{daysLeft()}</div>
          <div style={{ ...s.mono, fontSize: "0.68rem", color: TEXT_MUTED, textTransform: "uppercase", marginTop: 4 }}>Days left</div>
        </div>
      </div>
      {leaderboard.length === 0
        ? <div style={{ ...s.card, textAlign: "center", padding: "40px" }}><div style={{ color: TEXT_MUTED, fontSize: "0.875rem" }}>No scores yet. Answer today's question to get on the board.</div></div>
        : leaderboard.map((e, i) => <LBRow key={e.username} entry={e} rank={i + 1} isMe={e.username === user?.username} />)
      }
    </div>
  );
}

function RulesTab() {
  const rules = [
    { icon: "📅", text: "One question drops daily. One submission per account." },
    { icon: "⚡", text: "First correct answer receives 10% bonus." },
    { icon: "🏆", text: "Highest score at month end wins. Ties broken by fastest average answer time." },
    { icon: "💰", text: "$100 Visa Gift Card awarded monthly. Winner contacted via Instagram DM within 48 hours." },
    { icon: "📲", text: "Must follow @whatis_dailytrivia on Instagram to claim the prize." },
    { icon: "🗓️", text: "Scores reset on the 1st of each month. Every player starts fresh." },
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
      <div style={{ ...s.h2, marginBottom: 22 }}>Rules</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 28 }}>
        {rules.map((r, i) => (
          <div key={i} style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 8, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>{r.icon}</span>
            <span style={{ fontSize: "0.85rem", color: TEXT_SEC, lineHeight: 1.5 }}>{r.text}</span>
          </div>
        ))}
      </div>
      <div style={s.label}>Point values</div>
      <div style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 10, overflow: "hidden", marginTop: 10, marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {tiers.map((t, i) => (
            <div key={t.l} style={{ padding: "14px 10px", textAlign: "center", borderRight: i < 3 ? `1px solid ${SURFACE3}` : "none" }}>
              <div style={{ ...s.mono, fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", color: t.c, marginBottom: 7 }}>{t.l}</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: "1.4rem", fontWeight: 700, color: OFF_WHITE, lineHeight: 1 }}>{t.p}</div>
              <div style={{ ...s.mono, fontSize: "0.62rem", color: TEXT_MUTED, marginTop: 3 }}>pts</div>
              <div style={{ ...s.mono, fontSize: "0.66rem", color: t.c, marginTop: 7, opacity: 0.85 }}>⚡ {t.b}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${SURFACE3}`, padding: "9px 14px" }}>
          <span style={{ ...s.mono, fontSize: "0.7rem", color: TEXT_MUTED }}>⚡ = first correct answer bonus</span>
        </div>
      </div>
      <div style={s.label}>Weekly schedule</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginTop: 10, marginBottom: 28 }}>
        {sched.map(x => (
          <div key={x.d} style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 7, padding: "10px 4px", textAlign: "center" }}>
            <div style={{ ...s.mono, fontSize: "0.62rem", color: TEXT_MUTED, marginBottom: 5, textTransform: "uppercase" }}>{x.d}</div>
            <div style={{ fontSize: "0.68rem", color: x.c, fontWeight: 500, lineHeight: 1.3 }}>{x.cat}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "14px 18px", textAlign: "center" }}>
        <div style={{ fontSize: "0.85rem", color: TEXT_SEC }}>Questions? DM us on Instagram <span style={{ color: GOLD }}>@whatis_dailytrivia</span></div>
      </div>
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

  useEffect(() => { if (adminUnlocked) loadAdminData(); }, [adminUnlocked]);

  const loadAdminData = async () => {
    try {
      const [bR, lR] = await Promise.allSettled([apiStorage.get("question_bank"), apiStorage.get("launch_date")]);
      if (bR.status === "fulfilled" && bR.value) setBank(JSON.parse(bR.value.value));
      if (lR.status === "fulfilled" && lR.value) setLaunchDate(lR.value.value);
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

  const loadAndSave = async (q) => {
    const full = { ...q, id: `q_${todayKey()}` };
    setQuestion(full);
    setQForm({ question: q.question, answer: q.answer, displayAnswer: q.displayAnswer, category: q.category, points: q.points });
    await apiStorage.set(`question:${todayKey()}`, JSON.stringify(full));
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const saveQ = async () => {
    if (!qForm.question || !qForm.answer) return;
    const q = { ...qForm, id: `q_${todayKey()}` };
    setQuestion(q);
    await apiStorage.set(`question:${todayKey()}`, JSON.stringify(q));
    setSaved(true); setTimeout(() => setSaved(false), 3000);
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
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input style={s.input} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && unlock()} />
        {pwErr && <div style={{ color: "#E05C5C", fontSize: "0.82rem" }}>{pwErr}</div>}
        <button style={{ ...s.btn, width: "100%" }} onClick={unlock}>Unlock</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={s.label}>Admin Panel</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[["scheduler","📅 Scheduler"],["manual","✏️ Manual"],["import","📥 Import Bank"]].map(([k, l]) => (
          <button key={k} onClick={() => setSection(k)} style={{ padding: "8px 14px", borderRadius: 6, border: section === k ? `1px solid ${GOLD}` : `1px solid ${SURFACE3}`, background: section === k ? "rgba(201,168,76,0.1)" : "transparent", color: section === k ? GOLD : TEXT_SEC, fontFamily: "inherit", fontWeight: 500, fontSize: "0.8rem", cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {section === "scheduler" && (
        <div>
          <div style={{ ...s.mono, fontSize: "0.7rem", color: TEXT_MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Launch date</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <input style={s.input} type="date" value={launchDate} onChange={e => setLaunchDate(e.target.value)} />
            <button style={{ ...s.btn, whiteSpace: "nowrap" }} onClick={saveLaunch}>{launchSaved ? "✓ Saved" : "Set date"}</button>
          </div>
          {!bank.length && (
            <div style={{ background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: 8, padding: "16px 20px", marginBottom: 20, color: "#E05C5C", fontSize: "0.875rem" }}>
              No question bank imported yet. Go to Import Bank tab to upload your questions.
            </div>
          )}
          {bank.length > 0 && launchDate && todayQ && (
            <div>
              <div style={s.label}>Today — Day {dayNum}</div>
              <div style={{ ...s.card, marginBottom: 20 }}>
                <div style={s.accent} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ ...s.badge, background: (CAT[todayQ.category] || CAT.Wildcard).bg, color: (CAT[todayQ.category] || CAT.Wildcard).text }}>{todayQ.category}</span>
                    <span style={{ ...s.badge, background: `${ptC[todayQ.points]}18`, color: ptC[todayQ.points] }}>{ptL[todayQ.points]} · {todayQ.points}pts</span>
                  </div>
                  {saved && <span style={{ ...s.mono, fontSize: "0.75rem", color: "#4CAF7D" }}>✓ Live</span>}
                </div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "1rem", fontWeight: 700, lineHeight: 1.45, marginBottom: 12 }}>{todayQ.question}</div>
                <div style={{ ...s.mono, fontSize: "0.78rem", color: GOLD, marginBottom: 2 }}>Answer: {todayQ.answer}</div>
                <div style={{ ...s.mono, fontSize: "0.78rem", color: TEXT_SEC, marginBottom: 16 }}>Display: {todayQ.displayAnswer}</div>
                <button style={{ ...s.btn, width: "100%" }} onClick={() => loadAndSave(todayQ)}>{saved ? "✓ Today's question is live!" : "⚡ Load & publish today's question"}</button>
              </div>
            </div>
          )}
          {bank.length > 0 && launchDate && !todayQ && (
            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "16px 20px", color: GOLD, fontSize: "0.875rem" }}>
              {dayNum < 1 ? `Launch date is in the future — ${Math.abs(dayNum - 1)} days to go.` : `Day ${dayNum} is beyond your 90-question bank.`}
            </div>
          )}
          {bank.length > 0 && !launchDate && (
            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "16px 20px", color: GOLD, fontSize: "0.875rem" }}>
              Set your launch date above to activate the scheduler.
            </div>
          )}
        </div>
      )}

      {section === "manual" && (
        <div>
          <div style={{ color: TEXT_SEC, fontSize: "0.875rem", marginBottom: 20 }}>Manually set today's question for {todayKey()}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[["Question","question","textarea"],["Accepted answer","answer","input"],["Display answer","displayAnswer","input"]].map(([label, key, type]) => (
              <div key={key}>
                <div style={{ ...s.mono, fontSize: "0.7rem", color: TEXT_MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                {type === "textarea"
                  ? <textarea style={{ ...s.input, minHeight: 100, resize: "vertical", lineHeight: 1.6 }} value={qForm[key]} onChange={e => setQForm({ ...qForm, [key]: e.target.value })} placeholder={`Enter ${label.toLowerCase()}...`} />
                  : <input style={s.input} value={qForm[key]} onChange={e => setQForm({ ...qForm, [key]: e.target.value })} placeholder={key === "answer" ? "e.g. REIT" : "e.g. A Real Estate Investment Trust (REIT)"} />
                }
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ ...s.mono, fontSize: "0.7rem", color: TEXT_MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</div>
                <select style={s.input} value={qForm.category} onChange={e => setQForm({ ...qForm, category: e.target.value })}>
                  {Object.keys(CAT).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ ...s.mono, fontSize: "0.7rem", color: TEXT_MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Points</div>
                <select style={s.input} value={qForm.points} onChange={e => setQForm({ ...qForm, points: Number(e.target.value) })}>
                  <option value={100}>100 — Easy</option>
                  <option value={200}>200 — Medium</option>
                  <option value={300}>300 — Hard</option>
                  <option value={400}>400 — Expert</option>
                </select>
              </div>
            </div>
            <button style={{ ...s.btn, marginTop: 4 }} onClick={saveQ}>{saved ? "✓ Question saved and live!" : "Save today's question"}</button>
          </div>
          <hr style={s.divider} />
          <div style={s.label}>Live preview</div>
          <div style={{ ...s.card, marginTop: 8 }}>
            <div style={s.accent} />
            <div style={{ ...s.badge, background: (CAT[question?.category] || CAT.Wildcard).bg, color: (CAT[question?.category] || CAT.Wildcard).text, marginBottom: 12 }}>{question?.category}</div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: "1rem", fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>{question?.question || "No question set yet."}</div>
            <div style={{ ...s.mono, fontSize: "0.78rem", color: GOLD }}>Answer: {question?.answer}</div>
            <div style={{ ...s.mono, fontSize: "0.78rem", color: TEXT_SEC, marginTop: 4 }}>Display: {question?.displayAnswer}</div>
          </div>
        </div>
      )}

      {section === "import" && (
        <div>
          <div style={{ color: TEXT_SEC, fontSize: "0.875rem", lineHeight: 1.6, marginBottom: 20 }}>
            Paste your question bank JSON below. One-time import — the Scheduler handles everything after.
          </div>
          {bank.length > 0 && (
            <div style={{ background: "rgba(76,175,125,0.08)", border: "1px solid rgba(76,175,125,0.25)", borderRadius: 8, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ color: "#4CAF7D", fontSize: "0.875rem", fontWeight: 500 }}>✓ {bank.length} questions loaded</div>
              <div style={{ ...s.mono, fontSize: "0.72rem", color: TEXT_MUTED }}>Bank active</div>
            </div>
          )}
          <textarea
            style={{ ...s.input, minHeight: 200, resize: "vertical", lineHeight: 1.5, fontFamily: "'Courier New',monospace", fontSize: "0.78rem" }}
            placeholder={'[\n  {\n    "question": "...",\n    "answer": "...",\n    "displayAnswer": "...",\n    "category": "Finance",\n    "points": 200\n  }\n]'}
            value={bankJson}
            onChange={e => { setBankJson(e.target.value); setBankError(""); }}
          />
          {bankError && <div style={{ color: "#E05C5C", fontSize: "0.85rem", marginTop: 8 }}>{bankError}</div>}
          <button style={{ ...s.btn, width: "100%", marginTop: 10 }} onClick={importBank}>
            {bankImported ? `✓ ${bank.length} questions imported!` : "Import question bank"}
          </button>
        </div>
      )}
    </div>
  );
}
