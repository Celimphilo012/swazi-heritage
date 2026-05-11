import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getCeremony } from "../../api/ceremonies.api";
import YouTubeAudioPlayer from "../../components/common/YouTubeAudioPlayer";

const GENDER_LABEL = { male: "Men", female: "Women", both: "All", child: "Children" };

const ImvunuloCard = ({ item }) => {
  const displayImage = item.image_url || item.preset_image_url;
  return (
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
    {displayImage ? (
      <img
        src={displayImage}
        alt={item.preset_name}
        className="w-full h-32 object-cover rounded-lg mb-3"
        onError={(e) => { e.target.style.display = "none"; }}
      />
    ) : (
      <div className="w-full h-32 bg-amber-50 rounded-lg mb-3 flex items-center justify-center">
        <svg className="w-10 h-10 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
        </svg>
      </div>
    )}
    <p className="font-semibold text-sm text-gray-900">{item.preset_name}</p>
    {item.gender && (
      <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
        {GENDER_LABEL[item.gender] || item.gender}
      </span>
    )}
    {item.color_desc && <p className="text-xs text-gray-500 mt-1.5">{item.color_desc}</p>}
    {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
  </div>
  );
};

const SongItem = ({ song }) => (
  <div className="border border-gray-100 rounded-xl p-4 bg-white">
    <p className="font-medium text-sm text-gray-900">{song.title}</p>
    {song.description && <p className="text-xs text-gray-500 mt-1">{song.description}</p>}
    {song.audio_url && <YouTubeAudioPlayer url={song.audio_url} title={song.title} />}
  </div>
);

const CeremonyDetail = () => {
  const { id } = useParams();
  const [ceremony, setCeremony] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getCeremony(id)
      .then(setCeremony)
      .catch(() => setError("Ceremony not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="card space-y-2 mt-4">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-5/6" />
          <div className="h-3 bg-gray-100 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (error || !ceremony) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error || "Ceremony not found."}
        </div>
        <Link to="/explore" className="mt-4 inline-block text-sm text-red-800 hover:underline">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/explore" className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Explore
      </Link>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{ceremony.name}</h1>
        {ceremony.month_celebrated && (
          <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {ceremony.month_celebrated}
          </p>
        )}
        {ceremony.creator_name && (
          <p className="text-xs text-gray-400 mt-1">
            Documented by {ceremony.creator_name}
          </p>
        )}
      </div>

      {/* Description */}
      {ceremony.description && (
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">About</h2>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{ceremony.description}</p>
        </div>
      )}

      {/* Immunology notes */}
      {ceremony.immunology_notes && (
        <div className="card mb-4 border-l-4 border-l-green-500">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Health &amp; Immunology Notes
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ceremony.immunology_notes}</p>
        </div>
      )}

      {/* Traditional Attire */}
      {ceremony.imvunulo?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Traditional Attire (Imvunulo)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ceremony.imvunulo.map((item) => (
              <ImvunuloCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Songs */}
      {ceremony.songs?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Ceremony Songs
            <span className="ml-2 text-sm font-normal text-gray-400">
              {ceremony.songs.length} {ceremony.songs.length === 1 ? "song" : "songs"}
            </span>
          </h2>
          <div className="space-y-3">
            {ceremony.songs.map((song) => <SongItem key={song.id} song={song} />)}
          </div>
        </div>
      )}

      {/* Empty state for no songs / imvunulo */}
      {!ceremony.imvunulo?.length && !ceremony.songs?.length && (
        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
          No songs or attire documented for this ceremony yet.
        </div>
      )}
    </div>
  );
};

export default CeremonyDetail;
