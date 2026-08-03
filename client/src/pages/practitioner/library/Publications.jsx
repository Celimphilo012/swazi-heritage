import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyPublications, deletePublication } from "../../../api/publications.api";

const STATUS_CFG = {
  pending_review: { label: "Pending",   color: "#d97706", bg: "rgba(217,119,6,0.1)"   },
  published:      { label: "Published", color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  rejected:       { label: "Rejected",  color: "#CE1126", bg: "rgba(206,17,38,0.1)"   },
  draft:          { label: "Draft",     color: "#64748b", bg: "rgba(100,116,139,0.1)" },
};

const TYPE_LABEL = { article: "Article", book: "Book", paper: "Paper", thesis: "Thesis", other: "Other" };

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

const Publications = () => {
  const [pubs,    setPubs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    getMyPublications()
      .then(setPubs)
      .catch(() => setError("Failed to load your publications."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (pub) => {
    if (!window.confirm(`Remove "${pub.title}"?`)) return;
    setDeletingId(pub.id);
    try {
      await deletePublication(pub.id);
      setPubs(rows => rows.filter(p => p.id !== pub.id));
    } catch {
      setError("Failed to remove publication.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">

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
            <h1 className="text-xl font-black text-white">My Publications</h1>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              {loading ? "Loading…" : `${pubs.length} publication${pubs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link to="/practitioner/library/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Submit publication
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-50 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : pubs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-500">No publications yet</p>
          <p className="text-xs text-slate-400 mt-1">Share research, articles, or books on Swazi history and culture.</p>
          <Link to="/practitioner/library/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white mt-4"
            style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
            Submit your first publication
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pubs.map(p => {
            const cfg = STATUS_CFG[p.status] || STATUS_CFG.draft;
            return (
              <div key={p.id} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <div className="h-0.5" style={{ background: cfg.color }} />
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{p.title}</h3>
                      <StatusPill status={p.status} />
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: "rgba(100,116,139,0.1)", color: "#64748b" }}>
                        {TYPE_LABEL[p.publication_type] || p.publication_type}
                      </span>
                    </div>
                    {p.authors && <p className="text-xs text-slate-400 mt-0.5">{p.authors}{p.publication_year ? ` · ${p.publication_year}` : ""}</p>}
                    {p.abstract && <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{p.abstract}</p>}
                    {p.status === "rejected" && p.rejection_note && (
                      <div className="mt-2 p-2.5 rounded-xl text-xs leading-relaxed"
                        style={{ background: "rgba(206,17,38,0.05)", color: "#b91c1c" }}>
                        <span className="font-semibold">Admin note: </span>{p.rejection_note}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Submitted {fmt(p.created_at)}{p.status === "published" ? ` · ${p.view_count} view${p.view_count !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link to={`/practitioner/library/${p.id}/edit`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center"
                      style={{ borderColor: "#e2e8f0", color: "#475569", background: "#f8fafc" }}>
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(p)} disabled={deletingId === p.id}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center transition-colors hover:bg-red-50 disabled:opacity-50"
                      style={{ borderColor: "rgba(206,17,38,0.25)", color: "#CE1126", background: "rgba(206,17,38,0.04)" }}>
                      {deletingId === p.id ? "Removing…" : "Remove"}
                    </button>
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

export default Publications;
