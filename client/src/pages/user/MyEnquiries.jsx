import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getMySentEnquiries, getEnquiryThread, replyToEnquiry } from "../../api/services.api";

const Avatar = ({ name, size = 28, color = "#002395" }) => {
  const initial = (name || "?")[0].toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: color }}>
      {initial}
    </div>
  );
};

const FlagStripe = () => (
  <div className="absolute top-0 left-0 right-0 flex" style={{ height: 3 }}>
    <div className="flex-1" style={{ background: "#002395" }} />
    <div style={{ width: "6%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#CE1126" }} />
    <div style={{ width: "6%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#002395" }} />
  </div>
);

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const d    = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 0)      return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
};

const ThreadView = ({ enquiry, userId, onBack }) => {
  const [thread,   setThread]   = useState(null);
  const [reply,    setReply]    = useState("");
  const [sending,  setSending]  = useState(false);
  const [err,      setErr]      = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    getEnquiryThread(enquiry.id)
      .then(setThread)
      .catch(() => setErr("Could not load messages."));
  }, [enquiry.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true); setErr("");
    try {
      await replyToEnquiry(enquiry.id, reply.trim());
      setReply("");
      const updated = await getEnquiryThread(enquiry.id);
      setThread(updated);
    } catch {
      setErr("Failed to send. Please try again.");
    } finally { setSending(false); }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!thread && !err) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { enquiry: enq, messages } = thread || { enquiry: enquiry, messages: [] };
  const isMine = (senderId) => senderId === userId;

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="md:hidden text-gray-400 hover:text-gray-700 mr-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(0,35,149,0.08)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#002395" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate">{enq.service_title}</p>
          <p className="text-xs text-gray-400 truncate">
            with <span className="font-medium text-gray-600">{enq.practitioner_name}</span>
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {err && <p className="text-xs text-red-500 text-center">{err}</p>}

        {/* Initial enquiry message (always first) */}
        <div className="flex items-end gap-2 justify-end">
          <div className="max-w-[72%]">
            <p className="text-xs text-gray-400 text-right mb-1">You · {timeAgo(enq.created_at)}</p>
            <div className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed"
              style={{ background: "linear-gradient(135deg,#002395,#1a4db0)", color: "#fff" }}>
              {enq.message}
            </div>
          </div>
          <Avatar name={enq.user_name} size={28} color="#002395" />
        </div>

        {/* Reply messages */}
        {messages.map(msg => (
          isMine(msg.sender_id) ? (
            <div key={msg.id} className="flex items-end gap-2 justify-end">
              <div className="max-w-[72%]">
                <p className="text-xs text-gray-400 text-right mb-1">You · {timeAgo(msg.created_at)}</p>
                <div className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed"
                  style={{ background: "linear-gradient(135deg,#002395,#1a4db0)", color: "#fff" }}>
                  {msg.body}
                </div>
              </div>
              <Avatar name={msg.sender_name} size={28} color="#002395" />
            </div>
          ) : (
            <div key={msg.id} className="flex items-end gap-2">
              <Avatar name={msg.sender_name} size={28} color="#92400e" />
              <div className="max-w-[72%]">
                <p className="text-xs text-gray-400 mb-1">{msg.sender_name} · {timeAgo(msg.created_at)}</p>
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed"
                  style={{ background: "#f1f5f9", color: "#1e293b" }}>
                  {msg.body}
                </div>
              </div>
            </div>
          )
        ))}

        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            No replies yet. The practitioner will respond here.
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            rows={2}
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a reply… (Enter to send, Shift+Enter for new line)"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
          <button onClick={handleSend} disabled={sending || !reply.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity"
            style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
      </div>
    </div>
  );
};

const MyEnquiries = () => {
  const { user }                        = useAuth();
  const [enquiries, setEnquiries]       = useState([]);
  const [loading,   setLoading]         = useState(true);
  const [selected,  setSelected]        = useState(null);

  useEffect(() => {
    getMySentEnquiries()
      .then(data => {
        setEnquiries(data || []);
        if (data?.length > 0) setSelected(data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="-mt-8 -mx-4 min-h-screen" style={{ background: "#f8fafc" }}>

      {/* Page header */}
      <div className="relative overflow-hidden px-6 pt-12 pb-8"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
        <FlagStripe />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,214,0,0.1)", border: "1px solid rgba(255,214,0,0.2)" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">My Enquiries</h1>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              Your marketplace conversations with practitioners
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : enquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "#f1f5f9" }}>
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-500">No enquiries yet</p>
          <p className="text-xs text-gray-400 mt-1 text-center">
            When you contact a practitioner from the Marketplace, your conversations will appear here.
          </p>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-200px)] max-w-5xl mx-auto border-x border-gray-200">

          {/* Left: enquiry list */}
          <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-100 overflow-y-auto bg-white
                           ${selected ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {enquiries.length} Conversation{enquiries.length !== 1 ? "s" : ""}
              </p>
            </div>
            {enquiries.map(enq => (
              <button key={enq.id} onClick={() => setSelected(enq)}
                className="w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors hover:bg-gray-50"
                style={selected?.id === enq.id ? { background: "rgba(0,35,149,0.05)", borderLeft: "3px solid #002395" } : {}}>
                <p className="text-sm font-semibold text-gray-900 truncate">{enq.service_title}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {enq.practitioner_name} · {timeAgo(enq.created_at)}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate">{enq.message}</p>
              </button>
            ))}
          </div>

          {/* Right: thread view */}
          <div className={`flex-1 bg-white flex flex-col min-w-0
                           ${selected ? "flex" : "hidden md:flex"}`}>
            {selected ? (
              <ThreadView
                enquiry={selected}
                userId={user?.id}
                onBack={() => setSelected(null)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">Select a conversation</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default MyEnquiries;
