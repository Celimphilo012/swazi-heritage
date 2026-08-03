import { useState, useEffect, useRef } from "react";

// ─── Place name autocomplete (Nominatim / OpenStreetMap) ─────────────────────
const PlaceAutocomplete = ({ value, onChange, onSelect, placeholder }) => {
  const [query, setQuery]             = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [activeIdx, setActiveIdx]     = useState(-1);
  const timerRef = useRef(null);
  const wrapRef  = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q) => {
    clearTimeout(timerRef.current);
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&accept-language=en`,
          { headers: { Accept: "application/json" } }
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    search(q);
  };

  const handleSelect = (item) => {
    const name = item.display_name;
    setQuery(name);
    setOpen(false);
    onSelect({ name, lat: item.lat, lon: item.lon });
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && (
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
          <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)", marginTop: 4,
          maxHeight: 220, overflowY: "auto",
        }}>
          {suggestions.map((item, i) => (
            <button key={item.place_id} type="button" onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "9px 14px", fontSize: "0.82rem", cursor: "pointer",
                background: i === activeIdx ? "#f1f5f9" : "transparent",
                borderBottom: i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
              }}>
              <span style={{ fontWeight: 600, color: "#1e293b" }}>
                {item.display_name.split(",")[0]}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "0.75rem", marginLeft: 6 }}>
                {item.display_name.split(",").slice(1).join(",").trim()}
              </span>
            </button>
          ))}
          <div style={{ padding: "5px 14px", fontSize: "0.68rem", color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}>
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceAutocomplete;
