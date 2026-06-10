import { useState, useEffect } from "react";
import { getMyServices, createService, updateService, deleteService } from "../../../api/services.api";
import MediaInput from "../../../components/common/MediaInput";

const CATEGORIES = ["performance", "crafts", "teaching", "ceremony", "attire", "music", "other"];

const FInput = (props) => (
  <input
    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800
               placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
    {...props}
  />
);
const FLabel = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
    {children}{required && <span className="ml-0.5" style={{ color: "#CE1126" }}>*</span>}
  </label>
);

const EMPTY = { title: "", description: "", category: "other", price_range: "", contact: "", image_url: "", status: "active" };

const ServiceForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial || EMPTY);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FLabel required>Service title</FLabel>
          <FInput value={form.title} onChange={set("title")} placeholder="e.g. Traditional ceremony guidance" required />
        </div>
        <div>
          <FLabel required>Category</FLabel>
          <select value={form.category} onChange={set("category")}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-200">
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <FLabel>Price range</FLabel>
          <FInput value={form.price_range} onChange={set("price_range")} placeholder="e.g. E500–E1200 per session" />
        </div>
        <div className="sm:col-span-2">
          <FLabel>Description</FLabel>
          <textarea rows={3} value={form.description} onChange={set("description")}
            placeholder="Describe what you offer, who it's for, and what clients can expect…"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
        </div>
        <div>
          <FLabel>Contact / booking info</FLabel>
          <FInput value={form.contact} onChange={set("contact")} placeholder="WhatsApp, email, or phone number" />
        </div>
        <div>
          <FLabel>Listing image (optional)</FLabel>
          <MediaInput value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))}
            accept="image/*" type="image" placeholder="https://… or upload" />
        </div>
        {initial && (
          <div>
            <FLabel>Status</FLabel>
            <select value={form.status} onChange={set("status")}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="active">Active (visible to users)</option>
              <option value="inactive">Inactive (hidden)</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button type="button" onClick={() => onSave(form)} disabled={saving || !form.title.trim()}
          className="px-5 py-2 text-sm font-bold rounded-xl text-white disabled:opacity-50 flex items-center gap-2"
          style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
          {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saving ? "Saving…" : initial ? "Save Changes" : "List Service"}
        </button>
      </div>
    </div>
  );
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [msg,      setMsg]      = useState("");

  const load = () => {
    setLoading(true);
    getMyServices()
      .then(setServices)
      .catch(() => setError("Could not load your services."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (form) => {
    setSaving(true); setError("");
    try {
      await createService(form);
      setCreating(false);
      setMsg("Service listed successfully.");
      setTimeout(() => setMsg(""), 3000);
      load();
    } catch { setError("Failed to create service."); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (form) => {
    setSaving(true); setError("");
    try {
      await updateService(editing.id, form);
      setEditing(null);
      setMsg("Service updated.");
      setTimeout(() => setMsg(""), 3000);
      load();
    } catch { setError("Failed to update service."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this service listing?")) return;
    try {
      await deleteService(id);
      setServices(s => s.filter(x => x.id !== id));
      setMsg("Service removed.");
      setTimeout(() => setMsg(""), 3000);
    } catch { setError("Failed to remove service."); }
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl">

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
            <h1 className="text-xl font-black text-white">My Services</h1>
            <p className="text-xs mt-0.5" style={{ color: "#d97706" }}>
              {services.length} listing{services.length !== 1 ? 's' : ''} in the marketplace
            </p>
          </div>
          {!creating && !editing && (
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl text-white border"
              style={{ borderColor: "rgba(255,214,0,0.4)", color: "#FFD600" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Service
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
          {error}
        </div>
      )}
      {msg && (
        <div className="p-3 rounded-xl text-sm flex items-center gap-2"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", color: "#065f46" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {msg}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <h2 className="text-sm font-bold text-slate-800 mb-4">New Service Listing</h2>
          <ServiceForm onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
        </div>
      )}

      {/* Service list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#002395" }} />
        </div>
      ) : services.length === 0 && !creating ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-sm font-semibold mb-1">No services yet</p>
          <p className="text-gray-400 text-xs mb-4">List your cultural skills and connect with people who want to learn.</p>
          <button onClick={() => setCreating(true)}
            className="text-xs font-bold px-5 py-2 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
            List My First Service
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map(svc => (
            <div key={svc.id} className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              {editing?.id === svc.id ? (
                <>
                  <h2 className="text-sm font-bold text-slate-800 mb-4">Edit Service</h2>
                  <ServiceForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} saving={saving} />
                </>
              ) : (
                <div className="flex items-start gap-4">
                  {svc.image_url && (
                    <img src={svc.image_url} alt={svc.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                      onError={e => { e.target.style.display = 'none'; }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-slate-800">{svc.title}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: svc.status === 'active' ? '#dcfce7' : '#f3f4f6', color: svc.status === 'active' ? '#15803d' : '#6b7280' }}>
                        {svc.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{svc.category}</span>
                    </div>
                    {svc.description && <p className="text-xs text-gray-500 line-clamp-2">{svc.description}</p>}
                    {svc.price_range && <p className="text-xs text-green-700 font-medium mt-1">{svc.price_range}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditing(svc)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(svc.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-100">
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;
