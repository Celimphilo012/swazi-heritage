import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSeminar, createSeminar, updateSeminar } from "../../../api/seminars.api";
import PlaceAutocomplete from "../../../components/common/PlaceAutocomplete";

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

// MySQL DATETIME ("YYYY-MM-DD HH:mm:ss") / ISO → value for <input type="datetime-local">
const toLocalInputValue = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const SeminarFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    description: "",
    format: "online",
    meeting_url: "",
    location_name: "",
    latitude: "",
    longitude: "",
    scheduled_at: "",
    duration_minutes: 60,
    capacity: "",
  });

  const [fetching, setFetching] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    getSeminar(id)
      .then((s) => {
        setForm({
          title: s.title,
          description: s.description || "",
          format: s.format,
          meeting_url: s.meeting_url || "",
          location_name: s.location_name || "",
          latitude: s.latitude ?? "",
          longitude: s.longitude ?? "",
          scheduled_at: toLocalInputValue(s.scheduled_at),
          duration_minutes: s.duration_minutes || 60,
          capacity: s.capacity ?? "",
        });
      })
      .catch(() => setError("Could not load this seminar."))
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
        capacity: form.capacity === "" ? null : Number(form.capacity),
        duration_minutes: Number(form.duration_minutes) || 60,
      };
      if (isEdit) await updateSeminar(id, payload);
      else await createSeminar(payload);

      setSuccess(isEdit ? "Seminar updated. Attendees have been notified." : "Seminar scheduled successfully.");
      setTimeout(() => navigate("/practitioner/seminars"), 1800);
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
          <p className="text-sm text-gray-500">Loading seminar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/practitioner/seminars" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to seminars
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">{isEdit ? "Edit Seminar" : "Schedule a Seminar"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? "Attendees will be notified if the date, time, or format changes." : "Set up an online or in-person cultural workshop for users to book."}
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
          <SectionHeader title="Seminar details" />
          <div className="space-y-4">
            <div>
              <Label required>Title</Label>
              <Input value={form.title} onChange={setField("title")} placeholder="e.g. Introduction to Traditional Beadwork" required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={setField("description")}
                placeholder="What will attendees learn? Who is this for?" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>Date & time</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={setField("scheduled_at")} required />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input type="number" min="15" step="15" value={form.duration_minutes} onChange={setField("duration_minutes")} />
              </div>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" min="1" value={form.capacity} onChange={setField("capacity")} placeholder="Leave blank for unlimited" />
            </div>
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Format" subtitle="Choose how attendees will join." />
          <div className="flex gap-3 mb-4">
            {["online", "physical"].map((fmt) => (
              <button key={fmt} type="button"
                onClick={() => setForm((f) => ({ ...f, format: fmt }))}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  form.format === fmt ? "border-red-600 bg-red-50 text-red-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}>
                {fmt === "online" ? "Online" : "In person"}
              </button>
            ))}
          </div>

          {form.format === "online" ? (
            <div>
              <Label required>Meeting link</Label>
              <Input type="url" value={form.meeting_url} onChange={setField("meeting_url")}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..." required />
              <p className="text-xs text-gray-400 mt-1">Shared with attendees once they book.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Place name</Label>
                <PlaceAutocomplete
                  value={form.location_name}
                  onChange={(val) => setForm((f) => ({ ...f, location_name: val }))}
                  onSelect={({ name, lat, lon }) => setForm((f) => ({ ...f, location_name: name, latitude: lat, longitude: lon }))}
                  placeholder="e.g. Ezulwini Cultural Village"
                />
                <p className="text-xs text-gray-400 mt-1">Start typing to get location suggestions.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input type="number" step="any" value={form.latitude} onChange={setField("latitude")} placeholder="-26.4661" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input type="number" step="any" value={form.longitude} onChange={setField("longitude")} placeholder="31.2026" />
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
          )}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2 min-w-[160px] justify-center">
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : isEdit ? "Save changes" : "Schedule seminar"}
          </button>
          <Link to="/practitioner/seminars" className="text-sm text-gray-500 hover:text-gray-800">Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default SeminarFormPage;
