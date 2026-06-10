import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { getCeremony } from "../../api/ceremonies.api";
import { getCeremonyRatings, rateCeremony } from "../../api/ratings.api";
import YouTubeAudioPlayer from "../../components/common/YouTubeAudioPlayer";
import { useLang, t } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
const CultureMap = lazy(() => import("../../components/common/CultureMap"));

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

/* ── Star rating display ── */
const Stars = ({ score, size = 16, interactive = false, onRate }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <svg key={n} style={{ width: size, height: size, cursor: interactive ? 'pointer' : 'default' }}
        fill={n <= score ? '#FFD600' : 'none'} viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={1.5}
        onClick={() => interactive && onRate && onRate(n)}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ))}
  </div>
);

/* ── Ratings section ── */
const RatingsSection = ({ ceremonyId }) => {
  const { user } = useAuth();
  const [data,        setData]        = useState({ reviews: [], summary: {} });
  const [hovered,     setHovered]     = useState(0);
  const [myScore,     setMyScore]     = useState(0);
  const [myComment,   setMyComment]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [msg,         setMsg]         = useState("");

  useEffect(() => {
    getCeremonyRatings(ceremonyId).then(setData).catch(() => {});
  }, [ceremonyId]);

  const handleSubmit = async () => {
    if (!myScore) return;
    setSubmitting(true); setMsg("");
    try {
      const summary = await rateCeremony(ceremonyId, { score: myScore, comment: myComment.trim() || undefined });
      setData(d => ({ ...d, summary }));
      setMsg("Thank you for your feedback!");
      getCeremonyRatings(ceremonyId).then(setData).catch(() => {});
    } catch { setMsg("Failed to save rating. Please try again."); }
    finally { setSubmitting(false); }
  };

  const { summary = {}, reviews = [] } = data;

  return (
    <div className="mt-8 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ background: "#e5e7eb" }} />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Community Reviews</span>
        <div className="h-px flex-1" style={{ background: "#e5e7eb" }} />
      </div>

      {/* Summary */}
      {summary.count > 0 && (
        <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="text-center">
            <div className="text-3xl font-black text-gray-900">{summary.average}</div>
            <Stars score={Math.round(summary.average)} size={14} />
            <div className="text-xs text-gray-400 mt-1">{summary.count} review{summary.count !== 1 ? 's' : ''}</div>
          </div>
          <div className="flex-1 space-y-1">
            {[5,4,3,2,1].map(n => {
              const cnt = reviews.filter(r => r.score === n).length;
              const pct = summary.count ? (cnt / summary.count) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-2">{n}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#FFD600" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit form */}
      {user ? (
        <div className="mb-6 rounded-2xl border border-gray-100 shadow-sm p-5 bg-white">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Rate this ceremony</p>
          <div className="flex gap-1 mb-3"
            onMouseLeave={() => setHovered(0)}>
            {[1,2,3,4,5].map(n => (
              <svg key={n} style={{ width: 28, height: 28, cursor: 'pointer' }}
                fill={n <= (hovered || myScore) ? '#FFD600' : 'none'}
                viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={1.5}
                onMouseEnter={() => setHovered(n)}
                onClick={() => setMyScore(n)}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ))}
            {myScore > 0 && (
              <span className="ml-2 text-xs text-gray-500 self-center">
                {["","Poor","Fair","Good","Very Good","Excellent"][myScore]}
              </span>
            )}
          </div>
          <textarea rows={2} value={myComment} onChange={e => setMyComment(e.target.value)}
            placeholder="Share your experience with this ceremony (optional)…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none mb-3" />
          {msg && (
            <p className="text-xs mb-2" style={{ color: msg.startsWith('Thank') ? '#10b981' : '#CE1126' }}>{msg}</p>
          )}
          <button onClick={handleSubmit} disabled={!myScore || submitting}
            className="text-sm font-bold px-5 py-2 rounded-xl text-white transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-500">
            <Link to="/login" className="font-semibold hover:underline" style={{ color: "#002395" }}>Sign in</Link>
            {" "}to leave a review.
          </p>
        </div>
      )}

      {/* Review list */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-800">{r.user_name}</span>
                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <Stars score={r.score} size={14} />
              {r.comment && <p className="text-xs text-gray-600 mt-2 leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">No reviews yet. Be the first to share your experience.</p>
      )}
    </div>
  );
};

/* ── Walkthrough step card ── */
const StepCard = ({ step }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 flex flex-col items-center">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm"
           style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
        {step.step_number}
      </div>
      <div className="w-0.5 flex-1 mt-2" style={{ background: "#e5e7eb", minHeight: 16 }} />
    </div>
    <div className="pb-6 flex-1 min-w-0">
      <h3 className="font-bold text-sm text-gray-900 mb-1">{step.title}</h3>
      {step.description && (
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{step.description}</p>
      )}
      {step.media_url && (
        <img src={step.media_url} alt={step.title}
          className="mt-3 rounded-xl w-full max-h-64 object-cover border border-gray-100"
          onError={e => { e.target.style.display = 'none'; }} />
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
  const { lang } = useLang();
  const { user } = useAuth();
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
    { id: "about",     label: "About" },
    ...(ceremony.steps?.length    > 0 ? [{ id: "walkthrough", label: `Walkthrough (${ceremony.steps.length})` }] : []),
    ...(ceremony.imvunulo?.length > 0 ? [{ id: "attire",      label: `Attire (${ceremony.imvunulo.length})`   }] : []),
    ...(ceremony.songs?.length    > 0 ? [{ id: "songs",       label: `Songs (${ceremony.songs.length})`       }] : []),
    ...(ceremony.latitude         ? [{ id: "location",        label: "Location" }]                               : []),
  ];

  const displayName = t(lang, ceremony, 'name', 'swati_name');
  const displayDesc = t(lang, ceremony, 'description', 'swati_description');

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
            {displayName}
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
                {displayDesc ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
                        style={{ color: "#002395" }}>
                      About this ceremony
                    </h2>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {displayDesc}
                    </p>
                    {lang === 'ss' && !ceremony.swati_description && (
                      <p className="text-xs text-gray-400 mt-2 italic">siSwati translation not available — showing English.</p>
                    )}
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

                {!displayDesc && !ceremony.immunology_notes && (
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

            {/* WALKTHROUGH */}
            {activeTab === "walkthrough" && (
              ceremony.steps?.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest mb-5"
                      style={{ color: "#002395" }}>
                    Step-by-step walkthrough
                  </h2>
                  <div>
                    {ceremony.steps.map(step => <StepCard key={step.id} step={step} />)}
                  </div>
                </div>
              ) : (
                <SectionEmpty message="No walkthrough steps documented for this ceremony yet." />
              )
            )}

            {/* LOCATION */}
            {activeTab === "location" && ceremony.latitude && (
              <div className="space-y-4">
                {ceremony.location_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#CE1126" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {ceremony.location_name}
                  </div>
                )}
                <Suspense fallback={<div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />}>
                  <CultureMap
                    markers={[{ lat: ceremony.latitude, lng: ceremony.longitude, title: displayName, subtitle: ceremony.location_name, type: 'ceremony' }]}
                    height={340}
                    zoom={11}
                    fitBounds={false}
                    center={[ceremony.latitude, ceremony.longitude]}
                  />
                </Suspense>
              </div>
            )}
          </div>

          {/* ══ RATINGS ══ */}
          <RatingsSection ceremonyId={id} />
        </div>
      </div>
    </div>
  );
};

export default CeremonyDetail;
