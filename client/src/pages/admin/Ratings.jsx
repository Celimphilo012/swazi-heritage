import { useState, useEffect } from "react";
import { getAllRatings } from "../../api/ratings.api";

const Stars = ({ score }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <svg key={n} style={{ width: 12, height: 12 }}
        fill={n <= score ? '#FFD600' : 'none'} viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ))}
  </div>
);

const Ratings = () => {
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    setLoading(true);
    getAllRatings({ limit: 100 })
      .then(r => { setRows(r.data || []); setTotal(r.pagination?.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === "all" ? rows : rows.filter(r => r.content_type === filter);

  const avg = rows.length
    ? (rows.reduce((s, r) => s + r.score, 0) / rows.length).toFixed(1)
    : null;

  const byType = (type) => {
    const sub = rows.filter(r => r.content_type === type);
    if (!sub.length) return null;
    return (sub.reduce((s, r) => s + r.score, 0) / sub.length).toFixed(1);
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-5"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", boxShadow: "0 4px 20px rgba(15,23,42,0.2)" }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 3 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#002395" }} />
        </div>
        <h1 className="text-xl font-black text-white mt-1">Community Ratings</h1>
        <p className="text-xs mt-0.5" style={{ color: "#d97706" }}>
          User evaluations of ceremonies and lineage records
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Reviews",       val: total,                    unit: "" },
          { label: "Overall Average",     val: avg ?? "—",               unit: avg ? "/ 5" : "" },
          { label: "Ceremony Average",    val: byType("ceremony") ?? "—", unit: byType("ceremony") ? "/ 5" : "" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm text-center">
            <div className="text-2xl font-black text-gray-900">{s.val}</div>
            {s.unit && <div className="text-xs text-gray-400">{s.unit}</div>}
            <div className="text-xs font-semibold text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter + table */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filter</span>
          {["all", "ceremony", "lineage"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-xs font-bold px-3 py-1 rounded-full border transition-all"
              style={filter === f
                ? { background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#FFD600", borderColor: "#FFD600" }
                : { background: "#fff", color: "#6b7280", borderColor: "#e2e8f0" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{displayed.length} result{displayed.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#002395" }} />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No ratings yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Content ID</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Comment</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{r.user_name}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: r.content_type === 'ceremony' ? '#dbeafe' : '#fce7f3',
                                     color: r.content_type === 'ceremony' ? '#1d4ed8' : '#be185d' }}>
                        {r.content_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">#{r.content_id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Stars score={r.score} />
                        <span className="text-xs font-bold text-gray-600">{r.score}/5</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs">
                      <p className="line-clamp-2 text-xs">{r.comment || <span className="italic text-gray-300">No comment</span>}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ratings;
