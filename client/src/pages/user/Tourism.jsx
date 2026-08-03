import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTourismSites } from "../../api/tourism.api";
import { getRecommendations } from "../../api/ratings.api";
import CultureMap from "../../components/common/CultureMap";

const CATEGORIES = [
  { val: "",                 label: "All" },
  { val: "heritage_site",    label: "Heritage Sites" },
  { val: "lodge",            label: "Lodges" },
  { val: "cultural_village", label: "Cultural Villages" },
  { val: "nature_reserve",   label: "Nature Reserves" },
  { val: "restaurant",       label: "Restaurants" },
  { val: "other",            label: "Other" },
];

const CAT_STYLE = {
  heritage_site:    { bg: "#fef9c3", color: "#854d0e" },
  lodge:             { bg: "#dbeafe", color: "#1d4ed8" },
  cultural_village:  { bg: "#ede9fe", color: "#7c3aed" },
  nature_reserve:    { bg: "#dcfce7", color: "#15803d" },
  restaurant:        { bg: "#ffedd5", color: "#c2410c" },
  other:             { bg: "#f3f4f6", color: "#4b5563" },
};

const CAT_LABEL = Object.fromEntries(CATEGORIES.filter(c => c.val).map(c => [c.val, c.label]));

const FlagStripe = () => (
  <div className="absolute top-0 left-0 right-0 flex" style={{ height: 4 }}>
    <div className="flex-1" style={{ background: "#002395" }} />
    <div style={{ width: "7%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#CE1126" }} />
    <div style={{ width: "7%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#002395" }} />
  </div>
);

const SiteCard = ({ site }) => {
  const catStyle = CAT_STYLE[site.category] || CAT_STYLE.other;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {site.image_url ? (
        <div className="h-40 overflow-hidden">
          <img src={site.image_url} alt={site.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.parentElement.style.display = "none"; }} />
        </div>
      ) : (
        <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,#002395,#FFD600,#CE1126)" }} />
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-sm text-gray-900 leading-snug">{site.name}</h3>
          <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full" style={catStyle}>
            {CAT_LABEL[site.category] || site.category}
          </span>
        </div>
        {site.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">{site.description}</p>
        )}
        <div className="mt-auto space-y-2">
          {site.price_range && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{site.price_range}</span>
            </div>
          )}
          {site.location_name && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {site.location_name}
            </div>
          )}
          {(site.contact || site.website) && (
            <div className="flex items-center gap-3 pt-1">
              {site.contact && <span className="text-xs text-gray-400">{site.contact}</span>}
              {site.website && (
                <a href={site.website} target="_blank" rel="noreferrer"
                  className="text-xs font-bold hover:underline" style={{ color: "#002395" }}>
                  Visit website →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SiteSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="h-2 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
    </div>
  </div>
);

const Tourism = () => {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    setLoading(true);
    getTourismSites({ category: category || undefined, limit: 30 })
      .then((r) => { setSites(r.data || []); setTotal(r.meta?.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (!user) return;
    getRecommendations().then((r) => setRecommended(r.tourism || [])).catch(() => {});
  }, [user]);

  const located = sites
    .filter((s) => s.latitude && s.longitude)
    .map((s) => ({ lat: s.latitude, lng: s.longitude, title: s.name, subtitle: CAT_LABEL[s.category], type: "ceremony" }));

  return (
    <div className="-mt-8 -mx-4">

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-14 pb-12 text-center"
        style={{
          background: "linear-gradient(160deg,#04331f 0%,#0a5c38 55%,#04331f 100%)",
          borderBottomLeftRadius: "2.5rem",
          borderBottomRightRadius: "2.5rem",
        }}>
        <FlagStripe />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: "rgba(255,214,0,0.12)", border: "1px solid rgba(255,214,0,0.2)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Discover Eswatini</h1>
          <div className="flex justify-center gap-2 mb-3">
            <div className="h-1 w-8 rounded-full" style={{ background: "#002395" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#FFD600" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#CE1126" }} />
          </div>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#bbf7d0" }}>
            Heritage sites, lodges, and cultural villages across the Kingdom — matched to what you care about most.
          </p>
        </div>
      </section>

      <div className="px-4 pt-8 pb-12 max-w-6xl mx-auto space-y-6">

        {/* Recommended for you */}
        {user && recommended.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-2">Recommended for you</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map((s) => <SiteCard key={`rec-${s.id}`} site={s} />)}
            </div>
          </div>
        )}

        {/* Map */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-2">Map</h2>
          {located.length > 0 ? (
            <CultureMap markers={located} zoom={8} height={400} />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              No sites with a location on file yet.
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.val} onClick={() => setCategory(c.val)}
              className="text-xs font-bold px-4 py-1.5 rounded-full border-2 transition-all"
              style={category === c.val
                ? { background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#FFD600", borderColor: "#FFD600" }
                : { background: "#fff", color: "#6b7280", borderColor: "#e2e8f0" }}>
              {c.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 self-center">{total} site{total !== 1 ? "s" : ""}</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SiteSkeleton key={i} />)}
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">No sites found{category ? ` in "${CAT_LABEL[category]}"` : ""}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((s) => <SiteCard key={s.id} site={s} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tourism;
