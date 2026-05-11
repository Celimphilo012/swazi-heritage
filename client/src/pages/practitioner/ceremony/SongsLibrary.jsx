import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyCeremonies } from "../../../api/ceremonies.api";
import { getCeremony } from "../../../api/ceremonies.api";

const SongsLibrary = () => {
  const [grouped, setGrouped] = useState([]); // [{ceremony, songs:[]}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyCeremonies()
      .then(async (ceremonies) => {
        const details = await Promise.all(
          ceremonies.filter((c) => c.status !== "draft").map((c) => getCeremony(c.id))
        );
        const result = details
          .map((d) => ({ ceremony: d, songs: d.songs || [] }))
          .filter((g) => g.songs.length > 0);
        setGrouped(result);
      })
      .catch(() => setError("Failed to load songs."))
      .finally(() => setLoading(false));
  }, []);

  const totalSongs = grouped.reduce((acc, g) => acc + g.songs.length, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Songs Library</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading ? "Loading…" : `${totalSongs} song${totalSongs !== 1 ? "s" : ""} across ${grouped.length} ceremonies`}
        </p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              {[...Array(3)].map((_, j) => <div key={j} className="h-8 bg-gray-100 rounded" />)}
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No songs added yet</p>
          <p className="text-xs text-gray-400 mt-1">Add songs to your ceremonies to see them here.</p>
          <Link to="/practitioner/ceremonies" className="btn-primary inline-flex mt-4 text-xs">
            Go to My Ceremonies
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ ceremony, songs }) => (
            <div key={ceremony.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{ceremony.name}</h2>
                  {ceremony.month_celebrated && (
                    <p className="text-xs text-gray-500">{ceremony.month_celebrated}</p>
                  )}
                </div>
                <Link to={`/practitioner/ceremonies/${ceremony.id}/edit`}
                  className="text-xs text-gray-500 hover:text-gray-800">
                  Edit ceremony →
                </Link>
              </div>
              <div className="space-y-2">
                {songs.map((song) => {
                  const ytMatch = song.audio_url?.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                  const ytEmbed = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` : null;
                  return (
                    <div key={song.id} className="border border-gray-100 rounded-xl p-3">
                      <p className="text-sm font-medium text-gray-900">{song.title}</p>
                      {song.description && <p className="text-xs text-gray-500 mt-0.5">{song.description}</p>}
                      {song.audio_url && (
                        ytEmbed ? (
                          <div className="mt-2 rounded-lg overflow-hidden aspect-video">
                            <iframe src={ytEmbed} title={song.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen className="w-full h-full border-0" />
                          </div>
                        ) : (
                          <audio controls src={song.audio_url} className="w-full mt-2" style={{ height: "36px" }} />
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SongsLibrary;
