import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getPublishedCeremonies, getCeremonyMonths } from "../../api/ceremonies.api";

const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
      <div className="h-3 bg-gray-100 rounded w-full mt-2" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
      <div className="flex gap-3 mt-3">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
    </div>
  </div>
);

const CeremonyCard = ({ c }) => (
  <Link
    to={`/explore/ceremonies/${c.id}`}
    className="card hover:shadow-md transition-shadow block group"
  >
    <h3 className="text-base font-semibold text-gray-900 group-hover:text-red-800 transition-colors">
      {c.name}
    </h3>
    {c.month_celebrated && (
      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {c.month_celebrated}
      </p>
    )}
    {c.description && (
      <p className="text-sm text-gray-600 mt-2 line-clamp-3">{c.description}</p>
    )}
    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50">
      {c.song_count > 0 && (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          {c.song_count} {c.song_count === 1 ? "song" : "songs"}
        </span>
      )}
      {c.imvunulo_count > 0 && (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
          </svg>
          {c.imvunulo_count} attire
        </span>
      )}
      <span className="ml-auto text-xs font-medium text-red-800 group-hover:underline">
        View →
      </span>
    </div>
  </Link>
);

const CultureExplorer = () => {
  const [ceremonies, setCeremonies] = useState([]);
  const [months, setMonths] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCeremonyMonths().then(setMonths).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCeremonies = useCallback(() => {
    setLoading(true);
    setError("");
    getPublishedCeremonies({
      search: debouncedSearch || undefined,
      month: monthFilter || undefined,
      page,
      limit: 12,
    })
      .then(({ data, meta: m }) => { setCeremonies(data); setMeta(m); })
      .catch(() => setError("Failed to load ceremonies."))
      .finally(() => setLoading(false));
  }, [debouncedSearch, monthFilter, page]);

  useEffect(() => { fetchCeremonies(); }, [fetchCeremonies]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Explore Ceremonies</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Discover Swazi cultural ceremonies and their traditions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-52">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ceremonies..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
        </div>
        <select
          value={monthFilter}
          onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-200 min-w-48"
        >
          <option value="">All months</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : ceremonies.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-medium text-gray-500">No ceremonies found</p>
          <p className="text-xs text-gray-400 mt-1">
            {debouncedSearch || monthFilter ? "Try clearing your filters." : "No ceremonies have been published yet."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">{meta.total} ceremonies</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ceremonies.map((c) => <CeremonyCard key={c.id} c={c} />)}
          </div>
        </>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Page {page} of {meta.totalPages}</p>
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
    </div>
  );
};

export default CultureExplorer;
