import { useState, useEffect, useCallback } from "react";
import { getAdminCinema, createCinema, updateCinema } from "../../api/admin.api";

const STATUS_STYLE = {
  scheduled: "bg-blue-100 text-blue-800",
  live: "bg-green-100 text-green-800",
  ended: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

const EMPTY_FORM = {
  title: "", description: "", type: "live", stream_url: "", scheduled_at: "", status: "scheduled",
};

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
const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}{required && <span className="text-red-600 ml-0.5">*</span>}
  </label>
);

const Modal = ({ title, onClose, children, footer }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  </div>
);

const CinemaManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | { type: 'create' | 'edit', session? }
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSessions = useCallback(() => {
    setLoading(true);
    setError("");
    getAdminCinema({ status: statusFilter || undefined, page, limit: 15 })
      .then(({ data, meta: m }) => { setSessions(data); setMeta(m); })
      .catch(() => setError("Failed to load sessions."))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setFormError("");
    setModal({ type: "create" });
  };

  const openEdit = (s) => {
    setFormData({
      title: s.title,
      description: s.description || "",
      type: s.type,
      stream_url: s.stream_url,
      scheduled_at: s.scheduled_at ? s.scheduled_at.slice(0, 16) : "",
      status: s.status,
    });
    setFormError("");
    setModal({ type: "edit", session: s });
  };

  const setField = (f) => (e) => setFormData((d) => ({ ...d, [f]: e.target.value }));

  const handleSave = async () => {
    setFormError("");
    setSaving(true);
    try {
      if (modal.type === "create") {
        await createCinema(formData);
      } else {
        await updateCinema(modal.session.id, formData);
      }
      setModal(null);
      fetchSessions();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save session.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (session, status) => {
    try {
      await updateCinema(session.id, { ...session, status });
      fetchSessions();
    } catch {
      setError("Failed to update status.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cinema Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage cultural cinema sessions</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add session
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200">
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="h-6 w-20 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">No cinema sessions. Add the first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{s.title}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[s.status]}`}>
                    {s.status}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{s.type}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Scheduled: {fmt(s.scheduled_at)}</p>
                {s.booking_count !== undefined && (
                  <p className="text-xs text-gray-400 mt-0.5">{s.booking_count} booking{s.booking_count !== 1 ? "s" : ""}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.status === "scheduled" && (
                  <button onClick={() => handleStatusChange(s, "live")}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-green-700 hover:bg-green-50 transition-colors">
                    Go Live
                  </button>
                )}
                {s.status === "live" && (
                  <button onClick={() => handleStatusChange(s, "ended")}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                    End
                  </button>
                )}
                {["scheduled", "live"].includes(s.status) && (
                  <button onClick={() => handleStatusChange(s, "cancelled")}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors">
                    Cancel
                  </button>
                )}
                <button onClick={() => openEdit(s)}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.type === "create" ? "Add cinema session" : `Edit — ${modal.session.title}`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button onClick={() => setModal(null)} disabled={saving} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? "Saving..." : modal.type === "create" ? "Create" : "Save"}
              </button>
            </>
          }
        >
          {formError && <p className="p-3 bg-red-50 rounded-lg text-sm text-red-700">{formError}</p>}
          <div>
            <Label required>Title</Label>
            <Input value={formData.title} onChange={setField("title")} placeholder="e.g. Incwala Ceremony Screening" />
          </div>
          <div>
            <Label>Description</Label>
            <textarea rows={3} value={formData.description} onChange={setField("description")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Type</Label>
              <Select value={formData.type} onChange={setField("type")}>
                <option value="live">Live</option>
                <option value="recorded">Recorded</option>
              </Select>
            </div>
            <div>
              <Label required>Status</Label>
              <Select value={formData.status} onChange={setField("status")}>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
          <div>
            <Label required>Stream / Video URL</Label>
            <Input type="url" value={formData.stream_url} onChange={setField("stream_url")}
              placeholder={formData.type === "recorded" ? "https://youtube.com/watch?v=... or direct file URL" : "https://..."} />
            {formData.type === "recorded" && (
              <p className="text-xs text-gray-400 mt-1">YouTube watch links are automatically converted to embed format.</p>
            )}
          </div>
          {formData.type === "live" && (
            <div>
              <Label>Scheduled at</Label>
              <Input type="datetime-local" value={formData.scheduled_at} onChange={setField("scheduled_at")} />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default CinemaManagement;
