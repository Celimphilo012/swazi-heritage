import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getServices, sendEnquiry } from "../../api/services.api";

const CATEGORIES = [
  { val: "",             label: "All" },
  { val: "performance",  label: "Performance" },
  { val: "crafts",       label: "Crafts" },
  { val: "teaching",     label: "Teaching" },
  { val: "ceremony",     label: "Ceremony" },
  { val: "attire",       label: "Attire" },
  { val: "music",        label: "Music" },
  { val: "other",        label: "Other" },
];

const CAT_STYLE = {
  performance: { bg: "#dbeafe", color: "#1d4ed8" },
  crafts:      { bg: "#fce7f3", color: "#be185d" },
  teaching:    { bg: "#dcfce7", color: "#15803d" },
  ceremony:    { bg: "#fef9c3", color: "#854d0e" },
  attire:      { bg: "#ede9fe", color: "#7c3aed" },
  music:       { bg: "#ffedd5", color: "#c2410c" },
  other:       { bg: "#f3f4f6", color: "#4b5563" },
};

const FlagStripe = () => (
  <div className="absolute top-0 left-0 right-0 flex" style={{ height: 4 }}>
    <div className="flex-1" style={{ background: "#002395" }} />
    <div style={{ width: "7%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#CE1126" }} />
    <div style={{ width: "7%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#002395" }} />
  </div>
);

const EnquiryModal = ({ service, onClose }) => {
  const { user } = useAuth();
  const [form,       setForm]       = useState({ user_email: user?.email || "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent,       setSent]       = useState(false);
  const [err,        setErr]        = useState("");

  const handleSend = async () => {
    if (!form.message.trim() || !form.user_email.trim()) return;
    setSubmitting(true); setErr("");
    try {
      await sendEnquiry(service.id, form);
      setSent(true);
    } catch {
      setErr("Failed to send enquiry. Please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className="relative px-6 py-5" style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
          <FlagStripe />
          <h2 className="text-white font-bold text-lg mt-1">Enquire about this service</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(147,197,253,0.8)" }}>{service.title}</p>
          <button onClick={onClose} className="absolute top-4 right-4 text-white opacity-60 hover:opacity-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                   style={{ background: "#dcfce7" }}>
                <svg className="w-6 h-6" style={{ color: "#15803d" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">Enquiry sent!</p>
              <p className="text-sm text-gray-500 mt-1">The practitioner will be in touch via email.</p>
              <button onClick={onClose}
                className="mt-4 text-sm font-bold px-6 py-2 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {err && <p className="text-xs text-red-600">{err}</p>}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Your email <span style={{ color: "#CE1126" }}>*</span>
                </label>
                <input type="email" value={form.user_email}
                  onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Message <span style={{ color: "#CE1126" }}>*</span>
                </label>
                <textarea rows={4} value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  placeholder="Describe what you're looking for, your dates, any specific requirements…" />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button onClick={onClose}
                  className="text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleSend} disabled={submitting || !form.message.trim() || !form.user_email.trim()}
                  className="text-sm font-bold px-5 py-2 rounded-xl text-white disabled:opacity-50 flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {submitting ? "Sending…" : "Send Enquiry"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ServiceCard = ({ service, onEnquire, isLoggedIn }) => {
  const catStyle = CAT_STYLE[service.category] || CAT_STYLE.other;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {service.image_url ? (
        <div className="h-40 overflow-hidden">
          <img src={service.image_url} alt={service.title}
            className="w-full h-full object-cover"
            onError={e => { e.target.parentElement.style.display = 'none'; }} />
        </div>
      ) : (
        <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,#002395,#FFD600,#CE1126)" }} />
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-sm text-gray-900 leading-snug">{service.title}</h3>
          <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={catStyle}>
            {service.category}
          </span>
        </div>
        {service.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">{service.description}</p>
        )}
        <div className="mt-auto space-y-2">
          {service.price_range && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{service.price_range}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {service.practitioner_name}
          </div>
          {isLoggedIn ? (
            <button onClick={() => onEnquire(service)}
              className="w-full mt-2 text-xs font-bold py-2 rounded-xl text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
              Send Enquiry
            </button>
          ) : (
            <Link to="/login"
              className="block w-full mt-2 text-xs font-bold py-2 rounded-xl text-center text-white"
              style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
              Sign in to enquire
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const ServiceSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="h-2 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
      <div className="h-8 bg-gray-100 rounded-xl mt-4" />
    </div>
  </div>
);

const Marketplace = () => {
  const { user } = useAuth();
  const [services,  setServices]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [category,  setCategory]  = useState("");
  const [enquiring, setEnquiring] = useState(null);

  useEffect(() => {
    setLoading(true);
    getServices({ category: category || undefined, limit: 30 })
      .then(r => { setServices(r.data || []); setTotal(r.pagination?.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="-mt-8 -mx-4">

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-14 pb-12 text-center"
        style={{
          background: "linear-gradient(160deg,#001540 0%,#002d80 55%,#001540 100%)",
          borderBottomLeftRadius: "2.5rem",
          borderBottomRightRadius: "2.5rem",
        }}>
        <FlagStripe />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: "rgba(255,214,0,0.12)", border: "1px solid rgba(255,214,0,0.2)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Cultural Marketplace</h1>
          <div className="flex justify-center gap-2 mb-3">
            <div className="h-1 w-8 rounded-full" style={{ background: "#002395" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#FFD600" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#CE1126" }} />
          </div>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#93c5fd" }}>
            Connect with Swazi cultural practitioners — performers, craftspeople, ceremony guides, and teachers.
          </p>
        </div>
      </section>

      <div className="px-4 pt-8 pb-12 max-w-6xl mx-auto">

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(c => (
            <button key={c.val} onClick={() => setCategory(c.val)}
              className="text-xs font-bold px-4 py-1.5 rounded-full border-2 transition-all"
              style={category === c.val
                ? { background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#FFD600", borderColor: "#FFD600" }
                : { background: "#fff", color: "#6b7280", borderColor: "#e2e8f0" }}>
              {c.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 self-center">{total} service{total !== 1 ? 's' : ''}</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <ServiceSkeleton key={i} />)}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: "#f3f4f6" }}>
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No services found{category ? ` in "${category}"` : ""}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(s => (
              <ServiceCard key={s.id} service={s} isLoggedIn={Boolean(user)}
                onEnquire={setEnquiring} />
            ))}
          </div>
        )}
      </div>

      {enquiring && <EnquiryModal service={enquiring} onClose={() => setEnquiring(null)} />}
    </div>
  );
};

export default Marketplace;
