import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMySeminars, cancelSeminar, getSeminarAttendees } from "../../../api/seminars.api";

const STATUS_CFG = {
  scheduled: { label: "Scheduled", color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  ongoing:   { label: "Ongoing",   color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  completed: { label: "Completed",color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  cancelled: { label: "Cancelled",color: "#CE1126", bg: "rgba(206,17,38,0.1)"  },
};

const fmt = (d) => new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const StatusPill = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.scheduled;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

const FormatBadge = ({ format }) => (
  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
    style={format === "online"
      ? { background: "rgba(0,35,149,0.08)", color: "#002395" }
      : { background: "rgba(217,119,6,0.1)", color: "#92400e" }}>
    {format === "online" ? "Online" : "In person"}
  </span>
);

// ─── Attendees modal ──────────────────────────────────────────────────────────
const AttendeesModal = ({ seminar, onClose }) => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSeminarAttendees(seminar.id).then(setAttendees).catch(() => {}).finally(() => setLoading(false));
  }, [seminar.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Attendees</h2>
            <p className="text-xs text-gray-500 mt-0.5">{seminar.title}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
          ) : attendees.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No one has booked yet.</p>
          ) : (
            <div className="space-y-2">
              {attendees.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.name}</p>
                    <p className="text-xs text-gray-500 truncate">{a.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${a.status === "cancelled" ? "text-gray-400" : "text-green-700"}`}
                    style={{ background: a.status === "cancelled" ? "#f1f5f9" : "rgba(16,185,129,0.1)" }}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const Seminars = () => {
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [attendeesFor, setAttendeesFor] = useState(null);

  const load = () => {
    setLoading(true);
    getMySeminars().then(setSeminars).catch(() => setError("Failed to load seminars.")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (seminar) => {
    if (!window.confirm(`Cancel "${seminar.title}"? All attendees will be notified.`)) return;
    setCancellingId(seminar.id);
    try {
      await cancelSeminar(seminar.id);
      setSeminars((rows) => rows.map((s) => (s.id === seminar.id ? { ...s, status: "cancelled" } : s)));
    } catch {
      setError("Failed to cancel seminar.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">

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
            <h1 className="text-xl font-black text-white">My Seminars</h1>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              {loading ? "Loading…" : `${seminars.length} seminar${seminars.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link to="/practitioner/seminars/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New seminar
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-50 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : seminars.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-500">No seminars yet</p>
          <Link to="/practitioner/seminars/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white mt-4"
            style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
            Schedule your first seminar
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {seminars.map((seminar) => {
            const cfg = STATUS_CFG[seminar.status] || STATUS_CFG.scheduled;
            return (
              <div key={seminar.id} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <div className="h-0.5" style={{ background: cfg.color }} />
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{seminar.title}</h3>
                      <StatusPill status={seminar.status} />
                      <FormatBadge format={seminar.format} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{fmt(seminar.scheduled_at)}</p>
                    {seminar.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{seminar.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {seminar.booking_count} booked{seminar.capacity ? ` / ${seminar.capacity} capacity` : ""}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button type="button" onClick={() => setAttendeesFor(seminar)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center transition-colors hover:bg-blue-50"
                      style={{ borderColor: "rgba(0,35,149,0.25)", color: "#002395", background: "rgba(0,35,149,0.04)" }}>
                      Attendees
                    </button>
                    {seminar.status !== "cancelled" && seminar.status !== "completed" && (
                      <>
                        <Link to={`/practitioner/seminars/${seminar.id}/edit`}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center"
                          style={{ borderColor: "#e2e8f0", color: "#475569", background: "#f8fafc" }}>
                          Edit
                        </Link>
                        <button type="button" onClick={() => handleCancel(seminar)} disabled={cancellingId === seminar.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center transition-colors hover:bg-red-50 disabled:opacity-50"
                          style={{ borderColor: "rgba(206,17,38,0.25)", color: "#CE1126", background: "rgba(206,17,38,0.04)" }}>
                          {cancellingId === seminar.id ? "Cancelling…" : "Cancel"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {attendeesFor && <AttendeesModal seminar={attendeesFor} onClose={() => setAttendeesFor(null)} />}
    </div>
  );
};

export default Seminars;
