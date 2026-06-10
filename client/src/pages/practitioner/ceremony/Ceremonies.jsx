import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getMyCeremonies,
  getCeremony,
  getImvunuloPresets,
  addImvunulo,
  deleteImvunulo,
} from "../../../api/ceremonies.api";

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

// ─── Attire preset card (used in the manage-attire modal) ────────────────────
const ModalPresetCard = ({ preset, selected, busy, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(preset)}
    disabled={busy}
    className={`w-full text-left border-2 rounded-xl p-3 transition-all ${
      busy
        ? "opacity-60 cursor-wait"
        : selected
          ? "border-red-600 bg-red-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
    }`}
  >
    <div className="flex items-start gap-2">
      <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? "border-red-600 bg-red-600" : "border-gray-300"
      }`}>
        {selected && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {preset.image_url && (
          <img src={preset.image_url} alt={preset.name}
            className="w-full h-16 object-cover rounded-lg mb-2 border border-gray-100"
            onError={(e) => { e.target.style.display = "none"; }} />
        )}
        <p className="text-sm font-medium text-gray-900">{preset.name}</p>
        {preset.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
            {preset.description}
          </p>
        )}
        <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded font-medium ${
          preset.gender === "male"   ? "bg-blue-50 text-blue-700"   :
          preset.gender === "female" ? "bg-pink-50 text-pink-700"   :
          preset.gender === "child"  ? "bg-purple-50 text-purple-700" :
          "bg-gray-100 text-gray-600"
        }`}>{preset.gender}</span>
      </div>
    </div>
  </button>
);

// ─── Manage Attire modal ──────────────────────────────────────────────────────
const AttireModal = ({ ceremony, onClose }) => {
  const [presets,    setPresets]    = useState([]);
  const [imvunulo,   setImvunulo]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    Promise.all([getImvunuloPresets(), getCeremony(ceremony.id)])
      .then(([p, c]) => { setPresets(p); setImvunulo(c.imvunulo); })
      .catch(() => setModalError("Could not load attire data. Please try again."))
      .finally(() => setLoading(false));
  }, [ceremony.id]);

  const isSelected = (presetId) => imvunulo.some(iv => iv.preset_id === presetId);

  const handleToggle = async (preset) => {
    setTogglingId(preset.id);
    setModalError("");
    try {
      const existing = imvunulo.find(iv => iv.preset_id === preset.id);
      if (existing) {
        await deleteImvunulo(ceremony.id, existing.id);
        setImvunulo(prev => prev.filter(iv => iv.id !== existing.id));
      } else {
        await addImvunulo(ceremony.id, { preset_id: preset.id });
        const updated = await getCeremony(ceremony.id);
        setImvunulo(updated.imvunulo);
      }
    } catch {
      setModalError("Could not update attire. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Manage Attire (Imvunulo)</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {ceremony.name} · changes save immediately
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {modalError && (
            <div className="mb-3 p-3 rounded-xl text-xs text-red-700"
              style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)" }}>
              {modalError}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-2 bg-gray-100 rounded w-full mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : presets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No attire presets configured yet. Ask the admin to add them in System Config.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3">
                <span className="font-semibold text-gray-700">{imvunulo.length}</span> item{imvunulo.length !== 1 ? "s" : ""} selected
                {" "}— click to add or remove
              </p>
              <div className="grid grid-cols-2 gap-2">
                {presets.map(preset => (
                  <ModalPresetCard
                    key={preset.id}
                    preset={preset}
                    selected={isSelected(preset.id)}
                    busy={togglingId === preset.id}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3">
            For colour descriptions, images, or notes per attire item, use the full{" "}
            <Link
              to={`/practitioner/ceremonies/${ceremony.id}/edit`}
              onClick={onClose}
              className="text-red-700 underline"
            >
              edit form
            </Link>.
          </p>
          <button type="button" onClick={onClose}
            className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#0f172a" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const Ceremonies = () => {
  const [ceremonies,  setCeremonies]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [filter,      setFilter]      = useState("");
  const [attireModal, setAttireModal] = useState(null);

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
                    <Link to={`/practitioner/ceremonies/${ceremony.id}/walkthrough`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center transition-colors hover:bg-blue-50"
                      style={{ borderColor: "rgba(0,35,149,0.25)", color: "#002395", background: "rgba(0,35,149,0.04)" }}>
                      Walkthrough
                    </Link>
                    <button
                      type="button"
                      onClick={() => setAttireModal(ceremony)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center transition-colors hover:bg-red-50"
                      style={{ borderColor: "rgba(206,17,38,0.25)", color: "#CE1126", background: "rgba(206,17,38,0.04)" }}>
                      Attire
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {attireModal && (
        <AttireModal
          ceremony={attireModal}
          onClose={() => setAttireModal(null)}
        />
      )}
    </div>
  );
};

export default Ceremonies;
