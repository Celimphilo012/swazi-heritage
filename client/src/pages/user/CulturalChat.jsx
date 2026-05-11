import { useState, useEffect, useRef } from "react";
import { askQuestion, getPromptHistory } from "../../api/prompts.api";

const SOURCE_LABEL = {
  db_only: "From Platform",
  hybrid: "Platform + AI",
  ai_only: "AI Generated",
  local: "Local Search",
};
const SOURCE_STYLE = {
  db_only: "bg-green-100 text-green-800",
  hybrid: "bg-blue-100 text-blue-700",
  ai_only: "bg-purple-100 text-purple-700",
  local: "bg-amber-100 text-amber-800",
};

const SourceBadge = ({ source }) =>
  source ? (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_STYLE[source] || "bg-gray-100 text-gray-600"}`}>
      {SOURCE_LABEL[source] || source}
    </span>
  ) : null;

const ChatBubble = ({ msg }) => (
  <div className="space-y-1">
    {/* Question */}
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-red-800 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
        {msg.question}
      </div>
    </div>
    {/* Answer */}
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
        <span className="text-xs font-bold text-amber-800">AI</span>
      </div>
      <div className="max-w-[80%]">
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-800 shadow-sm whitespace-pre-wrap">
          {msg.answer}
        </div>
        <div className="flex items-center gap-2 mt-1.5 ml-1">
          <SourceBadge source={msg.source} />
          {msg.created_at && (
            <span className="text-xs text-gray-400">
              {new Date(msg.created_at).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const LoadingBubble = () => (
  <div className="flex items-end gap-2">
    <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-amber-800">AI</span>
    </div>
    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const CulturalChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    getPromptHistory()
      .then((hist) => setMessages([...hist].reverse()))
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
      setMessages((prev) => [...prev, result]);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to get a response. Please try again."
      );
    } finally {
      setAsking(false);
      textareaRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Cultural Chat</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ask anything about Swazi culture, traditions, and ceremonies
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-400">Loading history...</div>
          </div>
        ) : messages.length === 0 && !asking ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-amber-800">AI</span>
            </div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              Ask about Swazi culture
            </h2>
            <p className="text-sm text-gray-500 max-w-sm">
              Learn about ceremonies like Incwala and Umhlanga, royal lineages,
              traditional attire (imvunulo), and more.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                "What is the Incwala ceremony?",
                "Tell me about Swazi traditional attire",
                "What is Umhlanga?",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 text-gray-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)
        )}
        {asking && <LoadingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about Swazi culture…"
          rows={1}
          maxLength={1000}
          disabled={asking}
          className="flex-1 resize-none border-none outline-none text-sm text-gray-800
                     placeholder-gray-400 py-1.5 px-2 max-h-32 overflow-y-auto bg-transparent"
          style={{ lineHeight: "1.5" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || asking}
          className="flex-shrink-0 w-9 h-9 bg-red-800 text-white rounded-xl flex items-center
                     justify-center hover:bg-red-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-1.5">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
};

export default CulturalChat;
