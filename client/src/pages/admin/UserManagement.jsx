import { useState, useEffect, useCallback } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} from "../../api/admin.api";
import { useAuth } from "../../context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = [
  { value: "user", label: "Regular User" },
  { value: "history_keeper", label: "History Keeper" },
  { value: "ceremony_keeper", label: "Ceremony Keeper" },
  { value: "admin", label: "Admin" },
];

const ROLE_STYLE = {
  admin: "bg-purple-100 text-purple-800",
  user: "bg-gray-100 text-gray-700",
  history_keeper: "bg-amber-100 text-amber-800",
  ceremony_keeper: "bg-orange-100 text-orange-800",
};

const ROLE_LABEL = {
  admin: "Admin",
  user: "Regular User",
  history_keeper: "History Keeper",
  ceremony_keeper: "Ceremony Keeper",
};

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "user",
  status: "active",
};

// ─── Small reusable bits ──────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}
    {required && <span className="text-red-600 ml-0.5">*</span>}
  </label>
);

const Field = ({ label, required, children }) => (
  <div>
    <Label required={required}>{label}</Label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400
               disabled:bg-gray-50"
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

// ─── Avatar initials ──────────────────────────────────────────────────────────
const Avatar = ({ name, role }) => {
  const colors = {
    admin: "bg-purple-100 text-purple-700",
    history_keeper: "bg-amber-100 text-amber-700",
    ceremony_keeper: "bg-orange-100 text-orange-700",
    user: "bg-gray-100 text-gray-600",
  };
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${colors[role] || colors.user}`}
    >
      {initials}
    </div>
  );
};

// ─── Modal wrapper ────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, footer }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
    <div
      className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
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

// ─── Loading skeleton row ─────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-200 rounded-full" />
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-28" />
          <div className="h-2.5 bg-gray-100 rounded w-36" />
        </div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="h-5 bg-gray-100 rounded-full w-24" />
    </td>
    <td className="px-4 py-3">
      <div className="h-5 bg-gray-100 rounded-full w-16" />
    </td>
    <td className="px-4 py-3">
      <div className="h-3 bg-gray-100 rounded w-20" />
    </td>
    <td className="px-4 py-3">
      <div className="h-7 bg-gray-100 rounded-lg w-20" />
    </td>
  </tr>
);

// ─── Main component ───────────────────────────────────────────────────────────
const UserManagement = () => {
  const { user: currentAdmin } = useAuth();

  // List state
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modal state: null | { type: 'create' | 'edit' | 'delete', user? }
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch users whenever filters or page change
  const fetchUsers = useCallback(() => {
    setLoading(true);
    setListError("");
    getUsers({
      search: debouncedSearch || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      page,
      limit: 15,
    })
      .then(({ data, meta: m }) => {
        setUsers(data);
        setMeta(m);
      })
      .catch(() => setListError("Failed to load users. Please refresh."))
      .finally(() => setLoading(false));
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setFormError("");
    setModal({ type: "create" });
  };

  const openEdit = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    setFormError("");
    setModal({ type: "edit", user });
  };

  const openDelete = (user) => {
    setModal({ type: "delete", user });
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setFormError("");
  };

  const setField = (field) => (e) =>
    setFormData((f) => ({ ...f, [field]: e.target.value }));

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setFormError("");
    setSaving(true);
    try {
      await createUser(formData);
      closeModal();
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };
      await updateUser(modal.user.id, payload);
      closeModal();
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteUser(modal.user.id);
      closeModal();
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const next = user.status === "active" ? "suspended" : "active";
    try {
      await updateUserStatus(user.id, next);
      fetchUsers();
    } catch {
      // keep UI unchanged on failure
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            User Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.total} total user{meta.total !== 1 ? "s" : ""} on the platform
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-1.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add user
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-200 min-w-40"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-200 min-w-36"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Error */}
      {listError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {listError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-16 text-gray-400 text-sm"
                >
                  {debouncedSearch || roleFilter || statusFilter
                    ? "No users match your filters."
                    : "No users yet. Add the first one."}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Name + email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} role={user.role} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {user.name}
                          {user.id === currentAdmin?.id && (
                            <span className="ml-1.5 text-xs text-gray-400 font-normal">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_STYLE[user.role]}`}
                    >
                      {ROLE_LABEL[user.role]}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-red-500"}`}
                      />
                      {user.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Suspend / Activate */}
                      {user.id !== currentAdmin?.id && (
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                            user.status === "active"
                              ? "text-amber-700 hover:bg-amber-50"
                              : "text-green-700 hover:bg-green-50"
                          }`}
                          title={
                            user.status === "active"
                              ? "Suspend user"
                              : "Activate user"
                          }
                        >
                          {user.status === "active" ? "Suspend" : "Activate"}
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => openEdit(user)}
                        className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Edit
                      </button>

                      {/* Delete */}
                      {user.id !== currentAdmin?.id && (
                        <button
                          onClick={() => openDelete(user)}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {meta.page} of {meta.totalPages} — {meta.total} users
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

      {/* ── CREATE MODAL ─────────────────────────────────────────────────────── */}
      {modal?.type === "create" && (
        <Modal
          title="Add new user"
          onClose={closeModal}
          footer={
            <>
              <button
                onClick={closeModal}
                disabled={saving}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {saving ? "Creating..." : "Create user"}
              </button>
            </>
          }
        >
          {formError && (
            <p className="text-sm text-red-700 p-3 bg-red-50 rounded-lg">
              {formError}
            </p>
          )}
          <Field label="Full name" required>
            <Input
              value={formData.name}
              onChange={setField("name")}
              placeholder="e.g. Nkosi Dlamini"
              required
            />
          </Field>
          <Field label="Email address" required>
            <Input
              type="email"
              value={formData.email}
              onChange={setField("email")}
              placeholder="user@example.com"
              required
            />
          </Field>
          <Field label="Password" required>
            <Input
              type="password"
              value={formData.password}
              onChange={setField("password")}
              placeholder="Minimum 8 characters"
              required
            />
          </Field>
          <Field label="Role" required>
            <Select value={formData.role} onChange={setField("role")}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
        </Modal>
      )}

      {/* ── EDIT MODAL ───────────────────────────────────────────────────────── */}
      {modal?.type === "edit" && (
        <Modal
          title={`Edit — ${modal.user.name}`}
          onClose={closeModal}
          footer={
            <>
              <button
                onClick={closeModal}
                disabled={saving}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {saving ? "Saving..." : "Save changes"}
              </button>
            </>
          }
        >
          {formError && (
            <p className="text-sm text-red-700 p-3 bg-red-50 rounded-lg">
              {formError}
            </p>
          )}
          <Field label="Full name" required>
            <Input value={formData.name} onChange={setField("name")} required />
          </Field>
          <Field label="Email address" required>
            <Input
              type="email"
              value={formData.email}
              onChange={setField("email")}
              required
            />
          </Field>
          <Field label="Role" required>
            <Select value={formData.role} onChange={setField("role")}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Account status" required>
            <Select value={formData.status} onChange={setField("status")}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
          </Field>
          <p className="text-xs text-gray-400">
            To reset the user's password, ask them to use the forgot-password
            flow, or create a new account.
          </p>
        </Modal>
      )}

      {/* ── DELETE CONFIRM ────────────────────────────────────────────────────── */}
      {modal?.type === "delete" && (
        <Modal
          title="Delete user"
          onClose={closeModal}
          footer={
            <>
              <button
                onClick={closeModal}
                disabled={saving}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium
                           hover:bg-red-800 transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {saving && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {saving ? "Deleting..." : "Yes, delete"}
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Delete <span className="font-semibold">{modal.user.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This will permanently remove their account and all associated
                data. This action cannot be undone.
              </p>
            </div>
          </div>
          {formError && (
            <p className="text-sm text-red-700 p-3 bg-red-50 rounded-lg mt-2">
              {formError}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
