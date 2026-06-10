import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Fits map bounds to all markers when they change
const BoundsFitter = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    const valid = markers.filter(m => m.lat != null && m.lng != null);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 10);
    } else {
      map.fitBounds(valid.map(m => [m.lat, m.lng]), { padding: [40, 40] });
    }
  }, [markers, map]);
  return null;
};

// markers: [{ lat, lng, title, subtitle?, type: 'ceremony'|'lineage'|'clan', id? }]
// height: number (px) or string
const CultureMap = ({ markers = [], center, zoom = 8, height = 400, fitBounds = true }) => {
  const ESWATINI = [-26.5225, 31.4659];
  // mysql2 returns DECIMAL columns as strings — coerce to float so Leaflet doesn't throw
  const validMarkers = markers
    .filter(m => m.lat != null && m.lng != null)
    .map(m => ({ ...m, lat: parseFloat(m.lat), lng: parseFloat(m.lng) }))
    .filter(m => !isNaN(m.lat) && !isNaN(m.lng));
  const resolvedCenter = center
    ? [parseFloat(center[0]), parseFloat(center[1])]
    : ESWATINI;

  return (
    <div style={{ height, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <MapContainer
        center={resolvedCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitBounds && <BoundsFitter markers={validMarkers} />}
        {validMarkers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]} icon={makeIcon(m.type)}>
            <Popup>
              <div style={{ minWidth: 140 }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{m.title}</p>
                {m.subtitle && <p style={{ fontSize: 11, color: '#6b7280' }}>{m.subtitle}</p>}
                {m.type && (
                  <span style={{
                    display: 'inline-block', marginTop: 4, fontSize: 10,
                    fontWeight: 700, textTransform: 'capitalize',
                    padding: '1px 7px', borderRadius: 99,
                    background: MARKER_COLORS[m.type] + '18',
                    color: MARKER_COLORS[m.type],
                  }}>{m.type}</span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CultureMap;
