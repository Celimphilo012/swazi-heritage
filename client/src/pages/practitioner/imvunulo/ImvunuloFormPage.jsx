import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getImvunuloListing, createImvunuloListing, updateImvunuloListing } from "../../../api/imvunulo.api";
import PlaceAutocomplete from "../../../components/common/PlaceAutocomplete";
import MediaInput from "../../../components/common/MediaInput";

const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}{required && <span className="text-red-600 ml-0.5">*</span>}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
    {...props}
  />
);

const Textarea = ({ className = "", rows = 3, ...props }) => (
  <textarea
    rows={rows}
    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
                disabled:bg-gray-50 resize-none ${className}`}
    {...props}
  />
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

const LISTING_TYPES = [
  { value: "sale",   label: "For sale" },
  { value: "rental", label: "For rental" },
  { value: "both",   label: "Sale or rental" },
];

const GENDERS = [
  { value: "unisex", label: "Unisex" },
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
];

const EMPTY = {
  title: "", description: "", listing_type: "sale", gender: "unisex",
  price: "", price_unit: "", image_url: "",
  location_name: "", latitude: "", longitude: "", contact: "", status: "active",
};

const ImvunuloFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [fetching, setFetching] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    getImvunuloListing(id)
      .then((l) => {
        setForm({
          title: l.title,
          description: l.description || "",
          listing_type: l.listing_type,
          gender: l.gender,
          price: l.price ?? "",
          price_unit: l.price_unit || "",
          image_url: l.image_url || "",
          location_name: l.location_name || "",
          latitude: l.latitude ?? "",
          longitude: l.longitude ?? "",
          contact: l.contact || "",
          status: l.status,
        });
      })
      .catch(() => setError("Could not load this listing."))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price === "" ? null : Number(form.price),
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
      };
      if (isEdit) await updateImvunuloListing(id, payload);
      else await createImvunuloListing(payload);

      setSuccess(isEdit ? "Listing updated." : "Listing created successfully.");
      setTimeout(() => navigate("/practitioner/imvunulo"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading listing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/practitioner/imvunulo" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to my listings
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">{isEdit ? "Edit Listing" : "List Imvunulo"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? "Update details, price, or availability for this listing." : "List traditional attire for rental or sale. Add a location so buyers nearby can find you."}
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success} Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <SectionHeader title="Listing details" />
          <div className="space-y-4">
            <div>
              <Label required>Title</Label>
              <Input value={form.title} onChange={setField("title")} placeholder="e.g. Beaded Emahiya Set" required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={setField("description")}
                placeholder="Describe the item, condition, sizing, what's included…" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>Listing type</Label>
                <select value={form.listing_type} onChange={setField("listing_type")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400">
                  {LISTING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Gender</Label>
                <select value={form.gender} onChange={setField("gender")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400">
                  {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Price (SZL)</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={setField("price")} placeholder="350.00" />
              </div>
              <div>
                <Label>Price unit</Label>
                <Input value={form.price_unit} onChange={setField("price_unit")} placeholder="e.g. per day, once-off" />
              </div>
            </div>
            <div>
              <Label>Listing image (optional)</Label>
              <MediaInput value={form.image_url} onChange={(v) => setForm((f) => ({ ...f, image_url: v }))}
                accept="image/*" type="image" placeholder="https://… or upload" />
            </div>
            <div>
              <Label>Contact / booking info</Label>
              <Input value={form.contact} onChange={setField("contact")} placeholder="WhatsApp, email, or phone number" />
            </div>
            {isEdit && (
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={setField("status")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400">
                  <option value="active">Active (visible to users)</option>
                  <option value="inactive">Inactive (hidden)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Pickup location" subtitle="Optional, but listings with a location show up on the buyer-facing map so nearby buyers can find you." />
          <div className="space-y-4">
            <div>
              <Label>Place name</Label>
              <PlaceAutocomplete
                value={form.location_name}
                onChange={(val) => setForm((f) => ({ ...f, location_name: val }))}
                onSelect={({ name, lat, lon }) => setForm((f) => ({ ...f, location_name: name, latitude: lat, longitude: lon }))}
                placeholder="e.g. Manzini Market"
              />
              <p className="text-xs text-gray-400 mt-1">Start typing to get location suggestions.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Latitude</Label>
                <Input type="number" step="any" value={form.latitude} onChange={setField("latitude")} placeholder="-26.4926" />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input type="number" step="any" value={form.longitude} onChange={setField("longitude")} placeholder="31.3839" />
              </div>
            </div>
            <button type="button"
              onClick={() => {
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition((pos) => {
                  setForm((f) => ({ ...f, latitude: pos.coords.latitude.toFixed(7), longitude: pos.coords.longitude.toFixed(7) }));
                });
              }}
              className="text-xs text-blue-700 hover:underline font-medium">
              Use my current location
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2 min-w-[160px] justify-center">
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : isEdit ? "Save changes" : "Create listing"}
          </button>
          <Link to="/practitioner/imvunulo" className="text-sm text-gray-500 hover:text-gray-800">Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default ImvunuloFormPage;
