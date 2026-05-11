import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyLineageRecords, createClan, updateClan, deleteClan } from "../../../api/lineage.api";
import { getLineageRecord } from "../../../api/lineage.api";

const Input = (props) => (
  <input
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:bg-gray-50"
    {...props}
  />
);
const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}{required && <span className="text-red-600 ml-0.5">*</span>}
  </label>
);
const EMPTY_CLAN = { name: "", royal_connection: "", founding_era: "", description: "" };

const ClansManager = () => {
  const [lineageRecords, setLineageRecords] = useState([]);
  const [clansByLineage, setClansByLineage] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingTo, setAddingTo] = useState(null);
  const [editingClan, setEditingClan] = useState(null);
  const [formData, setFormData] = useState(EMPTY_CLAN);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMyLineageRecords()
      .then(async (records) => {
        setLineageRecords(records);
        const details = await Promise.all(records.map((r) => getLineageRecord(r.id)));
        const clansMap = {};
        details.forEach((d) => { clansMap[d.id] = d.clans || []; });
        setClansByLineage(clansMap);
      })
      .catch(() => setError("Failed to load records."))
      .finally(() => setLoading(false));
  }, []);

  const setField = (f) => (e) => setFormData((d) => ({ ...d, [f]: e.target.value }));

  const handleAdd = async (lineageId) => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const created = await createClan({ ...formData, lineage_id: lineageId });
      setClansByLineage((m) => ({ ...m, [lineageId]: [...(m[lineageId] || []), created] }));
      setFormData(EMPTY_CLAN);
      setAddingTo(null);
    } catch {
      setError("Failed to add clan.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      await updateClan(editingClan.id, editingClan);
      setClansByLineage((m) => {
        const lineageId = editingClan.lineage_id;
        return { ...m, [lineageId]: m[lineageId].map((c) => (c.id === editingClan.id ? editingClan : c)) };
      });
      setEditingClan(null);
    } catch {
      setError("Failed to update clan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (clan) => {
    if (!confirm(`Delete clan "${clan.name}"?`)) return;
    try {
      await deleteClan(clan.id);
      setClansByLineage((m) => ({
        ...m,
        [clan.lineage_id]: m[clan.lineage_id].filter((c) => c.id !== clan.id),
      }));
    } catch {
      setError("Failed to delete clan.");
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Clans Manager</h1>
        <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="card animate-pulse h-32" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Clans Manager</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage clans across your lineage records</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {lineageRecords.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">No lineage records yet.</p>
          <Link to="/practitioner/lineage/new" className="btn-primary inline-flex mt-4 text-xs">
            Create a lineage record first
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {lineageRecords.map((record) => {
            const clans = clansByLineage[record.id] || [];
            return (
              <div key={record.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{record.title}</h2>
                    {record.era && <p className="text-xs text-gray-500">{record.era}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{clans.length} clan{clans.length !== 1 ? "s" : ""}</span>
                    <button
                      onClick={() => { setAddingTo(record.id); setFormData(EMPTY_CLAN); }}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      + Add Clan
                    </button>
                  </div>
                </div>

                {/* Clan list */}
                {clans.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {clans.map((c) =>
                      editingClan?.id === c.id ? (
                        <div key={c.id} className="border border-amber-200 rounded-xl p-3 bg-amber-50 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div><Label required>Name</Label><Input value={editingClan.name} onChange={(e) => setEditingClan((d) => ({ ...d, name: e.target.value }))} /></div>
                            <div><Label>Founding era</Label><Input value={editingClan.founding_era || ""} onChange={(e) => setEditingClan((d) => ({ ...d, founding_era: e.target.value }))} /></div>
                          </div>
                          <div><Label>Royal connection</Label><Input value={editingClan.royal_connection || ""} onChange={(e) => setEditingClan((d) => ({ ...d, royal_connection: e.target.value }))} /></div>
                          <div><Label>Description</Label><Input value={editingClan.description || ""} onChange={(e) => setEditingClan((d) => ({ ...d, description: e.target.value }))} /></div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingClan(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                            <button onClick={handleEditSave} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                              {saving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div key={c.id} className="flex items-start justify-between border border-gray-100 rounded-xl p-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">{c.name}</p>
                            {c.royal_connection && <p className="text-xs text-gray-500 mt-0.5">Connection: {c.royal_connection}</p>}
                            {c.founding_era && <p className="text-xs text-gray-500">Era: {c.founding_era}</p>}
                            {c.description && <p className="text-xs text-gray-600 mt-1 line-clamp-1">{c.description}</p>}
                          </div>
                          <div className="flex gap-2 ml-3">
                            <button onClick={() => setEditingClan({ ...c, lineage_id: record.id })} className="text-xs text-gray-500 hover:text-gray-800">Edit</button>
                            <button onClick={() => handleDelete({ ...c, lineage_id: record.id })} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Add form for this record */}
                {addingTo === record.id && (
                  <div className="border border-amber-200 rounded-xl p-3 bg-amber-50 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label required>Name</Label><Input value={formData.name} onChange={setField("name")} placeholder="Clan name" /></div>
                      <div><Label>Founding era</Label><Input value={formData.founding_era} onChange={setField("founding_era")} placeholder="e.g. 18th century" /></div>
                    </div>
                    <div><Label>Royal connection</Label><Input value={formData.royal_connection} onChange={setField("royal_connection")} placeholder="Connection to the royal family" /></div>
                    <div><Label>Description</Label><Input value={formData.description} onChange={setField("description")} placeholder="Brief description" /></div>
                    <div className="flex gap-2">
                      <button onClick={() => setAddingTo(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                      <button onClick={() => handleAdd(record.id)} disabled={saving || !formData.name.trim()}
                        className="btn-primary text-xs px-3 py-1.5">
                        {saving ? "Adding..." : "Add Clan"}
                      </button>
                    </div>
                  </div>
                )}

                {clans.length === 0 && addingTo !== record.id && (
                  <p className="text-sm text-gray-400 text-center py-2">No clans yet.</p>
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
