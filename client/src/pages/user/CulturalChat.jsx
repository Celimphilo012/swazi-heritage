import { useState, useEffect, useRef } from "react";
import { askQuestion, getPromptHistory } from "../../api/prompts.api";
import shieldPng from "../../lib/shield.png";

const SOURCE_LABEL = {
  db_only: "From Platform",
  hybrid:  "Platform + AI",
  ai_only: "AI Generated",
  local:   "Local Search",
};
const SOURCE_COLOR = {
  db_only: { bg: "#dcfce7", text: "#15803d" },
  hybrid:  { bg: "#dbeafe", text: "#1d4ed8" },
  ai_only: { bg: "#ede9fe", text: "#6d28d9" },
  local:   { bg: "#fef3c7", text: "#92400e" },
};

const SUGGESTIONS = [
  {
    q: "What is the Incwala ceremony?",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    color: "#002395",
  },
  {
    q: "Tell me about Swazi traditional attire",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
      </svg>
    ),
    color: "#CE1126",
  },
  {
    q: "What is Umhlanga?",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "#b86800",
  },
  {
    q: "History of Swazi kings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: "#002395",
  },
];

/* ── Swazi shield mini avatar ── */
const ShieldAvatar = () => (
  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
       style={{ background: "linear-gradient(135deg,#001540,#002d80)" }}>
    <img src={shieldPng} alt="Nguni Shield" width="16" height="20" style={{ objectFit: "contain" }} />
  </div>
);

/* ── Source badge ── */
const SourceBadge = ({ source }) => {
  if (!source) return null;
  const style = SOURCE_COLOR[source] || { bg: "#f3f4f6", text: "#4b5563" };
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: style.bg, color: style.text }}>
      {SOURCE_LABEL[source] || source}
    </span>
  );
};

/* ── Chat bubble ── */
const ChatBubble = ({ msg }) => (
  <div className="space-y-2">
    {/* User question — right aligned, flag blue */}
    <div className="flex justify-end">
      <div className="max-w-[78%] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm"
           style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
        {msg.question}
      </div>
    </div>

    {/* AI response — left aligned, white card */}
    <div className="flex items-end gap-2">
      <ShieldAvatar />
      <div className="max-w-[80%]">
        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 shadow-md border border-gray-100 whitespace-pre-wrap leading-relaxed">
          {msg.answer}
        </div>
        <div className="flex items-center gap-2 mt-1.5 ml-1">
          <SourceBadge source={msg.source} />
          {msg.created_at && (
            <span className="text-xs text-gray-400">
              {new Date(msg.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

/* ── Typing indicator ── */
const TypingBubble = () => (
  <div className="flex items-end gap-2">
    <ShieldAvatar />
    <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-md border border-gray-100">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full animate-bounce"
               style={{
                 background: i === 0 ? "#002395" : i === 1 ? "#CE1126" : "#FFD600",
                 animationDelay: `${i * 0.18}s`,
               }} />
        ))}
      </div>
    </div>
  </div>
);

/* ── Page ── */
const CulturalChat = () => {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [asking,   setAsking]   = useState(false);
  const [error,    setError]    = useState("");
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    getPromptHistory()
      .then(hist => setMessages([...hist].reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || asking) return;
    setInput("");
    setAsking(true);
    setError("");
    try {
      const result = await askQuestion(q);
      setMessages(prev => [...prev, result]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get a response. Please try again.");
    } finally {
      setAsking(false);
      textareaRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSuggestion = (q) => { setInput(q); textareaRef.current?.focus(); };

  return (
    <div className="flex flex-col max-w-3xl mx-auto" style={{ height: "calc(100vh - 130px)" }}>

      {/* ══ HEADER ══ */}
      <div className="rounded-2xl mb-4 overflow-hidden flex-shrink-0"
           style={{ background: "linear-gradient(135deg,#001540,#002d80)" }}>
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: "rgba(255,214,0,0.12)", border: "1px solid rgba(255,214,0,0.2)" }}>
            <img src={shieldPng} alt="Nguni Shield" width="22" height="27" style={{ objectFit: "contain" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Cultural AI Chat</h1>
            <p className="text-xs" style={{ color: "rgba(147,197,253,0.8)" }}>
              Ask anything about Swazi culture, traditions, and ceremonies
            </p>
          </div>
        </div>
        {/* Flag stripe */}
        <div className="flex" style={{ height: 3 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div style={{ width: "6%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
          <div style={{ width: "6%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#002395" }} />
        </div>
      </div>

      {/* ══ MESSAGES AREA ══ */}
      <div className="flex-1 overflow-y-auto space-y-5 pb-4 px-1 rounded-2xl"
           style={{ minHeight: 0 }}>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-2 items-center text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: "0s" }} />
              <div className="w-2 h-2 rounded-full bg-red-300 animate-bounce"  style={{ animationDelay: "0.18s" }} />
              <div className="w-2 h-2 rounded-full bg-amber-300 animate-bounce"style={{ animationDelay: "0.36s" }} />
              <span className="ml-1">Loading history…</span>
            </div>
          </div>
        ) : messages.length === 0 && !asking ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                 style={{ background: "linear-gradient(135deg,#001540,#002d80)" }}>
              <img src={shieldPng} alt="Nguni Shield" width="28" height="35" style={{ objectFit: "contain" }} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Ask about Swazi culture</h2>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Explore ceremonies like Incwala and Umhlanga, royal lineages,
              traditional attire, and much more.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {SUGGESTIONS.map(s => (
                <button key={s.q} onClick={() => handleSuggestion(s.q)}
                  className="flex items-start gap-3 text-left p-3.5 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110"
                       style={{ background: `${s.color}18`, color: s.color }}>
                    {s.icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 leading-snug">{s.q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)
        )}

        {asking && <TypingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* ══ ERROR ══ */}
      {error && (
        <div className="mb-2 flex-shrink-0 p-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* ══ INPUT ══ */}
      <div className="flex-shrink-0">
        <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-transparent transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about Swazi culture…"
            rows={1}
            maxLength={1000}
            disabled={asking}
            className="flex-1 resize-none border-none outline-none text-sm text-gray-800 placeholder-gray-400 py-1.5 px-2 max-h-32 overflow-y-auto bg-transparent"
            style={{ lineHeight: "1.5" }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || asking}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: asking ? "#6b7280" : "linear-gradient(135deg,#002395,#1a4db0)" }}>
            {asking ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default CulturalChat;
