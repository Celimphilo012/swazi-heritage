import { useState, useEffect } from "react";
import {
  getConfig, updateConfig,
  getImvunuloPresets, createImvunuloPreset, updateImvunuloPreset,
} from "../../api/admin.api";
import { getCeremonyMonths } from "../../api/ceremonies.api";
import MediaInput from "../../components/common/MediaInput";

const Input = (props) => (
  <input
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:bg-gray-50"
    {...props}
  />
);
const Select = ({ children, ...props }) => (
  <select
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
               focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
    {...props}
  >
    {children}
  </select>
);
const GENDER_OPTIONS = ["male", "female", "both", "child"];

// ─── Preset form row ──────────────────────────────────────────────────────────
const PresetRow = ({ preset, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: preset.name,
    description: preset.description || "",
    gender: preset.gender || "both",
    active: preset.active,
    image_url: preset.image_url || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(preset.id, { ...form, active: form.active ? 1 : 0 });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {preset.image_url ? (
            <img src={preset.image_url} alt={preset.name}
              className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
              onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <p className={`text-sm font-medium ${preset.active ? "text-gray-900" : "text-gray-400 line-through"}`}>
              {preset.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{preset.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{preset.gender}</span>
          <button onClick={() => setEditing(true)} className="text-xs text-gray-500 hover:text-gray-800">Edit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-0 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" />
        <Select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
          {GENDER_OPTIONS.map((g) => <option key={g} value={g} className="capitalize">{g}</option>)}
        </Select>
      </div>
      <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" />
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1">Preset image</p>
        <MediaInput
          value={form.image_url}
          onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
          accept="image/*"
          type="image"
          placeholder="https://... or upload a photo"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={!!form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="rounded" />
          Active
        </label>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const SystemConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [presets, setPresets] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI prompt
  const [aiPrompt, setAiPrompt] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

  // New preset
  const [newPreset, setNewPreset] = useState({ name: "", description: "", gender: "both", image_url: "" });
  const [addingPreset, setAddingPreset] = useState(false);

  // Months
  const [monthsRaw, setMonthsRaw] = useState("");
  const [savingMonths, setSavingMonths] = useState(false);
  const [monthsSaved, setMonthsSaved] = useState(false);

  useEffect(() => {
    Promise.all([getConfig(), getImvunuloPresets(), getCeremonyMonths()])
      .then(([cfgs, ps, ms]) => {
        setConfigs(cfgs);
        setPresets(ps);
        setMonths(ms);
        const ai = cfgs.find((c) => c.key === "ai_system_prompt");
        if (ai) setAiPrompt(ai.value);
        setMonthsRaw(ms.join("\n"));
      })
      .catch(() => setError("Failed to load config."))
      .finally(() => setLoading(false));
  }, []);

  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    try {
      await updateConfig("ai_system_prompt", aiPrompt);
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 2000);
    } catch {
      setError("Failed to save AI prompt.");
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleAddPreset = async () => {
    if (!newPreset.name.trim()) return;
    setAddingPreset(true);
    try {
      const created = await createImvunuloPreset(newPreset);
      setPresets((ps) => [...ps, { ...created, active: 1 }]);
      setNewPreset({ name: "", description: "", gender: "both", image_url: "" });
    } catch {
      setError("Failed to add preset.");
    } finally {
      setAddingPreset(false);
    }
  };

  const handleUpdatePreset = async (id, data) => {
    await updateImvunuloPreset(id, data);
    setPresets((ps) => ps.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const handleSaveMonths = async () => {
    const arr = monthsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setSavingMonths(true);
    try {
      await updateConfig("ceremony_months", JSON.stringify(arr));
      setMonths(arr);
      setMonthsSaved(true);
      setTimeout(() => setMonthsSaved(false), 2000);
    } catch {
      setError("Failed to save months.");
    } finally {
      setSavingMonths(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">System Config</h1>
        <div className="space-y-4">{[...Array(3)].map((_, i) => (
          <div key={i} className="card animate-pulse h-24" />
        ))}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">System Config</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage AI prompts, attire presets, and ceremony months</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-5">
        {/* AI System Prompt */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">AI System Prompt</h2>
          <p className="text-xs text-gray-500 mb-2">
            Prepended to every Gemini AI call. Controls the assistant's persona and tone.
          </p>
          <textarea
            rows={8}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono resize-y
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
          <div className="flex items-center gap-3 mt-3">
            <button onClick={handleSavePrompt} disabled={savingPrompt} className="btn-primary flex items-center gap-2">
              {savingPrompt && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {savingPrompt ? "Saving..." : "Save Prompt"}
            </button>
            {promptSaved && <span className="text-xs text-green-600">Saved!</span>}
          </div>
        </div>

        {/* Imvunulo presets */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Imvunulo Presets</h2>
          <p className="text-xs text-gray-500 mb-4">Traditional attire categories available to ceremony keepers.</p>
          <div className="mb-4">
            {presets.map((p) => (
              <PresetRow key={p.id} preset={p} onSave={handleUpdatePreset} />
            ))}
          </div>
          {/* Add new */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Add new preset</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input
                value={newPreset.name}
                onChange={(e) => setNewPreset((n) => ({ ...n, name: e.target.value }))}
                placeholder="Preset name"
              />
              <Select value={newPreset.gender} onChange={(e) => setNewPreset((n) => ({ ...n, gender: e.target.value }))}>
                {GENDER_OPTIONS.map((g) => <option key={g} value={g} className="capitalize">{g}</option>)}
              </Select>
            </div>
            <Input
              value={newPreset.description}
              onChange={(e) => setNewPreset((n) => ({ ...n, description: e.target.value }))}
              placeholder="Description"
              className="mb-2"
            />
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-600 mb-1">Preset image (optional)</p>
              <MediaInput
                value={newPreset.image_url}
                onChange={(url) => setNewPreset((n) => ({ ...n, image_url: url }))}
                accept="image/*"
                type="image"
                placeholder="https://... or upload a photo"
              />
            </div>
            <button onClick={handleAddPreset} disabled={addingPreset || !newPreset.name.trim()} className="btn-primary text-xs flex items-center gap-1">
              {addingPreset && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Add Preset
            </button>
          </div>
        </div>

        {/* Ceremony months */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Ceremony Months</h2>
          <p className="text-xs text-gray-500 mb-3">One entry per line. These appear in the ceremony form's month dropdown.</p>
          <textarea
            rows={10}
            value={monthsRaw}
            onChange={(e) => setMonthsRaw(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono resize-y
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
          <div className="flex items-center gap-3 mt-3">
            <button onClick={handleSaveMonths} disabled={savingMonths} className="btn-primary flex items-center gap-2">
              {savingMonths && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {savingMonths ? "Saving..." : "Save Months"}
            </button>
            {monthsSaved && <span className="text-xs text-green-600">Saved!</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfig;
