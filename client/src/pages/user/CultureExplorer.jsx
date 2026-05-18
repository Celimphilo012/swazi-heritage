import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getPublishedCeremonies, getCeremonyMonths } from "../../api/ceremonies.api";

/* ── Flag accent palette cycling across cards ── */
const ACCENTS = [
  { bar: "linear-gradient(90deg,#002395 0%,#1a4db0 100%)", tag: "rgba(255,255,255,0.18)" },
  { bar: "linear-gradient(90deg,#9b0018 0%,#CE1126 100%)", tag: "rgba(255,255,255,0.18)" },
  { bar: "linear-gradient(90deg,#5a3200 0%,#b86800 100%)", tag: "rgba(255,214,0,0.25)"  },
];

/* ── Flag stripe reused on both pages ── */
const FlagStripe = () => (
  <div className="absolute top-0 left-0 right-0 flex" style={{ height: 10 }}>
    <div className="flex-1" style={{ background: "#002395" }} />
    <div style={{ width: "7%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#CE1126" }} />
    <div style={{ width: "7%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#002395" }} />
  </div>
);

/* ── Floating diamond particles ── */
const DIAMONDS = [
  { s: 12, x: "5%",  y: "20%", d: "0s",   t: "4.5s", c: "#FFD600" },
  { s:  7, x: "18%", y: "65%", d: "1.2s", t: "5.2s", c: "#fff"    },
  { s: 16, x: "32%", y: "30%", d: "0.6s", t: "3.9s", c: "#CE1126" },
  { s:  9, x: "55%", y: "70%", d: "2.1s", t: "5.0s", c: "#FFD600" },
  { s: 11, x: "68%", y: "22%", d: "0.4s", t: "4.7s", c: "#fff"    },
  { s:  6, x: "80%", y: "58%", d: "1.6s", t: "3.6s", c: "#FFD600" },
  { s: 14, x: "90%", y: "35%", d: "0.9s", t: "5.1s", c: "#CE1126" },
];
const DiamondParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {DIAMONDS.map((d, i) => (
      <div key={i} className="absolute" style={{
        width: d.s, height: d.s,
        left: d.x, top: d.y,
        background: d.c, opacity: 0.16,
        animationName: "floatDiamond",
        animationDuration: d.t,
        animationDelay: d.d,
        animationIterationCount: "infinite",
        animationTimingFunction: "ease-in-out",
      }} />
    ))}
  </div>
);

/* ── Skeleton ── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="h-14 bg-gray-200" />
    <div className="p-5 space-y-2">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-full mt-2" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
      <div className="flex gap-2 mt-4">
        <div className="h-6 w-20 bg-gray-100 rounded-full" />
        <div className="h-6 w-20 bg-gray-100 rounded-full" />
      </div>
    </div>
  </div>
);

/* ── Ceremony card ── */
const CeremonyCard = ({ c, index }) => {
  const accent = ACCENTS[index % ACCENTS.length];
  return (
    <Link to={`/explore/ceremonies/${c.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 block">

      {/* Accent banner with shimmer on hover */}
      <div className="relative h-14 flex items-center px-5 overflow-hidden" style={{ background: accent.bar }}>
        {/* Shimmer sweep */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
             style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)" }} />

        {/* Decorative diamonds */}
        <div className="absolute right-4 top-2.5" style={{ width: 9, height: 9, background: "rgba(255,255,255,0.35)", transform: "rotate(45deg)" }} />
        <div className="absolute right-8 top-4"   style={{ width: 6, height: 6, background: "rgba(255,255,255,0.2)",  transform: "rotate(45deg)" }} />

        {c.month_celebrated && (
          <span className="relative text-xs font-semibold text-white px-2.5 py-1 rounded-full"
                style={{ background: accent.tag, backdropFilter: "blur(4px)" }}>
            {c.month_celebrated}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 group-hover:text-red-800 transition-colors leading-snug mb-2">
          {c.name}
        </h3>
        {c.description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{c.description}</p>
        )}

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50 flex-wrap">
          {c.song_count > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              {c.song_count} {c.song_count === 1 ? "song" : "songs"}
            </span>
          )}
          {c.imvunulo_count > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
              </svg>
              {c.imvunulo_count} attire
            </span>
          )}
          <span className="ml-auto text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ color: "#CE1126" }}>
            View →
          </span>
        </div>
      </div>
    </Link>
  );
};

/* ── Month pill ── */
const MonthPill = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className="flex-shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 hover:scale-105"
    style={active
      ? { background: "#CE1126", color: "#fff", boxShadow: "0 2px 8px rgba(206,17,38,0.35)" }
      : { background: "#f3f4f6", color: "#4b5563" }}>
    {label}
  </button>
);

/* ── Page ── */
const CultureExplorer = () => {
  const [ceremonies,       setCeremonies]   = useState([]);
  const [months,           setMonths]       = useState([]);
  const [meta,             setMeta]         = useState({ total: 0, page: 1, totalPages: 1 });
  const [page,             setPage]         = useState(1);
  const [search,           setSearch]       = useState("");
  const [debouncedSearch,  setDebounced]    = useState("");
  const [monthFilter,      setMonthFilter]  = useState("");
  const [loading,          setLoading]      = useState(true);
  const [error,            setError]        = useState("");

  useEffect(() => { getCeremonyMonths().then(setMonths).catch(() => {}); }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCeremonies = useCallback(() => {
    setLoading(true);
    setError("");
    getPublishedCeremonies({
      search: debouncedSearch || undefined,
      month:  monthFilter     || undefined,
      page, limit: 12,
    })
      .then(({ data, meta: m }) => { setCeremonies(data); setMeta(m); })
      .catch(() => setError("Failed to load ceremonies."))
      .finally(() => setLoading(false));
  }, [debouncedSearch, monthFilter, page]);

  useEffect(() => { fetchCeremonies(); }, [fetchCeremonies]);

  const selectMonth = (m) => { setMonthFilter(m); setPage(1); };
  const clearAll    = ()  => { setSearch(""); setMonthFilter(""); setPage(1); };

  return (
    <div className="-mt-8 -mx-4">

      {/* ══ HERO BANNER ══ */}
      <section className="relative overflow-hidden px-6 pt-16 pb-14 text-center"
        style={{
          background: "linear-gradient(160deg,#001540 0%,#002d80 55%,#001540 100%)",
          borderBottomLeftRadius: "2.5rem",
          borderBottomRightRadius: "2.5rem",
        }}>
        <FlagStripe />
        <DiamondParticles />

        <div className="relative z-10">
          {/* Ceremony count chip */}
          {!loading && meta.total > 0 && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4"
                 style={{ background: "rgba(255,214,0,0.14)", color: "#FFD600", border: "1px solid rgba(255,214,0,0.25)" }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              {meta.total} ceremonies documented
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 animate-fade-in-down">
            Explore Ceremonies
          </h1>

          <div className="flex justify-center gap-2 mb-3">
            <div className="h-1 w-8 rounded-full" style={{ background: "#002395" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#FFD600" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#CE1126" }} />
          </div>

          <p className="text-base max-w-md mx-auto animate-fade-in-up"
             style={{ color: "#93c5fd", animationDelay: "0.2s" }}>
            Discover the sacred traditions and ceremonies of the Kingdom of Eswatini
          </p>
        </div>
      </section>

      <div className="px-4">

        {/* ══ SEARCH & FILTERS ══ */}
        <div className="mt-7 mb-6 space-y-3">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ceremonies..."
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {months.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <MonthPill label="All" active={!monthFilter} onClick={() => selectMonth("")} />
              {months.map(m => (
                <MonthPill key={m} label={m} active={monthFilter === m} onClick={() => selectMonth(m)} />
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {/* ══ GRID ══ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : ceremonies.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: "linear-gradient(135deg,#f3f4f6,#e5e7eb)" }}>
              <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-500">No ceremonies found</p>
            <p className="text-xs text-gray-400 mt-1">
              {debouncedSearch || monthFilter
                ? "No results match your filters."
                : "No ceremonies have been published yet."}
            </p>
            {(debouncedSearch || monthFilter) && (
              <button onClick={clearAll}
                className="mt-4 text-xs font-bold px-5 py-2 rounded-full text-white transition-all hover:brightness-110"
                style={{ background: "#002395" }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ceremonies.map((c, i) => <CeremonyCard key={c.id} c={c} index={i} />)}
          </div>
        )}

        {/* ══ PAGINATION ══ */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
              className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30 transition-all hover:scale-110"
              style={{ background: "#f3f4f6" }}>
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {[...Array(meta.totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className="w-9 h-9 rounded-full text-sm font-bold transition-all hover:scale-110"
                style={page === i + 1
                  ? { background: "#002395", color: "#fff", boxShadow: "0 2px 10px rgba(0,35,149,0.4)" }
                  : { background: "#f3f4f6", color: "#4b5563" }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= meta.totalPages}
              className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30 transition-all hover:scale-110"
              style={{ background: "#f3f4f6" }}>
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CultureExplorer;
