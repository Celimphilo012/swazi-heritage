import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getCinemaSession } from "../../api/cinema.api";

const CinemaRoom = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCinemaSession(id)
      .then(setSession)
      .catch(() => setError("Session not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="aspect-video bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error || "Session not found."}
        </div>
        <Link to="/cinema" className="mt-4 inline-block text-sm text-red-800 hover:underline">← Back to Cinema</Link>
      </div>
    );
  }

  const toEmbedUrl = (url) => {
    if (!url) return url;
    const yt = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
    return url;
  };

  const embedUrl = toEmbedUrl(session.stream_url);
  const isVideo = session.stream_url?.match(/\.(mp4|webm|ogg)(\?.*)?$/i);

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/cinema" className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-4">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Cinema
      </Link>

      <div className="mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
          {session.status === "live" && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize">
            {session.type}
          </span>
        </div>
        {session.description && (
          <p className="text-sm text-gray-600 mt-2">{session.description}</p>
        )}
        {session.booking_count !== undefined && (
          <p className="text-xs text-gray-400 mt-1">{session.booking_count} attendees</p>
        )}
      </div>

      {/* Stream player */}
      <div className="rounded-2xl overflow-hidden bg-black aspect-video mb-4">
        {isVideo ? (
          <video src={session.stream_url} controls autoPlay className="w-full h-full" />
        ) : (
          <iframe
            src={embedUrl}
            title={session.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        )}
      </div>

      {session.status === "ended" && (
        <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-600 text-center">
          This session has ended. Thank you for watching!
        </div>
      )}

      {/* Fallback for videos that block embedding */}
      {!isVideo && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-400 mb-1">
            If the video above doesn't play, the owner may have disabled embedding.
          </p>
          <a
            href={session.stream_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
};

export default CinemaRoom;
