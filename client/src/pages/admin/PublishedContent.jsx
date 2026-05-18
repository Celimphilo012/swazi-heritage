import { useState, useEffect, useCallback } from "react";
import { getAdminCeremonies, reviewCeremony, getAdminLineage, reviewLineage } from "../../api/admin.api";

const fmt = d => new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });

const Skeleton = () => (
  <div className="rounded-2xl p-5 animate-pulse flex items-center justify-between gap-4"
    style={{ background:"#fff", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
    <div className="space-y-2 flex-1">
      <div className="h-4 bg-slate-100 rounded w-1/3" />
      <div className="h-3 bg-slate-50 rounded w-1/4" />
    </div>
    <div className="h-8 w-24 bg-slate-100 rounded-xl" />
  </div>
);

const PublishedContent = () => {
  const [tab,         setTab]      = useState("ceremonies");
  const [items,       setItems]    = useState([]);
  const [meta,        setMeta]     = useState({ total:0, page:1, totalPages:1 });
  const [page,        setPage]     = useState(1);
  const [loading,     setLoading]  = useState(true);
  const [error,       setError]    = useState("");
  const [unpublishing,setUnpub]    = useState(null);

  const fetchItems = useCallback(() => {
    setLoading(true); setError("");
    const params = { status:"published", page, limit:15 };
    (tab === "ceremonies" ? getAdminCeremonies(params) : getAdminLineage(params))
      .then(({ data, meta: m }) => { setItems(data); setMeta(m); })
      .catch(() => setError("Failed to load content."))
      .finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleUnpublish = async item => {
    setUnpub(item.id);
    try {
      if (tab === "ceremonies") await reviewCeremony(item.id, { status:"pending_review" });
      else await reviewLineage(item.id, { status:"pending_review" });
      fetchItems();
    } catch { setError("Failed to unpublish."); }
    finally { setUnpub(null); }
  };

  const switchTab = t => { setTab(t); setPage(1); setItems([]); };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Published Content</h1>
            <p className="text-xs mt-0.5" style={{ color:"#94a3b8" }}>
              {meta.total} item{meta.total!==1?"s":""} live and visible to users
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background:"rgba(16,185,129,0.2)", border:"1px solid rgba(16,185,129,0.3)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background:"#10b981" }} />
            <span className="text-xs font-bold" style={{ color:"#10b981" }}>Live</span>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background:"#f1f5f9" }}>
        {[{ key:"ceremonies", label:"Ceremonies" }, { key:"lineage", label:"Lineage Records" }].map(({ key, label }) => (
          <button key={key} onClick={() => switchTab(key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab===key
              ? { background:"#fff", color:"#0f172a", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }
              : { color:"#64748b" }}>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i) => <Skeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-500">No published {tab} yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ background:"#fff", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:"#10b981" }} />
                  <p className="font-bold text-slate-800 truncate text-sm">{item.name || item.title}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>By <span className="font-medium text-slate-600">{item.creator_name}</span></span>
                  {(item.month_celebrated || item.era) && (
                    <><span>·</span><span>{item.month_celebrated || item.era}</span></>
                  )}
                  <span>·</span><span>{fmt(item.created_at)}</span>
                </div>
              </div>
              <button onClick={() => handleUnpublish(item)} disabled={unpublishing === item.id}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl
                  border transition-colors disabled:opacity-50"
                style={{ borderColor:"rgba(217,119,6,0.3)", color:"#d97706", background:"rgba(217,119,6,0.06)" }}>
                {unpublishing === item.id
                  ? <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>}
                {unpublishing === item.id ? "Moving…" : "Unpublish"}
              </button>
            </div>
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p=>p-1)} disabled={page<=1}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p=>p+1)} disabled={page>=meta.totalPages}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishedContent;
