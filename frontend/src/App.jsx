import { useState, useRef, useEffect } from "react";

// ── Backend URL — FastAPI running locally on port 8000 ────────────────────────
// const BACKEND_URL = "http://localhost:8000";
const BACKEND_URL = "https://portfolio-y1i9.onrender.com";

const SUGGESTIONS = [
  "What did he build at TCS?",
  "Explain his RAG experience",
  "What are his AI/ML skills?",
  "Tell me about his security work",
  "How can I contact him?",
];

const RESUME_SECTIONS = [
  {
    label: "Education",
    icon: "🎓",
    items: [
      { title: "MS Computer Science", sub: "North Carolina State University · 2024–2026", tags: ["AI Engineering", "Neural Nets", "Security"] },
      { title: "B.Tech Computer Science", sub: "SRM University · 2019–2023", tags: ["Algorithms", "Software Engineering"] },
    ],
  },
  {
    label: "Experience",
    icon: "💼",
    items: [
      { title: "AI Engineer", sub: "North Carolina State University · 2025–Present", tags: ["RAG", "Agentic Systems", "LLM"] },
      { title: "Software Engineer", sub: "Tata Consultancy Services · 2023–2024", tags: ["Spring Boot", "Kafka", "Azure"] },
    ],
  },
  {
    label: "Skills",
    icon: "⚡",
    items: [
      { title: "Languages", sub: "Java · Python · JavaScript", tags: [] },
      { title: "AI / ML", sub: "RAG · LangChain · MCP · HuggingFace · Ollama", tags: [] },
      { title: "Technologies/Tools", sub: "Spring Boot · Kafka · REST · Docker · Kubernetes", tags: [] },
      { title: "Cloud & Databases", sub: "AWS · Azure · MySQL · MongoDB · SQLite · ChromaDB", tags: [] },
    ],
  },
];

const CONTACTS = [
  { icon: "✉", label: "Email", value: "yaswanthmullamurijobs@gmail.com", href: "mailto:yaswanthmullamurijobs@gmail.com", color: "#f59e0b" },
  { icon: "in", label: "LinkedIn", value: "yaswanth-mullamuri", href: "https://linkedin.com/in/yaswanth-mullamuri", color: "#0ea5e9" },
  { icon: "⌥", label: "GitHub", value: "YaswanthMullamuri", href: "https://github.com/YaswanthMullamuri", color: "#a78bfa" },
  { icon: "☏", label: "Phone", value: "(919) 264-1489", href: "tel:+19192641489", color: "#34d399" },
];

function renderMarkdown(text) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g).map((p, j) =>
      j % 2 === 1 ? <strong key={j} style={{ color: "#e2e8f0" }}>{p}</strong> : p
    );
    if (line === "") return <div key={i} style={{ height: 6 }} />;
    return <div key={i} style={{ lineHeight: 1.65 }}>{parts}</div>;
  });
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "8px 4px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "#475569",
          animation: "bounce 1.1s infinite", animationDelay: `${i * 0.18}s`,
        }} />
      ))}
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function Portfolio() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! 👋 I'm Yaswanth's AI assistant — ask me anything about his experience, skills, or how to reach him.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (isMobile && panelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, panelOpen]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    if (isMobile) setPanelOpen(false);
    setMessages(p => [...p, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, llm: "claude", history: messages }),
      });
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();
      setMessages(p => [...p, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setMessages(p => [...p, {
        role: "assistant",
        content: "⚠️ Could not reach the backend. Make sure the FastAPI server is running at `localhost:8000`.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const PANEL_WIDTH = 300;
  const mobilePanel = isMobile ? "min(300px, 85vw)" : undefined;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c14",
      fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
      color: "#94a3b8",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:#1e293b transparent; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        textarea { outline:none; }
        .contact-card:hover { transform:translateY(-2px); border-color:var(--c) !important; }
        .suggest:hover { background:rgba(248,197,100,0.08) !important; color:#f8c564 !important; border-color:#f8c564 !important; }
        .nav-tab:hover { color:#f8c564; }
        .send-btn:hover:not(:disabled) { transform:scale(1.05); }
        .panel-toggle:hover { background:rgba(248,197,100,0.1); }
        .suggest-row::-webkit-scrollbar { display:none; }
        .panel-overlay {
          position: fixed; inset: 0; z-index: 35;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease;
        }
      `}</style>

      {/* Scanline overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)",
      }} />

      {/* Top bar */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 52,
        background: "rgba(8,12,20,0.92)",
        borderBottom: "1px solid rgba(248,197,100,0.12)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, flexShrink: 0,
            background: "linear-gradient(135deg,#f8c564,#f97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#080c14",
          }}>Y</div>
          <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 500, fontFamily: "Syne, sans-serif", whiteSpace: "nowrap" }}>
            Yaswanth Mullamuri
          </span>
          {!isMobile && <span style={{ color: "#334155", fontSize: 11 }}>/ portfolio</span>}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {!isMobile && (
            <span style={{
              fontSize: 10, color: "#34d399", display: "flex", alignItems: "center", gap: 5,
              background: "rgba(52,211,153,0.08)", padding: "3px 10px", borderRadius: 20,
              border: "1px solid rgba(52,211,153,0.2)",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", animation: "glow 2s infinite", display: "inline-block" }} />
              Claude · RAG active
            </span>
          )}
          <button
            className="panel-toggle"
            onClick={() => setPanelOpen(p => !p)}
            style={{
              padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(248,197,100,0.2)",
              background: panelOpen ? "rgba(248,197,100,0.1)" : "transparent",
              color: "#f8c564", fontSize: 11, cursor: "pointer",
              transition: "all 0.2s", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            {panelOpen ? "hide resume" : "view resume"} ↗
          </button>
        </div>
      </header>

      {/* Mobile backdrop — tap to dismiss */}
      {isMobile && panelOpen && (
        <div className="panel-overlay" onClick={() => setPanelOpen(false)} />
      )}

      {/* Main layout */}
      <div style={{ display: "flex", flex: 1, paddingTop: 52 }}>

        {/* ── Side panel ─────────────────────────────────────────── */}
        <aside style={{
          width: isMobile ? (panelOpen ? mobilePanel : 0) : (panelOpen ? PANEL_WIDTH : 0),
          minWidth: isMobile ? undefined : (panelOpen ? PANEL_WIDTH : 0),
          transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
          borderRight: "1px solid rgba(248,197,100,0.08)",
          background: "rgba(10,14,22,0.99)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 52,
          left: isMobile ? (panelOpen ? 0 : "calc(-1 * min(300px, 85vw))") : 0,
          bottom: 0,
          zIndex: 40,
          overflow: "hidden",
        }}>
          {/* Scrollable inner content */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflowY: "auto",
            opacity: panelOpen ? 1 : 0,
            transition: "opacity 0.2s 0.1s",
          }}>
            {/* Profile */}
            <div style={{ padding: "20px 18px 0", flexShrink: 0 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, marginBottom: 10,
                  background: "linear-gradient(135deg,#f8c564 0%,#f97316 50%,#ec4899 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 700, color: "#080c14", fontFamily: "Syne, sans-serif",
                  boxShadow: "0 0 24px rgba(248,197,100,0.25)",
                }}>Y</div>
                <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700, fontFamily: "Syne, sans-serif" }}>
                  Venkata Yaswanth
                </div>
                <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>MS CS · NC State · Raleigh, NC</div>
                <a
                  href="/resume.pdf"
                  download
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10,
                    padding: "5px 12px", borderRadius: 6,
                    background: "rgba(248,197,100,0.1)",
                    border: "1px solid rgba(248,197,100,0.3)",
                    color: "#f8c564", fontSize: 11, textDecoration: "none",
                  }}
                >↓ Download Resume</a>
              </div>

              {/* Section tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                {RESUME_SECTIONS.map((s, i) => (
                  <button key={i} className="nav-tab" onClick={() => setActiveSection(i)} style={{
                    flex: 1, padding: "5px 4px", borderRadius: 6, border: "none",
                    background: activeSection === i ? "rgba(248,197,100,0.12)" : "transparent",
                    color: activeSection === i ? "#f8c564" : "#475569",
                    fontSize: 10, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
                  }}>{s.icon} {s.label}</button>
                ))}
              </div>
            </div>

            {/* Section items */}
            <div style={{ padding: "0 18px", flexShrink: 0 }}>
              {RESUME_SECTIONS[activeSection].items.map((item, i) => (
                <div key={i} style={{
                  padding: "10px 12px", borderRadius: 8, marginBottom: 8,
                  background: "rgba(15,23,42,0.7)",
                  border: "1px solid rgba(30,41,59,0.8)",
                  animation: "fadeUp 0.3s ease",
                }}>
                  <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 500, marginBottom: 3 }}>{item.title}</div>
                  <div style={{ color: "#475569", fontSize: 10, marginBottom: item.tags.length ? 6 : 0 }}>{item.sub}</div>
                  {item.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {item.tags.map(t => (
                        <span key={t} style={{
                          fontSize: 9, padding: "2px 7px", borderRadius: 10,
                          background: "rgba(248,197,100,0.08)", color: "#f8c564",
                          border: "1px solid rgba(248,197,100,0.15)",
                        }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contact — flows naturally at the bottom, always reachable by scrolling */}
            <div style={{ padding: "14px 18px 24px", borderTop: "1px solid rgba(30,41,59,0.6)", marginTop: 8, flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: "#334155", marginBottom: 8, letterSpacing: 1 }}>CONTACT</div>
              {CONTACTS.map(c => (
                <a key={c.label} href={c.href} target="_blank" rel="noreferrer"
                  className="contact-card"
                  style={{
                    "--c": c.color,
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "7px 10px", borderRadius: 7, marginBottom: 5,
                    background: "rgba(15,23,42,0.5)",
                    border: "1px solid rgba(30,41,59,0.6)",
                    textDecoration: "none", color: "#64748b",
                    fontSize: 11, transition: "all 0.2s",
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: 5,
                    background: `${c.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: c.color, fontSize: 10, fontWeight: 700, flexShrink: 0,
                  }}>{c.icon}</span>
                  <div>
                    <div style={{ color: "#94a3b8", fontSize: 10 }}>{c.label}</div>
                    <div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>{c.value}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Chat ─────────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          marginLeft: !isMobile && panelOpen ? PANEL_WIDTH : 0,
          transition: "margin-left 0.35s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "16px 12px 12px" : "24px 20px 20px",
          minHeight: "calc(100vh - 52px)",
        }}>

          <div style={{ textAlign: "center", marginBottom: isMobile ? 18 : 32, animation: "fadeUp 0.5s ease" }}>
            <h1 style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "clamp(24px, 5vw, 52px)",
              fontWeight: 800, color: "#e2e8f0",
              margin: 0, lineHeight: 1.1, letterSpacing: "-1px",
            }}>
              Ask me about{" "}
              <span style={{ background: "linear-gradient(90deg,#f8c564,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Yaswanth
              </span>
            </h1>
            <p style={{ color: "#334155", fontSize: isMobile ? 10 : 13, marginTop: 10, letterSpacing: 0.5 }}>
              RAG-powered · LangChain + ChromaDB + Claude · Resume-grounded answers
            </p>
          </div>

          <div style={{ width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", animation: "fadeUp 0.6s ease 0.1s both" }}>
            {/* Messages */}
            <div style={{
              background: "rgba(10,14,22,0.95)",
              border: "1px solid rgba(248,197,100,0.1)",
              borderRadius: "16px 16px 0 0",
              padding: "20px 20px 12px",
              height: isMobile ? "min(300px, 42vh)" : 380,
              overflowY: "auto",
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 14, animation: "fadeUp 0.3s ease",
                }}>
                  {msg.role === "assistant" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: "linear-gradient(135deg,#f8c564,#f97316)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#080c14",
                      marginRight: 9, marginTop: 2,
                    }}>Y</div>
                  )}
                  <div style={{
                    maxWidth: "78%", padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "3px 14px 14px 14px",
                    background: msg.role === "user" ? "linear-gradient(135deg,#f8c564,#f97316)" : "rgba(20,28,42,0.9)",
                    color: msg.role === "user" ? "#080c14" : "#94a3b8",
                    fontSize: isMobile ? 12 : 13,
                    border: msg.role === "user" ? "none" : "1px solid rgba(30,41,59,0.8)",
                    boxShadow: msg.role === "user" ? "0 4px 14px rgba(248,197,100,0.2)" : "none",
                    lineHeight: 1.6,
                  }}>
                    {msg.role === "user" ? msg.content : renderMarkdown(msg.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: "linear-gradient(135deg,#f8c564,#f97316)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "#080c14",
                  }}>Y</div>
                  <div style={{ background: "rgba(20,28,42,0.9)", borderRadius: "3px 14px 14px 14px", padding: "4px 14px", border: "1px solid rgba(30,41,59,0.8)" }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions — scrollable row on mobile */}
            <div className="suggest-row" style={{
              background: "rgba(10,14,22,0.9)",
              border: "1px solid rgba(248,197,100,0.1)",
              borderTop: "1px solid rgba(20,28,42,0.9)",
              borderBottom: "none",
              padding: "10px 14px",
              display: "flex",
              flexWrap: isMobile ? "nowrap" : "wrap",
              gap: 6,
              overflowX: isMobile ? "auto" : "visible",
              scrollbarWidth: "none",
            }}>
              {SUGGESTIONS.map((q, i) => (
                <button key={i} className="suggest" onClick={() => send(q)} disabled={loading} style={{
                  padding: "4px 11px", borderRadius: 20,
                  border: "1px solid rgba(30,41,59,0.8)",
                  background: "transparent", color: "#334155",
                  fontSize: 11, cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s", fontFamily: "inherit",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>{q}</button>
              ))}
            </div>

            {/* Input */}
            <div style={{
              background: "rgba(10,14,22,0.98)",
              border: "1px solid rgba(248,197,100,0.15)",
              borderTop: "1px solid rgba(20,28,42,0.8)",
              borderRadius: "0 0 16px 16px",
              padding: "12px 14px",
              display: "flex", gap: 10, alignItems: "flex-end",
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything about Yaswanth..."
                rows={1}
                disabled={loading}
                style={{
                  flex: 1, background: "rgba(15,23,42,0.7)",
                  border: "1px solid rgba(30,41,59,0.8)",
                  borderRadius: 10, padding: "9px 13px",
                  color: "#e2e8f0", fontSize: 13, resize: "none",
                  lineHeight: 1.5, fontFamily: "inherit", minHeight: 40,
                  touchAction: "manipulation",
                }}
              />
              <button
                className="send-btn"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  width: 40, height: 40, borderRadius: 10, border: "none", flexShrink: 0,
                  background: input.trim() && !loading ? "linear-gradient(135deg,#f8c564,#f97316)" : "rgba(20,28,42,0.7)",
                  color: input.trim() && !loading ? "#080c14" : "#334155",
                  fontSize: 16, cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >↑</button>
            </div>
          </div>

          {/* Contact strip */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center", padding: "0 8px", animation: "fadeUp 0.7s ease 0.2s both" }}>
            {CONTACTS.map(c => (
              <a key={c.label} href={c.href} target="_blank" rel="noreferrer" style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "6px 12px", borderRadius: 20,
                background: "rgba(10,14,22,0.8)",
                border: `1px solid ${c.color}28`,
                color: "#64748b", textDecoration: "none", fontSize: isMobile ? 10 : 11,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = c.color; e.currentTarget.style.borderColor = c.color + "66"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = c.color + "28"; }}
              >
                <span style={{ color: c.color, fontWeight: 700, fontSize: 12 }}>{c.icon}</span>
                {c.label}
              </a>
            ))}
          </div>

          <div style={{ marginTop: 16, fontSize: 10, color: "#1e293b", textAlign: "center" }}>
            built with LangChain · ChromaDB · FastAPI · Claude
          </div>
        </main>
      </div>
    </div>
  );
}
