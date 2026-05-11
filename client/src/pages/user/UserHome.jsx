import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPublishedCeremonies } from "../../api/ceremonies.api";
import { getPublishedLineage } from "../../api/lineage.api";

const CeremonyCard = ({ c }) => (
  <Link to={`/explore/ceremonies/${c.id}`}
    className="card hover:shadow-md transition-shadow block group">
    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-800 transition-colors">
      {c.name}
    </h3>
    {c.month_celebrated && (
      <p className="text-xs text-gray-500 mt-1">{c.month_celebrated}</p>
    )}
    {c.description && (
      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{c.description}</p>
    )}
  </Link>
);

const LineageCard = ({ r }) => (
  <Link to="/explore/lineage" className="card hover:shadow-md transition-shadow block group">
    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-800">{r.title}</h3>
    {r.era && <p className="text-xs text-gray-500 mt-1">{r.era}</p>}
    {r.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{r.description}</p>}
  </Link>
);

const UserHome = () => {
  const { user } = useAuth();
  const [ceremonies, setCeremonies] = useState([]);
  const [lineage, setLineage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPublishedCeremonies({ limit: 6 }),
      getPublishedLineage({ limit: 4 }),
    ])
      .then(([c, l]) => {
        setCeremonies(c.data || []);
        setLineage(l.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-red-800 to-red-900 text-white px-8 py-14 mb-10 text-center">
        <h1 className="text-4xl font-bold mb-3">Swazi Cultural Heritage</h1>
        <p className="text-red-200 text-lg max-w-2xl mx-auto">
          Preserving the rich traditions, royal lineages, and ceremonies of the Kingdom of Eswatini
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link to="/explore" className="bg-white text-red-800 font-medium px-6 py-2.5 rounded-lg hover:bg-red-50 transition-colors">
            Explore Ceremonies
          </Link>
          {user ? (
            <Link to="/chat" className="border border-red-400 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors">
              Ask AI About Culture
            </Link>
          ) : (
            <Link to="/login" className="border border-red-400 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Featured ceremonies */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Featured Ceremonies</h2>
          <Link to="/explore" className="text-sm text-red-800 hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : ceremonies.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No ceremonies published yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ceremonies.map((c) => <CeremonyCard key={c.id} c={c} />)}
          </div>
        )}
      </section>

      {/* Lineage records */}
      {lineage.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Royal Lineage Records</h2>
            <Link to="/explore/lineage" className="text-sm text-red-800 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lineage.map((r) => <LineageCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {/* Feature highlights */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Explore Culture</h3>
          <p className="text-xs text-gray-500 mt-1">Browse ceremonies, songs, and traditional attire</p>
          <Link to="/explore" className="text-xs text-red-800 font-medium hover:underline mt-2 inline-block">Browse →</Link>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">AI Cultural Chat</h3>
          <p className="text-xs text-gray-500 mt-1">Ask our AI assistant anything about Swazi culture</p>
          <Link to={user ? "/chat" : "/login"} className="text-xs text-red-800 font-medium hover:underline mt-2 inline-block">
            {user ? "Ask now →" : "Sign in to chat →"}
          </Link>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.868V15.132a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Cultural Cinema</h3>
          <p className="text-xs text-gray-500 mt-1">Watch live and recorded cultural events</p>
          <Link to="/cinema" className="text-xs text-red-800 font-medium hover:underline mt-2 inline-block">View sessions →</Link>
        </div>
      </section>
    </div>
  );
};

export default UserHome;
