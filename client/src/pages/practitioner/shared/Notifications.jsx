import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getMyCeremonies } from "../../../api/ceremonies.api";
import { getMyLineageRecords } from "../../../api/lineage.api";
import { getMyEnquiries, getEnquiryThread, replyToEnquiry } from "../../../api/services.api";

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

const InlineThread = ({ enquiryId, practitionerId }) => {
  const [thread,  setThread]  = useState(null);
  const [reply,   setReply]   = useState("");
  const [sending, setSending] = useState(false);
  const [err,     setErr]     = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    getEnquiryThread(enquiryId).then(setThread).catch(() => {});
  }, [enquiryId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true); setErr("");
    try {
      await replyToEnquiry(enquiryId, reply.trim());
      setReply("");
      const updated = await getEnquiryThread(enquiryId);
      setThread(updated);
    } catch { setErr("Failed to send."); }
    finally { setSending(false); }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!thread) return (
    <div className="flex justify-center py-4">
      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { enquiry: enq, messages } = thread;

  return (
    <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden"
      style={{ background: "#f8fafc" }}>
      {/* Message list */}
      <div className="px-4 py-3 space-y-2.5 max-h-64 overflow-y-auto">
        {/* Initial enquiry */}
        <div className="flex items-end gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "#002395" }}>
            {(enq.user_name || "U")[0].toUpperCase()}
          </div>
          <div className="max-w-[80%]">
            <p className="text-xs text-gray-400 mb-0.5">{enq.user_name} · {timeAgo(enq.created_at)}</p>
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm text-xs leading-relaxed"
              style={{ background: "#e2e8f0", color: "#334155" }}>
              {enq.message}
            </div>
          </div>
        </div>

        {messages.map(msg => {
          const mine = msg.sender_id === practitionerId;
          return mine ? (
            <div key={msg.id} className="flex items-end gap-2 justify-end">
              <div className="max-w-[80%]">
                <p className="text-xs text-gray-400 text-right mb-0.5">You · {timeAgo(msg.created_at)}</p>
                <div className="px-3 py-2 rounded-2xl rounded-br-sm text-xs leading-relaxed"
                  style={{ background: "linear-gradient(135deg,#002395,#1a4db0)", color: "#fff" }}>
                  {msg.body}
                </div>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "#92400e" }}>
                {(msg.sender_name || "P")[0].toUpperCase()}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "#002395" }}>
                {(msg.sender_name || "U")[0].toUpperCase()}
              </div>
              <div className="max-w-[80%]">
                <p className="text-xs text-gray-400 mb-0.5">{msg.sender_name} · {timeAgo(msg.created_at)}</p>
                <div className="px-3 py-2 rounded-2xl rounded-bl-sm text-xs leading-relaxed"
                  style={{ background: "#e2e8f0", color: "#334155" }}>
                  {msg.body}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">Reply to start the conversation.</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex gap-2 items-end">
        <textarea rows={2} value={reply} onChange={e => setReply(e.target.value)} onKeyDown={handleKey}
          placeholder="Reply… (Enter to send)"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-200" />
        <button onClick={handleSend} disabled={sending || !reply.trim()}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
          {sending ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      {err && <p className="text-xs text-red-500 px-3 pb-2">{err}</p>}
    </div>
  );
};

const Notifications = () => {
  const { user }   = useAuth();
  const [openThread, setOpenThread] = useState(null);
  const isCeremony = user?.role === "ceremony_keeper";
  const [items,     setItems]     = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const contentFetch = isCeremony ? getMyCeremonies() : getMyLineageRecords();
    Promise.all([contentFetch, getMyEnquiries()])
      .then(([content, enqs]) => { setItems(content); setEnquiries(enqs || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isCeremony]);

  const rejected  = items.filter(i => i.status === "rejected");
  const published = items.filter(i => i.status === "published");
  const pending   = items.filter(i => i.status === "pending_review");

  const editPath = id =>
    isCeremony ? `/practitioner/ceremonies/${id}/edit` : `/practitioner/lineage/${id}/edit`;

  const total = rejected.length + published.length + pending.length + enquiries.length;

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-5"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", boxShadow: "0 4px 20px rgba(15,23,42,0.2)" }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 3 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#002395" }} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Notifications</h1>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Status updates on your submitted content</p>
          </div>
          {!loading && total > 0 && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(217,119,6,0.2)", color: "#d97706" }}>
              {total} update{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 flex gap-3 bg-white"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-50 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 && enquiries.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "#f1f5f9" }}>
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-500">No submissions yet</p>
          <p className="text-xs text-slate-400 mt-1">Submit content to start receiving notifications</p>
        </div>
      ) : (
        <div className="space-y-3">

          {/* Rejections */}
          {rejected.map(item => (
            <div key={`r-${item.id}`} className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-0.5" style={{ background: "#CE1126" }} />
              <div className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(206,17,38,0.08)" }}>
                  <svg className="w-4.5 h-4.5" style={{ width: 18, height: 18 }}
                    fill="none" viewBox="0 0 24 24" stroke="#CE1126" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    Rejected: <span className="font-normal">{item.name || item.title}</span>
                  </p>
                  {item.rejection_note ? (
                    <p className="text-xs mt-2 p-2.5 rounded-xl leading-relaxed"
                      style={{ background: "rgba(206,17,38,0.05)", color: "#b91c1c" }}>
                      <span className="font-semibold">Admin note: </span>{item.rejection_note}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">No rejection note provided.</p>
                  )}
                  <Link to={editPath(item.id)}
                    className="text-xs font-bold hover:underline mt-2 inline-block" style={{ color: "#CE1126" }}>
                    Edit and resubmit →
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Published */}
          {published.map(item => (
            <div key={`p-${item.id}`} className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-0.5" style={{ background: "#10b981" }} />
              <div className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.08)" }}>
                  <svg className="w-4.5 h-4.5" style={{ width: 18, height: 18 }}
                    fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Published: <span className="font-normal">{item.name || item.title}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Your submission is now live on the platform.</p>
                </div>
              </div>
            </div>
          ))}

          {/* Pending */}
          {pending.map(item => (
            <div key={`pn-${item.id}`} className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-0.5" style={{ background: "#d97706" }} />
              <div className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(217,119,6,0.08)" }}>
                  <svg className="w-4.5 h-4.5" style={{ width: 18, height: 18 }}
                    fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Pending review: <span className="font-normal">{item.name || item.title}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Awaiting admin approval.</p>
                </div>
              </div>
            </div>
          ))}

          {/* Service enquiries */}
          {enquiries.length > 0 && (
            <>
              <div className="pt-2 pb-1">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>
                  Service Enquiries ({enquiries.length})
                </p>
              </div>
              {enquiries.map(enq => (
                <div key={`enq-${enq.id}`} className="rounded-2xl overflow-hidden"
                  style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                  <div className="h-0.5" style={{ background: "#002395" }} />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(0,35,149,0.08)" }}>
                        <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="#002395" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800">
                          Enquiry for: <span className="font-normal">{enq.service_title}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          From <strong>{enq.user_name}</strong>
                          {" · "}
                          <a href={`mailto:${enq.user_email}`} className="text-blue-600 hover:underline">{enq.user_email}</a>
                          {" · "}
                          {timeAgo(enq.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => setOpenThread(openThread === enq.id ? null : enq.id)}
                        className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                        style={openThread === enq.id
                          ? { background: "#002395", color: "#fff" }
                          : { background: "rgba(0,35,149,0.08)", color: "#002395" }}>
                        {openThread === enq.id ? "Close" : "Reply"}
                      </button>
                    </div>
                    {openThread === enq.id && (
                      <InlineThread enquiryId={enq.id} practitionerId={user?.id} />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
