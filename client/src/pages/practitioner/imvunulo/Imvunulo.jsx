import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyImvunuloListings, deleteImvunuloListing } from "../../../api/imvunulo.api";

const TYPE_CFG = {
  rental: { label: "Rental", color: "#002395", bg: "rgba(0,35,149,0.08)" },
  sale:   { label: "For sale", color: "#15803d", bg: "rgba(16,185,129,0.1)" },
  both:   { label: "Rental / Sale", color: "#92400e", bg: "rgba(217,119,6,0.1)" },
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CFG[type] || TYPE_CFG.sale;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

const Imvunulo = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    getMyImvunuloListings().then(setListings).catch(() => setError("Failed to load your listings.")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (listing) => {
    if (!window.confirm(`Remove "${listing.title}" from your listings?`)) return;
    setDeletingId(listing.id);
    try {
      await deleteImvunuloListing(listing.id);
      setListings((rows) => rows.filter((l) => l.id !== listing.id));
    } catch {
      setError("Failed to remove listing.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">

      <div className="relative rounded-2xl overflow-hidden px-6 py-5"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", boxShadow: "0 4px 20px rgba(15,23,42,0.2)" }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 3 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#002395" }} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">My Imvunulo Listings</h1>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              {loading ? "Loading…" : `${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link to="/practitioner/imvunulo/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New listing
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-50 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-500">No listings yet</p>
          <p className="text-xs text-slate-400 mt-1">List traditional attire for rental or sale, with a pickup location for buyers to find you.</p>
          <Link to="/practitioner/imvunulo/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white mt-4"
            style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
            List your first item
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-0.5" style={{ background: listing.status === "active" ? "#10b981" : "#94a3b8" }} />
              <div className="p-5 flex items-start gap-4">
                {listing.image_url && (
                  <img src={listing.image_url} alt={listing.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                    onError={(e) => { e.target.style.display = "none"; }} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{listing.title}</h3>
                    <TypeBadge type={listing.listing_type} />
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: listing.status === "active" ? "#dcfce7" : "#f1f5f9", color: listing.status === "active" ? "#15803d" : "#64748b" }}>
                      {listing.status}
                    </span>
                  </div>
                  {listing.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{listing.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    {listing.price && (
                      <span className="text-green-700 font-semibold">
                        E{Number(listing.price).toFixed(2)}{listing.price_unit ? ` ${listing.price_unit}` : ""}
                      </span>
                    )}
                    {listing.location_name && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.location_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link to={`/practitioner/imvunulo/${listing.id}/edit`}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center"
                    style={{ borderColor: "#e2e8f0", color: "#475569", background: "#f8fafc" }}>
                    Edit
                  </Link>
                  <button type="button" onClick={() => handleDelete(listing)} disabled={deletingId === listing.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border text-center transition-colors hover:bg-red-50 disabled:opacity-50"
                    style={{ borderColor: "rgba(206,17,38,0.25)", color: "#CE1126", background: "rgba(206,17,38,0.04)" }}>
                    {deletingId === listing.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Imvunulo;
