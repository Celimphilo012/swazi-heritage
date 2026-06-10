import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../api/axiosInstance";

const Input = (props) => (
  <input
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
    {...props}
  />
);
const Textarea = ({ rows = 3, ...props }) => (
  <textarea
    rows={rows}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
               focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
    {...props}
  />
);
const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}{required && <span className="text-red-600 ml-0.5">*</span>}
  </label>
);

const EMPTY_STEP = { title: "", description: "", media_url: "" };

const WalkthroughManager = () => {
  const { id: ceremonyId } = useParams();
  const [steps,   setSteps]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY_STEP);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [msg,     setMsg]     = useState("");
  const [cname,   setCname]   = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/ceremonies/${ceremonyId}`).then(r => setCname(r.data.data?.name || "")),
      api.get(`/ceremonies/${ceremonyId}/steps`).then(r => setSteps(r.data.data || [])),
    ]).catch(() => setError("Could not load ceremony."))
      .finally(() => setLoading(false));
  }, [ceremonyId]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await api.post(`/ceremonies/${ceremonyId}/steps`, form);
      setSteps(s => [...s, res.data.data]);
      setForm(EMPTY_STEP);
      setAdding(false);
      setMsg("Step added."); setTimeout(() => setMsg(""), 2000);
    } catch { setError("Failed to add step."); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editing.title.trim()) return;
    setSaving(true); setError("");
    try {
      await api.put(`/ceremonies/${ceremonyId}/steps/${editing.id}`, editing);
      setSteps(s => s.map(x => x.id === editing.id ? { ...x, ...editing } : x));
      setEditing(null);
      setMsg("Step updated."); setTimeout(() => setMsg(""), 2000);
    } catch { setError("Failed to update step."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (stepId) => {
    if (!window.confirm("Delete this step?")) return;
    try {
      await api.delete(`/ceremonies/${ceremonyId}/steps/${stepId}`);
      setSteps(s => s.filter(x => x.id !== stepId));
    } catch { setError("Failed to delete step."); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <Link to="/practitioner/ceremonies"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Ceremonies
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Walkthrough Steps</h1>
        {cname && <p className="text-sm text-gray-500 mt-0.5">{cname}</p>}
        <p className="text-xs text-gray-400 mt-1">
          Guide users through this ceremony step-by-step. Steps appear in the "Walkthrough" tab on the public ceremony page.
        </p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
      {msg   && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{msg}</div>}

      {/* Existing steps */}
      <div className="space-y-3 mb-5">
        {steps.length === 0 && !adding && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-400 text-sm">No walkthrough steps yet.</p>
            <button onClick={() => setAdding(true)}
              className="mt-2 text-sm text-red-700 hover:underline font-medium">
              Add the first step
            </button>
          </div>
        )}
        {steps.map((step) => (
          editing?.id === step.id ? (
            <div key={step.id} className="border border-orange-200 rounded-xl p-4 bg-orange-50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>Title</Label>
                  <Input value={editing.title} onChange={e => setEditing(s => ({ ...s, title: e.target.value }))} />
                </div>
                <div>
                  <Label>Step #</Label>
                  <Input type="number" value={editing.step_number}
                    onChange={e => setEditing(s => ({ ...s, step_number: +e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editing.description || ""} rows={3}
                  onChange={e => setEditing(s => ({ ...s, description: e.target.value }))}
                  placeholder="What happens at this step?" />
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input value={editing.media_url || ""} placeholder="https://..."
                  onChange={e => setEditing(s => ({ ...s, media_url: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                <button onClick={handleUpdate} disabled={saving}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
                  {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div key={step.id} className="border border-gray-200 rounded-xl p-4 flex gap-4">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                   style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
                {step.step_number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{step.title}</p>
                {step.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{step.description}</p>}
                {step.media_url && (
                  <p className="text-xs text-blue-600 mt-0.5 truncate">{step.media_url}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditing({ ...step })} className="text-xs text-gray-500 hover:text-gray-800">Edit</button>
                <button onClick={() => handleDelete(step.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Add form */}
      {adding ? (
        <div className="border-2 border-dashed border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
          <p className="text-xs font-semibold text-red-800">New step (#{steps.length + 1})</p>
          <div>
            <Label required>Title</Label>
            <Input value={form.title} onChange={set("title")} placeholder="e.g. Preparation of ceremonial attire" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={set("description")} rows={3}
              placeholder="Describe what happens during this step…" />
          </div>
          <div>
            <Label>Image URL (optional)</Label>
            <Input value={form.media_url} onChange={set("media_url")} placeholder="https://…" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setAdding(false); setForm(EMPTY_STEP); }}
              className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
            <button onClick={handleAdd} disabled={saving || !form.title.trim()}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
              {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Add Step
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="btn-secondary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Step
        </button>
      )}
    </div>
  );
};

export default WalkthroughManager;
