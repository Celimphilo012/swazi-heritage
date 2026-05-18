import { useState, useEffect } from "react";
import {
  getConfig, updateConfig,
  getImvunuloPresets, createImvunuloPreset, updateImvunuloPreset,
} from "../../api/admin.api";
import { getCeremonyMonths } from "../../api/ceremonies.api";
import MediaInput from "../../components/common/MediaInput";

const FInput = (props) => (
  <input
    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white
               focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-slate-300
               disabled:bg-slate-50 text-slate-800 placeholder-slate-400"
    {...props}
  />
);

const FSelect = ({ children, ...props }) => (
  <select
    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white
               focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-slate-300 text-slate-800"
    {...props}
  >
    {children}
  </select>
);

const BtnPrimary = ({ children, ...props }) => (
  <button
    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
               transition-all hover:opacity-90 disabled:opacity-50"
    style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}
    {...props}
  >
    {children}
  </button>
);

const GENDER_OPTIONS = ["male", "female", "both", "child"];

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
    } finally { setSaving(false); }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {preset.image_url ? (
            <img src={preset.image_url} alt={preset.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
              onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.15)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                style={{ color: "#d97706" }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${preset.active ? "text-slate-800" : "text-slate-400 line-through"}`}>
              {preset.name}
            </p>
            {preset.description && (
              <p className="text-xs text-slate-400 truncate">{preset.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
            style={{ background: "rgba(100,116,139,0.08)", color: "#64748b" }}>
            {preset.gender}
          </span>
          {preset.active ? (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          )}
          <button onClick={() => setEditing(true)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50">
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 border-b border-slate-100 last:border-0 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <FInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" />
        <FSelect value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
          {GENDER_OPTIONS.map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
        </FSelect>
      </div>
      <FInput value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-1.5">Preset image</p>
        <MediaInput value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))}
          accept="image/*" type="image" placeholder="https://... or upload a photo" />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input type="checkbox" checked={!!form.active}
            onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
            className="rounded border-slate-300" />
          Active
        </label>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <BtnPrimary onClick={handleSave} disabled={saving} style={{ padding: "6px 14px", fontSize: 12 }}>
            {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, description, children }) => (
  <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
    <h2 className="text-sm font-bold text-slate-800 mb-0.5">{title}</h2>
    {description && <p className="text-xs text-slate-400 mb-4">{description}</p>}
    {children}
  </div>
);

const SystemConfig = () => {
  const [configs,       setConfigs]      = useState([]);
  const [presets,       setPresets]      = useState([]);
  const [months,        setMonths]       = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState("");

  const [aiPrompt,      setAiPrompt]     = useState("");
  const [savingPrompt,  setSavingPrompt] = useState(false);
  const [promptSaved,   setPromptSaved]  = useState(false);

  const [newPreset,     setNewPreset]    = useState({ name: "", description: "", gender: "both", image_url: "" });
  const [addingPreset,  setAddingPreset] = useState(false);

  const [monthsRaw,     setMonthsRaw]    = useState("");
  const [savingMonths,  setSavingMonths] = useState(false);
  const [monthsSaved,   setMonthsSaved]  = useState(false);

  useEffect(() => {
    Promise.all([getConfig(), getImvunuloPresets(), getCeremonyMonths()])
      .then(([cfgs, ps, ms]) => {
        setConfigs(cfgs);
        setPresets(ps);
        setMonths(ms);
        const ai = cfgs.find(c => c.key === "ai_system_prompt");
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
    } catch { setError("Failed to save AI prompt."); }
    finally { setSavingPrompt(false); }
  };

  const handleAddPreset = async () => {
    if (!newPreset.name.trim()) return;
    setAddingPreset(true);
    try {
      const created = await createImvunuloPreset(newPreset);
      setPresets(ps => [...ps, { ...created, active: 1 }]);
      setNewPreset({ name: "", description: "", gender: "both", image_url: "" });
    } catch { setError("Failed to add preset."); }
    finally { setAddingPreset(false); }
  };

  const handleUpdatePreset = async (id, data) => {
    await updateImvunuloPreset(id, data);
    setPresets(ps => ps.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const handleSaveMonths = async () => {
    const arr = monthsRaw.split("\n").map(s => s.trim()).filter(Boolean);
    setSavingMonths(true);
    try {
      await updateConfig("ceremony_months", JSON.stringify(arr));
      setMonths(arr);
      setMonthsSaved(true);
      setTimeout(() => setMonthsSaved(false), 2000);
    } catch { setError("Failed to save months."); }
    finally { setSavingMonths(false); }
  };

  if (loading) return (
    <div className="p-6 space-y-5 animate-pulse">
      <div className="rounded-2xl h-24" style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }} />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl h-40 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }} />
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
        <h1 className="text-xl font-black text-white">System Config</h1>
        <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>AI prompts, attire presets, and ceremony months</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-5">

        {/* AI System Prompt */}
        <Section title="AI System Prompt"
          description="Prepended to every Gemini AI call. Controls the assistant's persona and tone.">
          <textarea
            rows={8}
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono resize-y
                       focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-slate-300
                       text-slate-800 placeholder-slate-400"
          />
          <div className="flex items-center gap-3 mt-3">
            <BtnPrimary onClick={handleSavePrompt} disabled={savingPrompt}>
              {savingPrompt && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {savingPrompt ? "Saving…" : "Save Prompt"}
            </BtnPrimary>
            {promptSaved && (
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </Section>

        {/* Imvunulo Presets */}
        <Section title="Imvunulo Presets"
          description="Traditional attire categories available to ceremony keepers.">
          <div className="mb-4">
            {presets.length === 0 && (
              <p className="text-sm text-slate-400 py-2">No presets yet.</p>
            )}
            {presets.map(p => (
              <PresetRow key={p.id} preset={p} onSave={handleUpdatePreset} />
            ))}
          </div>

          {/* Add new preset */}
          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">Add new preset</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <FInput value={newPreset.name}
                onChange={e => setNewPreset(n => ({ ...n, name: e.target.value }))}
                placeholder="Preset name" />
              <FSelect value={newPreset.gender}
                onChange={e => setNewPreset(n => ({ ...n, gender: e.target.value }))}>
                {GENDER_OPTIONS.map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
              </FSelect>
            </div>
            <div className="mb-2">
              <FInput value={newPreset.description}
                onChange={e => setNewPreset(n => ({ ...n, description: e.target.value }))}
                placeholder="Description (optional)" />
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Preset image (optional)</p>
              <MediaInput value={newPreset.image_url}
                onChange={url => setNewPreset(n => ({ ...n, image_url: url }))}
                accept="image/*" type="image" placeholder="https://... or upload a photo" />
            </div>
            <BtnPrimary onClick={handleAddPreset} disabled={addingPreset || !newPreset.name.trim()}>
              {addingPreset
                ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Adding…</>
                : <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Preset
                  </>}
            </BtnPrimary>
          </div>
        </Section>

        {/* Ceremony Months */}
        <Section title="Ceremony Months"
          description="One entry per line. These appear in the ceremony form's month dropdown.">
          <textarea
            rows={10}
            value={monthsRaw}
            onChange={e => setMonthsRaw(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono resize-y
                       focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-slate-300
                       text-slate-800 placeholder-slate-400"
          />
          <div className="flex items-center gap-3 mt-3">
            <BtnPrimary onClick={handleSaveMonths} disabled={savingMonths}>
              {savingMonths && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {savingMonths ? "Saving…" : "Save Months"}
            </BtnPrimary>
            {monthsSaved && (
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default SystemConfig;
