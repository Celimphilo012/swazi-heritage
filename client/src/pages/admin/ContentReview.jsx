import { useState, useEffect, useCallback } from "react";
import { getAdminCeremonies, reviewCeremony, getAdminLineage, reviewLineage } from "../../api/admin.api";

const STATUS_CFG = {
  pending_review: { label: "Pending",   color: "#d97706", bg: "rgba(217,119,6,0.1)"   },
  published:      { label: "Published", color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  rejected:       { label: "Rejected",  color: "#CE1126", bg: "rgba(206,17,38,0.1)"   },
  draft:          { label: "Draft",     color: "#64748b", bg: "rgba(100,116,139,0.1)" },
};

const fmt = d => new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });

/* ── Reject modal ── */
const RejectModal = ({ item, onClose, onConfirm, saving }) => {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Reject Submission</h2>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{item.name || item.title}</p>
        </div>
        <div className="px-6 py-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Rejection note <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Explain why this submission is being rejected…"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-100 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(note)} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#CE1126" }}>
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Skeleton ── */
const Skeleton = () => (
  <div className="rounded-2xl p-5 animate-pulse" style={{ background:"#fff", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="h-3 bg-slate-50 rounded w-1/4" />
        <div className="h-3 bg-slate-50 rounded w-2/3 mt-1" />
      </div>
      <div className="h-6 w-20 bg-slate-100 rounded-full" />
    </div>
    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
      <div className="h-8 w-20 bg-slate-100 rounded-xl" />
      <div className="h-8 w-20 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

/* ── Content card ── */
const ContentCard = ({ item, type, onApprove, onReject, saving }) => {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.draft;
  return (
    <div className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ background:"#fff", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
      <div className="h-0.5" style={{ background: cfg.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-slate-800 truncate">{item.name || item.title}</h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>By <span className="font-medium text-slate-600">{item.creator_name}</span></span>
              {(item.month_celebrated || item.era) && <><span>·</span><span>{item.month_celebrated || item.era}</span></>}
              <span>·</span><span>{fmt(item.created_at)}</span>
            </div>
            {item.description && (
              <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
            {item.status === "rejected" && item.rejection_note && (
              <div className="mt-2 p-2.5 rounded-xl text-xs" style={{ background:"rgba(206,17,38,0.06)", color:"#CE1126" }}>
                <span className="font-semibold">Rejection note: </span>{item.rejection_note}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
          <button onClick={() => onApprove(item, type)} disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#10b981" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Approve
          </button>
          <button onClick={() => onReject(item, type)} disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#CE1126" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reject
          </button>
          {type === "ceremony" && (
            <a href={`/explore/ceremonies/${item.id}`} target="_blank" rel="noreferrer"
              className="ml-auto text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1">
              Preview
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Page ── */
const ContentReview = () => {
  const [tab,         setTab]    = useState("ceremonies");
  const [statusFilt,  setStaFil] = useState("pending_review");
  const [items,       setItems]  = useState([]);
  const [meta,        setMeta]   = useState({ total: 0, page: 1, totalPages: 1 });
  const [page,        setPage]   = useState(1);
  const [loading,     setLoading]= useState(true);
  const [error,       setError]  = useState("");
  const [rejectTarget,setRT]     = useState(null);
  const [saving,      setSaving] = useState(false);

  const fetchItems = useCallback(() => {
    setLoading(true); setError("");
    const params = { status: statusFilt||undefined, page, limit: 15 };
    (tab === "ceremonies" ? getAdminCeremonies(params) : getAdminLineage(params))
      .then(({ data, meta: m }) => { setItems(data); setMeta(m); })
      .catch(() => setError("Failed to load items."))
      .finally(() => setLoading(false));
  }, [tab, statusFilt, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleApprove = async (item, type) => {
    setSaving(true);
    try {
      if (type === "ceremony") await reviewCeremony(item.id, { status:"published" });
      else await reviewLineage(item.id, { status:"published" });
      fetchItems();
    } catch { setError("Failed to approve."); }
    finally { setSaving(false); }
  };

  const handleRejectConfirm = async (note) => {
    if (!rejectTarget) return;
    setSaving(true);
    try {
      const payload = { status:"rejected", rejection_note: note||undefined };
      if (rejectTarget.type === "ceremony") await reviewCeremony(rejectTarget.item.id, payload);
      else await reviewLineage(rejectTarget.item.id, payload);
      setRT(null); fetchItems();
    } catch { setError("Failed to reject."); }
    finally { setSaving(false); }
  };

  const switchTab = t => { setTab(t); setPage(1); setItems([]); };
  const pendingCount = items.filter(i => i.status === "pending_review").length;

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-5"
        style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", boxShadow:"0 4px 20px rgba(15,23,42,0.2)" }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height:3 }}>
          <div className="flex-1" style={{ background:"#002395" }} />
          <div style={{ width:"5%", background:"#FFD600" }} />
          <div className="flex-1" style={{ background:"#CE1126" }} />
          <div style={{ width:"5%", background:"#FFD600" }} />
          <div className="flex-1" style={{ background:"#002395" }} />
        </div>
        <h1 className="text-xl font-black text-white">Content Review</h1>
        <p className="text-xs mt-0.5" style={{ color:"#94a3b8" }}>
          Review and approve practitioner submissions
        </p>
      </div>

      {/* Tabs + filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background:"#f1f5f9" }}>
          {[{ key:"ceremonies", label:"Ceremonies" }, { key:"lineage", label:"Lineage Records" }].map(({ key, label }) => (
            <button key={key} onClick={() => switchTab(key)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab === key
                ? { background:"#fff", color:"#0f172a", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }
                : { color:"#64748b" }}>
              {label}
            </button>
          ))}
        </div>
        <select value={statusFilt} onChange={e => { setStaFil(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value="pending_review">Pending Review</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
          <option value="">All statuses</option>
        </select>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background:"#f1f5f9" }}>
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-500">No submissions found</p>
          <p className="text-xs text-slate-400 mt-1">
            {statusFilt === "pending_review" ? "All submissions have been reviewed." : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <ContentCard key={item.id} item={item}
              type={tab === "ceremonies" ? "ceremony" : "lineage"}
              onApprove={handleApprove}
              onReject={(item, type) => setRT({ item, type })}
              saving={saving} />
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Page {meta.page} of {meta.totalPages} — {meta.total} items</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p=>p-1)} disabled={page<=1}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p=>p+1)} disabled={page>=meta.totalPages}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}

      {rejectTarget && (
        <RejectModal item={rejectTarget.item} onClose={() => setRT(null)}
          onConfirm={handleRejectConfirm} saving={saving} />
      )}
    </div>
  );
};

export default ContentReview;
