import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getMyLineageRecords, createLineageRecord, updateLineageRecord,
  createClan, updateClan, deleteClan,
} from "../../../api/lineage.api";
import { getLineageRecord } from "../../../api/lineage.api";

const ERAS = [
  "Pre-colonial era (before 1840)",
  "Colonial period (1840–1968)",
  "Post-independence (1968–present)",
  "Kingdom of Eswatini era (2018–present)",
  "Royal lineage of King Sobhuza II",
  "Royal lineage of King Mswati III",
  "Other",
];

const Input = (props) => (
  <input
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:bg-gray-50"
    {...props}
  />
);
const Textarea = ({ rows = 4, ...props }) => (
  <textarea
    rows={rows}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
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

const ClanForm = ({ lineageId, initialClans = [] }) => {
  const [clans, setClans] = useState(initialClans);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // { id, ...fields }
  const [formData, setFormData] = useState(EMPTY_CLAN);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (f) => (e) => setFormData((d) => ({ ...d, [f]: e.target.value }));

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const created = await createClan({ ...formData, lineage_id: lineageId });
      setClans((cs) => [...cs, created]);
      setFormData(EMPTY_CLAN);
      setAdding(false);
    } catch {
      setError("Failed to add clan.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateClan(editing.id, editing);
      setClans((cs) => cs.map((c) => (c.id === editing.id ? editing : c)));
      setEditing(null);
    } catch {
      setError("Failed to update clan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this clan?")) return;
    try {
      await deleteClan(id);
      setClans((cs) => cs.filter((c) => c.id !== id));
    } catch {
      setError("Failed to delete clan.");
    }
  };

  return (
    <div className="card mt-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Associated Clans</h2>
          <p className="text-xs text-gray-500 mt-0.5">Add clans connected to this lineage record</p>
        </div>
        {!adding && (
          <button onClick={() => { setAdding(true); setFormData(EMPTY_CLAN); setError(""); }}
            className="btn-secondary text-xs px-3 py-1.5">
            + Add Clan
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Existing clans */}
      {clans.length > 0 && (
        <div className="space-y-3 mb-4">
          {clans.map((c) =>
            editing?.id === c.id ? (
              <div key={c.id} className="border border-orange-200 rounded-xl p-4 bg-orange-50 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label required>Clan name</Label>
                    <Input value={editing.name} onChange={(e) => setEditing((d) => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Founding era</Label>
                    <Input value={editing.founding_era || ""} onChange={(e) => setEditing((d) => ({ ...d, founding_era: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Royal connection</Label>
                  <Input value={editing.royal_connection || ""} onChange={(e) => setEditing((d) => ({ ...d, royal_connection: e.target.value }))} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea rows={2} value={editing.description || ""} onChange={(e) => setEditing((d) => ({ ...d, description: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                  <button onClick={handleEditSave} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div key={c.id} className="border border-gray-100 rounded-xl p-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                  {c.royal_connection && <p className="text-xs text-gray-500 mt-0.5">Connection: {c.royal_connection}</p>}
                  {c.founding_era && <p className="text-xs text-gray-500">Era: {c.founding_era}</p>}
                  {c.description && <p className="text-xs text-gray-600 mt-1">{c.description}</p>}
                </div>
                <div className="flex gap-2 ml-3">
                  <button onClick={() => setEditing({ ...c })} className="text-xs text-gray-500 hover:text-gray-800">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="border border-amber-200 rounded-xl p-4 bg-amber-50 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label required>Clan name</Label>
              <Input value={formData.name} onChange={setField("name")} placeholder="e.g. Dlamini" />
            </div>
            <div>
              <Label>Founding era</Label>
              <Input value={formData.founding_era} onChange={setField("founding_era")} placeholder="e.g. 18th century" />
            </div>
          </div>
          <div>
            <Label>Royal connection</Label>
            <Input value={formData.royal_connection} onChange={setField("royal_connection")} placeholder="e.g. Direct descendants of King Sobhuza I" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={formData.description} onChange={setField("description")} placeholder="Brief history of the clan..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
            <button onClick={handleAdd} disabled={saving || !formData.name.trim()}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Add Clan
            </button>
          </div>
        </div>
      )}

      {clans.length === 0 && !adding && (
        <p className="text-sm text-gray-400 text-center py-4">No clans added yet.</p>
      )}
    </div>
  );
};

const LineageFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({ title: "", era: "", description: "" });
  const [clans, setClans] = useState([]);
  const [savedId, setSavedId] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getLineageRecord(id)
      .then((r) => {
        setFormData({ title: r.title, era: r.era, description: r.description || "" });
        setClans(r.clans || []);
        setSavedId(r.id);
      })
      .catch(() => setError("Failed to load record."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const setField = (f) => (e) => setFormData((d) => ({ ...d, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.era) return;
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await updateLineageRecord(id, formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const created = await createLineageRecord(formData);
        setSavedId(created.id);
        setSaved(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="card space-y-4">
          <div className="h-9 bg-gray-200 rounded" />
          <div className="h-9 bg-gray-100 rounded" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  const lineageId = isEdit ? Number(id) : savedId;

  return (
    <div className="max-w-2xl">
      <Link to="/practitioner/lineage" className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Lineage Records
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEdit ? "Edit Lineage Record" : "New Lineage Record"}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isEdit ? "Update and resubmit for review" : "Submit a royal lineage record for admin review"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div>
          <Label required>Title</Label>
          <Input
            value={formData.title}
            onChange={setField("title")}
            placeholder="e.g. Royal Lineage of House Dlamini"
            required
          />
        </div>

        <div>
          <Label required>Historical Era</Label>
          <select
            value={formData.era}
            onChange={setField("era")}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          >
            <option value="">Select era...</option>
            {ERAS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            rows={6}
            value={formData.description}
            onChange={setField("description")}
            placeholder="Describe the lineage, its historical significance, notable figures, and connection to the Swazi royal family..."
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? "Saving..." : isEdit ? "Save & Resubmit" : "Submit for Review"}
          </button>
          {saved && !isEdit && lineageId && (
            <span className="text-xs text-green-600">Saved! Add clans below.</span>
          )}
          {saved && isEdit && (
            <span className="text-xs text-green-600">Saved!</span>
          )}
        </div>
      </form>

      {/* Clan section — shown after save (or always on edit) */}
      {(isEdit || lineageId) && (
        <ClanForm lineageId={lineageId} initialClans={clans} />
      )}
    </div>
  );
};

export default LineageFormPage;
