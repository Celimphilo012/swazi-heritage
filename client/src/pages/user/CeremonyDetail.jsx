import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getCeremony } from "../../api/ceremonies.api";
import YouTubeAudioPlayer from "../../components/common/YouTubeAudioPlayer";

const GENDER_LABEL = { male: "Men", female: "Women", both: "All", child: "Children" };
const GENDER_STYLE = {
  male:   { background: "#dbeafe", color: "#1d4ed8" },
  female: { background: "#fce7f3", color: "#be185d" },
  both:   { background: "#dcfce7", color: "#15803d" },
  child:  { background: "#fef9c3", color: "#854d0e" },
};

/* ── Flag stripe ── */
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
  { s: 10, x: "4%",  y: "25%", d: "0s",   t: "4.5s", c: "#FFD600" },
  { s:  6, x: "20%", y: "60%", d: "1.3s", t: "5.2s", c: "#fff"    },
  { s: 14, x: "38%", y: "28%", d: "0.6s", t: "3.9s", c: "#CE1126" },
  { s:  8, x: "65%", y: "68%", d: "2.1s", t: "5.0s", c: "#FFD600" },
  { s: 11, x: "78%", y: "20%", d: "0.4s", t: "4.7s", c: "#fff"    },
  { s:  7, x: "91%", y: "55%", d: "1.6s", t: "3.6s", c: "#FFD600" },
];
const DiamondParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {DIAMONDS.map((d, i) => (
      <div key={i} className="absolute" style={{
        width: d.s, height: d.s,
        left: d.x, top: d.y,
        background: d.c, opacity: 0.15,
        animationName: "floatDiamond",
        animationDuration: d.t,
        animationDelay: d.d,
        animationIterationCount: "infinite",
        animationTimingFunction: "ease-in-out",
      }} />
    ))}
  </div>
);

/* ── Attire card ── */
const ImvunuloCard = ({ item }) => {
  const display = item.image_url || item.preset_image_url;
  const gStyle  = GENDER_STYLE[item.gender] || { background: "#f3f4f6", color: "#4b5563" };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      {/* Image area */}
      <div className="relative overflow-hidden" style={{ height: 140 }}>
        {display ? (
          <img src={display} alt={item.preset_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.parentElement.innerHTML = placeholder; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ background: "linear-gradient(135deg,#fef9c3,#fde68a)" }}>
            <svg className="w-12 h-12" style={{ color: "#d97706" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
            </svg>
          </div>
        )}
        {/* Flag accent at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: 3 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div className="flex-1" style={{ background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
        </div>
      </div>

      <div className="p-4">
        <p className="font-bold text-sm text-gray-900 mb-2">{item.preset_name}</p>
        <div className="flex flex-wrap gap-1.5">
          {item.gender && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={gStyle}>
              {GENDER_LABEL[item.gender] || item.gender}
            </span>
          )}
        </div>
        {item.color_desc && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.color_desc}</p>
        )}
        {item.notes && (
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.notes}</p>
        )}
      </div>
    </div>
  );
};

/* ── Song item ── */
const SongItem = ({ song, index }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    {/* Coloured top strip cycling flag colors */}
    <div className="h-1.5" style={{
      background: index % 3 === 0
        ? "linear-gradient(90deg,#002395,#1a4db0)"
        : index % 3 === 1
          ? "linear-gradient(90deg,#9b0018,#CE1126)"
          : "linear-gradient(90deg,#5a3200,#b86800)",
    }} />
    <div className="p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
             style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-gray-900">{song.title}</p>
          {song.description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{song.description}</p>
          )}
        </div>
        <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#dbeafe", color: "#1d4ed8" }}>
          #{index + 1}
        </span>
      </div>
      {song.audio_url && (
        <div className="mt-4">
          <YouTubeAudioPlayer url={song.audio_url} title={song.title} />
        </div>
      )}
    </div>
  </div>
);

/* ── Empty section state ── */
const SectionEmpty = ({ message }) => (
  <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-100">
    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
         style={{ background: "#f3f4f6" }}>
      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    <p className="text-sm text-gray-400">{message}</p>
  </div>
);

/* ── Loading skeleton ── */
const LoadingSkeleton = () => (
  <div className="-mt-8 -mx-4 animate-pulse">
    <div className="h-52" style={{ background: "linear-gradient(160deg,#001540,#002d80)" }} />
    <div className="px-4 mt-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex gap-2">
        {[1, 2, 3].map(i => <div key={i} className="h-10 flex-1 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="h-24 bg-gray-100 rounded-2xl" />
    </div>
  </div>
);

/* ── Page ── */
const CeremonyDetail = () => {
  const { id } = useParams();
  const [ceremony,  setCeremony]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    setLoading(true);
    setActiveTab("about");
    getCeremony(id)
      .then(setCeremony)
      .catch(() => setError("Ceremony not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error || !ceremony) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error || "Ceremony not found."}</div>
        <Link to="/explore" className="mt-4 inline-block text-sm text-red-800 hover:underline">← Back to Explore</Link>
      </div>
    );
  }

  const tabs = [
    { id: "about",  label: "About" },
    ...(ceremony.imvunulo?.length > 0 ? [{ id: "attire", label: `Attire (${ceremony.imvunulo.length})` }] : []),
    ...(ceremony.songs?.length    > 0 ? [{ id: "songs",  label: `Songs (${ceremony.songs.length})`    }] : []),
  ];

  return (
    <div className="-mt-8 -mx-4">

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden px-6 pt-16 pb-14"
        style={{
          background: "linear-gradient(160deg,#001540 0%,#002d80 55%,#001540 100%)",
          borderBottomLeftRadius: "2.5rem",
          borderBottomRightRadius: "2.5rem",
        }}>
        <FlagStripe />
        <DiamondParticles />

        <div className="relative z-10 max-w-3xl mx-auto">
          <Link to="/explore"
            className="inline-flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-80"
            style={{ color: "rgba(147,197,253,0.85)" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Explore
          </Link>

          {ceremony.month_celebrated && (
            <div className="mb-3">
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: "#CE1126", color: "#fff" }}>
                {ceremony.month_celebrated}
              </span>
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 animate-fade-in-down"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
            {ceremony.name}
          </h1>

          <div className="flex gap-2 mb-3">
            <div className="h-1 w-8 rounded-full" style={{ background: "#002395" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#FFD600" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#CE1126" }} />
          </div>

          {ceremony.creator_name && (
            <p className="text-xs" style={{ color: "rgba(147,197,253,0.7)" }}>
              Documented by {ceremony.creator_name}
            </p>
          )}

          {/* Quick stats */}
          <div className="flex flex-wrap gap-3 mt-5">
            {ceremony.songs?.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                   style={{ background: "rgba(255,255,255,0.1)", color: "#93c5fd" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                {ceremony.songs.length} {ceremony.songs.length === 1 ? "song" : "songs"}
              </div>
            )}
            {ceremony.imvunulo?.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                   style={{ background: "rgba(255,214,0,0.12)", color: "#FFD600" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
                </svg>
                {ceremony.imvunulo.length} attire items
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="px-4">
        <div className="max-w-3xl mx-auto">

          {/* ══ TABS ══ */}
          <div className="flex gap-1 my-6 p-1 rounded-xl" style={{ background: "#f3f4f6" }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 text-sm font-bold py-2.5 px-3 rounded-lg transition-all duration-200"
                style={activeTab === tab.id
                  ? { background: "#002395", color: "#fff", boxShadow: "0 2px 10px rgba(0,35,149,0.3)" }
                  : { color: "#6b7280", background: "transparent" }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══ TAB CONTENT ══ */}
          <div key={activeTab} className="animate-fade-in-up pb-8">

            {/* ABOUT */}
            {activeTab === "about" && (
              <div className="space-y-4">
                {ceremony.description ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
                        style={{ color: "#002395" }}>
                      About this ceremony
                    </h2>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {ceremony.description}
                    </p>
                  </div>
                ) : null}

                {ceremony.immunology_notes ? (
                  <div className="rounded-2xl p-6 border"
                       style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderColor: "#86efac" }}>
                    <h2 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5"
                        style={{ color: "#15803d" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Health &amp; Immunology Notes
                    </h2>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#166534" }}>
                      {ceremony.immunology_notes}
                    </p>
                  </div>
                ) : null}

                {!ceremony.description && !ceremony.immunology_notes && (
                  <SectionEmpty message="No description documented for this ceremony yet." />
                )}
              </div>
            )}

            {/* ATTIRE */}
            {activeTab === "attire" && (
              ceremony.imvunulo?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {ceremony.imvunulo.map(item => <ImvunuloCard key={item.id} item={item} />)}
                </div>
              ) : (
                <SectionEmpty message="No attire documented for this ceremony yet." />
              )
            )}

            {/* SONGS */}
            {activeTab === "songs" && (
              ceremony.songs?.length > 0 ? (
                <div className="space-y-3">
                  {ceremony.songs.map((song, i) => <SongItem key={song.id} song={song} index={i} />)}
                </div>
              ) : (
                <SectionEmpty message="No songs documented for this ceremony yet." />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CeremonyDetail;
