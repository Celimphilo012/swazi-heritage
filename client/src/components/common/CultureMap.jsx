import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MARKER_COLORS = {
  ceremony: '#002395',
  lineage:  '#CE1126',
  clan:     '#b86800',
};

const makeIcon = (type) => L.divIcon({
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:${MARKER_COLORS[type] || '#002395'};
    border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
    transform:rotate(-45deg);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
  className: '',
});

// Uses vanilla Leaflet (no react-leaflet) to avoid React 18.3 context incompatibility.
// markers: [{ lat, lng, title, subtitle?, type: 'ceremony'|'lineage'|'clan' }]
const CultureMap = ({ markers = [], center, zoom = 8, height = 400, fitBounds = true }) => {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const ESWATINI = [-26.5225, 31.4659];

    // mysql2 returns DECIMAL as strings — coerce to float
    const valid = markers
      .map(m => ({ ...m, lat: parseFloat(m.lat), lng: parseFloat(m.lng) }))
      .filter(m => !isNaN(m.lat) && !isNaN(m.lng));

    const resolvedCenter = center
      ? [parseFloat(center[0]), parseFloat(center[1])]
      : (valid.length === 1 ? [valid[0].lat, valid[0].lng] : ESWATINI);

    const map = L.map(containerRef.current, {
      center: resolvedCenter,
      zoom,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    valid.forEach(m => {
      L.marker([m.lat, m.lng], { icon: makeIcon(m.type) })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:140px">
            <p style="font-weight:700;font-size:13px;margin:0 0 2px">${m.title}</p>
            ${m.subtitle ? `<p style="font-size:11px;color:#6b7280;margin:0">${m.subtitle}</p>` : ''}
          </div>
        `);
    });

    if (fitBounds && valid.length > 1) {
      map.fitBounds(valid.map(m => [m.lat, m.lng]), { padding: [40, 40] });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}
    />
  );
};

export default CultureMap;
