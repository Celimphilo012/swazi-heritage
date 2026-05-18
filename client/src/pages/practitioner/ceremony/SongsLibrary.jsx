import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyCeremonies, getCeremony } from "../../../api/ceremonies.api";
import YouTubeAudioPlayer from "../../../components/common/YouTubeAudioPlayer";

const SongsLibrary = () => {
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getMyCeremonies()
      .then(async ceremonies => {
        const details = await Promise.all(
          ceremonies.filter(c => c.status !== "draft").map(c => getCeremony(c.id))
        );
        const result = details
          .map(d => ({ ceremony: d, songs: d.songs || [] }))
          .filter(g => g.songs.length > 0);
        setGrouped(result);
      })
      .catch(() => setError("Failed to load songs."))
      .finally(() => setLoading(false));
  }, []);

  const totalSongs = grouped.reduce((acc, g) => acc + g.songs.length, 0);

  return (
    <div className="p-6 space-y-5">

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
        <h1 className="text-xl font-black text-white">Songs Library</h1>
        <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
          {loading
            ? "Loading…"
            : `${totalSongs} song${totalSongs !== 1 ? "s" : ""} across ${grouped.length} ceremon${grouped.length !== 1 ? "ies" : "y"}`}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 bg-white space-y-3"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              {[...Array(3)].map((_, j) => <div key={j} className="h-10 bg-slate-50 rounded-xl" />)}
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "#f1f5f9" }}>
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-500">No songs added yet</p>
          <p className="text-xs text-slate-400 mt-1">Add songs to your ceremonies to see them here.</p>
          <Link to="/practitioner/ceremonies"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white mt-4"
            style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
            Go to My Ceremonies
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ ceremony, songs }) => (
            <div key={ceremony.id} className="rounded-2xl p-5"
              style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>

              {/* Ceremony heading */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">{ceremony.name}</h2>
                  {ceremony.month_celebrated && (
                    <p className="text-xs text-slate-400 mt-0.5">{ceremony.month_celebrated}</p>
                  )}
                </div>
                <Link to={`/practitioner/ceremonies/${ceremony.id}/edit`}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
                  Edit ceremony →
                </Link>
              </div>

              {/* Songs */}
              <div className="space-y-2">
                {songs.map(song => (
                  <div key={song.id} className="rounded-xl p-3"
                    style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(0,35,149,0.08)" }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#002395" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{song.title}</p>
                    </div>
                    {song.description && (
                      <p className="text-xs text-slate-500 mb-2">{song.description}</p>
                    )}
                    {song.audio_url && (
                      <YouTubeAudioPlayer url={song.audio_url} title={song.title} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SongsLibrary;
