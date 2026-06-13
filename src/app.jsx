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
const GOLD_DARK = "#9A7030";
const BLACK = "#0A0A0A";
const OFF_WHITE = "#F5F3EE";
const SURFACE = "#141414";
const SURFACE2 = "#1E1E1E";
const SURFACE3 = "#282828";
const TEXT_SEC = "#9A9590";
const TEXT_MUTED = "#5A5550";

const styles = {
  app: { background: BLACK, minHeight: "100vh", color: OFF_WHITE, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: `1px solid ${SURFACE2}`, position: "sticky", top: 0, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(10px)", zIndex: 100 },
  logo: { fontFamily: "Georgia, serif", fontSize: "1.3rem", fontWeight: 700, color: OFF_WHITE, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { width: 36, height: 36, borderRadius: "50%", border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontFamily: "Georgia, serif", fontSize: "1.2rem", fontWeight: 700, flexShrink: 0 },
  navTabs: { display: "flex", gap: 4 },
  navTab: { padding: "8px 16px", borderRadius: 6, fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", border: "none", background: "transparent", color: TEXT_SEC, transition: "all 0.2s" },
  navTabActive: { background: SURFACE2, color: GOLD },
  main: { maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" },
  card: { background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 10, padding: "32px", marginBottom: 16, position: "relative", overflow: "hidden" },
  cardAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${SURFACE3})` },
  label: { fontFamily: "'Courier New', monospace", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginBottom: 10 },
  mono: { fontFamily: "'Courier New', monospace" },
  h1: { fontFamily: "Georgia, serif", fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.35, marginBottom: 8 },
  h2: { fontFamily: "Georgia, serif", fontSize: "1.25rem", fontWeight: 700, marginBottom: 16 },
  input: { width: "100%", background: SURFACE2, border: `1px solid ${SURFACE3}`, borderRadius: 6, padding: "13px 16px", color: OFF_WHITE, fontFamily: "inherit", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" },
  btn: { background: GOLD, color: BLACK, border: "none", borderRadius: 6, padding: "13px 24px", fontFamily: "inherit", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s", display: "inline-block" },
  btnSecondary: { background: "transparent", color: GOLD, border: `1px solid ${SURFACE3}`, borderRadius: 6, padding: "10px 20px", fontFamily: "inherit", fontWeight: 500, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" },
  tag: { display: "inline-flex", alignItems: "center", gap: 6, background: SURFACE2, border: `1px solid ${SURFACE3}`, borderRadius: 100, padding: "5px 12px", fontSize: "0.75rem", fontFamily: "'Courier New', monospace", letterSpacing: "0.06em", color: GOLD },
  lbRow: { display: "grid", gridTemplateColumns: "36px 1fr auto", alignItems: "center", gap: 14, padding: "14px 18px", background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 8, marginBottom: 8, transition: "border-color 0.2s" },
  feedback: { padding: "16px 20px", borderRadius: 8, marginTop: 14, fontWeight: 500 },
  sectionDivider: { border: "none", borderTop: `1px solid ${SURFACE3}`, margin: "36px 0" },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 },
  statCard: { background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 8, padding: "16px 18px" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: 100, fontSize: "0.7rem", fontFamily: "'Courier New', monospace", letterSpacing: "0.08em" },
};

const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getDaysLeftInMonth = () => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return last - d.getDate();
};

const normalizeAnswer = (str) =>
  str.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

const checkAnswer = (userAnswer, correctAnswer) => {
  const u = normalizeAnswer(userAnswer);
  const c = normalizeAnswer(correctAnswer);
  if (u === c) return true;
  if (u.includes(c) || c.includes(u)) return true;
  const cWords = c.split(" ").filter((w) => w.length > 3);
  const matches = cWords.filter((w) => u.includes(w));
  return matches.length >= Math.ceil(cWords.length * 0.7);
};

const CATEGORY_COLORS = {
  Finance: { bg: "rgba(201,168,76,0.12)", text: GOLD },
  Geopolitics: { bg: "rgba(76,175,125,0.1)", text: "#4CAF7D" },
  Sports: { bg: "rgba(100,149,237,0.12)", text: "#6495ED" },
  Science: { bg: "rgba(147,112,219,0.12)", text: "#9370DB" },
  History: { bg: "rgba(205,133,63,0.12)", text: "#CD853F" },
  "Business & Tech": { bg: "rgba(64,224,208,0.1)", text: "#40E0D0" },
  Psychology: { bg: "rgba(255,105,180,0.1)", text: "#FF69B4" },
  Geography: { bg: "rgba(144,238,144,0.1)", text: "#90EE90" },
  Law: { bg: "rgba(255,165,0,0.1)", text: "#FFA500" },
  Wildcard: { bg: "rgba(200,80,80,0.1)", text: "#E05C5C" },
};

const SAMPLE_QUESTIONS = [
  { id: "q1", question: "This financial instrument, first introduced in the 1960s, allows investors to pool capital and gain exposure to real estate without directly owning property — and is required by law to distribute at least 90% of its taxable income to shareholders.", answer: "REIT", displayAnswer: "A Real Estate Investment Trust (REIT)", category: "Finance", points: 200 },
  { id: "q2", question: "This Cold War-era military alliance, formed in 1949, remains the cornerstone of Western collective defense and currently has 32 member nations after its most recent expansion in 2024.", answer: "NATO", displayAnswer: "NATO (North Atlantic Treaty Organization)", category: "Geopolitics", points: 200 },
  { id: "q3", question: "In the NFL, this rule — introduced in 1978 — fundamentally changed offensive football by prohibiting defensive backs from making contact with receivers more than 5 yards beyond the line of scrimmage.", answer: "illegal contact rule", displayAnswer: "The Illegal Contact Rule (Mel Blount Rule)", category: "Sports", points: 200 },
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

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, qRes, subsRes, lbRes] = await Promise.allSettled([
        apiStorage.get("users"),
        apiStorage.get(`question:${getTodayKey()}`),
        apiStorage.get(`submissions:${getTodayKey()}`),
        apiStorage.get(`leaderboard:${getCurrentMonthKey()}`),
      ]);
      if (usersRes.status === "fulfilled" && usersRes.value) setUsers(JSON.parse(usersRes.value.value));
      if (qRes.status === "fulfilled" && qRes.value) setQuestion(JSON.parse(qRes.value.value));
      else setQuestion(SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)]);
      if (subsRes.status === "fulfilled" && subsRes.value) setSubmissions(JSON.parse(subsRes.value.value));
      if (lbRes.status === "fulfilled" && lbRes.value) setLeaderboard(JSON.parse(lbRes.value.value));

      const savedUser = localStorage.getItem("whatis_user");
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {
      setQuestion(SAMPLE_QUESTIONS[0]);
    }
    setLoading(false);
  };

  const saveUsers = async (u) => {
    setUsers(u);
    await apiStorage.set("users", JSON.stringify(u));
  };

  const saveLeaderboard = async (lb) => {
    setLeaderboard(lb);
    await apiStorage.set(`leaderboard:${getCurrentMonthKey()}`, JSON.stringify(lb));
  };

  if (loading) return (
    <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...styles.logoIcon, width: 56, height: 56, fontSize: "1.8rem", margin: "0 auto 16px" }}>?</div>
        <div style={{ color: TEXT_SEC, fontFamily: "'Courier New', monospace", fontSize: "0.8rem", letterSpacing: "0.1em" }}>LOADING...</div>
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>?</div>
          <span>WhatIs<span style={{ color: GOLD, fontStyle: "italic" }}>...</span></span>
        </div>
        <div style={styles.navTabs}>
          {["play", "leaderboard", "rules", "admin"].map((t) => (
            <button key={t} style={{ ...styles.navTab, ...(tab === t ? styles.navTabActive : {}) }} onClick={() => setTab(t)}>
              {t === "play" ? "Today" : t === "leaderboard" ? "Leaderboard" : t === "rules" ? "Rules" : "Admin"}
            </button>
          ))}
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...styles.tag }}>🔥 {user.streak || 0} streak</div>
            <button style={{ ...styles.btnSecondary, padding: "6px 12px", fontSize: "0.75rem" }} onClick={() => { setUser(null); localStorage.removeItem("whatis_user"); }}>Sign out</button>
          </div>
        )}
      </nav>

      <div style={styles.main}>
        {tab === "play" && <PlayTab user={user} setUser={setUser} users={users} saveUsers={saveUsers} question={question} submissions={submissions} setSubmissions={setSubmissions} leaderboard={leaderboard} saveLeaderboard={saveLeaderboard} />}
        {tab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard} user={user} />}
        {tab === "admin" && <AdminTab adminUnlocked={adminUnlocked} setAdminUnlocked={setAdminUnlocked} question={question} setQuestion={setQuestion} />}
        {tab === "rules" && <RulesTab />}
      </div>
    </div>
  );
}

function PlayTab({ user, setUser, users, saveUsers, question, submissions, setSubmissions, leaderboard, saveLeaderboard }) {
  const [view, setView] = useState(user ? "question" : "auth");
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const todayKey = getTodayKey();
  const alreadyAnswered = user && submissions[user.username];

  useEffect(() => {
    if (user) setView("question");
  }, [user]);

  const handleAuth = () => {
    setError("");
    if (authMode === "register") {
      if (!form.username || !form.email || !form.password) return setError("All fields required.");
      if (users[form.username]) return setError("Username already taken.");
      const newUser = { username: form.username, email: form.email, password: form.password, streak: 0, joinedMonth: getCurrentMonthKey() };
      const updated = { ...users, [form.username]: newUser };
      saveUsers(updated);
      setUser(newUser);
      localStorage.setItem("whatis_user", JSON.stringify(newUser));
    } else {
      const found = users[form.username];
      if (!found || found.password !== form.password) return setError("Invalid username or password.");
      setUser(found);
      localStorage.setItem("whatis_user", JSON.stringify(found));
    }
    setForm({ username: "", email: "", password: "" });
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    const isCorrect = checkAnswer(answer, question.answer);
    const basePoints = question.points || 200;

    const hasFirstCorrect = Object.values(submissions).some((s) => s.isCorrect);
    const isFirstCorrect = isCorrect && !hasFirstCorrect;
    const bonusPoints = isFirstCorrect ? Math.round(basePoints * 0.1) : 0;
    const points = isCorrect ? basePoints + bonusPoints : 0;

    const sub = { answer, isCorrect, points, basePoints, bonusPoints, isFirstCorrect, time: new Date().toISOString() };

    const newSubs = { ...submissions, [user.username]: sub };
    setSubmissions(newSubs);
    await apiStorage.set(`submissions:${todayKey}`, JSON.stringify(newSubs));

    const newStreak = isCorrect ? (user.streak || 0) + 1 : 0;
    const updatedUser = { ...user, streak: newStreak };
    setUser(updatedUser);
    localStorage.setItem("whatis_user", JSON.stringify(updatedUser));
    const updatedUsers = { ...users, [user.username]: { ...users[user.username], streak: newStreak } };
    await saveUsers(updatedUsers);

    const existing = leaderboard.find((e) => e.username === user.username);
    let newLb;
    if (existing) {
      newLb = leaderboard.map((e) => e.username === user.username ? { ...e, points: e.points + points, correct: e.correct + (isCorrect ? 1 : 0), streak: newStreak, answered: e.answered + 1, firstCorrects: (e.firstCorrects || 0) + (isFirstCorrect ? 1 : 0) } : e);
    } else {
      newLb = [...leaderboard, { username: user.username, points, correct: isCorrect ? 1 : 0, streak: newStreak, answered: 1, firstCorrects: isFirstCorrect ? 1 : 0 }];
    }
    newLb.sort((a, b) => b.points - a.points);
    await saveLeaderboard(newLb);
    setResult({ isCorrect, points, basePoints, bonusPoints, isFirstCorrect, sub });
  };

  const catStyle = CATEGORY_COLORS[question?.category] || CATEGORY_COLORS["Wildcard"];

  if (view === "auth") return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ ...styles.logoIcon, width: 64, height: 64, fontSize: "2rem", margin: "0 auto 16px", borderWidth: 3 }}>?</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: 8 }}>WhatIs<span style={{ color: GOLD, fontStyle: "italic" }}>...</span></div>
        <div style={{ color: TEXT_SEC, fontSize: "0.9rem" }}>One question. Every day. Top scorer wins $100.</div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardAccent} />
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => { setAuthMode(m); setError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 6, border: authMode === m ? `1px solid ${GOLD}` : `1px solid ${SURFACE3}`, background: authMode === m ? "rgba(201,168,76,0.1)" : "transparent", color: authMode === m ? GOLD : TEXT_SEC, fontFamily: "inherit", fontWeight: 500, cursor: "pointer", fontSize: "0.85rem" }}>
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={styles.input} placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleAuth()} />
          {authMode === "register" && <input style={styles.input} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleAuth()} />}
          <input style={styles.input} placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleAuth()} />
          {error && <div style={{ color: "#E05C5C", fontSize: "0.85rem" }}>{error}</div>}
          <button style={{ ...styles.btn, width: "100%", marginTop: 4 }} onClick={handleAuth}>
            {authMode === "login" ? "Sign in" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ ...styles.label, marginBottom: 4 }}>{getTodayKey()} · Daily Question</div>
          <div style={{ color: TEXT_SEC, fontSize: "0.85rem" }}>{getDaysLeftInMonth()} days left in {new Date().toLocaleString("default", { month: "long" })}</div>
        </div>
        <div style={{ ...styles.badge, background: catStyle.bg, color: catStyle.text }}>{question?.category}</div>
      </div>

      <div style={styles.statGrid}>
        <div style={styles.statCard}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color: GOLD }}>{leaderboard.length}</div>
          <div style={{ ...styles.mono, fontSize: "0.7rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Players this month</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", fontWeight: 700 }}>{user?.streak || 0}🔥</div>
          <div style={{ ...styles.mono, fontSize: "0.7rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Your streak</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color: GOLD }}>$100</div>
          <div style={{ ...styles.mono, fontSize: "0.7rem", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Monthly prize</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardAccent} />
        <div style={styles.label}>Today's question · {question?.points || 200} pts</div>
        <div style={styles.h1}>{question?.question}</div>
      </div>

      {!alreadyAnswered && !result ? (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", color: GOLD, fontStyle: "italic", marginBottom: 12 }}>"What is..."</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...styles.input }} placeholder="Type your answer..." value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            <button style={{ ...styles.btn, whiteSpace: "nowrap" }} onClick={handleSubmit}>Submit</button>
          </div>
        </div>
      ) : null}

      {(result || alreadyAnswered) && (() => {
        const sub = result?.sub || submissions[user?.username];
        const correct = sub?.isCorrect;
        return (
          <div style={{ ...styles.feedback, background: correct ? "rgba(76,175,125,0.1)" : "rgba(224,92,92,0.1)", border: `1px solid ${correct ? "rgba(76,175,125,0.3)" : "rgba(224,92,92,0.3)"}`, color: correct ? "#4CAF7D" : "#E05C5C", marginBottom: 24 }}>
            {correct ? "✓ Correct! Well played." : "✗ Not quite — try again tomorrow."}
            <div style={{ marginTop: 8, fontFamily: "Georgia, serif", fontSize: "1rem", color: OFF_WHITE, fontStyle: "italic" }}>
              What is... {question?.displayAnswer || question?.answer}
            </div>
            {correct && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                {sub?.isFirstCorrect && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,168,76,0.15)", border: `1px solid rgba(201,168,76,0.4)`, borderRadius: 100, padding: "4px 12px", width: "fit-content" }}>
                    <span>⚡</span>
                    <span style={{ ...styles.mono, fontSize: "0.75rem", color: GOLD, letterSpacing: "0.06em" }}>First correct answer! +{sub?.bonusPoints} bonus pts</span>
                  </div>
                )}
                <div style={{ ...styles.mono, fontSize: "0.8rem", color: "#4CAF7D" }}>
                  {sub?.isFirstCorrect
                    ? `+${sub?.basePoints} pts + ${sub?.bonusPoints} bonus = ${sub?.points} pts total`
                    : `+${sub?.points} points added to your score`}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <hr style={styles.sectionDivider} />
      <div style={{ ...styles.label, marginBottom: 16 }}>Top 5 this month</div>
      {leaderboard.slice(0, 5).map((entry, i) => (
        <LeaderboardRow key={entry.username} entry={entry} rank={i + 1} isMe={entry.username === user?.username} />
      ))}
      {leaderboard.length === 0 && <div style={{ color: TEXT_MUTED, fontSize: "0.9rem", padding: "20px 0" }}>No scores yet — be the first to answer today!</div>}
    </div>
  );
}

function LeaderboardTab({ leaderboard, user }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={styles.label}>Monthly leaderboard</div>
        <div style={styles.h2}>{new Date().toLocaleString("default", { month: "long" })} {new Date().getFullYear()}</div>
        <div style={{ color: TEXT_SEC, fontSize: "0.875rem" }}>{getDaysLeftInMonth()} days remaining · Top scorer wins $100 gift card</div>
      </div>


      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 14 }}>Scoring breakdown</div>
        <div style={{ background: "#141414", border: "1px solid #282828", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "1px solid #282828" }}>
            {[{label:"Easy",pts:"100",bonus:"+10",color:"#4CAF7D"},{label:"Medium",pts:"200",bonus:"+20",color:"#6495ED"},{label:"Hard",pts:"300",bonus:"+30",color:"#C9A84C"},{label:"Expert",pts:"400",bonus:"+40",color:"#E05C5C"}].map((tier) => (
              <div key={tier.label} style={{ padding: "16px 12px", textAlign: "center", borderRight: "1px solid #282828" }}>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: tier.color, marginBottom: 8 }}>{tier.label}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#F5F3EE", lineHeight: 1 }}>{tier.pts}</div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.68rem", color: "#5A5550", marginTop: 4 }}>pts</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1rem" }}>⚡</span>
            <div>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.75rem", color: "#C9A84C", fontWeight: 500 }}>First correct answer bonus</span>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.75rem", color: "#5A5550" }}> — earn an extra 10% on top of base points</span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #282828" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              {[{label:"Easy",bonus:"+10 pts"},{label:"Medium",bonus:"+20 pts"},{label:"Hard",bonus:"+30 pts"},{label:"Expert",bonus:"+40 pts"}].map((tier) => (
                <div key={tier.label} style={{ padding: "10px 12px", textAlign: "center", borderRight: "1px solid #282828" }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", color: "#C9A84C" }}>{tier.bonus}</div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.65rem", color: "#3A3530", marginTop: 2 }}>if 1st correct</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: "rgba(201,168,76,0.06)", border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 10, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ ...styles.mono, fontSize: "0.7rem", color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>🏆 June Prize</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 700 }}>$100 Visa Gift Card</div>
          <div style={{ color: TEXT_SEC, fontSize: "0.85rem", marginTop: 4 }}>Awarded to top scorer at month's end</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "2.5rem", fontWeight: 700, color: GOLD, lineHeight: 1 }}>{getDaysLeftInMonth()}</div>
          <div style={{ ...styles.mono, fontSize: "0.7rem", color: TEXT_MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>Days left</div>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center", padding: "48px 32px" }}>
          <div style={{ color: TEXT_MUTED, fontSize: "0.9rem" }}>No scores yet this month. Answer today's question to get on the board.</div>
        </div>
      ) : leaderboard.map((entry, i) => (
        <LeaderboardRow key={entry.username} entry={entry} rank={i + 1} isMe={entry.username === user?.username} showFull />
      ))}
    </div>
  );
}

function LeaderboardRow({ entry, rank, isMe, showFull }) {
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return (
    <div style={{ ...styles.lbRow, ...(rank === 1 ? { border: `1px solid rgba(201,168,76,0.4)`, background: "linear-gradient(135deg, rgba(201,168,76,0.07), #141414)" } : {}), ...(isMe ? { border: `1px solid rgba(201,168,76,0.3)` } : {}), gridTemplateColumns: showFull ? "36px 1fr auto auto" : "36px 1fr auto" }}>
      <div style={{ ...styles.mono, fontSize: "0.85rem", color: rank <= 3 ? GOLD : TEXT_MUTED, textAlign: "center" }}>{medals[rank] || rank}</div>
      <div>
        <div style={{ fontWeight: 500, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
          {entry.username}
          {isMe && <span style={{ color: GOLD, fontSize: "0.75rem" }}>(you)</span>}
          {entry.firstCorrects > 0 && (
            <span style={{ ...styles.mono, fontSize: "0.7rem", color: GOLD, background: "rgba(201,168,76,0.1)", border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 100, padding: "1px 7px" }}>⚡ {entry.firstCorrects}</span>
          )}
        </div>
        <div style={{ ...styles.mono, fontSize: "0.72rem", color: TEXT_MUTED, marginTop: 2 }}>🔥 {entry.streak || 0} streak · {entry.correct || 0}/{entry.answered || 0} correct</div>
      </div>
      {showFull && <div style={{ ...styles.mono, fontSize: "0.75rem", color: TEXT_MUTED, textAlign: "right" }}>{entry.correct || 0} correct</div>}
      <div style={{ ...styles.mono, fontSize: "0.9rem", fontWeight: 500, color: GOLD, textAlign: "right" }}>{entry.points} pts</div>
    </div>
  );
}

function AdminTab({ adminUnlocked, setAdminUnlocked, question, setQuestion }) {
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [qForm, setQForm] = useState({ question: "", answer: "", displayAnswer: "", category: "Finance", points: 200 });
  const [saved, setSaved] = useState(false);
  const [bank, setBank] = useState([]);
  const [launchDate, setLaunchDate] = useState("");
  const [launchSaved, setLaunchSaved] = useState(false);
  const [bankJson, setBankJson] = useState("");
  const [bankImported, setBankImported] = useState(false);
  const [bankError, setBankError] = useState("");
  const [adminSection, setAdminSection] = useState("scheduler");

  useEffect(() => {
    if (adminUnlocked) loadAdminData();
  }, [adminUnlocked]);

  const loadAdminData = async () => {
    try {
      const [bankRes, ldRes] = await Promise.allSettled([
        apiStorage.get("question_bank"),
        apiStorage.get("launch_date"),
      ]);
      if (bankRes.status === "fulfilled" && bankRes.value) setBank(JSON.parse(bankRes.value.value));
      if (ldRes.status === "fulfilled" && ldRes.value) setLaunchDate(ldRes.value.value);
    } catch (e) {}
  };

  const unlock = () => {
    if (pw === ADMIN_PASSWORD) { setAdminUnlocked(true); setPwError(""); }
    else setPwError("Incorrect password.");
  };

  const getDayNumber = () => {
    if (!launchDate) return null;
    const launch = new Date(launchDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    launch.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - launch) / (1000 * 60 * 60 * 24));
    return diff + 1;
  };

  const getQuestionForDay = (dayNum) => {
    if (!bank.length || dayNum < 1 || dayNum > bank.length) return null;
    return bank[dayNum - 1];
  };

  const loadQuestionIntoForm = (q) => {
    setQForm({ question: q.question, answer: q.answer, displayAnswer: q.displayAnswer, category: q.category, points: q.points });
  };

  const loadAndSaveQuestion = async (q) => {
    const fullQ = { ...q, id: `q_${getTodayKey()}` };
    setQuestion(fullQ);
    setQForm({ question: q.question, answer: q.answer, displayAnswer: q.displayAnswer, category: q.category, points: q.points });
    await apiStorage.set(`question:${getTodayKey()}`, JSON.stringify(fullQ));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const saveQuestion = async () => {
    if (!qForm.question || !qForm.answer) return;
    const q = { ...qForm, id: `q_${getTodayKey()}` };
    setQuestion(q);
    await apiStorage.set(`question:${getTodayKey()}`, JSON.stringify(q));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const saveLaunchDate = async () => {
    await apiStorage.set("launch_date", launchDate);
    setLaunchSaved(true);
    setTimeout(() => setLaunchSaved(false), 2000);
  };

  const importBank = async () => {
    setBankError("");
    try {
      const parsed = JSON.parse(bankJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Must be a non-empty array.");
      if (!parsed[0].question || !parsed[0].answer) throw new Error("Questions must have 'question' and 'answer' fields.");
      await apiStorage.set("question_bank", JSON.stringify(parsed));
      setBank(parsed);
      setBankJson("");
      setBankImported(true);
      setTimeout(() => setBankImported(false), 3000);
    } catch (e) {
      setBankError(e.message || "Invalid JSON — check format and try again.");
    }
  };

  const dayNum = getDayNumber();
  const todayQ = getQuestionForDay(dayNum);
  const upcomingQs = dayNum ? Array.from({ length: 7 }, (_, i) => ({ day: dayNum + i + 1, q: getQuestionForDay(dayNum + i + 1) })).filter(x => x.q) : [];
  const ptColors = { 100: "#4CAF7D", 200: "#6495ED", 300: "#C9A84C", 400: "#E05C5C" };
  const ptLabels = { 100: "Easy", 200: "Medium", 300: "Hard", 400: "Expert" };

  if (!adminUnlocked) return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <div style={styles.label}>Admin Access</div>
      <div style={styles.h2}>Enter admin password</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input style={styles.input} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} />
        {pwError && <div style={{ color: "#E05C5C", fontSize: "0.85rem" }}>{pwError}</div>}
        <button style={{ ...styles.btn, width: "100%" }} onClick={unlock}>Unlock</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={styles.label}>Admin Panel</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {[["scheduler", "📅 Scheduler"], ["manual", "✏️ Manual"], ["import", "📥 Import Bank"]].map(([key, label]) => (
          <button key={key} onClick={() => setAdminSection(key)} style={{ padding: "9px 16px", borderRadius: 6, border: adminSection === key ? `1px solid ${GOLD}` : `1px solid ${SURFACE3}`, background: adminSection === key ? "rgba(201,168,76,0.1)" : "transparent", color: adminSection === key ? GOLD : TEXT_SEC, fontFamily: "inherit", fontWeight: 500, fontSize: "0.82rem", cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {adminSection === "scheduler" && (
        <div>
          <div style={{ ...styles.mono, fontSize: "0.72rem", color: TEXT_MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Launch date</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <input style={{ ...styles.input }} type="date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} />
            <button style={{ ...styles.btn, whiteSpace: "nowrap" }} onClick={saveLaunchDate}>
              {launchSaved ? "✓ Saved" : "Set date"}
            </button>
          </div>

          {!bank.length && (
            <div style={{ background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: 8, padding: "16px 20px", marginBottom: 20, color: "#E05C5C", fontSize: "0.875rem" }}>
              No question bank imported yet. Go to the Import Bank tab to upload your questions.
            </div>
          )}

          {bank.length > 0 && launchDate && todayQ && (
            <div>
              <div style={styles.label}>Today — Day {dayNum}</div>
              <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={styles.cardAccent} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ ...styles.badge, background: (CATEGORY_COLORS[todayQ.category] || CATEGORY_COLORS.Wildcard).bg, color: (CATEGORY_COLORS[todayQ.category] || CATEGORY_COLORS.Wildcard).text }}>{todayQ.category}</span>
                    <span style={{ ...styles.badge, background: `${ptColors[todayQ.points]}18`, color: ptColors[todayQ.points] }}>{ptLabels[todayQ.points]} · {todayQ.points}pts</span>
                  </div>
                  {saved && <span style={{ ...styles.mono, fontSize: "0.75rem", color: "#4CAF7D" }}>✓ Live</span>}
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 700, lineHeight: 1.45, marginBottom: 12 }}>{todayQ.question}</div>
                <div style={{ ...styles.mono, fontSize: "0.78rem", color: GOLD, marginBottom: 2 }}>Answer: {todayQ.answer}</div>
                <div style={{ ...styles.mono, fontSize: "0.78rem", color: TEXT_SEC, marginBottom: 16 }}>Display: {todayQ.displayAnswer}</div>
                <button style={{ ...styles.btn, width: "100%" }} onClick={() => loadAndSaveQuestion(todayQ)}>
                  {saved ? "✓ Today's question is live!" : "⚡ Load & publish today's question"}
                </button>
              </div>

              {upcomingQs.length > 0 && (
                <div>
                  <div style={styles.label}>Upcoming — next 7 days</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {upcomingQs.map(({ day, q }) => (
                      <div key={day} style={{ background: SURFACE, border: `1px solid ${SURFACE3}`, borderRadius: 8, padding: "14px 18px", display: "grid", gridTemplateColumns: "48px 1fr auto", alignItems: "center", gap: 14 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ ...styles.mono, fontSize: "0.7rem", color: TEXT_MUTED, textTransform: "uppercase" }}>Day</div>
                          <div style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: GOLD }}>{day}</div>
                        </div>
                        <div>
                          <div style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                            <span style={{ ...styles.badge, background: (CATEGORY_COLORS[q.category] || CATEGORY_COLORS.Wildcard).bg, color: (CATEGORY_COLORS[q.category] || CATEGORY_COLORS.Wildcard).text, fontSize: "0.65rem" }}>{q.category}</span>
                            <span style={{ ...styles.badge, background: `${ptColors[q.points]}15`, color: ptColors[q.points], fontSize: "0.65rem" }}>{q.points}pts</span>
                          </div>
                          <div style={{ fontSize: "0.82rem", color: TEXT_SEC, lineHeight: 1.4 }}>{q.question.substring(0, 90)}...</div>
                        </div>
                        <button style={{ ...styles.btnSecondary, padding: "7px 12px", fontSize: "0.78rem", whiteSpace: "nowrap" }} onClick={() => { setAdminSection("manual"); loadQuestionIntoForm(q); }}>
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bank.length > 0 && launchDate && !todayQ && (
          
      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 14 }}>Scoring breakdown</div>
        <div style={{ background: "#141414", border: "1px solid #282828", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "1px solid #282828" }}>
            {[{label:"Easy",pts:"100",bonus:"+10",color:"#4CAF7D"},{label:"Medium",pts:"200",bonus:"+20",color:"#6495ED"},{label:"Hard",pts:"300",bonus:"+30",color:"#C9A84C"},{label:"Expert",pts:"400",bonus:"+40",color:"#E05C5C"}].map((tier) => (
              <div key={tier.label} style={{ padding: "16px 12px", textAlign: "center", borderRight: "1px solid #282828" }}>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: tier.color, marginBottom: 8 }}>{tier.label}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#F5F3EE", lineHeight: 1 }}>{tier.pts}</div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.68rem", color: "#5A5550", marginTop: 4 }}>pts</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1rem" }}>⚡</span>
            <div>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.75rem", color: "#C9A84C", fontWeight: 500 }}>First correct answer bonus</span>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.75rem", color: "#5A5550" }}> — earn an extra 10% on top of base points</span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #282828" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              {[{label:"Easy",bonus:"+10 pts"},{label:"Medium",bonus:"+20 pts"},{label:"Hard",bonus:"+30 pts"},{label:"Expert",bonus:"+40 pts"}].map((tier) => (
                <div key={tier.label} style={{ padding: "10px 12px", textAlign: "center", borderRight: "1px solid #282828" }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", color: "#C9A84C" }}>{tier.bonus}</div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.65rem", color: "#3A3530", marginTop: 2 }}>if 1st correct</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: "rgba(201,168,76,0.06)", border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 8, padding: "16px 20px", color: GOLD, fontSize: "0.875rem" }}>
                  {dayNum < 1 ? `Launch date is in the future — ${Math.abs(dayNum - 1)} days to go.` : `Day ${dayNum} is beyond your 90-question bank. Time to write more questions!`}
                </div>
              )}
            </div>
          )}

          {bank.length > 0 && !launchDate && (
      
      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 14 }}>Scoring breakdown</div>
        <div style={{ background: "#141414", border: "1px solid #282828", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "1px solid #282828" }}>
            {[{label:"Easy",pts:"100",bonus:"+10",color:"#4CAF7D"},{label:"Medium",pts:"200",bonus:"+20",color:"#6495ED"},{label:"Hard",pts:"300",bonus:"+30",color:"#C9A84C"},{label:"Expert",pts:"400",bonus:"+40",color:"#E05C5C"}].map((tier) => (
              <div key={tier.label} style={{ padding: "16px 12px", textAlign: "center", borderRight: "1px solid #282828" }}>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: tier.color, marginBottom: 8 }}>{tier.label}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#F5F3EE", lineHeight: 1 }}>{tier.pts}</div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.68rem", color: "#5A5550", marginTop: 4 }}>pts</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1rem" }}>⚡</span>
            <div>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.75rem", color: "#C9A84C", fontWeight: 500 }}>First correct answer bonus</span>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.75rem", color: "#5A5550" }}> — earn an extra 10% on top of base points</span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #282828" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              {[{label:"Easy",bonus:"+10 pts"},{label:"Medium",bonus:"+20 pts"},{label:"Hard",bonus:"+30 pts"},{label:"Expert",bonus:"+40 pts"}].map((tier) => (
                <div key={tier.label} style={{ padding: "10px 12px", textAlign: "center", borderRight: "1px solid #282828" }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", color: "#C9A84C" }}>{tier.bonus}</div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.65rem", color: "#3A3530", marginTop: 2 }}>if 1st correct</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: "rgba(201,168,76,0.06)", border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 8, padding: "16px 20px", color: GOLD, fontSize: "0.875rem" }}>
              Set your launch date above to activate the scheduler.
            </div>
          )}
        </div>
      )}

      {adminSection === "manual" && (
        <div>
          <div style={{ color: TEXT_SEC, fontSize: "0.875rem", marginBottom: 20 }}>Manually set today's question for {getTodayKey()}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ ...styles.mono, fontSize: "0.72rem", color: TEXT_MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Question</div>
              <textarea style={{ ...styles.input, minHeight: 120, resize: "vertical", lineHeight: 1.6 }} placeholder="Enter the full trivia question..." value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })} />
            </div>
            <div>
              <div style={{ ...styles.mono, fontSize: "0.72rem", color: TEXT_MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Accepted answer (auto-scoring)</div>
              <input style={styles.input} placeholder="e.g. REIT" value={qForm.answer} onChange={(e) => setQForm({ ...qForm, answer: e.target.value })} />
            </div>
            <div>
              <div style={{ ...styles.mono, fontSize: "0.72rem", color: TEXT_MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Display answer (shown after submission)</div>
              <input style={styles.input} placeholder="e.g. A Real Estate Investment Trust (REIT)" value={qForm.displayAnswer} onChange={(e) => setQForm({ ...qForm, displayAnswer: e.target.value })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ ...styles.mono, fontSize: "0.72rem", color: TEXT_MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</div>
                <select style={{ ...styles.input }} value={qForm.category} onChange={(e) => setQForm({ ...qForm, category: e.target.value })}>
                  {Object.keys(CATEGORY_COLORS).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ ...styles.mono, fontSize: "0.72rem", color: TEXT_MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Points</div>
                <select style={{ ...styles.input }} value={qForm.points} onChange={(e) => setQForm({ ...qForm, points: Number(e.target.value) })}>
                  <option value={100}>100 — Easy</option>
                  <option value={200}>200 — Medium</option>
                  <option value={300}>300 — Hard</option>
                  <option value={400}>400 — Expert</option>
                </select>
              </div>
            </div>
            <button style={{ ...styles.btn, marginTop: 4 }} onClick={saveQuestion}>
              {saved ? "✓ Question saved and live!" : "Save today's question"}
            </button>
          </div>
          <hr style={styles.sectionDivider} />
          <div style={styles.label}>Live preview</div>
          <div style={{ ...styles.card, marginTop: 8 }}>
            <div style={styles.cardAccent} />
            <div style={{ ...styles.badge, background: (CATEGORY_COLORS[question?.category] || CATEGORY_COLORS.Wildcard).bg, color: (CATEGORY_COLORS[question?.category] || CATEGORY_COLORS.Wildcard).text, marginBottom: 12 }}>{question?.category}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>{question?.question || "No question set yet."}</div>
            <div style={{ ...styles.mono, fontSize: "0.78rem", color: GOLD }}>Answer: {question?.answer}</div>
            <div style={{ ...styles.mono, fontSize: "0.78rem", color: TEXT_SEC, marginTop: 4 }}>Display: {question?.displayAnswer}</div>
          </div>
        </div>
      )}

      {adminSection === "import" && (
        <div>
          <div style={{ color: TEXT_SEC, fontSize: "0.875rem", lineHeight: 1.6, marginBottom: 20 }}>
            Paste your question bank JSON below. This is a one-time import — once saved, the Scheduler tab handles everything automatically.
          </div>
          {bank.length > 0 && (
            <div style={{ background: "rgba(76,175,125,0.08)", border: "1px solid rgba(76,175,125,0.25)", borderRadius: 8, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ color: "#4CAF7D", fontSize: "0.875rem", fontWeight: 500 }}>✓ {bank.length} questions loaded</div>
              <div style={{ ...styles.mono, fontSize: "0.72rem", color: TEXT_MUTED }}>Bank active</div>
            </div>
          )}
          <textarea
            style={{ ...styles.input, minHeight: 200, resize: "vertical", lineHeight: 1.5, fontFamily: "'Courier New', monospace", fontSize: "0.78rem" }}
            placeholder={'[\n  {\n    "question": "...",\n    "answer": "...",\n    "displayAnswer": "...",\n    "category": "Finance",\n    "points": 200\n  },\n  ...\n]'}
            value={bankJson}
            onChange={(e) => { setBankJson(e.target.value); setBankError(""); }}
          />
          {bankError && <div style={{ color: "#E05C5C", fontSize: "0.85rem", marginTop: 8 }}>{bankError}</div>}
          <button style={{ ...styles.btn, width: "100%", marginTop: 10 }} onClick={importBank}>
            {bankImported ? `✓ ${bank.length} questions imported!` : "Import question bank"}
          </button>
          <div style={{ ...styles.mono, fontSize: "0.72rem", color: TEXT_MUTED, marginTop: 12, lineHeight: 1.6 }}>
            After importing, go to the Scheduler tab, set your launch date, and hit "Load & publish today's question" each morning. That's all you need to do daily.
          </div>
        </div>
      )}
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

  const schedule = [
    { day: "Mon", category: "Finance", color: "#C9A84C" },
    { day: "Tue", category: "History", color: "#CD853F" },
    { day: "Wed", category: "Geopolitics", color: "#4CAF7D" },
    { day: "Thu", category: "Science", color: "#9370DB" },
    { day: "Fri", category: "Sports", color: "#6495ED" },
    { day: "Sat", category: "Psychology", color: "#FF69B4" },
    { day: "Sun", category: "Wildcard", color: "#E05C5C" },
  ];

  const tiers = [
    { label: "Easy", pts: 100, bonus: "+10", color: "#4CAF7D" },
    { label: "Medium", pts: 200, bonus: "+20", color: "#6495ED" },
    { label: "Hard", pts: 300, bonus: "+30", color: "#C9A84C" },
    { label: "Expert", pts: 400, bonus: "+40", color: "#E05C5C" },
  ];

  return (
    <div>
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 10 }}>How it works</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "1.25rem", fontWeight: 700, marginBottom: 28 }}>Rules</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
        {rules.map((r, i) => (
          <div key={i} style={{ background: "#141414", border: "1px solid #282828", borderRadius: 8, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{r.icon}</span>
            <span style={{ fontSize: "0.875rem", color: "#9A9590", lineHeight: 1.5 }}>{r.text}</span>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 12 }}>Point values</div>
      <div style={{ background: "#141414", border: "1px solid #282828", borderRadius: 10, overflow: "hidden", marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {tiers.map((t, i) => (
            <div key={t.label} style={{ padding: "16px 12px", textAlign: "center", borderRight: i < 3 ? "1px solid #282828" : "none" }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: t.color, marginBottom: 8 }}>{t.label}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#F5F3EE", lineHeight: 1 }}>{t.pts}</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.65rem", color: "#5A5550", marginTop: 3 }}>pts</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.68rem", color: t.color, marginTop: 8, opacity: 0.8 }}>⚡ {t.bonus}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #282828", padding: "10px 16px" }}>
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.72rem", color: "#5A5550" }}>⚡ = first correct answer bonus</span>
        </div>
      </div>

      <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 12 }}>Weekly schedule</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 32 }}>
        {schedule.map((s) => (
          <div key={s.day} style={{ background: "#141414", border: "1px solid #282828", borderRadius: 8, padding: "12px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.68rem", color: "#5A5550", marginBottom: 6, textTransform: "uppercase" }}>{s.day}</div>
            <div style={{ fontSize: "0.72rem", color: s.color, fontWeight: 500, lineHeight: 1.3 }}>{s.category}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "0.875rem", color: "#9A9590" }}>Questions? DM us on Instagram <span style={{ color: "#C9A84C" }}>@whatis_dailytrivia</span></div>
      </div>
    </div>
  );
}
