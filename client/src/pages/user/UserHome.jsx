import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPublishedCeremonies } from "../../api/ceremonies.api";
import { getPublishedLineage } from "../../api/lineage.api";

const FACTS = [
  "The Kingdom of Eswatini is one of Africa's last absolute monarchies",
  "Incwala — the sacred First Fruits ceremony — celebrates the power of the king",
  "Umhlanga (Reed Dance) unites thousands of Swazi maidens each August",
  "The sibhaca dance is famous across southern Africa for its energetic high kicks",
  "Swazi emahiya cloth features vibrant geometric weave patterns passed down for generations",
];

/* ── Floating diamond particles (emahiya-inspired motif) ── */
const DIAMONDS = [
  { s: 14, x: "6%",  y: "22%", d: "0s",   t: "4.2s", c: "#FFD600" },
  { s:  8, x: "15%", y: "65%", d: "1.1s", t: "5.4s", c: "#ffffff" },
  { s: 18, x: "28%", y: "33%", d: "0.5s", t: "3.8s", c: "#CE1126" },
  { s: 10, x: "42%", y: "70%", d: "2.0s", t: "5.0s", c: "#FFD600" },
  { s: 12, x: "60%", y: "20%", d: "0.3s", t: "4.6s", c: "#ffffff" },
  { s:  7, x: "73%", y: "60%", d: "1.5s", t: "3.5s", c: "#FFD600" },
  { s: 15, x: "83%", y: "38%", d: "0.8s", t: "4.9s", c: "#CE1126" },
  { s:  9, x: "92%", y: "72%", d: "1.8s", t: "4.1s", c: "#ffffff" },
];

const DiamondParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {DIAMONDS.map((d, i) => (
      <div key={i} className="absolute" style={{
        width: d.s, height: d.s,
        left: d.x, top: d.y,
        background: d.c,
        animationName: "floatDiamond",
        animationDuration: d.t,
        animationDelay: d.d,
        animationIterationCount: "infinite",
        animationTimingFunction: "ease-in-out",
      }} />
    ))}
  </div>
);

/* ── Swazi Nguni shield with spears ── */
const ShieldSVG = ({ style }) => (
  <svg style={style} viewBox="0 0 80 104" fill="none" xmlns="http://www.w3.org/2000/svg" width="96" height="104">
    {/* Left spear */}
    <line x1="14" y1="4"  x2="14" y2="100" stroke="#A07840" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
    <polygon points="14,2 9,16 19,16"  fill="#C0C0C0" opacity="0.85"/>
    {/* Right spear */}
    <line x1="66" y1="4"  x2="66" y2="100" stroke="#A07840" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
    <polygon points="66,2 61,16 71,16" fill="#C0C0C0" opacity="0.85"/>
    {/* Shield body */}
    <path d="M40,5 C56,5 68,18 68,40 C68,64 56,88 40,100 C24,88 12,64 12,40 C12,18 24,5 40,5Z"
          fill="white" stroke="#111" strokeWidth="1.5"/>
    {/* Black left half */}
    <clipPath id="sh-clip">
      <path d="M40,5 C56,5 68,18 68,40 C68,64 56,88 40,100 C24,88 12,64 12,40 C12,18 24,5 40,5Z"/>
    </clipPath>
    <rect x="12" y="5" width="28" height="95" fill="#111" clipPath="url(#sh-clip)"/>
    {/* White horizontal stripe */}
    <path d="M14,42 Q40,35 66,42" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
    {/* Central stick */}
    <line x1="40" y1="3" x2="40" y2="101" stroke="#7B4A28" strokeWidth="3.5" strokeLinecap="round"/>
    <circle cx="40" cy="2" r="4" fill="#FFD600"/>
  </svg>
);

/* ── Hooks ── */
const useFadeIn = (threshold = 0.1) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); ob.disconnect(); } },
      { threshold }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return [ref, visible];
};

const useCountUp = (target, active, ms = 1200) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (!target) { setN(0); return; }
    let cur = 0;
    const step = target / (ms / 16);
    const id = setInterval(() => {
      cur += step;
      if (cur >= target) { setN(target); clearInterval(id); }
      else setN(Math.floor(cur));
    }, 16);
    return () => clearInterval(id);
  }, [active, target, ms]);
  return n;
};

/* ── Cards ── */
const CeremonyCard = ({ c }) => (
  <Link to={`/explore/ceremonies/${c.id}`}
    className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 block">
    <div className="h-1" style={{ background: "linear-gradient(90deg,#002395,#FFD600,#CE1126)" }} />
    <div className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-800 transition-colors">{c.name}</h3>
      {c.month_celebrated && <p className="text-xs text-gray-400 mt-1">{c.month_celebrated}</p>}
      {c.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{c.description}</p>}
      <span className="inline-block mt-3 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#CE1126" }}>
        Learn more →
      </span>
    </div>
  </Link>
);

const LineageCard = ({ r }) => (
  <Link to="/explore/lineage"
    className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 block">
    <div className="h-1" style={{ background: "linear-gradient(90deg,#FFD600,#CE1126)" }} />
    <div className="p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
           style={{ background: "#002395" }}>
        {r.title?.[0]?.toUpperCase() ?? "L"}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-800 transition-colors truncate">{r.title}</h3>
        {r.era && <p className="text-xs text-gray-400 mt-0.5">{r.era}</p>}
        {r.description && <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{r.description}</p>}
      </div>
    </div>
  </Link>
);

/* ── Skeleton ── */
const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="h-1 bg-gray-200" />
    <div className="p-5 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
    </div>
  </div>
);

/* ── Page ── */
const UserHome = () => {
  const { user } = useAuth();
  const [ceremonies, setCeremonies] = useState([]);
  const [lineage,    setLineage]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [factIdx,    setFactIdx]    = useState(0);
  const [factOn,     setFactOn]     = useState(true);

  const [statsRef, statsVisible] = useFadeIn(0.05);

  const ceremCount   = useCountUp(ceremonies.length, statsVisible, 1000);
  const linCount     = useCountUp(lineage.length,    statsVisible, 1000);
  const foundedCount = useCountUp(1815,              statsVisible, 1800);

  useEffect(() => {
    Promise.all([getPublishedCeremonies({ limit: 6 }), getPublishedLineage({ limit: 4 })])
      .then(([c, l]) => { setCeremonies(c.data || []); setLineage(l.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setFactOn(false);
      setTimeout(() => { setFactIdx(i => (i + 1) % FACTS.length); setFactOn(true); }, 350);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="-mt-8 -mx-4">

      {/* ══ HERO ══ */}
      <section
        className="relative overflow-hidden px-6 pt-20 pb-24 text-center"
        style={{
          background: "linear-gradient(160deg,#001540 0%,#002d80 55%,#001540 100%)",
          borderBottomLeftRadius: "2.5rem",
          borderBottomRightRadius: "2.5rem",
        }}>

        {/* Flag stripe at top */}
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 10 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div style={{ width: "7%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
          <div style={{ width: "7%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#002395" }} />
        </div>

        <DiamondParticles />

        {/* Shield */}
        <div className="relative z-10 flex justify-center mb-6">
          <ShieldSVG style={{
            filter: "drop-shadow(0 0 20px rgba(255,214,0,0.4))",
            animationName: "pulseShield",
            animationDuration: "3s",
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
          }} />
        </div>

        {/* Headline */}
        <h1 className="relative z-10 text-4xl md:text-5xl font-bold text-white mb-3 animate-fade-in-down"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.55)" }}>
          Swazi Cultural Heritage
        </h1>

        {/* Flag-colour divider dots */}
        <div className="relative z-10 flex justify-center gap-2 mb-4">
          <div className="h-1 w-10 rounded-full" style={{ background: "#002395" }} />
          <div className="h-1 w-10 rounded-full" style={{ background: "#FFD600" }} />
          <div className="h-1 w-10 rounded-full" style={{ background: "#CE1126" }} />
        </div>

        <p className="relative z-10 text-base md:text-lg max-w-xl mx-auto mb-4 animate-fade-in-up"
           style={{ color: "#93c5fd", animationDelay: "0.2s" }}>
          Preserving the rich traditions, royal lineages, and ceremonies of the Kingdom of Eswatini
        </p>

        {/* Rotating cultural fact */}
        <div className="relative z-10 flex items-center justify-center mb-8" style={{ minHeight: 28 }}>
          <p className="text-sm italic max-w-lg mx-auto transition-opacity duration-300"
             style={{ color: "#FFD600", opacity: factOn ? 1 : 0 }}>
            "{FACTS[factIdx]}"
          </p>
        </div>

        {/* CTAs */}
        <div className="relative z-10 flex flex-wrap justify-center gap-3 animate-fade-in-up"
             style={{ animationDelay: "0.4s" }}>
          <Link to="/explore"
            className="font-bold px-7 py-2.5 rounded-lg transition-all hover:scale-105 hover:brightness-110"
            style={{ background: "#FFD600", color: "#001540" }}>
            Explore Ceremonies
          </Link>
          <Link to={user ? "/chat" : "/login"}
            className="font-medium px-7 py-2.5 rounded-lg text-white border transition-all hover:scale-105 hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}>
            {user ? "Ask AI About Culture" : "Sign In to Explore"}
          </Link>
        </div>
      </section>

      {/* ══ CONTENT ══ */}
      <div className="px-4">

        {/* STATS BAR */}
        <div ref={statsRef}
          className={`my-8 rounded-2xl overflow-hidden shadow-lg transition-all duration-700 ${statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ background: "linear-gradient(135deg,#001540,#002d80)" }}>
          <div className="grid grid-cols-3 divide-x divide-blue-900/50">
            {[
              {
                val: ceremCount, label: "Ceremonies",
                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>,
              },
              {
                val: linCount, label: "Lineage Records",
                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
              },
              {
                val: foundedCount, label: "Kingdom Founded",
                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>,
              },
            ].map((s, i) => (
              <div key={i} className="py-6 px-4 text-center">
                <div className="flex justify-center mb-2">{s.icon}</div>
                <div className="text-3xl font-bold" style={{ color: "#FFD600" }}>{s.val}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(147,197,253,0.85)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURED CEREMONIES */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Featured Ceremonies</h2>
              <p className="text-xs text-gray-400 mt-0.5">Sacred traditions of Eswatini</p>
            </div>
            <Link to="/explore" className="text-sm font-medium hover:underline" style={{ color: "#CE1126" }}>View all →</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : ceremonies.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No ceremonies published yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ceremonies.map(c => <CeremonyCard key={c.id} c={c} />)}
            </div>
          )}
        </section>

        {/* ROYAL LINEAGE */}
        {lineage.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Royal Lineage Records</h2>
                <p className="text-xs text-gray-400 mt-0.5">The lineage of Swazi kings and clans</p>
              </div>
              <Link to="/explore/lineage" className="text-sm font-medium hover:underline" style={{ color: "#CE1126" }}>View all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lineage.map(r => <LineageCard key={r.id} r={r} />)}
            </div>
          </section>
        )}

        {/* DISCOVER MORE */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Discover More</h2>
          <p className="text-xs text-gray-400 mb-5">Explore all aspects of Swazi cultural heritage</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Explore Culture */}
            <div className="rounded-xl overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                 style={{ background: "linear-gradient(145deg,#001540,#0030a0)" }}>
              <div className="p-6 text-white">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                     style={{ background: "rgba(255,214,0,0.12)", border: "1px solid rgba(255,214,0,0.2)" }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <h3 className="font-semibold mb-1.5">Explore Culture</h3>
                <p className="text-xs mb-5" style={{ color: "rgba(147,197,253,0.9)" }}>
                  Browse ceremonies, songs, and traditional attire of Eswatini
                </p>
                <Link to="/explore"
                  className="inline-block text-xs font-bold px-4 py-1.5 rounded-full transition-all group-hover:scale-105"
                  style={{ background: "#FFD600", color: "#001540" }}>
                  Browse →
                </Link>
              </div>
            </div>

            {/* AI Chat */}
            <div className="rounded-xl overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                 style={{ background: "linear-gradient(145deg,#6B0010,#CE1126)" }}>
              <div className="p-6 text-white">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                     style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                  </svg>
                </div>
                <h3 className="font-semibold mb-1.5">AI Cultural Chat</h3>
                <p className="text-xs mb-5" style={{ color: "rgba(254,202,202,0.9)" }}>
                  Ask our AI assistant anything about Swazi culture and traditions
                </p>
                <Link to={user ? "/chat" : "/login"}
                  className="inline-block text-xs font-bold px-4 py-1.5 rounded-full bg-white transition-all group-hover:scale-105"
                  style={{ color: "#CE1126" }}>
                  {user ? "Ask now →" : "Sign in →"}
                </Link>
              </div>
            </div>

            {/* Cinema */}
            <div className="rounded-xl overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                 style={{ background: "linear-gradient(145deg,#2C1800,#6B3E00)" }}>
              <div className="p-6 text-white">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                     style={{ background: "rgba(255,214,0,0.12)", border: "1px solid rgba(255,214,0,0.2)" }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#FFD600" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.868V15.132a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 className="font-semibold mb-1.5">Cultural Cinema</h3>
                <p className="text-xs mb-5" style={{ color: "rgba(253,230,138,0.9)" }}>
                  Watch live and recorded traditional cultural events
                </p>
                <Link to="/cinema"
                  className="inline-block text-xs font-bold px-4 py-1.5 rounded-full transition-all group-hover:scale-105"
                  style={{ background: "#FFD600", color: "#2C1800" }}>
                  View sessions →
                </Link>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};

export default UserHome;
