import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMyPublications, createPublication, updatePublication } from "../../../api/publications.api";
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

const TYPES = [
  { value: "article", label: "Article" },
  { value: "book",    label: "Book" },
  { value: "paper",   label: "Research Paper" },
  { value: "thesis",  label: "Thesis" },
  { value: "other",   label: "Other" },
];

const EMPTY = {
  title: "", authors: "", abstract: "", publication_type: "article",
  publication_year: "", keywords: "", file_url: "",
};

const PublicationFormPage = () => {
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
    // No single-fetch-by-id endpoint for the owner's own (possibly unpublished) work,
    // since GET /publications/:id only serves published records — reuse the mine list.
    getMyPublications()
      .then((rows) => {
        const p = rows.find((r) => String(r.id) === String(id));
        if (!p) throw new Error();
        setForm({
          title: p.title,
          authors: p.authors || "",
          abstract: p.abstract || "",
          publication_type: p.publication_type,
          publication_year: p.publication_year ?? "",
          keywords: p.keywords || "",
          file_url: p.file_url || "",
        });
      })
      .catch(() => setError("Could not load this publication."))
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
        publication_year: form.publication_year === "" ? null : Number(form.publication_year),
      };
      if (isEdit) await updatePublication(id, payload);
      else await createPublication(payload);

      setSuccess(isEdit ? "Publication updated and resubmitted for review." : "Publication submitted for review.");
      setTimeout(() => navigate("/practitioner/library"), 1800);
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
          <p className="text-sm text-gray-500">Loading publication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/practitioner/library" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to my publications
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">{isEdit ? "Edit Publication" : "Submit a Publication"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? "Changes will be resubmitted for admin review." : "Share research, articles, or books on Swazi history and culture with the Library."}
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
          <SectionHeader title="Publication details" />
          <div className="space-y-4">
            <div>
              <Label required>Title</Label>
              <Input value={form.title} onChange={setField("title")} placeholder="e.g. The Reed Dance Ceremony: Origins and Evolution" required />
            </div>
            <div>
              <Label>Authors</Label>
              <Input value={form.authors} onChange={setField("authors")} placeholder="e.g. N. Dlamini, T. Mabuza" />
            </div>
            <div>
              <Label>Abstract</Label>
              <Textarea rows={5} value={form.abstract} onChange={setField("abstract")}
                placeholder="A brief summary of the publication's content and findings…" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>Type</Label>
                <select value={form.publication_type} onChange={setField("publication_type")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400">
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Year</Label>
                <Input type="number" min="1800" max="2100" value={form.publication_year} onChange={setField("publication_year")} placeholder="2024" />
              </div>
            </div>
            <div>
              <Label>Keywords</Label>
              <Input value={form.keywords} onChange={setField("keywords")} placeholder="Comma-separated, e.g. umhlanga, reed dance, royal culture" />
              <p className="text-xs text-gray-400 mt-1">Improves search relevance in the Library.</p>
            </div>
            <div>
              <Label>Full text (optional)</Label>
              <MediaInput value={form.file_url} onChange={(v) => setForm((f) => ({ ...f, file_url: v }))}
                accept="application/pdf,.pdf" type="document" placeholder="https://... or upload a PDF" />
            </div>
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
            ) : isEdit ? "Save changes" : "Submit for review"}
          </button>
          <Link to="/practitioner/library" className="text-sm text-gray-500 hover:text-gray-800">Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default PublicationFormPage;
