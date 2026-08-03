import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/notifications.api";

const POLL_INTERVAL = 30_000;

const timeAgo = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// theme: "light" (default, for light navbars) or "dark" (for the practitioner sidebar)
const NotificationBell = ({ theme = "light" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const wrapRef = useRef(null);

  const refreshCount = useCallback(() => {
    getUnreadCount().then(setUnread).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshCount();
    const id = setInterval(refreshCount, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [user, refreshCount]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleOpen = () => {
    setOpen((o) => !o);
    if (!loaded) {
      getNotifications().then((rows) => { setItems(rows); setLoaded(true); }).catch(() => {});
    }
  };

  const handleItemClick = (n) => {
    if (!n.read_at) {
      markNotificationRead(n.id).catch(() => {});
      setItems((rows) => rows.map((r) => (r.id === n.id ? { ...r, read_at: new Date().toISOString() } : r)));
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead().catch(() => {});
    setItems((rows) => rows.map((r) => ({ ...r, read_at: r.read_at || new Date().toISOString() })));
    setUnread(0);
  };

  if (!user) return null;

  const dark = theme === "dark";

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative flex items-center justify-center rounded-lg transition-colors"
        style={{ width: 34, height: 34, color: dark ? "#94a3b8" : "#6b7280" }}
      >
        <svg style={{ width: 19, height: 19 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute flex items-center justify-center rounded-full font-bold text-white"
            style={{ top: 1, right: 1, minWidth: 16, height: 16, fontSize: 9.5, background: "#CE1126", padding: "0 3px" }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 60,
          width: 340, maxHeight: 420, overflowY: "auto",
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
          boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
        }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-800">Notifications</span>
            {unread > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-semibold hover:underline" style={{ color: "#002395" }}>
                Mark all read
              </button>
            )}
          </div>
          {!loaded ? (
            <div className="px-4 py-8 text-center text-xs text-gray-400">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-gray-400">No notifications yet.</div>
          ) : (
            items.map((n) => (
              <button key={n.id} onClick={() => handleItemClick(n)}
                className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: n.read_at ? "transparent" : "#CE1126" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
