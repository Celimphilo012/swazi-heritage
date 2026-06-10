import { useState, useEffect, useCallback, useRef } from "react";
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

const PlaceAutocomplete = ({ value, onChange, onSelect, placeholder }) => {
  const [query, setQuery]           = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const timerRef = useRef(null);
  const wrapRef  = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q) => {
    clearTimeout(timerRef.current);
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&accept-language=en`,
          { headers: { Accept: "application/json" } }
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    search(q);
  };

  const handleSelect = (item) => {
    const name = item.display_name;
    setQuery(name);
    setOpen(false);
    onSelect({ name, lat: item.lat, lon: item.lon });
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && (
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
          <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)", marginTop: 4,
          maxHeight: 220, overflowY: "auto",
        }}>
          {suggestions.map((item, i) => (
            <button key={item.place_id} type="button" onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "9px 14px", fontSize: "0.82rem", cursor: "pointer",
                background: i === activeIdx ? "#f1f5f9" : "transparent",
                borderBottom: i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
              }}>
              <span style={{ fontWeight: 600, color: "#1e293b" }}>
                {item.display_name.split(",")[0]}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "0.75rem", marginLeft: 6 }}>
                {item.display_name.split(",").slice(1).join(",").trim()}
              </span>
            </button>
          ))}
          <div style={{ padding: "5px 14px", fontSize: "0.68rem", color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}>
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
};

const EMPTY_CLAN = { name: "", royal_connection: "", founding_era: "", description: "", location_name: "", latitude: "", longitude: "" };

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
                <div>
                  <Label>Location name</Label>
                  <PlaceAutocomplete
                    value={editing.location_name || ""}
                    onChange={(val) => setEditing((d) => ({ ...d, location_name: val }))}
                    onSelect={({ name, lat, lon }) => setEditing((d) => ({ ...d, location_name: name, latitude: lat, longitude: lon }))}
                    placeholder="e.g. Manzini"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Latitude</Label>
                    <Input type="number" step="any" value={editing.latitude || ""} placeholder="-26.49" onChange={(e) => setEditing((d) => ({ ...d, latitude: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input type="number" step="any" value={editing.longitude || ""} placeholder="31.37" onChange={(e) => setEditing((d) => ({ ...d, longitude: e.target.value }))} />
                  </div>
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
          <div>
            <Label>Location name</Label>
            <PlaceAutocomplete
              value={formData.location_name}
              onChange={(val) => setFormData((d) => ({ ...d, location_name: val }))}
              onSelect={({ name, lat, lon }) => setFormData((d) => ({ ...d, location_name: name, latitude: lat, longitude: lon }))}
              placeholder="e.g. Manzini region"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Latitude</Label>
              <Input type="number" step="any" value={formData.latitude} onChange={setField("latitude")} placeholder="-26.49" />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input type="number" step="any" value={formData.longitude} onChange={setField("longitude")} placeholder="31.37" />
            </div>
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

  const [formData, setFormData] = useState({ title: "", era: "", description: "", swati_title: "", swati_description: "", location_name: "", latitude: "", longitude: "", category: "" });
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
        setFormData({ title: r.title, era: r.era, description: r.description || "", swati_title: r.swati_title || "", swati_description: r.swati_description || "", location_name: r.location_name || "", latitude: r.latitude ?? "", longitude: r.longitude ?? "", category: r.category || "" });
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

        {/* Cultural category */}
        <div>
          <Label>Cultural category</Label>
          <select
            value={formData.category}
            onChange={setField("category")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          >
            <option value="">— Select a category (for recommendations) —</option>
            <option value="ceremonies">Ceremonies</option>
            <option value="lineage">Royal Lineage</option>
            <option value="music">Music &amp; Songs</option>
            <option value="attire">Traditional Attire</option>
            <option value="royal">Royal Culture</option>
            <option value="spiritual">Spiritual Practices</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">Used to match this record with users' cultural interests.</p>
        </div>

        {/* siSwati translation */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">siSwati Translation (Optional)</p>
          <div className="space-y-3">
            <div>
              <Label>Isihloko sesiSwati (siSwati title)</Label>
              <Input value={formData.swati_title} onChange={setField("swati_title")} placeholder="e.g. Indzawo yelikhosi..." />
            </div>
            <div>
              <Label>Inchazelo yesiSwati (siSwati description)</Label>
              <Textarea rows={3} value={formData.swati_description} onChange={setField("swati_description")} placeholder="Bhala lapha ngebsati..." />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Location (Optional)</p>
          <div className="space-y-3">
            <div>
              <Label>Place name</Label>
              <PlaceAutocomplete
                value={formData.location_name}
                onChange={(val) => setFormData((d) => ({ ...d, location_name: val }))}
                onSelect={({ name, lat, lon }) => setFormData((d) => ({ ...d, location_name: name, latitude: lat, longitude: lon }))}
                placeholder="e.g. Lobamba, Hhohho Region"
              />
              <p className="text-xs text-gray-400 mt-1">Start typing to get location suggestions. Selecting one auto-fills the coordinates.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Latitude</Label>
                <Input type="number" step="any" value={formData.latitude} onChange={setField("latitude")} placeholder="-26.4661" />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input type="number" step="any" value={formData.longitude} onChange={setField("longitude")} placeholder="31.2026" />
              </div>
            </div>
          </div>
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
