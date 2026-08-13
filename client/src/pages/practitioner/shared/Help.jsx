import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getGuide } from "../../../api/guide.api";

const ROLE_LABEL = {
  public:           "Visitor",
  user:             "User",
  ceremony_keeper:  "Ceremony Keeper",
  history_keeper:   "History Keeper",
  admin:            "Administrator",
};

const Help = () => {
  const { user } = useAuth();
  const role = user?.role || "public";

  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getGuide(role)
      .then((d) => setHtml(d.html))
      .catch(() => setError("Failed to load the user guide."))
      .finally(() => setLoading(false));
  }, [role]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-5"
        style={{ background: "linear-gradient(135deg,#001540,#002d80)", boxShadow: "0 4px 20px rgba(0,21,64,0.2)" }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 3 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#002395" }} />
        </div>
        <h1 className="text-xl font-black text-white">User Guide</h1>
        <p className="text-xs mt-0.5" style={{ color: "#93c5fd" }}>
          Showing the sections relevant to your role — <span className="font-semibold">{ROLE_LABEL[role] || role}</span>
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-2xl h-[70vh] bg-white animate-pulse" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }} />
      ) : (
        <div className="rounded-2xl overflow-hidden border border-gray-100" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <iframe
            title="Swazi Cultural Heritage Platform — User Guide"
            srcDoc={html}
            className="w-full h-[75vh] bg-white"
            style={{ border: "none" }}
          />
        </div>
      )}
    </div>
  );
};

export default Help;
