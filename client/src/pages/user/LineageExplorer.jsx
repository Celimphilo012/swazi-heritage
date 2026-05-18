import { useState, useEffect, useCallback } from "react";
import { getPublishedLineage } from "../../api/lineage.api";

/* ── Per-record accent palette (flag colours) ── */
const ACCENTS = [
  { line: "#002395", tag: "#dbeafe", tagText: "#1e40af" },
  { line: "#CE1126", tag: "#fee2e2", tagText: "#991b1b" },
  { line: "#b86800", tag: "#fef3c7", tagText: "#92400e" },
];

/* ── Shared primitives ── */
const FlagStripe = () => (
  <div className="absolute top-0 left-0 right-0 flex" style={{ height: 10 }}>
    <div className="flex-1" style={{ background: "#002395" }} />
    <div style={{ width: "7%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#CE1126" }} />
    <div style={{ width: "7%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#002395" }} />
  </div>
);

const DIAMONDS = [
  { s: 12, x: "5%",  y: "22%", d: "0s",   t: "4.5s", c: "#FFD600" },
  { s:  7, x: "20%", y: "62%", d: "1.2s", t: "5.2s", c: "#fff"    },
  { s: 15, x: "35%", y: "30%", d: "0.6s", t: "3.9s", c: "#CE1126" },
  { s:  9, x: "60%", y: "68%", d: "2.1s", t: "5.0s", c: "#FFD600" },
  { s: 11, x: "75%", y: "20%", d: "0.4s", t: "4.7s", c: "#fff"    },
  { s:  7, x: "88%", y: "55%", d: "1.6s", t: "3.6s", c: "#FFD600" },
];
const DiamondParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {DIAMONDS.map((d, i) => (
      <div key={i} className="absolute" style={{
        width: d.s, height: d.s, left: d.x, top: d.y, background: d.c, opacity: 0.16,
        animationName: "floatDiamond", animationDuration: d.t, animationDelay: d.d,
        animationIterationCount: "infinite", animationTimingFunction: "ease-in-out",
      }} />
    ))}
  </div>
);

/* ── Clan card ── */
const ClanCard = ({ clan }) => (
  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-gray-200 transition-colors">
    <p className="font-bold text-sm text-gray-800">{clan.name}</p>
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {clan.royal_connection && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
          {clan.royal_connection}
        </span>
      )}
      {clan.founding_era && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
          {clan.founding_era}
        </span>
      )}
    </div>
    {clan.description && (
      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{clan.description}</p>
    )}
  </div>
);

/* ── Lineage card on timeline ── */
const LineageCard = ({ record, index }) => {
  const [expanded, setExpanded] = useState(false);
  const ac = ACCENTS[index % ACCENTS.length];

  return (
    <div className="relative pl-10">
      {/* Timeline dot */}
      <div className="absolute left-0 top-5 w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center"
           style={{ background: ac.line }}>
        <div className="w-2 h-2 rounded-full bg-white opacity-70" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Accent bar */}
        <div className="h-1" style={{ background: ac.line }} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {record.era && (
                <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-2"
                      style={{ background: ac.tag, color: ac.tagText }}>
                  {record.era}
                </span>
              )}
              <h3 className="text-base font-bold text-gray-900 leading-snug">{record.title}</h3>
              {record.creator_name && (
                <p className="text-xs text-gray-400 mt-0.5">Documented by {record.creator_name}</p>
              )}
              {record.description && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-3">
                  {record.description}
                </p>
              )}
            </div>

            {record.clans?.length > 0 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105"
                style={expanded
                  ? { background: ac.line, color: "#fff" }
                  : { background: ac.tag, color: ac.tagText }}>
                <svg className={`w-3 h-3 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {record.clans.length} clan{record.clans.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>

          {/* Clan expansion with smooth animation */}
          <div className={`overflow-hidden transition-all duration-400 ${expanded ? "max-h-[600px]" : "max-h-0"}`}>
            <div className="pt-4 mt-4 border-t border-gray-50">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Associated Clans
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {record.clans.map(c => <ClanCard key={c.id} clan={c} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Skeleton ── */
const SkeletonCard = ({ index }) => (
  <div className="relative pl-10 animate-pulse">
    <div className="absolute left-0 top-5 w-5 h-5 rounded-full bg-gray-200" />
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-1 bg-gray-200" />
      <div className="p-5 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        <div className="h-5 bg-gray-200 rounded w-2/3 mt-1" />
        <div className="h-3 bg-gray-100 rounded w-full mt-2" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  </div>
);

/* ── Page ── */
const LineageExplorer = () => {
  const [records, setRecords] = useState([]);
  const [meta,    setMeta]    = useState({ total: 0, page: 1, totalPages: 1 });
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchRecords = useCallback(() => {
    setLoading(true);
    setError("");
    getPublishedLineage({ page, limit: 10 })
      .then(({ data, meta: m }) => { setRecords(data); setMeta(m); })
      .catch(() => setError("Failed to load lineage records."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <div className="-mt-8 -mx-4">

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden px-6 pt-16 pb-14 text-center"
        style={{
          background: "linear-gradient(160deg,#001540 0%,#002d80 55%,#001540 100%)",
          borderBottomLeftRadius: "2.5rem",
          borderBottomRightRadius: "2.5rem",
        }}>
        <FlagStripe />
        <DiamondParticles />

        <div className="relative z-10">
          {!loading && meta.total > 0 && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4"
                 style={{ background: "rgba(255,214,0,0.14)", color: "#FFD600", border: "1px solid rgba(255,214,0,0.25)" }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {meta.total} records documented
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 animate-fade-in-down">
            Royal Lineage Records
          </h1>
          <div className="flex justify-center gap-2 mb-3">
            <div className="h-1 w-8 rounded-full" style={{ background: "#002395" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#FFD600" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#CE1126" }} />
          </div>
          <p className="text-base max-w-md mx-auto animate-fade-in-up"
             style={{ color: "#93c5fd", animationDelay: "0.2s" }}>
            Documented royal lineages and clan histories of the Kingdom of Eswatini
          </p>
        </div>
      </section>

      <div className="px-4">
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="relative mt-8 space-y-5">
            <div className="absolute left-2 top-4 bottom-4 w-0.5 bg-gray-200 rounded-full" />
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} index={i} />)}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-gray-200 mt-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                 style={{ background: "#f3f4f6" }}>
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-500">No lineage records published yet.</p>
          </div>
        ) : (
          <div className="relative mt-8">
            {/* Vertical timeline line */}
            <div className="absolute left-2 top-4 bottom-10 w-0.5 rounded-full"
                 style={{ background: "linear-gradient(to bottom,#002395,#CE1126,#FFD600)" }} />

            <div className="space-y-5">
              {records.map((r, i) => <LineageCard key={r.id} record={r} index={i} />)}
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
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

export default LineageExplorer;
