import { useState, useEffect, useCallback } from "react";
import {
  getAdminCeremonies,
  reviewCeremony,
  getAdminLineage,
  reviewLineage,
} from "../../api/admin.api";

const STATUS_STYLE = {
  pending_review: "badge-pending",
  published: "badge-published",
  rejected: "badge-rejected",
  draft: "badge-draft",
};
const STATUS_LABEL = {
  pending_review: "Pending Review",
  published: "Published",
  rejected: "Rejected",
  draft: "Draft",
};

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ─── Reject modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ item, onClose, onConfirm, saving }) => {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Reject submission</h2>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{item.name || item.title}</p>
        </div>
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rejection note <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain why this submission is being rejected..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} disabled={saving} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={saving}
            className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium
                       hover:bg-red-800 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="card animate-pulse space-y-3">
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/5" />
        <div className="h-3 bg-gray-100 rounded w-2/3 mt-2" />
      </div>
      <div className="h-6 w-20 bg-gray-100 rounded-full ml-4" />
    </div>
    <div className="flex gap-2 mt-3">
      <div className="h-8 w-20 bg-gray-100 rounded-lg" />
      <div className="h-8 w-20 bg-gray-100 rounded-lg" />
    </div>
  </div>
);

// ─── Content card ─────────────────────────────────────────────────────────────
const ContentCard = ({ item, type, onApprove, onReject, saving }) => (
  <div className="card hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {item.name || item.title}
          </h3>
          <span className={STATUS_STYLE[item.status]}>{STATUS_LABEL[item.status]}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>By {item.creator_name}</span>
          {(item.month_celebrated || item.era) && (
            <>
              <span>·</span>
              <span>{item.month_celebrated || item.era}</span>
            </>
          )}
          <span>·</span>
          <span>{fmt(item.created_at)}</span>
        </div>
        {item.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
        )}
        {item.status === "rejected" && item.rejection_note && (
          <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-700">
            <span className="font-medium">Previous rejection note: </span>
            {item.rejection_note}
          </div>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
      <button
        onClick={() => onApprove(item, type)}
        disabled={saving}
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white
                   hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => onReject(item, type)}
        disabled={saving}
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white
                   hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        Reject
      </button>
      <a
        href={type === "ceremony" ? `/explore/ceremonies/${item.id}` : undefined}
        target="_blank"
        rel="noreferrer"
        className={`ml-auto text-xs text-gray-500 hover:text-gray-700 ${type !== "ceremony" ? "hidden" : ""}`}
      >
        Preview →
      </a>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const ContentReview = () => {
  const [tab, setTab] = useState("ceremonies");
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review modal state
  const [rejectTarget, setRejectTarget] = useState(null); // {item, type}
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(() => {
    setLoading(true);
    setError("");
    const params = { status: statusFilter || undefined, page, limit: 15 };
    const call =
      tab === "ceremonies"
        ? getAdminCeremonies(params)
        : getAdminLineage(params);
    call
      .then(({ data, meta: m }) => {
        setItems(data);
        setMeta(m);
      })
      .catch(() => setError("Failed to load items."))
      .finally(() => setLoading(false));
  }, [tab, statusFilter, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleApprove = async (item, type) => {
    setSaving(true);
    try {
      if (type === "ceremony") {
        await reviewCeremony(item.id, { status: "published" });
      } else {
        await reviewLineage(item.id, { status: "published" });
      }
      fetchItems();
    } catch {
      setError("Failed to approve. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRejectConfirm = async (note) => {
    if (!rejectTarget) return;
    setSaving(true);
    try {
      const payload = { status: "rejected", rejection_note: note || undefined };
      if (rejectTarget.type === "ceremony") {
        await reviewCeremony(rejectTarget.item.id, payload);
      } else {
        await reviewLineage(rejectTarget.item.id, payload);
      }
      setRejectTarget(null);
      fetchItems();
    } catch {
      setError("Failed to reject. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const switchTab = (t) => {
    setTab(t);
    setPage(1);
    setItems([]);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Content Review</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Review and approve practitioner submissions
        </p>
      </div>

      {/* Tabs + filter row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { key: "ceremonies", label: "Ceremonies" },
            { key: "lineage", label: "Lineage Records" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key
                  ? "border-red-700 text-red-800"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          <option value="pending_review">Pending Review</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
          <option value="">All statuses</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-medium text-gray-500">No submissions found</p>
          <p className="text-xs text-gray-400 mt-1">
            {statusFilter === "pending_review"
              ? "All submissions have been reviewed."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              type={tab === "ceremonies" ? "ceremony" : "lineage"}
              onApprove={handleApprove}
              onReject={(item, type) => setRejectTarget({ item, type })}
              saving={saving}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {meta.page} of {meta.totalPages} — {meta.total} items
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          item={rejectTarget.item}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          saving={saving}
        />
      )}
    </div>
  );
};

export default ContentReview;
