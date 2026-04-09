import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Singapore bounds (with ~1.5x surrounding buffer to allow slight panning)
// SG approx bounds: lat 1.15-1.50, lng 103.55-104.10
// Buffered to ~1.5x: lat 1.00-1.65, lng 103.35-104.30
const SG_BOUNDS = [[1.00, 103.35], [1.65, 104.30]];

// Fit map to route bounds once route loads
function FitBounds({ points }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && points.length > 0) {
      const lats = points.map(p => p[0]);
      const lngs = points.map(p => p[1]);
      map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [20, 20] });
      fitted.current = true;
    }
  }, [points, map]);
  return null;
}

// Custom controls — full view + locate rider
function MapControls({ points, riderGps }) {
  const map = useMap();

  const fitRoute = () => {
    if (points.length === 0) return;
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [20, 20] });
  };

  const locateRider = () => {
    if (riderGps?.lat && riderGps?.lng) {
      map.setView([riderGps.lat, riderGps.lng], 15);
    } else if (points.length > 0) {
      // Fall back to start of route
      map.setView(points[0], 14);
    }
  };

  const btnStyle = {
    display: "block",
    width: 34,
    height: 34,
    background: "#ffffff",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 16,
    marginBottom: 4,
    padding: 0,
    color: "#333",
    fontWeight: "bold",
  };

  return (
    <div style={{ position:"absolute", top:10, right:10, zIndex:1000, display:"flex", flexDirection:"column" }}>
      <button
        onClick={fitRoute}
        title="Full route view"
        style={btnStyle}
      >
        🗺️
      </button>
      <button
        onClick={locateRider}
        title={riderGps ? "Locate rider" : "Jump to start"}
        style={{ ...btnStyle, opacity: riderGps ? 1 : 0.7 }}
      >
        📍
      </button>
    </div>
  );
}

// Parse a GPX XML string to array of [lat, lng]
const parseGpx = (xml) => {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const trkpts = doc.getElementsByTagName("trkpt");
  const points = [];
  for (let i = 0; i < trkpts.length; i++) {
    const lat = parseFloat(trkpts[i].getAttribute("lat"));
    const lng = parseFloat(trkpts[i].getAttribute("lon"));
    if (!isNaN(lat) && !isNaN(lng)) points.push([lat, lng]);
  }
  return points;
};

export default function LeafletMap({ riderGps, segments, kmDone, brightness, height = 400 }) {
  const [routePoints, setRoutePoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load route.gpx once
  useEffect(() => {
    fetch("/route.gpx")
      .then(r => {
        if (!r.ok) throw new Error("Failed to load route.gpx");
        return r.text();
      })
      .then(xml => {
        const pts = parseGpx(xml);
        setRoutePoints(pts);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // Split the route polyline at the kmDone progress mark
  // Approximate: assume route is uniformly sampled, so kmDone% of points = completed
  const totalKm = segments?.reduce((a, s) => a + s.km, 0) || 171;
  const progress = totalKm > 0 ? Math.min(kmDone / totalKm, 1) : 0;
  const splitIdx = Math.floor(routePoints.length * progress);
  const completedPath = routePoints.slice(0, Math.max(splitIdx + 1, 1));
  const remainingPath = routePoints.slice(Math.max(splitIdx, 0));

  const isNight = brightness === "night";
  const tileUrl = isNight
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

  if (loading) return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:"#9ca3af", fontSize:11, fontFamily:"system-ui" }}>Loading route…</div>;
  if (error) return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444", fontSize:11, fontFamily:"system-ui" }}>Error loading route: {error}</div>;
  if (routePoints.length === 0) return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:"#9ca3af", fontSize:11, fontFamily:"system-ui" }}>No route data</div>;

  return (
    <div style={{ height, borderRadius:8, overflow:"hidden", border:"1px solid #1f2937", position:"relative" }}>
      <MapContainer
        center={[1.355, 103.82]}
        zoom={11}
        minZoom={10}
        maxZoom={18}
        maxBounds={SG_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height:"100%", width:"100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} subdomains="abcd" maxZoom={18} bounds={SG_BOUNDS} />
        <FitBounds points={routePoints} />
        <MapControls points={routePoints} riderGps={riderGps} />

        {/* Remaining route — blue */}
        <Polyline positions={remainingPath} pathOptions={{ color:"#3b82f6", weight:4, opacity:0.85 }} />

        {/* Completed route — green, on top */}
        {completedPath.length > 1 && (
          <Polyline positions={completedPath} pathOptions={{ color:"#22c55e", weight:5, opacity:0.95 }} />
        )}

        {/* Start marker */}
        {routePoints.length > 0 && (
          <CircleMarker center={routePoints[0]} radius={6} pathOptions={{ color:"#fff", fillColor:"#22c55e", fillOpacity:1, weight:2 }}>
            <Popup>Start / Finish — ECP Marine Cove</Popup>
          </CircleMarker>
        )}

        {/* Live rider position */}
        {riderGps && riderGps.lat && riderGps.lng && (
          <CircleMarker
            center={[riderGps.lat, riderGps.lng]}
            radius={9}
            pathOptions={{ color:"#fff", fillColor:"#ec4899", fillOpacity:1, weight:3 }}
          >
            <Popup>
              📍 Rider position<br/>
              {riderGps.speed > 0 && `${riderGps.speed.toFixed(1)} km/h`}<br/>
              {riderGps.t && `Updated ${Math.round((Date.now() - riderGps.t) / 1000)}s ago`}
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
