import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyCeremonies } from "../../../api/ceremonies.api";

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

const Ceremonies = () => {
  const [ceremonies, setCeremonies] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [filter,     setFilter]     = useState("");

  useEffect(() => {
    setLoading(true);
    getMyCeremonies(filter || undefined)
      .then(setCeremonies)
      .catch(() => setError("Failed to load ceremonies."))
      .finally(() => setLoading(false));
  }, [filter]);

  const FILTERS = ["", "pending_review", "published", "rejected", "draft"];

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
            <h1 className="text-xl font-black text-white">My Ceremonies</h1>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              {loading ? "Loading…" : `${ceremonies.length} ceremoni${ceremonies.length !== 1 ? "es" : "y"}`}
            </p>
          </div>
          <Link to="/practitioner/ceremonies/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white
                       transition-all hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add ceremony
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
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-50 rounded w-1/4" />
                  <div className="h-3 bg-slate-50 rounded w-2/3 mt-2" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : ceremonies.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "#f1f5f9" }}>
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {filter ? `No ${STATUS_LABEL[filter]?.toLowerCase()} ceremonies` : "No ceremonies yet"}
          </p>
          {!filter && (
            <Link to="/practitioner/ceremonies/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white mt-4"
              style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
              Add first ceremony
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ceremonies.map(ceremony => {
            const cfg = STATUS_CFG[ceremony.status] || STATUS_CFG.draft;
            return (
              <div key={ceremony.id}
                className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <div className="h-0.5" style={{ background: cfg.color }} />
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{ceremony.name}</h3>
                      <StatusPill status={ceremony.status} />
                    </div>
                    {ceremony.month_celebrated && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {ceremony.month_celebrated}
                      </p>
                    )}
                    {ceremony.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{ceremony.description}</p>
                    )}
                    {ceremony.status === "rejected" && ceremony.rejection_note && (
                      <div className="mt-2 p-2.5 rounded-xl text-xs leading-relaxed"
                        style={{ background: "rgba(206,17,38,0.05)", color: "#b91c1c" }}>
                        <span className="font-semibold">Admin note: </span>{ceremony.rejection_note}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">Submitted {fmt(ceremony.created_at)}</p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {ceremony.status === "published" ? (
                      <>
                        <Link to={`/explore/ceremonies/${ceremony.id}`} target="_blank"
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center"
                          style={{ borderColor: "rgba(16,185,129,0.3)", color: "#10b981", background: "rgba(16,185,129,0.06)" }}>
                          View live
                        </Link>
                        <Link to={`/practitioner/ceremonies/${ceremony.id}/edit`}
                          className="text-xs font-semibold text-center text-slate-400 hover:text-slate-700 px-3 py-1.5">
                          Edit & resubmit
                        </Link>
                      </>
                    ) : (
                      <Link to={`/practitioner/ceremonies/${ceremony.id}/edit`}
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

export default Ceremonies;
