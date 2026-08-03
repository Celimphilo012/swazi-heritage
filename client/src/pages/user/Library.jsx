import { useState, useEffect, useRef } from "react";
import { getPublications } from "../../api/publications.api";

const TYPES = [
  { val: "",        label: "All types" },
  { val: "article",  label: "Articles" },
  { val: "book",      label: "Books" },
  { val: "paper",     label: "Papers" },
  { val: "thesis",    label: "Theses" },
  { val: "other",     label: "Other" },
];

const TYPE_STYLE = {
  article: { bg: "#dbeafe", color: "#1d4ed8" },
  book:    { bg: "#dcfce7", color: "#15803d" },
  paper:   { bg: "#ede9fe", color: "#7c3aed" },
  thesis:  { bg: "#ffedd5", color: "#c2410c" },
  other:   { bg: "#f3f4f6", color: "#4b5563" },
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

const citationFor = (pub) => {
  const year = pub.publication_year ? ` (${pub.publication_year})` : "";
  const authors = pub.authors ? `${pub.authors}${year}. ` : "";
  return `${authors}${pub.title}. Swazi Cultural Heritage Library.`;
};

const PublicationRow = ({ pub, expanded, onToggle }) => {
  const [copied, setCopied] = useState(false);
  const typeStyle = TYPE_STYLE[pub.publication_type] || TYPE_STYLE.other;

  const handleCite = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(citationFor(pub));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — silently ignore */ }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
      <button onClick={onToggle} className="w-full text-left p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-gray-900 leading-snug">{pub.title}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {pub.author_name && <span>{pub.author_name}</span>}
              {pub.authors && <span>{pub.author_name ? " · " : ""}{pub.authors}</span>}
              {pub.publication_year && <span> · {pub.publication_year}</span>}
            </p>
          </div>
          <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full" style={typeStyle}>
            {pub.publication_type}
          </span>
        </div>
        {pub.abstract && (
          <p className={`text-xs text-gray-600 mt-2 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
            {pub.abstract}
          </p>
        )}
      </button>
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-50 flex flex-wrap items-center gap-3">
          {pub.keywords && (
            <div className="flex flex-wrap gap-1.5">
              {pub.keywords.split(",").map(k => k.trim()).filter(Boolean).map((k, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#64748b" }}>
                  {k}
                </span>
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={handleCite}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors"
              style={{ borderColor: "#e2e8f0", color: "#475569" }}>
              {copied ? "Copied!" : "Cite"}
            </button>
            {pub.file_url && (
              <a href={pub.file_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold px-4 py-1.5 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
                Read full text →
              </a>
            )}
          </div>
          {pub.view_count !== undefined && (
            <p className="text-xs text-gray-400 w-full">{pub.view_count} view{pub.view_count !== 1 ? "s" : ""}</p>
          )}
        </div>
      )}
    </div>
  );
};

const RowSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse space-y-2">
    <div className="h-4 bg-gray-200 rounded w-2/3" />
    <div className="h-3 bg-gray-100 rounded w-1/3" />
    <div className="h-3 bg-gray-100 rounded w-full" />
  </div>
);

const Library = () => {
  const [search, setSearch]   = useState("");
  const [debounced, setDebounced] = useState("");
  const [pubType, setPubType] = useState("");
  const [pubs, setPubs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    getPublications({ search: debounced || undefined, publication_type: pubType || undefined, limit: 30 })
      .then((r) => { setPubs(r.data || []); setTotal(r.meta?.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debounced, pubType]);

  return (
    <div className="-mt-8 -mx-4">

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-14 pb-12 text-center"
        style={{
          background: "linear-gradient(160deg,#1a0733 0%,#3b0f66 55%,#1a0733 100%)",
          borderBottomLeftRadius: "2.5rem",
          borderBottomRightRadius: "2.5rem",
        }}>
        <FlagStripe />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: "rgba(255,214,0,0.12)", border: "1px solid rgba(255,214,0,0.2)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Library & Publications</h1>
          <div className="flex justify-center gap-2 mb-5">
            <div className="h-1 w-8 rounded-full" style={{ background: "#002395" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#FFD600" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#CE1126" }} />
          </div>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles, books, and research on Swazi history & culture…"
              className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm bg-white shadow-lg
                         focus:outline-none focus:ring-4 focus:ring-purple-300/40" />
          </div>
        </div>
      </section>

      <div className="px-4 pt-8 pb-12 max-w-3xl mx-auto space-y-6">

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {TYPES.map((t) => (
            <button key={t.val} onClick={() => setPubType(t.val)}
              className="text-xs font-bold px-4 py-1.5 rounded-full border-2 transition-all"
              style={pubType === t.val
                ? { background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#FFD600", borderColor: "#FFD600" }
                : { background: "#fff", color: "#6b7280", borderColor: "#e2e8f0" }}>
              {t.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 self-center">{total} result{total !== 1 ? "s" : ""}</span>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : pubs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">
              {debounced ? `No results for "${debounced}".` : "No publications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pubs.map((p) => (
              <PublicationRow key={p.id} pub={p}
                expanded={expandedId === p.id}
                onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
