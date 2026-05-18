import { useState, useEffect, useCallback } from "react";
import { getUsers, createUser, updateUser, updateUserStatus, deleteUser } from "../../api/admin.api";
import { useAuth } from "../../context/AuthContext";

const ROLES = [
  { value: "user",            label: "Regular User"    },
  { value: "history_keeper",  label: "History Keeper"  },
  { value: "ceremony_keeper", label: "Ceremony Keeper" },
  { value: "admin",           label: "Admin"           },
];

const ROLE_CFG = {
  admin:           { label: "Admin",           color: "#7c3aed", bg: "rgba(124,58,237,0.1)"  },
  user:            { label: "User",            color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  history_keeper:  { label: "Historian",       color: "#d97706", bg: "rgba(217,119,6,0.1)"   },
  ceremony_keeper: { label: "Ceremony",        color: "#ea580c", bg: "rgba(234,88,12,0.1)"   },
};

const EMPTY_FORM = { name: "", email: "", password: "", role: "user", status: "active" };

/* ── Shared form primitives ── */
const FInput = ({ label, required, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
      focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
      disabled:bg-slate-50 transition-shadow" {...props} />
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

/* ── Avatar ── */
const Avatar = ({ name, role }) => {
  const cfg = ROLE_CFG[role] || ROLE_CFG.user;
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: cfg.bg, color: cfg.color }}>
      {initials}
    </div>
  );
};

/* ── Modal ── */
const Modal = ({ title, subtitle, onClose, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
    style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
      <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 ml-4 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  </div>
);

/* ── Skeleton row ── */
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-100 rounded-xl" />
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-100 rounded w-28" />
          <div className="h-2.5 bg-slate-50 rounded w-36" />
        </div>
      </div>
    </td>
    {[1,2,3,4].map(i => (
      <td key={i} className="px-5 py-3.5"><div className="h-5 bg-slate-100 rounded-full w-20" /></td>
    ))}
  </tr>
);

/* ── Btn helpers ── */
const BtnPrimary = ({ children, ...p }) => (
  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
    transition-all hover:opacity-90 disabled:opacity-50"
    style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }} {...p}>
    {children}
  </button>
);
const BtnSecondary = ({ children, ...p }) => (
  <button className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200
    hover:bg-slate-50 transition-colors disabled:opacity-50" {...p}>
    {children}
  </button>
);
const BtnDanger = ({ children, ...p }) => (
  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
    transition-all hover:opacity-90 disabled:opacity-50"
    style={{ background: "#CE1126" }} {...p}>
    {children}
  </button>
);

/* ── Spinner ── */
const Spin = () => <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />;

/* ── Page ── */
const UserManagement = () => {
  const { user: currentAdmin } = useAuth();
  const [users,    setUsers]   = useState([]);
  const [meta,     setMeta]    = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,  setLoading] = useState(true);
  const [listErr,  setListErr] = useState("");
  const [search,   setSearch]  = useState("");
  const [debSearch,setDeb]     = useState("");
  const [roleFilt, setRoleFilt]= useState("");
  const [staFilt,  setStaFilt] = useState("");
  const [page,     setPage]    = useState(1);
  const [modal,    setModal]   = useState(null);
  const [formData, setFormData]= useState(EMPTY_FORM);
  const [formErr,  setFormErr] = useState("");
  const [saving,   setSaving]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDeb(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(() => {
    setLoading(true); setListErr("");
    getUsers({ search: debSearch||undefined, role: roleFilt||undefined, status: staFilt||undefined, page, limit: 15 })
      .then(({ data, meta: m }) => { setUsers(data); setMeta(m); })
      .catch(() => setListErr("Failed to load users."))
      .finally(() => setLoading(false));
  }, [debSearch, roleFilt, staFilt, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const setField = f => e => setFormData(d => ({ ...d, [f]: e.target.value }));
  const closeModal = () => { if (saving) return; setModal(null); setFormErr(""); };

  const handleCreate = async () => {
    setFormErr(""); setSaving(true);
    try { await createUser(formData); closeModal(); fetchUsers(); }
    catch (err) { setFormErr(err.response?.data?.message || "Failed to create user."); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setFormErr(""); setSaving(true);
    try {
      await updateUser(modal.user.id, { name: formData.name, email: formData.email, role: formData.role, status: formData.status });
      closeModal(); fetchUsers();
    } catch (err) { setFormErr(err.response?.data?.message || "Failed to update user."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await deleteUser(modal.user.id); closeModal(); fetchUsers(); }
    catch (err) { setFormErr(err.response?.data?.message || "Failed to delete user."); }
    finally { setSaving(false); }
  };

  const handleToggleStatus = async (user) => {
    try { await updateUserStatus(user.id, user.status === "active" ? "suspended" : "active"); fetchUsers(); } catch {}
  };

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
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
          <h1 className="text-xl font-black text-white">User Management</h1>
          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
            {meta.total} member{meta.total !== 1 ? "s" : ""} on the platform
          </p>
        </div>
        <BtnPrimary onClick={() => { setFormData(EMPTY_FORM); setFormErr(""); setModal({ type: "create" }); }}
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </BtnPrimary>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search name or email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
        </div>
        {[
          { value: roleFilt, onChange: e => { setRoleFilt(e.target.value); setPage(1); },
            options: [["","All roles"], ...ROLES.map(r=>[r.value,r.label])] },
          { value: staFilt, onChange: e => { setStaFilt(e.target.value); setPage(1); },
            options: [["","All statuses"],["active","Active"],["suspended","Suspended"]] },
        ].map((s, i) => (
          <select key={i} value={s.value} onChange={s.onChange}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-36">
            {s.options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {listErr && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{listErr}</div>}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
              {["User","Role","Status","Joined",""].map((h, i) => (
                <th key={i} className={`px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider ${i > 0 ? "text-left" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-16 text-slate-400 text-sm">
                {debSearch || roleFilt || staFilt ? "No users match your filters." : "No users yet."}
              </td></tr>
            ) : users.map(user => {
              const cfg = ROLE_CFG[user.role] || ROLE_CFG.user;
              return (
                <tr key={user.id} className="transition-colors hover:bg-slate-50"
                  style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} role={user.role} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {user.name}
                          {user.id === currentAdmin?.id && (
                            <span className="ml-1.5 text-xs text-slate-400 font-normal">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={user.status === "active"
                        ? { background: "rgba(16,185,129,0.1)", color: "#10b981" }
                        : { background: "rgba(206,17,38,0.1)", color: "#CE1126" }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: user.status === "active" ? "#10b981" : "#CE1126" }} />
                      {user.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {new Date(user.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {user.id !== currentAdmin?.id && (
                        <button onClick={() => handleToggleStatus(user)}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                          style={user.status === "active"
                            ? { color: "#d97706", background: "transparent" }
                            : { color: "#10b981", background: "transparent" }}
                          onMouseOver={e => e.currentTarget.style.background = user.status==="active" ? "rgba(217,119,6,0.08)" : "rgba(16,185,129,0.08)"}
                          onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          {user.status === "active" ? "Suspend" : "Activate"}
                        </button>
                      )}
                      <button onClick={() => { setFormData({ name:user.name, email:user.email, password:"", role:user.role, status:user.status }); setFormErr(""); setModal({ type:"edit", user }); }}
                        className="text-xs px-2.5 py-1.5 rounded-lg font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
                        Edit
                      </button>
                      {user.id !== currentAdmin?.id && (
                        <button onClick={() => setModal({ type:"delete", user })}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                          style={{ color: "#CE1126" }}
                          onMouseOver={e => e.currentTarget.style.background = "rgba(206,17,38,0.08)"}
                          onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Page {meta.page} of {meta.totalPages} — {meta.total} users</p>
          <div className="flex gap-2">
            <BtnSecondary onClick={() => setPage(p=>p-1)} disabled={page<=1}>← Prev</BtnSecondary>
            <BtnSecondary onClick={() => setPage(p=>p+1)} disabled={page>=meta.totalPages}>Next →</BtnSecondary>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {modal?.type === "create" && (
        <Modal title="Add New User" subtitle="Create a platform account" onClose={closeModal}
          footer={<><BtnSecondary onClick={closeModal} disabled={saving}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleCreate} disabled={saving}>{saving&&<Spin/>}{saving?"Creating…":"Create User"}</BtnPrimary></>}>
          {formErr && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{formErr}</div>}
          <FInput label="Full name" required value={formData.name} onChange={setField("name")} placeholder="e.g. Nkosi Dlamini" />
          <FInput label="Email address" required type="email" value={formData.email} onChange={setField("email")} placeholder="user@example.com" />
          <FInput label="Password" required type="password" value={formData.password} onChange={setField("password")} placeholder="Minimum 8 characters" />
          <FSelect label="Role" required value={formData.role} onChange={setField("role")}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </FSelect>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {modal?.type === "edit" && (
        <Modal title={`Edit User`} subtitle={modal.user.email} onClose={closeModal}
          footer={<><BtnSecondary onClick={closeModal} disabled={saving}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleEdit} disabled={saving}>{saving&&<Spin/>}{saving?"Saving…":"Save Changes"}</BtnPrimary></>}>
          {formErr && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{formErr}</div>}
          <FInput label="Full name" required value={formData.name} onChange={setField("name")} />
          <FInput label="Email address" required type="email" value={formData.email} onChange={setField("email")} />
          <FSelect label="Role" required value={formData.role} onChange={setField("role")}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </FSelect>
          <FSelect label="Account status" required value={formData.status} onChange={setField("status")}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </FSelect>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {modal?.type === "delete" && (
        <Modal title="Delete User" onClose={closeModal}
          footer={<><BtnSecondary onClick={closeModal} disabled={saving}>Cancel</BtnSecondary>
            <BtnDanger onClick={handleDelete} disabled={saving}>{saving&&<Spin/>}{saving?"Deleting…":"Yes, Delete"}</BtnDanger></>}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(206,17,38,0.1)" }}>
              <svg className="w-5 h-5" style={{ color: "#CE1126" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Delete <span className="text-red-700">{modal.user.name}</span>?</p>
              <p className="text-sm text-slate-500 mt-1">This permanently removes their account and all data. This cannot be undone.</p>
            </div>
          </div>
          {formErr && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mt-2">{formErr}</div>}
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
