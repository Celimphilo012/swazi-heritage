import { useState, useEffect, useCallback } from "react";
import { getAdminCinema, createCinema, updateCinema } from "../../api/admin.api";

const STATUS_CFG = {
  scheduled: { label:"Scheduled", color:"#002395", bg:"rgba(0,35,149,0.1)"   },
  live:      { label:"Live",      color:"#10b981", bg:"rgba(16,185,129,0.1)"  },
  ended:     { label:"Ended",     color:"#64748b", bg:"rgba(100,116,139,0.1)" },
  cancelled: { label:"Cancelled", color:"#CE1126", bg:"rgba(206,17,38,0.1)"  },
  available:   { label:"Available",   color:"#7c3aed", bg:"rgba(124,58,237,0.1)"  },
  unavailable: { label:"Unavailable", color:"#94a3b8", bg:"rgba(148,163,184,0.1)" },
};

const fmt = d => d ? new Date(d).toLocaleString("en-GB", {
  day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"
}) : "—";

const EMPTY_FORM = { title:"", description:"", type:"live", stream_url:"", scheduled_at:"", status:"scheduled" };

/* ── Form primitives ── */
const FInput = ({ label, required, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
      focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 disabled:bg-slate-50" {...props} />
  </div>
);
const FSelect = ({ label, required, children, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white
      focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" {...props}>
      {children}
    </select>
  </div>
);

/* ── Modal ── */
const Modal = ({ title, subtitle, onClose, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
    style={{ background:"rgba(15,23,42,0.5)", backdropFilter:"blur(4px)" }}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
      <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 ml-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  </div>
);

const Spin = () => <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />;

const CinemaManagement = () => {
  const [sessions,   setSessions]  = useState([]);
  const [meta,       setMeta]      = useState({ total:0, page:1, totalPages:1 });
  const [page,       setPage]      = useState(1);
  const [statusFilt, setStaFil]    = useState("");
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState("");
  const [modal,      setModal]     = useState(null);
  const [formData,   setFormData]  = useState(EMPTY_FORM);
  const [formErr,    setFormErr]   = useState("");
  const [saving,     setSaving]    = useState(false);

  const fetchSessions = useCallback(() => {
    setLoading(true); setError("");
    getAdminCinema({ status: statusFilt||undefined, page, limit:15 })
      .then(({ data, meta: m }) => { setSessions(data); setMeta(m); })
      .catch(() => setError("Failed to load sessions."))
      .finally(() => setLoading(false));
  }, [statusFilt, page]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const setField = f => e => setFormData(d => ({ ...d, [f]: e.target.value }));

  const handleSave = async () => {
    setFormErr(""); setSaving(true);
    try {
      if (modal.type === "create") await createCinema(formData);
      else await updateCinema(modal.session.id, formData);
      setModal(null); fetchSessions();
    } catch (err) { setFormErr(err.response?.data?.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (session, status) => {
    try { await updateCinema(session.id, { ...session, status }); fetchSessions(); }
    catch { setError("Failed to update status."); }
  };

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-5 flex items-center justify-between gap-4"
        style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", boxShadow:"0 4px 20px rgba(15,23,42,0.2)" }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height:3 }}>
          <div className="flex-1" style={{ background:"#002395" }} />
          <div style={{ width:"5%", background:"#FFD600" }} />
          <div className="flex-1" style={{ background:"#CE1126" }} />
          <div style={{ width:"5%", background:"#FFD600" }} />
          <div className="flex-1" style={{ background:"#002395" }} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Cinema Management</h1>
          <p className="text-xs mt-0.5" style={{ color:"#94a3b8" }}>
            {meta.total} session{meta.total!==1?"s":""} in the system
          </p>
        </div>
        <button onClick={() => { setFormData(EMPTY_FORM); setFormErr(""); setModal({ type:"create" }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
          style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Session
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[["","All"],["scheduled","Scheduled"],["live","Live"],["available","Available"],["unavailable","Unavailable"],["ended","Ended"],["cancelled","Cancelled"]].map(([v,l]) => (
          <button key={v} onClick={() => { setStaFil(v); setPage(1); }}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={statusFilt===v
              ? { background:"#0f172a", color:"#fff" }
              : { background:"#f1f5f9", color:"#64748b" }}>
            {l}
          </button>
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_,i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse flex items-center justify-between gap-4"
              style={{ background:"#fff", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-50 rounded w-1/4" />
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background:"#f1f5f9" }}>
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 10l4.553-2.069A1 1 0 0121 8.868V15.132a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-500">No cinema sessions. Add the first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => {
            const cfg = STATUS_CFG[s.status] || STATUS_CFG.ended;
            return (
              <div key={s.id} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background:"#fff", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
                <div className="h-0.5" style={{ background: cfg.color }} />
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-slate-800 text-sm">{s.title}</p>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                        style={{ background:"rgba(100,116,139,0.1)", color:"#64748b" }}>
                        {s.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Scheduled: {fmt(s.scheduled_at)}</p>
                    {s.booking_count !== undefined && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.booking_count} booking{s.booking_count!==1?"s":""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {s.status === "scheduled" && (
                      <button onClick={() => handleStatusChange(s, "live")}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors"
                        style={{ background:"rgba(16,185,129,0.1)", color:"#10b981" }}>
                        Go Live
                      </button>
                    )}
                    {s.status === "live" && (
                      <button onClick={() => handleStatusChange(s, "ended")}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors"
                        style={{ background:"rgba(100,116,139,0.1)", color:"#64748b" }}>
                        End Session
                      </button>
                    )}
                    {["scheduled","live"].includes(s.status) && (
                      <button onClick={() => handleStatusChange(s, "cancelled")}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors"
                        style={{ background:"rgba(206,17,38,0.08)", color:"#CE1126" }}>
                        Cancel
                      </button>
                    )}
                    {s.type === "recorded" && s.status === "available" && (
                      <button onClick={() => handleStatusChange(s, "unavailable")}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors"
                        style={{ background:"rgba(148,163,184,0.12)", color:"#64748b" }}>
                        Hide
                      </button>
                    )}
                    {s.type === "recorded" && s.status === "unavailable" && (
                      <button onClick={() => handleStatusChange(s, "available")}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors"
                        style={{ background:"rgba(124,58,237,0.1)", color:"#7c3aed" }}>
                        Make Available
                      </button>
                    )}
                    <button onClick={() => {
                      setFormData({ title:s.title, description:s.description||"", type:s.type,
                        stream_url:s.stream_url, scheduled_at:s.scheduled_at?s.scheduled_at.slice(0,16):"", status:s.status });
                      setFormErr(""); setModal({ type:"edit", session:s });
                    }} className="text-xs px-3 py-1.5 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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

      {modal && (
        <Modal
          title={modal.type === "create" ? "Add Cinema Session" : "Edit Session"}
          subtitle={modal.type === "edit" ? modal.session.title : ""}
          onClose={() => setModal(null)}
          footer={<>
            <button onClick={() => setModal(null)} disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)" }}>
              {saving && <Spin />}
              {saving ? "Saving…" : modal.type === "create" ? "Create Session" : "Save Changes"}
            </button>
          </>}>
          {formErr && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{formErr}</div>}
          <FInput label="Title" required value={formData.title} onChange={setField("title")}
            placeholder="e.g. Incwala Ceremony Live Stream" />
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
            <textarea rows={3} value={formData.description} onChange={setField("description")}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FSelect label="Type" required value={formData.type} onChange={e => {
              const t = e.target.value;
              setFormData(d => ({ ...d, type: t, status: t === "recorded" ? "available" : "scheduled" }));
            }}>
              <option value="live">Live</option>
              <option value="recorded">Recorded</option>
            </FSelect>
            <FSelect label="Status" required value={formData.status} onChange={setField("status")}>
              {formData.type === "recorded" ? (
                <>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </>
              ) : (
                <>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="ended">Ended</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </FSelect>
          </div>
          <FInput label="Video URL" required type="url" value={formData.stream_url} onChange={setField("stream_url")}
            placeholder={formData.type==="recorded" ? "https://youtube.com/watch?v=..." : "https://live-stream-url..."} />
          {formData.type === "recorded" && (
            <p className="text-xs text-slate-400 -mt-2">YouTube watch links are automatically converted to embed format.</p>
          )}
          {formData.type === "live" && (
            <FInput label="Scheduled at" type="datetime-local" value={formData.scheduled_at} onChange={setField("scheduled_at")} />
          )}
        </Modal>
      )}
    </div>
  );
};

export default CinemaManagement;
