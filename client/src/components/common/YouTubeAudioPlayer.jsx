import { useState, useRef } from 'react';

const YT_ID = (url) =>
  url?.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];

const YouTubeAudioPlayer = ({ url, title }) => {
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef(null);
  const videoId = YT_ID(url);

  if (!videoId) {
    return <audio controls src={url} className="w-full mt-2" style={{ height: '36px' }} />;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`;

  const send = (func) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      'https://www.youtube.com'
    );
  };

  const toggle = () => {
    playing ? send('pauseVideo') : send('playVideo');
    setPlaying(!playing);
  };

  return (
    <div className="mt-2 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
      <button
        onClick={toggle}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-red-800 text-white hover:bg-red-700 transition-colors flex-shrink-0"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{title || 'Song'}</p>
        <p className="text-xs text-gray-400">YouTube</p>
      </div>
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title}
        allow="autoplay; encrypted-media"
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px' }}
      />
    </div>
  );
};

export default YouTubeAudioPlayer;
