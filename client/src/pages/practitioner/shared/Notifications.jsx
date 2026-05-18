import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getMyCeremonies } from "../../../api/ceremonies.api";
import { getMyLineageRecords } from "../../../api/lineage.api";

const Notifications = () => {
  const { user } = useAuth();
  const isCeremony = user?.role === "ceremony_keeper";
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = isCeremony ? getMyCeremonies() : getMyLineageRecords();
    fetch.then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [isCeremony]);

  const rejected  = items.filter(i => i.status === "rejected");
  const published = items.filter(i => i.status === "published");
  const pending   = items.filter(i => i.status === "pending_review");

  const editPath = id =>
    isCeremony ? `/practitioner/ceremonies/${id}/edit` : `/practitioner/lineage/${id}/edit`;

  const total = rejected.length + published.length + pending.length;

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
      ) : items.length === 0 ? (
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
        </div>
      )}
    </div>
  );
};

export default Notifications;
