import { useState, useEffect, useCallback } from "react";
import { getAdminTourismSites, createTourismSite, updateTourismSite, deleteTourismSite } from "../../api/admin.api";
import PlaceAutocomplete from "../../components/common/PlaceAutocomplete";
import MediaInput from "../../components/common/MediaInput";

const CATEGORIES = [
  { val: "heritage_site",    label: "Heritage Site" },
  { val: "lodge",            label: "Lodge" },
  { val: "cultural_village", label: "Cultural Village" },
  { val: "nature_reserve",   label: "Nature Reserve" },
  { val: "restaurant",       label: "Restaurant" },
  { val: "other",            label: "Other" },
];

const CAT_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.val, c.label]));

const INTERESTS = [
  { val: "ceremonies", label: "Ceremonies" },
  { val: "lineage",    label: "Royal Lineage" },
  { val: "music",      label: "Music & Songs" },
  { val: "attire",     label: "Traditional Attire" },
  { val: "royal",      label: "Royal Culture" },
  { val: "spiritual",  label: "Spiritual Practices" },
];

const EMPTY_FORM = {
  name: "", description: "", category: "heritage_site", interest_tags: [],
  price_range: "", image_url: "", location_name: "", latitude: "", longitude: "",
  contact: "", website: "", status: "active",
};

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
const FTextarea = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    <textarea rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none
      focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" {...props} />
  </div>
);

const Modal = ({ title, subtitle, onClose, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
    style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
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
      <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  </div>
);

const Spin = () => <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />;

const TourismManagement = () => {
  const [sites,    setSites]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [modal,    setModal]    = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErr,  setFormErr]  = useState("");
  const [saving,   setSaving]   = useState(false);

  const fetchSites = useCallback(() => {
    setLoading(true); setError("");
    getAdminTourismSites()
      .then(setSites)
      .catch(() => setError("Failed to load sites."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSites(); }, [fetchSites]);

  const setField = f => e => setFormData(d => ({ ...d, [f]: e.target.value }));
  const toggleTag = val => setFormData(d => ({
    ...d,
    interest_tags: d.interest_tags.includes(val)
      ? d.interest_tags.filter(t => t !== val)
      : [...d.interest_tags, val],
  }));

  const handleSave = async () => {
    if (!formData.name.trim()) { setFormErr("Name is required."); return; }
    setFormErr(""); setSaving(true);
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude === "" ? null : Number(formData.latitude),
        longitude: formData.longitude === "" ? null : Number(formData.longitude),
      };
      if (modal.type === "create") await createTourismSite(payload);
      else await updateTourismSite(modal.site.id, payload);
      setModal(null); fetchSites();
    } catch (err) { setFormErr(err.response?.data?.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (site) => {
    if (!window.confirm(`Remove "${site.name}"?`)) return;
    try { await deleteTourismSite(site.id); setSites(s => s.filter(x => x.id !== site.id)); }
    catch { setError("Failed to remove site."); }
  };

  const openCreate = () => { setFormData(EMPTY_FORM); setFormErr(""); setModal({ type: "create" }); };
  const openEdit = (site) => {
    setFormData({
      name: site.name, description: site.description || "", category: site.category,
      interest_tags: Array.isArray(site.interest_tags) ? site.interest_tags : JSON.parse(site.interest_tags || "[]"),
      price_range: site.price_range || "", image_url: site.image_url || "",
      location_name: site.location_name || "", latitude: site.latitude ?? "", longitude: site.longitude ?? "",
      contact: site.contact || "", website: site.website || "", status: site.status,
    });
    setFormErr(""); setModal({ type: "edit", site });
  };

  return (
    <div className="p-6 space-y-5">

      <div className="relative rounded-2xl overflow-hidden px-6 py-5 flex items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", boxShadow: "0 4px 20px rgba(15,23,42,0.2)" }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 3 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#002395" }} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Tourism Management</h1>
          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
            {sites.length} site{sites.length !== 1 ? "s" : ""} · heritage sites, lodges & cultural villages
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-50 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-500">No tourist sites yet. Add the first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map(site => (
            <div key={site.id} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-0.5" style={{ background: site.status === "active" ? "#10b981" : "#94a3b8" }} />
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-slate-800 text-sm">{site.name}</p>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: "rgba(0,35,149,0.08)", color: "#002395" }}>
                      {CAT_LABEL[site.category] || site.category}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: site.status === "active" ? "#dcfce7" : "#f1f5f9", color: site.status === "active" ? "#15803d" : "#64748b" }}>
                      {site.status}
                    </span>
                  </div>
                  {site.description && <p className="text-xs text-slate-500 line-clamp-2">{site.description}</p>}
                  {site.location_name && <p className="text-xs text-slate-400 mt-1">{site.location_name}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(site)}
                    className="text-xs px-3 py-1.5 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(site)}
                    className="text-xs px-3 py-1.5 rounded-xl font-semibold text-red-600 hover:bg-red-50 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.type === "create" ? "Add Tourist Site" : "Edit Site"}
          subtitle={modal.type === "edit" ? modal.site.name : ""}
          onClose={() => setModal(null)}
          footer={<>
            <button onClick={() => setModal(null)} disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
              {saving && <Spin />}
              {saving ? "Saving…" : "Save"}
            </button>
          </>}>
          {formErr && <p className="text-xs text-red-600">{formErr}</p>}
          <FInput label="Name" required value={formData.name} onChange={setField("name")} placeholder="e.g. Mantenga Cultural Village" />
          <FTextarea label="Description" value={formData.description} onChange={setField("description")} placeholder="What makes this worth visiting?" />
          <div className="grid grid-cols-2 gap-3">
            <FSelect label="Category" value={formData.category} onChange={setField("category")}>
              {CATEGORIES.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
            </FSelect>
            <FInput label="Price range" value={formData.price_range} onChange={setField("price_range")} placeholder="e.g. E100–E200" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Related interests (powers recommendations)</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(({ val, label }) => {
                const active = formData.interest_tags.includes(val);
                return (
                  <button key={val} type="button" onClick={() => toggleTag(val)}
                    className="text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all"
                    style={active
                      ? { background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#FFD600", borderColor: "#FFD600" }
                      : { background: "#fff", color: "#6b7280", borderColor: "#e2e8f0" }}>
                    {active && "✓ "}{label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Photo (optional)</p>
            <MediaInput value={formData.image_url} onChange={url => setFormData(f => ({ ...f, image_url: url }))}
              accept="image/*" type="image" placeholder="https://... or upload" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Location</p>
            <PlaceAutocomplete
              value={formData.location_name}
              onChange={(val) => setFormData(f => ({ ...f, location_name: val }))}
              onSelect={({ name, lat, lon }) => setFormData(f => ({ ...f, location_name: name, latitude: lat, longitude: lon }))}
              placeholder="e.g. Ezulwini Valley"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FInput label="Latitude" type="number" step="any" value={formData.latitude} onChange={setField("latitude")} placeholder="-26.4477" />
            <FInput label="Longitude" type="number" step="any" value={formData.longitude} onChange={setField("longitude")} placeholder="31.2019" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FInput label="Contact" value={formData.contact} onChange={setField("contact")} placeholder="Phone or email" />
            <FInput label="Website" type="url" value={formData.website} onChange={setField("website")} placeholder="https://..." />
          </div>
          {modal.type === "edit" && (
            <FSelect label="Status" value={formData.status} onChange={setField("status")}>
              <option value="active">Active (visible to users)</option>
              <option value="inactive">Inactive (hidden)</option>
            </FSelect>
          )}
        </Modal>
      )}
    </div>
  );
};

export default TourismManagement;
