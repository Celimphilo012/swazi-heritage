import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyLineageRecords, createClan, updateClan, deleteClan, getLineageRecord } from "../../../api/lineage.api";

const FInput = (props) => (
  <input
    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800
               placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200
               focus:border-slate-300 disabled:bg-slate-50 transition-all"
    {...props}
  />
);

const FLabel = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
    {children}{required && <span className="ml-0.5" style={{ color: "#CE1126" }}>*</span>}
  </label>
);

const EMPTY_CLAN = { name: "", royal_connection: "", founding_era: "", description: "" };

const ClansManager = () => {
  const [lineageRecords, setLineageRecords] = useState([]);
  const [clansByLineage, setClansByLineage] = useState({});
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [addingTo,       setAddingTo]       = useState(null);
  const [editingClan,    setEditingClan]    = useState(null);
  const [formData,       setFormData]       = useState(EMPTY_CLAN);
  const [saving,         setSaving]         = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState(null);

  useEffect(() => {
    setLoading(true);
    getMyLineageRecords()
      .then(async records => {
        setLineageRecords(records);
        const details = await Promise.all(records.map(r => getLineageRecord(r.id)));
        const clansMap = {};
        details.forEach(d => { clansMap[d.id] = d.clans || []; });
        setClansByLineage(clansMap);
      })
      .catch(() => setError("Failed to load records."))
      .finally(() => setLoading(false));
  }, []);

  const setField = f => e => setFormData(d => ({ ...d, [f]: e.target.value }));

  const handleAdd = async lineageId => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const created = await createClan({ ...formData, lineage_id: lineageId });
      setClansByLineage(m => ({ ...m, [lineageId]: [...(m[lineageId] || []), created] }));
      setFormData(EMPTY_CLAN);
      setAddingTo(null);
    } catch { setError("Failed to add clan."); }
    finally { setSaving(false); }
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      await updateClan(editingClan.id, editingClan);
      setClansByLineage(m => {
        const lid = editingClan.lineage_id;
        return { ...m, [lid]: m[lid].map(c => c.id === editingClan.id ? editingClan : c) };
      });
      setEditingClan(null);
    } catch { setError("Failed to update clan."); }
    finally { setSaving(false); }
  };

  const handleDelete = async clan => {
    setSaving(true);
    try {
      await deleteClan(clan.id);
      setClansByLineage(m => ({
        ...m,
        [clan.lineage_id]: m[clan.lineage_id].filter(c => c.id !== clan.id),
      }));
    } catch { setError("Failed to delete clan."); }
    finally { setSaving(false); setDeleteTarget(null); }
  };

  if (loading) return (
    <div className="p-6 space-y-5 animate-pulse">
      <div className="rounded-2xl h-24" style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }} />
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-2xl h-32 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }} />
        ))}
      </div>
    </div>
  );

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
        <h1 className="text-xl font-black text-white">Clans Manager</h1>
        <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Manage clans across your lineage records</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
          {error}
        </div>
      )}

      {lineageRecords.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-500 mb-3">No lineage records yet.</p>
          <Link to="/practitioner/lineage/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
            Create a lineage record first
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {lineageRecords.map(record => {
            const clans = clansByLineage[record.id] || [];
            return (
              <div key={record.id} className="rounded-2xl p-5"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>

                {/* Record header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">{record.title}</h2>
                    {record.era && <p className="text-xs text-slate-400 mt-0.5">{record.era}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{clans.length} clan{clans.length !== 1 ? "s" : ""}</span>
                    <button
                      onClick={() => { setAddingTo(record.id); setFormData(EMPTY_CLAN); setEditingClan(null); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:opacity-90"
                      style={{ borderColor: "#e2e8f0", color: "#475569", background: "#f8fafc" }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Clan
                    </button>
                  </div>
                </div>

                {/* Clan list */}
                {clans.length === 0 && addingTo !== record.id && (
                  <p className="text-sm text-slate-400 text-center py-3">No clans yet.</p>
                )}

                {clans.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {clans.map(c =>
                      editingClan?.id === c.id ? (
                        <div key={c.id} className="rounded-xl p-4 space-y-3"
                          style={{ background: "rgba(217,119,6,0.04)", border: "1px solid rgba(217,119,6,0.2)" }}>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <FLabel required>Name</FLabel>
                              <FInput value={editingClan.name}
                                onChange={e => setEditingClan(d => ({ ...d, name: e.target.value }))} />
                            </div>
                            <div>
                              <FLabel>Founding era</FLabel>
                              <FInput value={editingClan.founding_era || ""}
                                onChange={e => setEditingClan(d => ({ ...d, founding_era: e.target.value }))} />
                            </div>
                          </div>
                          <div>
                            <FLabel>Royal connection</FLabel>
                            <FInput value={editingClan.royal_connection || ""}
                              onChange={e => setEditingClan(d => ({ ...d, royal_connection: e.target.value }))} />
                          </div>
                          <div>
                            <FLabel>Description</FLabel>
                            <FInput value={editingClan.description || ""}
                              onChange={e => setEditingClan(d => ({ ...d, description: e.target.value }))} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingClan(null)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
                              style={{ borderColor: "#e2e8f0", color: "#475569" }}>
                              Cancel
                            </button>
                            <button onClick={handleEditSave} disabled={saving}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                              style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
                              {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div key={c.id} className="flex items-start justify-between rounded-xl p-3 gap-3"
                          style={{ border: "1px solid #f1f5f9", background: "#fafafa" }}>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                            {c.royal_connection && <p className="text-xs text-slate-500 mt-0.5">Connection: {c.royal_connection}</p>}
                            {c.founding_era && <p className="text-xs text-slate-500">Era: {c.founding_era}</p>}
                            {c.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.description}</p>}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => setEditingClan({ ...c, lineage_id: record.id })}
                              className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
                              Edit
                            </button>
                            {deleteTarget?.id === c.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => setDeleteTarget(null)}
                                  className="text-xs font-semibold text-slate-400 px-2 py-1 rounded-lg hover:bg-slate-100">
                                  Keep
                                </button>
                                <button onClick={() => handleDelete({ ...c, lineage_id: record.id })} disabled={saving}
                                  className="text-xs font-bold px-2 py-1 rounded-lg disabled:opacity-50"
                                  style={{ color: "#CE1126", background: "rgba(206,17,38,0.08)" }}>
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteTarget(c)}
                                className="text-xs font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                                style={{ color: "#CE1126" }}>
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Add form */}
                {addingTo === record.id && (
                  <div className="rounded-xl p-4 space-y-3"
                    style={{ background: "rgba(217,119,6,0.04)", border: "1px solid rgba(217,119,6,0.2)" }}>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">New Clan</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FLabel required>Name</FLabel>
                        <FInput value={formData.name} onChange={setField("name")} placeholder="Clan name" />
                      </div>
                      <div>
                        <FLabel>Founding era</FLabel>
                        <FInput value={formData.founding_era} onChange={setField("founding_era")} placeholder="e.g. 18th century" />
                      </div>
                    </div>
                    <div>
                      <FLabel>Royal connection</FLabel>
                      <FInput value={formData.royal_connection} onChange={setField("royal_connection")} placeholder="Connection to the royal family" />
                    </div>
                    <div>
                      <FLabel>Description</FLabel>
                      <FInput value={formData.description} onChange={setField("description")} placeholder="Brief description" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAddingTo(null)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
                        style={{ borderColor: "#e2e8f0", color: "#475569" }}>
                        Cancel
                      </button>
                      <button onClick={() => handleAdd(record.id)} disabled={saving || !formData.name.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
                        {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        Add Clan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClansManager;
