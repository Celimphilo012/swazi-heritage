import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyLineageRecords } from "../../../api/lineage.api";

const STATUS_CFG = {
  pending_review: { label: "Pending",   color: "#d97706", bg: "rgba(217,119,6,0.1)"   },
  published:      { label: "Published", color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  rejected:       { label: "Rejected",  color: "#CE1126", bg: "rgba(206,17,38,0.1)"   },
  draft:          { label: "Draft",     color: "#64748b", bg: "rgba(100,116,139,0.1)" },
};

const STATUS_LABEL = { pending_review: "Pending", published: "Published", rejected: "Rejected", draft: "Draft" };

const fmt = d => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const StatusPill = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

const LineageRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("");

  useEffect(() => {
    setLoading(true);
    getMyLineageRecords(filter || undefined)
      .then(setRecords)
      .catch(() => setError("Failed to load lineage records."))
      .finally(() => setLoading(false));
  }, [filter]);

  const FILTERS = ["", "pending_review", "published", "rejected"];

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
            <h1 className="text-xl font-black text-white">My Lineage Records</h1>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              {loading ? "Loading…" : `${records.length} record${records.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link to="/practitioner/lineage/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white
                       transition-all hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add record
          </Link>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(val => (
          <button key={val} onClick={() => setFilter(val)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={filter === val
              ? { background: "#0f172a", color: "#fff" }
              : { background: "#f1f5f9", color: "#64748b" }}>
            {val === "" ? "All" : STATUS_LABEL[val]}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-50 rounded w-1/4 mb-3" />
              <div className="h-3 bg-slate-50 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "#f1f5f9" }}>
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {filter ? `No ${STATUS_LABEL[filter]?.toLowerCase()} records` : "No lineage records yet"}
          </p>
          {!filter && (
            <Link to="/practitioner/lineage/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white mt-4"
              style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
              Add first record
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(r => {
            const cfg = STATUS_CFG[r.status] || STATUS_CFG.draft;
            return (
              <div key={r.id}
                className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <div className="h-0.5" style={{ background: cfg.color }} />
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{r.title}</h3>
                      <StatusPill status={r.status} />
                    </div>
                    {r.era && <p className="text-xs text-slate-400 mt-0.5">Era: {r.era}</p>}
                    {r.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{r.description}</p>
                    )}
                    {r.status === "rejected" && r.rejection_note && (
                      <div className="mt-2 p-2.5 rounded-xl text-xs leading-relaxed"
                        style={{ background: "rgba(206,17,38,0.05)", color: "#b91c1c" }}>
                        <span className="font-semibold">Admin note: </span>{r.rejection_note}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">Submitted {fmt(r.created_at)}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {r.status === "published" ? (
                      <Link to={`/practitioner/lineage/${r.id}/edit`}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-3 py-1.5 text-center">
                        Edit & resubmit
                      </Link>
                    ) : (
                      <Link to={`/practitioner/lineage/${r.id}/edit`}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center"
                        style={{ borderColor: "#e2e8f0", color: "#475569", background: "#f8fafc" }}>
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LineageRecords;
