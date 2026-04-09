import { useState, useEffect, useRef, useCallback } from "react";
import { sb } from "./supabase";
import LeafletMap from "./LeafletMap";

// ===== ROUTE DATA =====
const SEGS = [
  { id:1, name:"ECP → Marina Bay", km:15, d:"Easy", c:"#22c55e", ts:22 },
  { id:2, name:"Marina Bay → Keppel", km:8, d:"Easy", c:"#22c55e", ts:22 },
  { id:3, name:"Keppel → West Coast", km:12, d:"Easy–Mod", c:"#eab308", ts:20 },
  { id:4, name:"West Coast → Jurong", km:14, d:"Moderate", c:"#f97316", ts:18 },
  { id:5, name:"Jurong → Tuas LP1", km:28, d:"Hard", c:"#ef4444", ts:16 },
  { id:6, name:"Tuas → Lim Chu Kang", km:18, d:"Hard", c:"#ef4444", ts:14 },
  { id:7, name:"LCK → Woodlands", km:16, d:"Moderate", c:"#f97316", ts:17 },
  { id:8, name:"Woodlands → Yishun", km:14, d:"Easy–Mod", c:"#eab308", ts:19 },
  { id:9, name:"Yishun → Pasir Ris", km:18, d:"Easy", c:"#22c55e", ts:22 },
  { id:10, name:"Changi → TMCR", km:18, d:"Moderate", c:"#f97316", ts:18 },
  { id:11, name:"TMCR → ECP Finish", km:10, d:"Easy", c:"#22c55e", ts:20 },
];
const TOTAL_KM = SEGS.reduce((s,v)=>s+v.km, 0);

const WP = [
  { lat:1.301, lng:103.912, name:"ECP Marine Cove", short:"ECP" },
  { lat:1.281, lng:103.859, name:"Marina Bay Sands", short:"MBS" },
  { lat:1.264, lng:103.822, name:"HarbourFront", short:"KEP" },
  { lat:1.281, lng:103.766, name:"West Coast Park", short:"WCP" },
  { lat:1.331, lng:103.710, name:"Jurong/Boon Lay", short:"JUR" },
  { lat:1.295, lng:103.637, name:"Lamp Post 1", short:"LP1" },
  { lat:1.422, lng:103.712, name:"Lim Chu Kang", short:"LCK" },
  { lat:1.438, lng:103.769, name:"Woodlands Waterfront", short:"WDL" },
  { lat:1.449, lng:103.820, name:"Sembawang", short:"SBW" },
  { lat:1.418, lng:103.841, name:"Yishun Dam", short:"YIS" },
  { lat:1.405, lng:103.902, name:"Punggol", short:"PGL" },
  { lat:1.376, lng:103.949, name:"Pasir Ris", short:"PR" },
  { lat:1.358, lng:103.991, name:"Changi Village", short:"CHG" },
  { lat:1.325, lng:103.962, name:"TMCR End", short:"TMCR" },
];

const TURNS = {
  1: { steps:["Start Marine Cove, head WEST on ECP PCN","Pass Bedok Jetty on left","Continue west through ECP Lagoon","Follow PCN past areas F→A","Cross Marina Barrage"], hazards:"Joggers on shared path from ~5am", resupply:"None needed — just started",
    toilets:["Marine Cove Playground (24hr)","ECP toilet blocks at carparks C2, C4, E1 (24hr)","Marina Barrage ground floor (24hr)"],
    photo:["Marina Barrage walkway — CBD skyline at night","Gardens by the Bay Supertrees (lit until midnight)"],
    shelter:["Marina Barrage building","ECP sheltered pavilions"],
    gmaps:"https://www.google.com/maps/dir/1.301,103.912/1.281,103.859/@1.29,103.88,14z/data=!4m2!4m1!3e1" },
  2: { steps:["From Marina Barrage, west to Gardens by the Bay","Marina Blvd → Shenton Way","Pass Lau Pa Sat (24hr food)","Onto Keppel Rd","Keppel → Telok Blangah Rd","Reach VivoCity"], hazards:"CBD traffic lights", resupply:"Lau Pa Sat 24hr food court",
    toilets:["Lau Pa Sat hawker (24hr)","Labrador Nature Reserve carpark (24hr, unlit path)"],
    photo:["Keppel Bay waterfront — Sentosa & cable car lights"],
    shelter:["Lau Pa Sat"],
    gmaps:"https://www.google.com/maps/dir/1.281,103.859/1.264,103.822/@1.27,103.84,14z/data=!4m2!4m1!3e1" },
  3: { steps:["HarbourFront → Pasir Panjang Rd (WEST)","Past Labrador Nature Reserve","Continue past wholesale centre","→ West Coast Highway","LEFT into West Coast Park"], hazards:"Industrial trucks even at night on Pasir Panjang Rd", resupply:"HarbourFront area before departing",
    toilets:["West Coast Park near McDonald's (24hr)"],
    photo:["West Coast Park beachfront"],
    shelter:["McDonald's West Coast Park (24hr, aircon) — KEY STOP"],
    gmaps:"https://www.google.com/maps/dir/1.264,103.822/1.281,103.766/@1.27,103.79,14z/data=!4m2!4m1!3e1" },
  4: { steps:["Exit WCP onto Jalan Buroh (NW)","Past Pandan Reservoir","SPC Jalan Buroh refuel (24hr)","→ Penjuru → Pioneer Rd","Reach Boon Lay"], hazards:"Heavy trucks, potholes, no cycling pavement. No shoulder on parts of Pioneer Rd.", resupply:"⛽ SPC Jalan Buroh (24hr) — LAST refuel before 45km dry stretch to Woodlands",
    toilets:["SPC Jalan Buroh petrol station (24hr)","Shell Pioneer Rd petrol station (24hr)"],
    photo:["Nothing scenic — industrial zone"],
    shelter:["Petrol station forecourts"],
    gmaps:"https://www.google.com/maps/dir/1.281,103.766/1.331,103.710/@1.30,103.74,13z/data=!4m2!4m1!3e1" },
  5: { steps:["Pioneer Rd WEST","→ Jalan Ahmad Ibrahim → Tuas West Dr","Past Joo Koon MRT","Continue Tuas West Rd","LEFT onto Tuas South Ave 3","Follow SOUTH to Tuas South Blvd","LAMP POST 1 (dead end)"], hazards:"⚠️ ZERO shelter, no water, buff for dust. STRAY DOGS near LP1 — maintain speed, do not stop near them.", resupply:"NOTHING. Fill up at SPC Jalan Buroh before this segment.",
    toilets:["⚠️ NONE for entire segment. Use petrol station in Seg 4 before entering."],
    photo:["Lamp Post 1 — westernmost point of mainland SG. Iconic RTI photo.","Tuas Second Link bridge lights (pre-dawn)"],
    shelter:["⚠️ NONE. Carry rain jacket."],
    gmaps:"https://www.google.com/maps/dir/1.331,103.710/1.295,103.637/@1.31,103.67,13z/data=!4m2!4m1!3e1" },
  6: { steps:["Return NORTH via Tuas South Ave 3","→ Pioneer → Nanyang → Jalan Bahar","Cross to REALIGNED Lim Chu Kang Rd (opened Jun 2025)","⚠️ NEO TIEW hills (hardest climbs)","Past LCK Cemetery","Continue to Kranji Farms"], hazards:"⚠️ Stray dogs in farmland area. Very dark. New LCK Rd has NO cycling path — ride on road. Downshift early for Neo Tiew hills.", resupply:"NOTHING open until Woodlands.",
    toilets:["⚠️ NONE until Sungei Buloh (opens 7am weekends)"],
    photo:["Neo Tiew Rd — rustic kampong atmosphere at dawn","LCK farmland — sunrise views over farms"],
    shelter:["⚠️ NONE. Industrial buildings only."],
    gmaps:"https://www.google.com/maps/dir/1.295,103.637/1.422,103.712/@1.36,103.68,13z/data=!4m2!4m1!3e1" },
  7: { steps:["LCK → Kranji Way","Cross KRANJI DAM (JB view left)","→ Woodlands Rd NORTH","Past Old Woodlands Checkpoint","⚠️ STEEP descent Admiralty Rd W","→ Woodlands Waterfront"], hazards:"⚠️ Steep descent Admiralty Rd W — control speed. SLE traffic at junctions.", resupply:"Woodlands town: 7-Eleven, convenience stores. BREAKFAST STOP.",
    toilets:["Kranji War Memorial carpark (from ~7am)","Woodlands Waterfront Park toilet block (24hr) — KEY STOP","Shell/Esso Woodlands petrol stations (24hr)"],
    photo:["Kranji Dam — JB skyline & Causeway view at dawn","Woodlands Waterfront jetty — Johor Strait panorama, excellent dawn light"],
    shelter:["Woodlands Waterfront Park pavilions","Petrol stations along Woodlands Ave"],
    gmaps:"https://www.google.com/maps/dir/1.422,103.712/1.438,103.769/@1.43,103.74,13z/data=!4m2!4m1!3e1" },
  8: { steps:["Woodlands Waterfront → Admiralty Rd EAST","Past Sembawang Park left","→ Yishun Ave 1","Optional: Sembawang Hot Springs","Onto Yishun Dam"], hazards:"Ulu Sembawang PCN dark sections early morning", resupply:"Chong Pang Market & Food Centre (Yishun) — breakfast option",
    toilets:["Sembawang Park toilet block (24hr)","Sembawang Hot Spring Park (from 7am)","Chong Pang Market, Yishun (early morning)"],
    photo:["Sembawang Park — colonial bungalows & beachfront","Sembawang Hot Spring Park — unique SG photo op","Yishun Dam — reservoir one side, sea the other. Iconic RTI shot in morning light."],
    shelter:["Sembawang Park shelters","Chong Pang food centre","HDB void decks along Yishun Ave 1"],
    gmaps:"https://www.google.com/maps/dir/1.438,103.769/1.418,103.841/@1.43,103.81,13z/data=!4m2!4m1!3e1" },
  9: { steps:["Yishun Dam → Yishun Ave 6","→ Seletar North Link","Punggol Waterway promenade PCN","⚠️ DETOUR: Avoid Punggol Central (CRL construction closed). Use Punggol Waterway → Coney Island West","Exit Coney Island East → Lorong Halus → Pasir Ris Park"], hazards:"⚠️ Punggol Central CLOSED for Cross Island Line construction (until ~2032). Detour via waterway promenade.", resupply:"Punggol Settlement restaurants (from ~8am)",
    toilets:["Punggol Waterway Park toilet blocks (24hr)","Coney Island composting toilets at west & east entrances (7am–7pm)","Pasir Ris Park toilet blocks (24hr)"],
    photo:["Punggol Waterway Jewel Bridge (red wave bridge)","Coney Island boardwalk & beach — casuarina forest","Lorong Halus Wetland red bridge"],
    shelter:["Punggol Settlement (covered)","Pasir Ris Park pavilions"],
    gmaps:"https://www.google.com/maps/dir/1.418,103.841/1.376,103.949/@1.40,103.89,13z/data=!4m2!4m1!3e1" },
  10:{ steps:["Pasir Ris → Loyang Ave → Changi","CHANGI VILLAGE HAWKER (food from ~6am)","East to Changi Beach Park","→ Changi Bay PC","TMCR 15km straight stretch — dedicated cycling lane"], hazards:"⚠️ TMCR: 15km no shade, no water, no exits. Don't attempt 10am-4pm. Stay in cycling lane. LTA improved enforcement 2026.", resupply:"🍜 Changi Village hawker — FILL UP here. Nothing for 15km on TMCR.",
    toilets:["Changi Village Hawker Centre (early morning)","Changi Beach Park toilet blocks (24hr)","Changi Point Ferry Terminal (public toilet)","⚠️ TMCR: NONE for 15km. Go at Changi Village."],
    photo:["Changi Village boardwalk — Pulau Ubin & bumboat views","Changi Beach Park — old trees, WWII historical site","TMCR — 'epic road ahead' cycling shot with cargo ships"],
    shelter:["Changi Village hawker centre","Changi Beach Park shelters","⚠️ TMCR: NONE. Ride through any rain."],
    gmaps:"https://www.google.com/maps/dir/1.376,103.949/1.325,103.962/@1.35,103.97,13z/data=!4m2!4m1!3e1" },
  11:{ steps:["TMCR end → Coastal PC","Past NS Resort","Enter ECP Area G","Through areas F→B","🏁 FINISH Marine Cove"], hazards:"Fatigue — stay alert, almost home", resupply:"ECP has amenities. You're done!",
    toilets:["ECP toilet blocks throughout (24hr)","Marine Cove restaurants"],
    photo:["ECP — city skyline getting closer, victory shot","🏁 Marine Cove finish line selfie!"],
    shelter:["ECP sheltered pavilions","Marine Cove"],
    gmaps:"https://www.google.com/maps/dir/1.325,103.962/1.301,103.912/@1.31,103.94,14z/data=!4m2!4m1!3e1" },
};

// ===== GUIDE CONTENT =====
const GEAR = {
  tier1: [
    ["Helmet","Van Rysel RCR 100","$35–50"],
    ["Front light","Btwin Vioo Road 900 (300+lm)","$35–50"],
    ["Rear light","Btwin Vioo Clip 300","$12–20"],
    ["Padded bib shorts","Triban RC 100 bib","$40–60"],
    ["Cycling gloves","Triban RC 100","$12–20"],
    ["Spare tubes ×2","Btwin Presta 700×25c","$20"],
    ["Tyre levers ×3","Btwin plastic","$3–5"],
    ["Mini pump","Btwin 500 w/gauge","$18–30"],
    ["Multi-tool","Btwin 900","$15–25"],
    ["Water bottles ×2","Triban 650ml","$6–10"],
    ["Saddle bag","Btwin 500 M","$12–20"],
  ],
  tier2: [
    ["Reflective vest","Btwin","$8–15"],
    ["Cycling jersey","Triban RC 100","$20–35"],
    ["UV arm sleeves","Van Rysel","$15–25"],
    ["CO2 inflator+2","Btwin","$15–25"],
    ["Patch kit","Rema TIP TOP","$5–8"],
    ["Frame bag","Btwin","$15–25"],
    ["Buff/gaiter","Forclaz","$12–18"],
    ["Electrolyte tabs","Aptonia","$10–15"],
    ["Energy gels ×8","Aptonia","$16"],
    ["Energy bars ×6","Aptonia","$9"],
  ],
  pharmacy: [
    ["Sudocrem 60g (chamois alt)","$8","Guardian"],
    ["Biore UV Aqua Rich SPF50+","$15","Donki/Guardian"],
    ["NeilMed saline spray","$10","Guardian"],
    ["CeraVe cleanser travel","$8","Guardian"],
    ["Lip balm SPF30","$5","Guardian"],
    ["Systane eye drops","$10","Guardian"],
    ["Wet wipes","$3","Guardian"],
    ["Ibuprofen 200mg","$5","Guardian"],
    ["Nitrile gloves ×4","$3","Guardian"],
    ["Microfibre cloths ×4","$2","Daiso"],
  ],
};

const SKIN_PROTOCOL = [
  "PRE-RIDE: Gentle cleanse → Aquaphor/Sudocrem occlusive on treated areas (sweat barrier)",
  "EVERY STOP: Saline spray mist face to rinse sweat + bacteria. Pat dry with clean microfibre.",
  "TUAS SEGMENT: Buff over lower face for dust. Remove at rest stops.",
  "FROM 07:00: SPF50+ on face. Reapply every stop. Arm sleeves for arms.",
  "GLOVES: NEVER touch face with cycling gloves. Use nitrile for face touching.",
  "POST-RIDE: Shower immediately → gentle cleanse → post-tx ointment → stay indoors.",
];

const PREP_TIMELINE = [
  ["Apr 5 Sun","Rest","Day 7 post-tx, skin still healing"],
  ["Apr 6–7","Light walking only","No sweat-heavy activity"],
  ["Apr 8 Tue","30km easy PCN ride","Day 10, first saddle time"],
  ["Apr 9 Wed","Rest","Recovery"],
  ["Apr 10 Thu","50km moderate","Gear shakedown. Full kit test."],
  ["Apr 11 Fri","Bike shop service","Professional tune-up"],
  ["Apr 12 Sat","Rest + carb load","Pre-ride fueling begins"],
  ["Apr 13 Sun","Rest / CFA study","Sleep bank"],
  ["Apr 14–16","Light spin 30min/day","Keep legs moving"],
  ["Apr 17 Thu","Final bike check","15km shakedown"],
  ["Apr 18 Fri","Pre-ride rest","Large meals, sleep bank"],
  ["Apr 18 ~23:00","🚴 RIDE START (Blitz)","If going Apr 18"],
];

const TIPS = [
  ["Weekend Only","#ef4444","Tuas/LCK have heavy trucks weekdays. 70–80% lighter weekends."],
  ["TMCR = Mental","#f97316","15km shelterless road. Never 10am–4pm."],
  ["Changi T3 Oasis","#22c55e","24hr A/C, wifi, charging, cafes."],
  ["Hydration Math","#3b82f6","~1L/hr loss at 30°C. 1.5L min. Electrolytes every other bottle."],
  ["Night Safety","#06b6d4","Reflective vest, 400+lm front, rear flasher. Neo Tiew very dark."],
  ["Bonk Prevention","#14b8a6","60–90g carbs/hr after hr 2. Gel every 45 min. Cold/dizzy = 40g sugar NOW."],
  ["Post-Tx Skin","#f43f5e","Never touch face with cycling gloves. Saline mist at every stop. Shower immediately after."],
];

// ===== STREAM / RECORD WORTHY MOMENTS =====
// type: "live" = YouTube Live burst, "record" = Insta360 cinematic capture
// trigger: distance in km from this point to fire the alert
const MOMENTS = [
  { id:"start",     lat:1.301, lng:103.912, name:"Ride Start at ECP",         type:"live",   why:"Hype, conditions check, 'we're going!'", segment:1, trigger:0.5 },
  { id:"mbs",       lat:1.281, lng:103.859, name:"Marina Barrage Night Skyline", type:"live",   why:"CBD lights backdrop, iconic SG view", segment:1, trigger:0.5 },
  { id:"keppel",    lat:1.264, lng:103.822, name:"Keppel/Sentosa Cable Cars", type:"record", why:"Lit cable cars over Sentosa", segment:2, trigger:0.4 },
  { id:"tuas-pre",  lat:1.295, lng:103.700, name:"Tuas Industrial Approach",  type:"record", why:"Empty roads, alien vibe, pre-dawn", segment:5, trigger:1.0 },
  { id:"lp1",       lat:1.295, lng:103.637, name:"Lamp Post 1 — Westernmost SG", type:"live",   why:"The pilgrimage moment. Iconic RTI photo.", segment:5, trigger:0.5 },
  { id:"neotiew",   lat:1.405, lng:103.700, name:"Neo Tiew Dawn Kampong",     type:"record", why:"Rustic 'Singapore you don't see'", segment:6, trigger:0.8 },
  { id:"kranji",    lat:1.430, lng:103.745, name:"Kranji Dam — JB Skyline",   type:"record", why:"Causeway view at dawn", segment:7, trigger:0.5 },
  { id:"woodlands", lat:1.449, lng:103.789, name:"Woodlands Waterfront Sunrise", type:"live",   why:"Dawn over Johor Strait, breakfast", segment:7, trigger:0.5 },
  { id:"yishun",    lat:1.418, lng:103.841, name:"Yishun Dam Morning",        type:"live",   why:"Reservoir/sea panorama, golden hour", segment:8, trigger:0.5 },
  { id:"changi",    lat:1.388, lng:103.985, name:"Changi Village Hawker",     type:"live",   why:"Pre-TMCR brunch, food content", segment:10, trigger:0.5 },
  { id:"tmcr",      lat:1.345, lng:103.975, name:"TMCR Cinematic Stretch",    type:"record", why:"Long road to vanishing point + cargo ships", segment:10, trigger:1.0 },
  { id:"finish",    lat:1.301, lng:103.912, name:"Finish at Marine Cove",     type:"live",   why:"Victory moment, full circle complete!", segment:11, trigger:0.5 },
];

// ===== HELPERS =====
const toS = (lat,lng) => ({ x:(lng-103.60)/0.42*280+10, y:(1.47-lat)/0.23*140+10 });
const SG = "M18,118 L24,135 L44,144 L78,142 L109,136 L135,140 L166,136 L192,136 L218,128 L244,114 L270,100 L290,85 L292,77 L283,68 L262,61 L244,63 L222,50 L205,46 L183,35 L166,24 L148,20 L131,22 L118,24 L105,28 L85,30 L70,33 L57,41 L44,52 L33,70 L24,87 L18,105 Z";

const STORAGE_KEY = "rti-tracker-v4";
const CHAT_KEY = "rti-chat-shared-v1";
const GARMIN_COURSE_EMBED = "https://connect.garmin.com/app/course/embed/446685371";
const GARMIN_COURSE_URL = "https://connect.garmin.com/modern/course/446685371";
const CHAT_NAME_KEY = "rti-chat-name";
const ATTEMPTS_KEY = "rti-attempts-v1";

// ===== Attempts helpers =====
const loadAttempts = () => {
  try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "[]"); } catch(e) { return []; }
};
const saveAttempts = (attempts) => {
  try { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts)); } catch(e) {}
};
const snapshotAttempt = (state, name, elapsed, kmDone) => {
  const attempts = loadAttempts();
  const attempt = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name || `Attempt ${attempts.length + 1}`,
    createdAt: Date.now(),
    state: JSON.parse(JSON.stringify(state)),
    elapsed,
    kmDone,
    segsDone: state.segments.filter(s => s.completed).length,
    status: state.status,
  };
  saveAttempts([...attempts, attempt]);
  return attempt;
};
const deleteAttempt = (id) => {
  saveAttempts(loadAttempts().filter(a => a.id !== id));
};

const fmtTime = (ms) => {
  if (!ms || ms < 0) return "00:00:00";
  const s = Math.floor(ms/1000), m = Math.floor(s/60), h = Math.floor(m/60);
  return `${String(h).padStart(2,"0")}:${String(m%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
};
const fmtClock = (ts) => {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-SG",{hour:"2-digit",minute:"2-digit"});
};
const fmtPace = (km, ms) => !km || !ms ? "—" : (km / (ms/3600000)).toFixed(1);

const hav = (p1, p2) => {
  const R = 6371, dLat = (p2.lat-p1.lat)*Math.PI/180, dLng = (p2.lng-p1.lng)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(p1.lat*Math.PI/180)*Math.cos(p2.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
};

const bearing = (p1, p2) => {
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const lat1 = p1.lat * Math.PI / 180, lat2 = p2.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};
const bearingCompass = (deg) => ["N","NE","E","SE","S","SW","W","NW"][Math.round(deg/45) % 8];

// Find the closest stream/record-worthy moment within trigger range
const findActiveMoment = (gps, currentSegId, dismissedIds = []) => {
  if (!gps) return null;
  let closest = null;
  let closestDist = Infinity;
  for (const m of MOMENTS) {
    if (dismissedIds.includes(m.id)) continue;
    if (m.segment < currentSegId) continue; // Skip past moments
    const d = hav(gps, m);
    if (d < m.trigger && d < closestDist) {
      closest = { ...m, distance: d };
      closestDist = d;
    }
  }
  return closest;
};

// YouTube URL → embed URL parser
const ytEmbedUrl = (url) => {
  if (!url) return null;
  try {
    // youtube.com/watch?v=ID | youtu.be/ID | youtube.com/live/ID | youtube.com/embed/ID
    let id = null;
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.pathname.startsWith("/live/")) id = u.pathname.split("/live/")[1];
    else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/embed/")[1];
    else if (u.searchParams.has("v")) id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id.split(/[?&/]/)[0]}?autoplay=1&mute=1&rel=0`;
  } catch(e) {}
  return null;
};

const initState = () => ({
  status:"idle", startTime:null, pauseTime:null, totalPaused:0,
  segments: SEGS.map(s => ({ ...s, completed:false, completedAt:null })),
  dateOption:null, notes:[], gpsPoints:[], liveTrackUrl:"", stravaUrl:"", youtubeStreamUrl:"", streamLive:false,
});

const DATE_INFO = {
  apr10: { label:"Apr 10 Fri", sub:"Fri 23:00 → Sat 11:30", day:"Day 12 post-tx" },
  apr11: { label:"Apr 11 Sat", sub:"Sat 23:00 → Sun 11:30", day:"Day 13 post-tx" },
};

// ==========================================================================
// MAIN APP
// ==========================================================================
const RIDER_PIN = "1234";

export default function App() {
  const [state, setState] = useState(initState);
  const [tab, setTab] = useState("nav");
  const [now, setNow] = useState(Date.now());
  const [cardSeg, setCardSeg] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [lastGps, setLastGps] = useState(null);
  const [wakeLock, setWakeLock] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState("normal");
  const [showGuide, setShowGuide] = useState(false);
  const [riderMode, setRiderMode] = useState(() => sessionStorage.getItem("rti-rider") === "1");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const timerRef = useRef(null);
  const watchRef = useRef(null);
  const gpsSyncRef = useRef(null);

  // Load state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...initState(), ...JSON.parse(saved) });
    } catch(e) {}
  }, []);

  // Save to localStorage + sync shared state to Supabase
  const save = useCallback((s) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e) {}
    // Sync shared state to Supabase (fire-and-forget)
    const kmDoneCalc = s.segments.filter(seg=>seg.completed).reduce((a,seg)=>a+seg.km, 0);
    sb.upsert("rti_rides", {
      id: "current",
      status: s.status,
      start_time: s.startTime,
      pause_time: s.pauseTime,
      total_paused: s.totalPaused,
      date_option: s.dateOption,
      segments: s.segments.map(seg => ({ id:seg.id, name:seg.name, km:seg.km, d:seg.d, c:seg.c, completed:seg.completed, completedAt:seg.completedAt })),
      live_track_url: s.liveTrackUrl || "",
      strava_url: s.stravaUrl || "",
      youtube_stream_url: s.youtubeStreamUrl || "",
      stream_live: !!s.streamLive,
      km_done: kmDoneCalc,
      pct: Math.round(kmDoneCalc / TOTAL_KM * 100),
      updated_at: new Date().toISOString(),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (state.status === "active") timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [state.status]);

  // Sync GPS to Supabase every 30s for observer map
  useEffect(() => {
    if (state.status !== "active" || !riderMode) {
      clearInterval(gpsSyncRef.current);
      return;
    }
    const syncGps = () => {
      if (!lastGps) return;
      sb.upsert("rti_rides", {
        id: "current",
        last_gps: { lat: lastGps.lat, lng: lastGps.lng, speed: lastGps.speed, t: Date.now() },
        updated_at: new Date().toISOString(),
      }).catch(() => {});
    };
    syncGps(); // sync immediately on start
    gpsSyncRef.current = setInterval(syncGps, 30000);
    return () => clearInterval(gpsSyncRef.current);
  }, [state.status, riderMode, lastGps]);

  // GPS
  useEffect(() => {
    if (!gpsTracking) {
      if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      return;
    }
    if (!navigator.geolocation) { setGpsError("Geolocation not supported"); setGpsTracking(false); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const pt = { lat:latitude, lng:longitude, speed:speed?speed*3.6:null, accuracy, t:Date.now() };
        setLastGps(pt); setGpsError(null);
        setState(prev => {
          if (accuracy > 50) return prev;
          const last = prev.gpsPoints[prev.gpsPoints.length-1];
          if (last && hav(last, pt) < 0.005) return prev;
          const ns = { ...prev, gpsPoints:[...prev.gpsPoints, pt] };
          save(ns);
          return ns;
        });
      },
      (err) => setGpsError(err.message || "GPS error"),
      { enableHighAccuracy:true, maximumAge:5000, timeout:20000 }
    );
    return () => { if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; } };
  }, [gpsTracking, save]);

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        const wl = await navigator.wakeLock.request("screen");
        setWakeLock(wl);
        wl.addEventListener("release", () => setWakeLock(null));
      }
    } catch (err) {}
  };
  const releaseWakeLock = async () => { if (wakeLock) { await wakeLock.release(); setWakeLock(null); } };

  useEffect(() => {
    const handleVis = () => {
      if (document.visibilityState === "visible" && state.status === "active" && !wakeLock) requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVis);
    return () => document.removeEventListener("visibilitychange", handleVis);
  }, [state.status, wakeLock]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); setIsFullscreen(true); }
      else { await document.exitFullscreen(); setIsFullscreen(false); }
    } catch (err) {}
  };

  const elapsed = () => {
    if (!state.startTime) return 0;
    if (state.status === "paused" || state.status === "finished") return state.pauseTime - state.startTime - state.totalPaused;
    return now - state.startTime - state.totalPaused;
  };

  const kmDone = state.segments.filter(s=>s.completed).reduce((a,s)=>a+s.km, 0);
  const kmLeft = TOTAL_KM - kmDone;
  const segsDone = state.segments.filter(s=>s.completed).length;
  const currentSeg = state.segments.find(s=>!s.completed) || state.segments[state.segments.length-1];
  const pct = (kmDone / TOTAL_KM * 100).toFixed(0);
  const gpsKm = state.gpsPoints.length > 1 ? state.gpsPoints.reduce((sum, p, i) => i === 0 ? 0 : sum + hav(state.gpsPoints[i-1], p), 0) : 0;
  const gpsCurSpeed = lastGps?.speed || 0;

  const nextWpIdx = Math.min(currentSeg.id, WP.length - 1);
  const nextWp = WP[nextWpIdx] || WP[WP.length - 1];
  const distToNextWp = lastGps ? hav(lastGps, nextWp) : null;
  const bearingToNextWp = lastGps ? bearing(lastGps, nextWp) : null;
  const withinProximity = distToNextWp !== null && distToNextWp < 0.5;

  const startRide = async (dateOpt) => {
    const ns = { ...initState(), status:"active", startTime:Date.now(), dateOption:dateOpt };
    setState(ns); save(ns);
    await requestWakeLock();
    setGpsTracking(true);
  };
  const pauseRide = () => { const ns = { ...state, status:"paused", pauseTime:Date.now() }; setState(ns); save(ns); };
  const resumeRide = () => {
    const pf = Date.now() - state.pauseTime;
    const ns = { ...state, status:"active", totalPaused:state.totalPaused+pf, pauseTime:null };
    setState(ns); save(ns);
  };
  const completeSeg = (id) => {
    const ns = { ...state, segments:state.segments.map(s => s.id === id ? { ...s, completed:true, completedAt:Date.now() } : s) };
    if (ns.segments.every(s=>s.completed)) { ns.status = "finished"; ns.pauseTime = Date.now(); }
    setState(ns); save(ns);
    setCardSeg(id); setShowCard(true);
  };
  const undoSeg = (id) => {
    const ns = { ...state, segments:state.segments.map(s => s.id === id ? { ...s, completed:false, completedAt:null } : s) };
    if (ns.status === "finished") ns.status = "active";
    setState(ns); save(ns);
  };
  const saveAsAttempt = (name) => {
    if (state.status === "idle") { alert("Nothing to save — no ride in progress."); return null; }
    const snap = snapshotAttempt(state, name, elapsed(), kmDone);
    return snap;
  };

  const loadAttemptById = (id) => {
    const attempts = loadAttempts();
    const a = attempts.find(x => x.id === id);
    if (!a) return;
    if (!confirm(`Load "${a.name}"? Current ride state will be discarded.`)) return;
    setState(a.state);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(a.state)); } catch(e) {}
    save(a.state); // sync to Supabase
  };

  const resetRide = async (mode = "reset") => {
    // mode: "reset" (just clear), "save" (save as attempt first), "full" (clear + chat)
    if (mode === "save") {
      const name = prompt("Name this attempt:", `Attempt ${loadAttempts().length + 1}`);
      if (name === null) return; // cancelled
      saveAsAttempt(name);
    } else {
      const msg = mode === "full" ? "FULL RESET: Clear ride state, GPS, and ALL chat messages? This cannot be undone." : "Reset ride state? (Chat & attempts kept)";
      if (!confirm(msg)) return;
    }
    setGpsTracking(false); setLastGps(null);
    await releaseWakeLock();
    const ns = initState();
    setState(ns);
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    // Clear Supabase ride row so observers also see fresh state
    try {
      await sb.upsert("rti_rides", {
        id: "current",
        status: "idle",
        start_time: null,
        pause_time: null,
        total_paused: 0,
        date_option: null,
        segments: SEGS.map(s => ({ id:s.id, name:s.name, km:s.km, d:s.d, c:s.c, completed:false, completedAt:null })),
        live_track_url: "",
        strava_url: "",
        youtube_stream_url: "",
        stream_live: false,
        last_gps: null,
        km_done: 0,
        pct: 0,
        updated_at: new Date().toISOString(),
      });
    } catch(e) {}
    if (mode === "full") {
      try { await sb.del("rti_chat", "ride_id=eq.current"); } catch(e) {}
    }
  };
  const addNote = (text) => {
    if (!text.trim()) return;
    const ns = { ...state, notes:[...state.notes, { text, time:Date.now(), km:kmDone }] };
    setState(ns); save(ns);
  };
  const updateField = (field, val) => { const ns = { ...state, [field]: val }; setState(ns); save(ns); };
  const exportData = () => {
    const data = { ...state, elapsed:elapsed(), gpsKm, exportedAt:new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rti-ride-${state.dateOption || "data"}-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const S = brightness === "night"
    ? { bg:"#000000", card:"#0a0a0a", border:"#1a1a1a", acc:"#ef4444", text:"#f87171", mut:"#991b1b", dim:"#7f1d1d" }
    : { bg:"#050a12", card:"#111827", border:"#1f2937", acc:"#3b82f6", text:"#f3f4f6", mut:"#9ca3af", dim:"#6b7280" };

  // Primary tabs — essential while riding (big buttons)
  // Map placed beside Nav for easy access to route + chat from navigation view
  const primaryTabs = [
    { id:"nav", l:"Nav", em:"🧭" },
    { id:"map", l:"Map", em:"🗺️" },
    { id:"tracker", l:"Track", em:"🚴" },
  ];
  // Secondary tabs — resting-only, accessed via overflow menu
  const secondaryTabs = [
    { id:"sync", l:"Sync", em:"📡" },
    { id:"cards", l:"Cards", em:"📸" },
    { id:"share", l:"Share", em:"🔗" },
  ];
  const tabs = [...primaryTabs, ...secondaryTabs];

  const dateInfo = state.dateOption ? DATE_INFO[state.dateOption] : null;
  const currentTurns = TURNS[currentSeg.id];

  const unlockRider = (pin) => {
    if (pin === RIDER_PIN) {
      sessionStorage.setItem("rti-rider", "1");
      setRiderMode(true);
      return true;
    }
    return false;
  };
  const lockRider = () => {
    sessionStorage.removeItem("rti-rider");
    setRiderMode(false);
  };

  // Observer mode — show public view
  if (!riderMode) {
    return (
      <div style={{ fontFamily:"'JetBrains Mono','SF Mono',monospace", background:S.bg, color:S.text, minHeight:"100vh", padding:10 }}>
        <ObserverView S={S} brightness={brightness} setBrightness={setBrightness} toggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} unlockRider={unlockRider} />
        {showGuide && <GuideModal onClose={()=>setShowGuide(false)} />}
      </div>
    );
  }

  // Rider mode — full controls
  return (
    <div style={{ fontFamily:"'JetBrains Mono','SF Mono',monospace", background:S.bg, color:S.text, minHeight:"100vh", padding:10 }}>

      {/* Status bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, padding:"5px 8px", background:S.card, borderRadius:6, border:`1px solid ${S.border}`, fontSize:9 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background: state.status==="active"?"#22c55e":state.status==="paused"?"#eab308":state.status==="finished"?"#3b82f6":"#6b7280" }} />
          <span style={{ color:S.mut, textTransform:"uppercase", letterSpacing:2 }}>
            {state.status === "idle" ? "Ready" : state.status === "active" ? "Live" : state.status === "paused" ? "Paused" : "Done"}
          </span>
          {gpsTracking && <span style={{ color:"#22c55e" }}>📡</span>}
          {wakeLock && <span style={{ color:"#fbbf24" }}>💡</span>}
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={lockRider} style={{ padding:"3px 6px", fontSize:8, border:"none", borderRadius:3, background:"#7f1d1d", color:"#fff", cursor:"pointer" }}>Lock</button>
          <button onClick={()=>setBrightness(brightness==="night"?"normal":"night")} style={{ padding:"3px 6px", fontSize:8, border:"none", borderRadius:3, background:brightness==="night"?"#7f1d1d":"#374151", color:"#fff", cursor:"pointer" }}>{brightness==="night"?"☀️":"🌙"}</button>
          <button onClick={toggleFullscreen} style={{ padding:"3px 6px", fontSize:8, border:"none", borderRadius:3, background:"#374151", color:"#fff", cursor:"pointer" }}>{isFullscreen?"⤓":"⤢"}</button>
        </div>
      </div>

      {/* Tabs — primary big + More overflow */}
      <div style={{ display:"flex", gap:3, marginBottom:8, position:"relative" }}>
        {primaryTabs.map(t => (
          <button key={t.id} onClick={()=>{setTab(t.id); setShowMoreMenu(false);}} style={{ flex:1, padding:"12px 4px", fontSize:11, fontWeight:800, borderRadius:8, border:"none", cursor:"pointer", background:tab===t.id?S.acc:S.card, color:tab===t.id?"#fff":S.mut, letterSpacing:0.5 }}>
            <div style={{ fontSize:18, marginBottom:2 }}>{t.em}</div>
            {t.l}
          </button>
        ))}
        <button onClick={()=>setShowMoreMenu(!showMoreMenu)} style={{ flex:1, padding:"12px 4px", fontSize:11, fontWeight:800, borderRadius:8, border:"none", cursor:"pointer", background:secondaryTabs.some(t=>t.id===tab)?S.acc:S.card, color:secondaryTabs.some(t=>t.id===tab)?"#fff":S.mut, letterSpacing:0.5 }}>
          <div style={{ fontSize:18, marginBottom:2 }}>☰</div>
          More
        </button>
        {showMoreMenu && (
          <div style={{ position:"absolute", top:"calc(100% + 4px)", right:0, background:S.card, borderRadius:8, border:`1px solid ${S.border}`, padding:4, zIndex:100, boxShadow:"0 4px 12px rgba(0,0,0,0.4)", minWidth:120 }}>
            {secondaryTabs.map(t => (
              <button key={t.id} onClick={()=>{setTab(t.id); setShowMoreMenu(false);}} style={{ width:"100%", padding:"10px 14px", fontSize:11, fontWeight:700, borderRadius:5, border:"none", cursor:"pointer", background:tab===t.id?S.acc:"transparent", color:tab===t.id?"#fff":S.text, textAlign:"left", display:"flex", alignItems:"center", gap:8, fontFamily:"system-ui" }}>
                <span style={{ fontSize:16 }}>{t.em}</span>
                {t.l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== NAV ===== */}
      {tab === "nav" && (
        <NavTab state={state} currentSeg={currentSeg} currentTurns={currentTurns} nextWp={nextWp} distToNextWp={distToNextWp} bearingToNextWp={bearingToNextWp} withinProximity={withinProximity} lastGps={lastGps} gpsTracking={gpsTracking} elapsed={elapsed()} kmDone={kmDone} kmLeft={kmLeft} pct={pct} completeSeg={completeSeg} pauseRide={pauseRide} resumeRide={resumeRide} setGpsTracking={setGpsTracking} requestWakeLock={requestWakeLock} wakeLock={wakeLock} brightness={brightness} setTab={setTab} S={S} />
      )}

      {/* ===== TRACKER ===== */}
      {tab === "tracker" && (
        <TrackerTab state={state} startRide={startRide} pauseRide={pauseRide} resumeRide={resumeRide} resetRide={resetRide} loadAttemptById={loadAttemptById} completeSeg={completeSeg} undoSeg={undoSeg} addNote={addNote} elapsed={elapsed()} kmDone={kmDone} kmLeft={kmLeft} pct={pct} S={S} />
      )}

      {/* ===== MAP + CHAT ===== */}
      {tab === "map" && (
        <MapChatTab state={state} lastGps={lastGps} gpsTracking={gpsTracking} nextWp={nextWp} kmDone={kmDone} pct={pct} brightness={brightness} S={S} />
      )}

      {/* ===== SYNC ===== */}
      {tab === "sync" && (
        <SyncTab state={state} gpsTracking={gpsTracking} setGpsTracking={setGpsTracking} lastGps={lastGps} gpsCurSpeed={gpsCurSpeed} gpsError={gpsError} wakeLock={wakeLock} requestWakeLock={requestWakeLock} releaseWakeLock={releaseWakeLock} updateField={updateField} exportData={exportData} S={S} />
      )}

      {/* ===== CARDS ===== */}
      {tab === "cards" && (
        <CardsTab state={state} setCardSeg={setCardSeg} setShowCard={setShowCard} showCard={showCard} cardSeg={cardSeg} elapsed={elapsed()} kmDone={kmDone} pct={pct} dateInfo={dateInfo} S={S} />
      )}

      {/* ===== SHARE ===== */}
      {tab === "share" && (
        <ShareTab state={state} dateInfo={dateInfo} elapsed={elapsed()} kmDone={kmDone} pct={pct} segsDone={segsDone} currentSeg={currentSeg} S={S} />
      )}

      {/* Hidden Guide Link */}
      <div style={{ textAlign:"center", marginTop:20, padding:"12px 0", fontSize:8, color:S.dim, fontFamily:"system-ui" }}>
        SG Round Island · Fenix 6S primary + Webapp secondary
        <div style={{ marginTop:6 }}>
          <button onClick={()=>setShowGuide(true)} style={{ background:"transparent", border:"none", color:S.dim, fontSize:7, fontStyle:"italic", cursor:"pointer", textDecoration:"underline", fontFamily:"system-ui", opacity:0.5 }}>
            ·—· full ride guide ·—·
          </button>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && <GuideModal onClose={()=>setShowGuide(false)} />}
    </div>
  );
}

// ==========================================================================
// OBSERVER VIEW (Public)
// ==========================================================================
// Adventure/cyclist theme palette (warmer, outdoor-inspired)
const ADV = {
  bg: "#0f1419",           // deep slate
  card: "#1a2332",         // card bg
  border: "#2d3e52",       // borders
  accent: "#f59e0b",       // amber sunrise
  accent2: "#ea580c",      // orange trail
  text: "#f5f5f4",         // warm white
  mut: "#a8a29e",          // warm grey
  dim: "#78716c",          // dimmer warm grey
  success: "#65a30d",      // forest green
  route: "#0891b2",        // cyan trail
};

function ObserverView({ S, brightness, setBrightness, toggleFullscreen, isFullscreen, unlockRider }) {
  const [ride, setRide] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Poll Supabase for ride state
  useEffect(() => {
    const load = async () => {
      const rows = await sb.get("rti_rides", "id=eq.current");
      if (rows && rows.length > 0) setRide(rows[0]);
    };
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, []);

  const segments = ride?.segments || SEGS.map(s => ({ ...s, completed: false, completedAt: null }));
  const kmDone = ride?.km_done || 0;
  const pct = ride?.pct || 0;
  const status = ride?.status || "idle";
  const dateOption = ride?.date_option;
  const dateInfo = dateOption ? DATE_INFO[dateOption] : null;
  const startTime = ride?.start_time;
  const pauseTime = ride?.pause_time;
  const totalPaused = ride?.total_paused || 0;
  const segsDone = segments.filter(s => s.completed).length;
  const liveTrackUrl = ride?.live_track_url;
  const stravaUrl = ride?.strava_url;
  const youtubeStreamUrl = ride?.youtube_stream_url;
  const streamLive = ride?.stream_live;
  const ytEmbed = ytEmbedUrl(youtubeStreamUrl);
  const riderGps = ride?.last_gps; // { lat, lng, speed, t }

  const handlePin = () => {
    if (unlockRider(pinInput)) {
      setShowPin(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  return (
    <div style={{ background:ADV.bg, minHeight:"100vh", margin:-10, padding:10 }}>
      {/* HEADER — Adventure theme */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, padding:"8px 12px", background:`linear-gradient(135deg, ${ADV.card}, ${ADV.bg})`, borderRadius:8, border:`1px solid ${ADV.border}`, fontSize:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:14 }}>🚴</span>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:ADV.text, fontFamily:"system-ui", letterSpacing:0.5 }}>ROUND ISLAND TRACKER</div>
            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:1 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background: status==="active"?ADV.success:status==="paused"?ADV.accent:status==="finished"?ADV.route:"#78716c" }} />
              <span style={{ color:ADV.mut, fontSize:8, letterSpacing:1, textTransform:"uppercase" }}>
                {status === "idle" ? "Waiting" : status === "active" ? "Live" : status === "paused" ? "Paused" : "Finished"}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={()=>setBrightness(brightness==="night"?"normal":"night")} style={{ padding:"4px 8px", fontSize:9, border:`1px solid ${ADV.border}`, borderRadius:4, background:brightness==="night"?ADV.accent2:"transparent", color:ADV.text, cursor:"pointer" }}>{brightness==="night"?"☀️":"🌙"}</button>
          <button onClick={toggleFullscreen} style={{ padding:"4px 8px", fontSize:9, border:`1px solid ${ADV.border}`, borderRadius:4, background:"transparent", color:ADV.text, cursor:"pointer" }}>{isFullscreen?"⤓":"⤢"}</button>
        </div>
      </div>

      {/* HERO: Live Progress (adventure theme) */}
      <div style={{ background:`linear-gradient(135deg, #1a2332 0%, #2d3e52 50%, #1a2332 100%)`, borderRadius:14, padding:18, border:`1px solid ${ADV.accent}33`, marginBottom:10, position:"relative", overflow:"hidden" }}>
        {/* Subtle topo pattern */}
        <div style={{ position:"absolute", inset:0, opacity:0.04, backgroundImage:"radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 40%), radial-gradient(circle at 80% 80%, #ea580c 0%, transparent 30%)" }} />
        <div style={{ textAlign:"center", position:"relative" }}>
          <div style={{ fontSize:9, letterSpacing:4, color:ADV.accent, fontWeight:800, marginBottom:2, fontFamily:"system-ui" }}>⛰️ LIVE PROGRESS</div>
          <h2 style={{ fontSize:20, fontWeight:800, margin:"0 0 2px", fontFamily:"system-ui", color:ADV.text, letterSpacing:0.5 }}>SG Round Island 🇸🇬</h2>
          <div style={{ fontSize:9, color:ADV.mut, marginBottom:14, fontFamily:"system-ui" }}>{dateInfo ? `${dateInfo.label} · Blitz Ride · ${dateInfo.day}` : "Ride not started yet"}</div>

          {/* Progress ring */}
          <div style={{ position:"relative", width:130, height:130, margin:"0 auto 14px" }}>
            <svg viewBox="0 0 100 100" style={{ width:"100%", height:"100%", transform:"rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke={ADV.border} strokeWidth="7" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#ograd)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${2*Math.PI*42*kmDone/TOTAL_KM} ${2*Math.PI*42}`} />
              <defs><linearGradient id="ograd" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={ADV.accent} /><stop offset="100%" stopColor={ADV.accent2} /></linearGradient></defs>
            </svg>
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color:ADV.text }}>{pct}%</div>
              <div style={{ fontSize:7, color:ADV.accent, letterSpacing:1, fontWeight:700 }}>COMPLETE</div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
            <div style={{ textAlign:"center", background:"rgba(0,0,0,0.25)", borderRadius:6, padding:"6px 3px", border:`1px solid ${ADV.border}` }}>
              <div style={{ fontSize:12, fontWeight:800, color:ADV.accent }}>{kmDone}/{TOTAL_KM}</div>
              <div style={{ fontSize:7, color:ADV.mut, letterSpacing:1 }}>KILOMETRES</div>
            </div>
            <div style={{ textAlign:"center", background:"rgba(0,0,0,0.25)", borderRadius:6, padding:"6px 3px", border:`1px solid ${ADV.border}` }}>
              <div style={{ fontSize:12, fontWeight:800, color:ADV.success }}>{segsDone}/11</div>
              <div style={{ fontSize:7, color:ADV.mut, letterSpacing:1 }}>SEGMENTS</div>
            </div>
            <div style={{ textAlign:"center", background:"rgba(0,0,0,0.25)", borderRadius:6, padding:"6px 3px", border:`1px solid ${ADV.border}` }}>
              <div style={{ fontSize:12, fontWeight:800, color:ADV.route }}>{status === "active" ? "RIDING" : status === "paused" ? "REST" : status === "finished" ? "DONE!" : "PREP"}</div>
              <div style={{ fontSize:7, color:ADV.mut, letterSpacing:1 }}>STATUS</div>
            </div>
          </div>

          {/* Current speed badge if live */}
          {riderGps && riderGps.speed > 0 && (
            <div style={{ marginTop:10, display:"inline-block", padding:"6px 14px", background:`${ADV.accent}22`, border:`1px solid ${ADV.accent}`, borderRadius:20 }}>
              <span style={{ fontSize:9, color:ADV.mut, letterSpacing:1 }}>CURRENT SPEED</span>
              <span style={{ fontSize:18, fontWeight:800, color:ADV.accent, marginLeft:8, fontVariantNumeric:"tabular-nums" }}>{riderGps.speed.toFixed(0)}</span>
              <span style={{ fontSize:9, color:ADV.mut, marginLeft:2 }}>km/h</span>
            </div>
          )}
        </div>
      </div>

      {/* YouTube Live Stream — Burst Mode */}
      {ytEmbed && (
        <div style={{ background:ADV.card, borderRadius:10, padding:10, border:`2px solid ${streamLive ? "#ef4444" : ADV.border}`, marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <span style={{ fontSize:14 }}>📺</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:ADV.text, fontFamily:"system-ui" }}>Live Stream</div>
              {streamLive ? (
                <div style={{ fontSize:8, color:"#ef4444", fontWeight:700, fontFamily:"system-ui" }}>● LIVE NOW</div>
              ) : (
                <div style={{ fontSize:8, color:ADV.dim, fontFamily:"system-ui" }}>Stream offline — rider goes live at key moments</div>
              )}
            </div>
            <button onClick={()=>window.open(youtubeStreamUrl,"_blank")} style={{ padding:"4px 8px", fontSize:8, fontWeight:700, borderRadius:4, border:`1px solid ${ADV.border}`, background:"transparent", color:ADV.mut, cursor:"pointer", fontFamily:"system-ui" }}>YouTube ↗</button>
          </div>
          {streamLive ? (
            <div style={{ position:"relative", width:"100%", paddingBottom:"56.25%", borderRadius:8, overflow:"hidden", background:"#000" }}>
              <iframe
                src={ytEmbed}
                style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div style={{ background:ADV.bg, borderRadius:8, padding:16, textAlign:"center", border:`1px dashed ${ADV.border}` }}>
              <div style={{ fontSize:24, marginBottom:6 }}>📡</div>
              <div style={{ fontSize:10, color:ADV.mut, fontFamily:"system-ui" }}>Stream offline right now</div>
              <div style={{ fontSize:8, color:ADV.dim, fontFamily:"system-ui", marginTop:4 }}>Rider goes live at checkpoints — check back soon!</div>
            </div>
          )}
        </div>
      )}

      {/* CYCLING DASHBOARD — speed, distance, status above map */}
      <div style={{ background:`linear-gradient(135deg, #0f1419, #1a2332)`, borderRadius:10, padding:"12px 10px", border:`1px solid ${ADV.accent}44`, marginBottom:8, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        <div style={{ textAlign:"center", borderRight:`1px solid ${ADV.border}` }}>
          <div style={{ fontSize:7, color:ADV.mut, letterSpacing:2, marginBottom:2, fontFamily:"system-ui" }}>⚡ SPEED</div>
          <div style={{ fontSize:28, fontWeight:800, color: riderGps?.speed > 0 ? ADV.accent : ADV.dim, fontVariantNumeric:"tabular-nums", lineHeight:1, fontFamily:"system-ui" }}>
            {riderGps?.speed > 0 ? riderGps.speed.toFixed(0) : "—"}
          </div>
          <div style={{ fontSize:7, color:ADV.mut, marginTop:2 }}>km/h</div>
        </div>
        <div style={{ textAlign:"center", borderRight:`1px solid ${ADV.border}` }}>
          <div style={{ fontSize:7, color:ADV.mut, letterSpacing:2, marginBottom:2, fontFamily:"system-ui" }}>📏 DISTANCE</div>
          <div style={{ fontSize:28, fontWeight:800, color:ADV.success, fontVariantNumeric:"tabular-nums", lineHeight:1, fontFamily:"system-ui" }}>
            {kmDone}
          </div>
          <div style={{ fontSize:7, color:ADV.mut, marginTop:2 }}>of {TOTAL_KM} km</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:7, color:ADV.mut, letterSpacing:2, marginBottom:2, fontFamily:"system-ui" }}>🏁 STATUS</div>
          <div style={{ fontSize:14, fontWeight:800, color:ADV.route, lineHeight:1.1, fontFamily:"system-ui", marginTop:6 }}>
            {status === "active" ? "LIVE" : status === "paused" ? "RESTING" : status === "finished" ? "DONE!" : "WAITING"}
          </div>
          <div style={{ fontSize:7, color:ADV.mut, marginTop:4 }}>{segsDone}/11 segs</div>
        </div>
      </div>

      {/* PRIMARY: Leaflet Map — locked to SG */}
      <div style={{ background:ADV.card, borderRadius:10, padding:10, border:`1px solid ${ADV.border}`, marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
          <span style={{ fontSize:14 }}>🗺️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:ADV.text, fontFamily:"system-ui" }}>Live Route Map</div>
            <div style={{ fontSize:8, color:ADV.mut, fontFamily:"system-ui" }}>
              <span style={{ color:ADV.success }}>● Done</span> · <span style={{ color:ADV.route }}>● Remaining</span>
              {riderGps && <> · <span style={{ color:ADV.accent }}>● Rider</span></>}
            </div>
          </div>
          <button onClick={()=>window.open(`https://connect.garmin.com/modern/course/446685371`,"_blank")} style={{ padding:"4px 10px", fontSize:9, fontWeight:700, borderRadius:4, border:`1px solid ${ADV.border}`, background:"transparent", color:ADV.mut, cursor:"pointer", fontFamily:"system-ui" }}>View Route ↗</button>
        </div>
        <LeafletMap riderGps={riderGps} segments={segments} kmDone={kmDone} brightness={brightness} height={420} />
        {riderGps && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6, padding:"5px 10px", background:"rgba(101, 163, 13, 0.15)", borderRadius:4, border:`1px solid ${ADV.success}33` }}>
            <div style={{ fontSize:9, color:ADV.success, fontFamily:"system-ui", fontWeight:700 }}>
              📍 Updated {riderGps.t ? `${Math.round((Date.now() - riderGps.t) / 1000)}s ago` : ""}
              {riderGps.speed > 0 && ` · ${riderGps.speed.toFixed(0)} km/h`}
            </div>
            <div style={{ fontSize:7, color:ADV.mut, fontFamily:"system-ui" }}>~30s refresh</div>
          </div>
        )}
      </div>

      {/* SINGLE prominent LiveTrack button */}
      {liveTrackUrl && (
        <button onClick={()=>window.open(liveTrackUrl,"_blank")} style={{ width:"100%", padding:"14px", fontSize:12, fontWeight:800, borderRadius:10, border:`2px solid ${ADV.accent}`, background:`linear-gradient(135deg, ${ADV.accent}22, ${ADV.accent2}22)`, color:ADV.accent, cursor:"pointer", fontFamily:"system-ui", marginBottom:10, letterSpacing:0.5 }}>
          ⌚ GARMIN LIVETRACK — REAL-TIME GPS ↗
        </button>
      )}

      {/* COMBINED: Segment progress bar (horizontal, with all info inline) */}
      <div style={{ background:ADV.card, borderRadius:10, padding:12, border:`1px solid ${ADV.border}`, marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontSize:10, fontWeight:700, color:ADV.accent, letterSpacing:2, fontFamily:"system-ui" }}>🏁 SEGMENTS</div>
          <div style={{ fontSize:9, color:ADV.mut, fontFamily:"system-ui" }}>{kmDone}/{TOTAL_KM} km · {pct}%</div>
        </div>
        {/* Segment bar with labels inline */}
        <div style={{ display:"flex", height:36, borderRadius:6, overflow:"hidden", marginBottom:6, border:`1px solid ${ADV.border}` }}>
          {segments.map((s,i) => (
            <div key={i} title={`${s.name} · ${s.km}km${s.completedAt?` · ${fmtClock(s.completedAt)}`:""}`} style={{ flex:s.km, background:s.completed ? s.c : ADV.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderRight: i < segments.length-1 ? `1px solid ${ADV.border}` : "none", position:"relative" }}>
              <span style={{ fontSize:9, color:s.completed?"#fff":ADV.dim, fontWeight:800 }}>{s.id}</span>
              <span style={{ fontSize:6, color:s.completed?"rgba(255,255,255,0.85)":ADV.dim, marginTop:1 }}>{s.km}k</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:7, color:ADV.dim, marginBottom:10 }}>
          <span>ECP START</span><span>TUAS LP1</span><span>WOODLANDS</span><span>CHANGI</span><span>FINISH</span>
        </div>
        {/* Detailed segment list with timestamps */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
          {segments.map(s => (
            <div key={s.id} style={{ display:"flex", gap:6, alignItems:"center", padding:"5px 8px", background: s.completed ? `${s.c}15` : "rgba(0,0,0,0.2)", borderRadius:4, borderLeft:`3px solid ${s.completed?s.c:ADV.border}`, opacity:s.completed?1:0.6 }}>
              <span style={{ fontSize:9, fontWeight:800, color:s.completed?s.c:ADV.dim, minWidth:12 }}>{s.id}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:8, color:ADV.text, fontFamily:"system-ui", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
                <div style={{ fontSize:7, color:ADV.dim, fontFamily:"system-ui" }}>
                  {s.km}km{s.completedAt && ` · ${fmtClock(s.completedAt)}`}
                </div>
              </div>
              {s.completed && <span style={{ fontSize:10, color:s.c }}>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* PROMINENT Chat */}
      <div style={{ background:`linear-gradient(135deg, ${ADV.card}, ${ADV.bg})`, borderRadius:12, padding:14, border:`2px solid ${ADV.accent}66`, marginBottom:10, position:"relative", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <span style={{ fontSize:22 }}>📣</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:ADV.text, fontFamily:"system-ui" }}>Join the Chat</div>
            <div style={{ fontSize:9, color:ADV.accent, fontFamily:"system-ui" }}>Live messages between the rider and the crew</div>
          </div>
        </div>
        <ChatRoom state={{ status, dateOption }} kmDone={kmDone} S={{ ...S, card:ADV.bg, border:ADV.border, text:ADV.text, mut:ADV.mut, dim:ADV.dim, acc:ADV.accent }} />
      </div>

      {/* Rider login */}
      <div style={{ textAlign:"center", marginTop:16, padding:"12px 0" }}>
        {!showPin ? (
          <button onClick={()=>setShowPin(true)} style={{ background:"transparent", border:"none", color:ADV.dim, fontSize:8, cursor:"pointer", textDecoration:"underline", fontFamily:"system-ui", opacity:0.4 }}>
            Rider login
          </button>
        ) : (
          <div style={{ display:"flex", gap:4, justifyContent:"center", alignItems:"center" }}>
            <input
              type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")handlePin();}}
              placeholder="PIN"
              style={{ width:80, padding:"6px 8px", fontSize:11, borderRadius:5, border:`1px solid ${pinError?"#ef4444":ADV.border}`, background:ADV.card, color:ADV.text, outline:"none", textAlign:"center" }}
              autoFocus
            />
            <button onClick={handlePin} style={{ padding:"6px 12px", fontSize:10, fontWeight:700, borderRadius:5, border:"none", cursor:"pointer", background:ADV.accent, color:"#000" }}>Go</button>
            <button onClick={()=>{setShowPin(false);setPinInput("");}} style={{ padding:"6px 8px", fontSize:10, borderRadius:5, border:"none", cursor:"pointer", background:ADV.card, color:ADV.dim }}>x</button>
          </div>
        )}
        {pinError && <div style={{ fontSize:9, color:"#ef4444", marginTop:4, fontFamily:"system-ui" }}>Wrong PIN</div>}
      </div>
    </div>
  );
}

// ==========================================================================
// NAV TAB
// ==========================================================================
function NavTab({ state, currentSeg, currentTurns, nextWp, distToNextWp, bearingToNextWp, withinProximity, lastGps, gpsTracking, elapsed, kmDone, kmLeft, pct, completeSeg, pauseRide, resumeRide, setGpsTracking, requestWakeLock, wakeLock, brightness, setTab, S }) {
  const [showStops, setShowStops] = useState(false);
  const [showTurns, setShowTurns] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [dismissedMoments, setDismissedMoments] = useState([]);

  // Poll chat messages
  useEffect(() => {
    if (state.status !== "active") return;
    const load = async () => {
      try {
        const msgs = await sb.get("rti_chat", "ride_id=eq.current&order=created_at.desc&limit=10");
        if (Array.isArray(msgs)) setMessages(msgs);
      } catch(e) {}
    };
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [state.status]);

  const sendMessage = async () => {
    if (!draft.trim() || sending) return;
    const myName = localStorage.getItem(CHAT_NAME_KEY) || "Rider";
    setSending(true);
    try {
      await sb.insert("rti_chat", {
        ride_id: "current",
        name: myName,
        text: draft.trim().slice(0, 300),
        km: kmDone,
        ride_status: state.status,
      });
      setDraft("");
      // Refresh
      const msgs = await sb.get("rti_chat", "ride_id=eq.current&order=created_at.desc&limit=10");
      if (Array.isArray(msgs)) setMessages(msgs);
    } catch(e) {}
    setSending(false);
  };

  // Find active moment alert
  const activeMoment = findActiveMoment(lastGps, currentSeg.id, dismissedMoments);
  const dismissMoment = (id) => setDismissedMoments(prev => [...prev, id]);

  if (state.status === "idle") {
    return (
      <div style={{ textAlign:"center", padding:"24px 12px" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🧭</div>
        <h2 style={{ fontSize:16, fontWeight:800, margin:"0 0 6px", fontFamily:"system-ui" }}>Navigation View</h2>
        <p style={{ fontSize:10, color:S.mut, marginBottom:16, fontFamily:"system-ui" }}>Start a ride to begin navigation</p>
        <div style={{ background:"#1a0d0d", borderRadius:8, padding:12, maxWidth:320, margin:"0 auto", border:"1px solid #7f1d1d", textAlign:"left" }}>
          <div style={{ fontSize:10, color:"#fca5a5", fontWeight:700, marginBottom:6, fontFamily:"system-ui" }}>⚠️ Primary Nav Reminder</div>
          <div style={{ fontSize:9, color:S.mut, lineHeight:1.5, fontFamily:"system-ui" }}>Use Fenix 6S <b style={{ color:S.text }}>Follow Course</b> as primary. This webapp is secondary visual reference.</div>
        </div>
        <button onClick={()=>setTab("tracker")} style={{ marginTop:12, padding:"10px 20px", fontSize:11, fontWeight:700, borderRadius:6, border:"none", background:S.acc, color:"#fff", cursor:"pointer" }}>Go to Start Screen →</button>
      </div>
    );
  }

  // Critical hazard detection (only show in-motion warnings if word "⚠️" present)
  const hasCriticalHazard = currentTurns?.hazards?.includes("⚠️");
  const curSpeed = lastGps?.speed || 0;

  return (
    <div>
      {/* MOMENT ALERT — flashes when near stream/record-worthy spot */}
      {activeMoment && (
        <div style={{ background: activeMoment.type === "live" ? "#3d0a0a" : "#1a0d2e", borderRadius:10, padding:12, marginBottom:8, border:`2px solid ${activeMoment.type === "live" ? "#ef4444" : "#a78bfa"}`, animation:"pulse 2s infinite" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ fontSize:18 }}>{activeMoment.type === "live" ? "🔴" : "📹"}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:8, color: activeMoment.type === "live" ? "#fca5a5" : "#c4b5fd", fontWeight:700, letterSpacing:2, fontFamily:"system-ui" }}>
                {activeMoment.type === "live" ? "🔴 GO LIVE NOW" : "📹 RECORD CINEMATIC"}
              </div>
              <div style={{ fontSize:13, fontWeight:800, color:"#fff", fontFamily:"system-ui" }}>{activeMoment.name}</div>
            </div>
            <button onClick={()=>dismissMoment(activeMoment.id)} style={{ background:"transparent", border:"none", color:"#fff", fontSize:16, cursor:"pointer", padding:4 }}>×</button>
          </div>
          <div style={{ fontSize:10, color:"#e5e7eb", lineHeight:1.4, marginBottom:8, fontFamily:"system-ui" }}>{activeMoment.why}</div>
          <div style={{ fontSize:9, color: activeMoment.type === "live" ? "#fca5a5" : "#c4b5fd", fontFamily:"system-ui" }}>
            📍 {(activeMoment.distance * 1000).toFixed(0)}m away
          </div>
          {activeMoment.type === "live" && (
            <button onClick={()=>setTab("sync")} style={{ width:"100%", marginTop:8, padding:"8px", fontSize:11, fontWeight:700, borderRadius:5, border:"none", cursor:"pointer", background:"#ef4444", color:"#fff", fontFamily:"system-ui" }}>
              Open Sync → Go Live
            </button>
          )}
        </div>
      )}

      {/* HERO STATS — always visible, glanceable at speed */}
      <div style={{ background:S.card, borderRadius:10, padding:"10px 12px", marginBottom:8, border:`1px solid ${S.border}` }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, alignItems:"center" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:800, color:S.text, fontVariantNumeric:"tabular-nums", fontFamily:"system-ui" }}>{fmtTime(elapsed).slice(0,5)}</div>
            <div style={{ fontSize:7, color:S.dim, letterSpacing:1 }}>TIME</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#22c55e", fontVariantNumeric:"tabular-nums", fontFamily:"system-ui" }}>{kmDone}</div>
            <div style={{ fontSize:7, color:S.dim, letterSpacing:1 }}>KM DONE</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:800, color: curSpeed > 0 ? "#3b82f6" : S.dim, fontVariantNumeric:"tabular-nums", fontFamily:"system-ui" }}>{curSpeed > 0 ? curSpeed.toFixed(0) : "—"}</div>
            <div style={{ fontSize:7, color:S.dim, letterSpacing:1 }}>KM/H NOW</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#a78bfa", fontVariantNumeric:"tabular-nums", fontFamily:"system-ui" }}>{pct}%</div>
            <div style={{ fontSize:7, color:S.dim, letterSpacing:1 }}>DONE</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop:6, height:3, background:"#1f2937", borderRadius:2, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg, #22c55e, #3b82f6)", transition:"width 0.5s" }} />
        </div>
      </div>

      {/* NEXT WAYPOINT — Hero element, biggest on screen */}
      <div style={{ background: withinProximity ? "#1a2e1a" : S.card, borderRadius:10, padding:14, marginBottom:8, border:`2px solid ${withinProximity?"#22c55e":S.border}`, transition:"all 0.3s" }}>
        <div style={{ fontSize:9, color:S.mut, letterSpacing:2, marginBottom:4 }}>NEXT WAYPOINT</div>
        <div style={{ fontSize:16, fontWeight:800, color:S.text, fontFamily:"system-ui", marginBottom:8 }}>{nextWp.name}</div>
        {lastGps && distToNextWp !== null ? (
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:42, fontWeight:800, color: withinProximity?"#22c55e":"#fbbf24", fontVariantNumeric:"tabular-nums", lineHeight:1, fontFamily:"system-ui" }}>
                {distToNextWp < 1 ? `${(distToNextWp*1000).toFixed(0)}` : `${distToNextWp.toFixed(1)}`}
              </div>
              <div style={{ fontSize:9, color:S.dim, marginTop:2 }}>{distToNextWp < 1 ? "METRES" : "KM"} · STRAIGHT</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ width:72, height:72 }}>
                <svg viewBox="0 0 60 60" style={{ width:"100%", height:"100%" }}>
                  <circle cx="30" cy="30" r="26" fill="none" stroke={S.border} strokeWidth="2" />
                  <g transform={`rotate(${bearingToNextWp} 30 30)`}>
                    <polygon points="30,8 38,34 30,28 22,34" fill="#fbbf24" />
                  </g>
                  <text x="30" y="8" fill={S.mut} fontSize="6" textAnchor="middle">N</text>
                </svg>
              </div>
              <div style={{ fontSize:11, color:S.text, fontWeight:700, marginTop:2 }}>{bearingCompass(bearingToNextWp)} {bearingToNextWp.toFixed(0)}°</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize:12, color:S.mut, fontFamily:"system-ui", padding:"8px 0" }}>
            {gpsTracking ? "📡 Acquiring GPS..." : "⚠️ Enable GPS in Sync tab"}
          </div>
        )}
        {withinProximity && <div style={{ fontSize:11, color:"#22c55e", fontWeight:700, marginTop:8, fontFamily:"system-ui", textAlign:"center" }}>✓ Within 500m — tap DONE below</div>}
      </div>

      {/* CURRENT SEGMENT + DONE BUTTON — most critical action */}
      <div style={{ background:S.card, borderRadius:10, padding:12, marginBottom:8, border:`1px solid ${S.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:9, color:S.mut, letterSpacing:2 }}>SEG {currentSeg.id}/11 · {currentSeg.km}km</div>
            <div style={{ fontSize:14, fontWeight:700, color:S.text, fontFamily:"system-ui" }}>{currentSeg.name}</div>
          </div>
          <span style={{ background:currentSeg.c, color:"#fff", padding:"3px 8px", borderRadius:3, fontSize:9, fontWeight:700, flexShrink:0 }}>{currentSeg.d}</span>
        </div>

        {/* Critical hazard warning — always visible if present */}
        {hasCriticalHazard && (
          <div style={{ padding:"8px 10px", background:"#2d1b00", borderRadius:5, fontSize:11, color:"#fbbf24", fontFamily:"system-ui", marginBottom:8, lineHeight:1.4, borderLeft:"3px solid #fbbf24" }}>
            {currentTurns.hazards}
          </div>
        )}

        {/* Big Done button */}
        {!currentSeg.completed && state.status === "active" && (
          <button onClick={()=>completeSeg(currentSeg.id)} style={{ width:"100%", padding:"14px", fontSize:14, fontWeight:800, borderRadius:8, border:"none", cursor:"pointer", background:"#22c55e", color:"#000", letterSpacing:1 }}>
            ✓ COMPLETE SEGMENT {currentSeg.id}
          </button>
        )}
      </div>

      {/* COLLAPSIBLE: Stops & Facilities */}
      {currentTurns && (
        <div style={{ background:S.card, borderRadius:10, padding:10, marginBottom:6, border:`1px solid ${S.border}` }}>
          <button
            onClick={()=>setShowStops(!showStops)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:8, background:"transparent", border:"none", color:S.text, cursor:"pointer", padding:0, fontFamily:"system-ui", textAlign:"left" }}
          >
            <span style={{ fontSize:14 }}>🚻</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700 }}>Stops & Facilities</div>
              {currentTurns.resupply && !showStops && (
                <div style={{ fontSize:9, color:"#22c55e", marginTop:2, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>🚰 {currentTurns.resupply}</div>
              )}
            </div>
            <span style={{ fontSize:10, color:S.mut, flexShrink:0 }}>{showStops ? "▼" : "▶"}</span>
          </button>
          {showStops && (
            <div style={{ marginTop:8 }}>
              {currentTurns.resupply && (
                <div style={{ marginBottom:6, padding:"8px 10px", background:"#0a1a0a", borderRadius:5, borderLeft:"3px solid #22c55e" }}>
                  <div style={{ fontSize:8, color:"#16a34a", fontWeight:700, marginBottom:2, letterSpacing:1 }}>🚰 WATER / FOOD</div>
                  <div style={{ fontSize:10, color:"#22c55e", lineHeight:1.4 }}>{currentTurns.resupply}</div>
                </div>
              )}
              {currentTurns.toilets && (
                <div style={{ marginBottom:6, padding:"8px 10px", background:"#0a0a1a", borderRadius:5, borderLeft:"3px solid #3b82f6" }}>
                  <div style={{ fontSize:8, color:"#60a5fa", fontWeight:700, marginBottom:2, letterSpacing:1 }}>🚻 TOILETS</div>
                  {currentTurns.toilets.map((t,i) => (
                    <div key={i} style={{ fontSize:10, color:"#93c5fd", lineHeight:1.4, marginTop:i?2:0 }}>• {t}</div>
                  ))}
                </div>
              )}
              {currentTurns.photo && (
                <div style={{ marginBottom:6, padding:"8px 10px", background:"#1a0a1a", borderRadius:5, borderLeft:"3px solid #c084fc" }}>
                  <div style={{ fontSize:8, color:"#c084fc", fontWeight:700, marginBottom:2, letterSpacing:1 }}>📸 PHOTO SPOTS</div>
                  {currentTurns.photo.map((p,i) => (
                    <div key={i} style={{ fontSize:10, color:"#d8b4fe", lineHeight:1.4, marginTop:i?2:0 }}>• {p}</div>
                  ))}
                </div>
              )}
              {currentTurns.shelter && (
                <div style={{ padding:"8px 10px", background:"#1a1500", borderRadius:5, borderLeft:"3px solid #fbbf24" }}>
                  <div style={{ fontSize:8, color:"#fbbf24", fontWeight:700, marginBottom:2, letterSpacing:1 }}>☂️ SHELTER (rain plan)</div>
                  {currentTurns.shelter.map((s,i) => (
                    <div key={i} style={{ fontSize:10, color:"#fde68a", lineHeight:1.4, marginTop:i?2:0 }}>• {s}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* COLLAPSIBLE: Turn-by-turn directions */}
      {currentTurns && (
        <div style={{ background:S.card, borderRadius:10, padding:10, marginBottom:6, border:`1px solid ${S.border}` }}>
          <button
            onClick={()=>setShowTurns(!showTurns)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:8, background:"transparent", border:"none", color:S.text, cursor:"pointer", padding:0, fontFamily:"system-ui", textAlign:"left" }}
          >
            <span style={{ fontSize:14 }}>📋</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700 }}>Turn-by-Turn</div>
              <div style={{ fontSize:8, color:S.dim, marginTop:1 }}>{currentTurns.steps.length} steps · Fenix has audio alerts</div>
            </div>
            <span style={{ fontSize:10, color:S.mut }}>{showTurns ? "▼" : "▶"}</span>
          </button>
          {showTurns && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:11, color:S.text, lineHeight:1.7, fontFamily:"system-ui" }}>
                {currentTurns.steps.map((step, i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:4 }}>
                    <span style={{ color:S.acc, fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              {currentTurns.gmaps && (
                <button onClick={()=>window.open(currentTurns.gmaps,"_blank")} style={{ marginTop:8, width:"100%", padding:"8px", fontSize:10, fontWeight:700, borderRadius:5, border:`1px solid ${S.border}`, background:"transparent", color:"#93c5fd", cursor:"pointer", fontFamily:"system-ui" }}>
                  🗺️ Open in Google Maps
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* COLLAPSIBLE: Live Chat (read + quick reply) */}
      <div style={{ background:S.card, borderRadius:10, padding:10, marginBottom:6, border:`1px solid ${messages.length > 0 ? "#3b82f6" : S.border}` }}>
        <button
          onClick={()=>setShowChat(!showChat)}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:8, background:"transparent", border:"none", color:S.text, cursor:"pointer", padding:0, fontFamily:"system-ui", textAlign:"left" }}
        >
          <span style={{ fontSize:14 }}>💬</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700 }}>Live Chat <span style={{ fontSize:9, color:S.dim, fontWeight:400 }}>· {messages.length} msgs</span></div>
            {messages.length > 0 && !showChat && (
              <div style={{ fontSize:9, color:"#93c5fd", marginTop:2, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                <b>{messages[0].name}:</b> {messages[0].text}
              </div>
            )}
          </div>
          <span style={{ fontSize:10, color:S.mut, flexShrink:0 }}>{showChat ? "▼" : "▶"}</span>
        </button>
        {showChat && (
          <div style={{ marginTop:8 }}>
            <div style={{ maxHeight:180, overflowY:"auto", background:"#050a12", borderRadius:6, padding:8, marginBottom:8, border:`1px solid ${S.border}` }}>
              {messages.length === 0 ? (
                <div style={{ textAlign:"center", color:S.dim, fontSize:10, padding:16, fontFamily:"system-ui" }}>No messages yet</div>
              ) : (
                [...messages].reverse().map(m => (
                  <div key={m.id} style={{ marginBottom:6, paddingBottom:4, borderBottom:`1px solid ${S.border}` }}>
                    <div style={{ display:"flex", gap:6, alignItems:"baseline", marginBottom:2 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:"#93c5fd", fontFamily:"system-ui" }}>{m.name}</span>
                      <span style={{ fontSize:8, color:S.dim, fontFamily:"system-ui" }}>{fmtClock(new Date(m.created_at).getTime())}</span>
                    </div>
                    <div style={{ fontSize:10, color:S.text, lineHeight:1.4, fontFamily:"system-ui", wordBreak:"break-word" }}>{m.text}</div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display:"flex", gap:4 }}>
              <input
                type="text" value={draft} onChange={e=>setDraft(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")sendMessage();}}
                placeholder="Quick reply..."
                maxLength={300}
                disabled={sending}
                style={{ flex:1, padding:"8px 10px", fontSize:11, borderRadius:5, border:`1px solid ${S.border}`, background:"#0a0f1a", color:S.text, outline:"none", fontFamily:"system-ui" }}
              />
              <button onClick={sendMessage} disabled={!draft.trim() || sending} style={{ padding:"8px 14px", fontSize:10, fontWeight:700, borderRadius:5, border:"none", cursor:draft.trim()&&!sending?"pointer":"not-allowed", background:S.acc, color:"#fff", opacity:draft.trim()&&!sending?1:0.4, fontFamily:"system-ui" }}>
                {sending ? "..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK CONTROLS — pause / GPS / Wake */}
      <div style={{ display:"flex", gap:4, marginTop:8 }}>
        {state.status === "active" && <Btn onClick={pauseRide} bg="#eab308" text="⏸ Pause" />}
        {state.status === "paused" && <Btn onClick={resumeRide} bg="#22c55e" text="▶ Resume" />}
        {!gpsTracking && state.status !== "finished" && <Btn onClick={()=>setGpsTracking(true)} bg="#ec4899" text="📡 GPS" />}
        {!wakeLock && <Btn onClick={requestWakeLock} bg="#fbbf24" text="💡 Wake" />}
      </div>
    </div>
  );
}

// ==========================================================================
// TRACKER TAB
// ==========================================================================
function TrackerTab({ state, startRide, pauseRide, resumeRide, resetRide, loadAttemptById, completeSeg, undoSeg, addNote, elapsed, kmDone, kmLeft, pct, S }) {
  const [attempts, setAttempts] = useState(loadAttempts);
  const [showAttempts, setShowAttempts] = useState(false);
  const refreshAttempts = () => setAttempts(loadAttempts());
  if (state.status === "idle") {
    return (
      <div style={{ textAlign:"center", padding:"24px 12px" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🚴</div>
        <h2 style={{ fontSize:18, fontWeight:800, margin:"0 0 4px", fontFamily:"system-ui" }}>SG Round Island</h2>
        <p style={{ fontSize:11, color:S.mut, marginBottom:6, fontFamily:"system-ui" }}>{TOTAL_KM} km · 11 segments</p>
        <p style={{ fontSize:9, color:"#f87171", marginBottom:16, fontFamily:"system-ui" }}>⚠️ Day 12–13 post-tx · Blitz only</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, maxWidth:320, margin:"0 auto" }}>
          <div style={{ fontSize:9, color:"#22c55e", fontWeight:700, marginBottom:-4, fontFamily:"system-ui" }}>★ RECOMMENDED</div>
          <button onClick={()=>startRide("apr11")} style={{ padding:"14px", fontSize:12, fontWeight:700, borderRadius:10, border:"2px solid #22c55e", background:"#22c55e11", color:"#22c55e", cursor:"pointer", textAlign:"left" }}>
            Apr 11 Sat · Blitz (Day 13)
            <div style={{ fontSize:9, fontWeight:400, marginTop:2 }}>Sat 23:00 → Sun 11:30 · Auto-enables GPS + Wake Lock</div>
          </button>
          <div style={{ fontSize:9, color:S.dim, fontWeight:700, marginBottom:-4, marginTop:4, fontFamily:"system-ui" }}>BACKUP</div>
          <button onClick={()=>startRide("apr10")} style={{ padding:"14px", fontSize:12, fontWeight:700, borderRadius:10, border:"2px solid #f97316", background:"#f9731611", color:"#f97316", cursor:"pointer", textAlign:"left" }}>
            Apr 10 Fri · Blitz (Day 12)
            <div style={{ fontSize:9, fontWeight:400, marginTop:2 }}>Fri 23:00 → Sat 11:30 · Weather contingency</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign:"center", padding:"14px 0 10px", background:S.card, borderRadius:10, marginBottom:8, border:`1px solid ${S.border}` }}>
        <div style={{ fontSize:32, fontWeight:800, letterSpacing:2, fontVariantNumeric:"tabular-nums", color: state.status==="finished"?"#22c55e":S.text }}>{fmtTime(elapsed)}</div>
        <div style={{ fontSize:9, color:S.dim, marginTop:2 }}>ELAPSED</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4, marginTop:10, padding:"0 10px" }}>
          <StatBox l="Done" v={`${kmDone}km`} c="#22c55e" />
          <StatBox l="Left" v={`${kmLeft}km`} c="#f97316" />
          <StatBox l="Pace" v={`${fmtPace(kmDone,elapsed)}`} c="#3b82f6" />
          <StatBox l="%" v={`${pct}%`} c="#a78bfa" />
        </div>
        <div style={{ margin:"10px 10px 0", height:5, background:"#1f2937", borderRadius:3, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg, #22c55e, #3b82f6)", borderRadius:3, transition:"width 0.5s" }} />
        </div>
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:10, flexWrap:"wrap" }}>
          {state.status === "active" && <Btn onClick={pauseRide} bg="#eab308" text="⏸ Pause" />}
          {state.status === "paused" && <Btn onClick={resumeRide} bg="#22c55e" text="▶ Resume" />}
          {state.status === "finished" && <div style={{ fontSize:13, fontWeight:700, color:"#22c55e", padding:"8px 14px" }}>🏁 COMPLETE!</div>}
          <Btn onClick={()=>{resetRide("save"); setTimeout(refreshAttempts, 100);}} bg="#3b82f6" text="💾 Save & Reset" />
          <Btn onClick={()=>resetRide("reset")} bg="#ef4444" text="↺ Reset" />
          <Btn onClick={()=>resetRide("full")} bg="#7f1d1d" text="🗑 Full Reset" />
        </div>
        <div style={{ fontSize:8, color:S.dim, textAlign:"center", marginTop:4, fontFamily:"system-ui" }}>
          Save & Reset = archive this attempt · Reset = discard · Full Reset = also clears chat
        </div>
      </div>

      {/* Saved Attempts */}
      <div style={{ background:S.card, borderRadius:10, padding:10, border:`1px solid ${S.border}`, marginBottom:8 }}>
        <button onClick={()=>setShowAttempts(!showAttempts)} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, background:"transparent", border:"none", color:S.text, cursor:"pointer", padding:0, fontFamily:"system-ui", textAlign:"left" }}>
          <span style={{ fontSize:14 }}>💾</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700 }}>Saved Attempts <span style={{ fontSize:9, color:S.dim, fontWeight:400 }}>· {attempts.length}</span></div>
            <div style={{ fontSize:8, color:S.dim, marginTop:1 }}>{attempts.length === 0 ? "No saved attempts yet" : "Load a previous test or real ride"}</div>
          </div>
          <span style={{ fontSize:10, color:S.mut }}>{showAttempts ? "▼" : "▶"}</span>
        </button>
        {showAttempts && (
          <div style={{ marginTop:10 }}>
            {attempts.length === 0 ? (
              <div style={{ fontSize:9, color:S.dim, textAlign:"center", padding:"12px 0", fontFamily:"system-ui" }}>
                Tap <b>💾 Save & Reset</b> above to archive your current ride as an attempt
              </div>
            ) : (
              [...attempts].reverse().map(a => (
                <div key={a.id} style={{ display:"flex", gap:6, alignItems:"center", padding:"8px 10px", marginBottom:4, background:"#0a0f1a", borderRadius:6, border:`1px solid ${S.border}` }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:S.text, fontFamily:"system-ui", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
                    <div style={{ fontSize:8, color:S.dim, fontFamily:"system-ui" }}>
                      {a.kmDone}km · {a.segsDone}/11 segs · {fmtTime(a.elapsed)} · {new Date(a.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button onClick={()=>loadAttemptById(a.id)} style={{ padding:"5px 8px", fontSize:8, fontWeight:700, borderRadius:4, border:"none", cursor:"pointer", background:"#3b82f6", color:"#fff", fontFamily:"system-ui" }}>Load</button>
                  <button onClick={()=>{if(confirm("Delete this attempt?")){deleteAttempt(a.id); refreshAttempts();}}} style={{ padding:"5px 8px", fontSize:8, fontWeight:700, borderRadius:4, border:`1px solid ${S.border}`, cursor:"pointer", background:"transparent", color:"#ef4444", fontFamily:"system-ui" }}>🗑</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom:8 }}>
        {state.segments.map((s, i) => {
          const isNext = !s.completed && (i === 0 || state.segments[i-1].completed);
          const segE = s.completedAt && i > 0 && state.segments[i-1].completedAt ? s.completedAt - state.segments[i-1].completedAt : s.completedAt && i === 0 ? s.completedAt - state.startTime : null;
          return (
            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px", marginBottom:3, background: s.completed ? "#0a1a0a" : isNext ? "#1a1a0a" : S.card, borderRadius:6, border:`1px solid ${isNext ? "#eab30866" : s.completed ? "#22c55e33" : S.border}` }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background: s.completed ? s.c : "#1f2937", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color: s.completed ? "#fff" : S.dim, flexShrink:0 }}>{s.completed ? "✓" : s.id}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:700, fontFamily:"system-ui", color: s.completed ? "#22c55e" : isNext ? "#eab308" : S.text }}>{s.name}</div>
                <div style={{ fontSize:8, color:S.dim }}>{s.km}km · {s.d}{segE ? ` · ${fmtTime(segE)}` : ""}</div>
              </div>
              {isNext && state.status === "active" && <button onClick={()=>completeSeg(s.id)} style={{ padding:"5px 10px", fontSize:9, fontWeight:700, borderRadius:5, border:"none", cursor:"pointer", background:"#22c55e", color:"#000" }}>Done</button>}
              {s.completed && <button onClick={()=>undoSeg(s.id)} style={{ padding:"3px 6px", fontSize:8, borderRadius:3, border:`1px solid ${S.border}`, background:"transparent", color:S.dim, cursor:"pointer" }}>↺</button>}
            </div>
          );
        })}
      </div>

      <NoteInput onAdd={addNote} S={S} />
    </div>
  );
}

// ==========================================================================
// MAP + CHAT TAB
// ==========================================================================
function MapChatTab({ state, lastGps, gpsTracking, nextWp, kmDone, pct, brightness, S }) {
  // Build riderGps shape compatible with LeafletMap
  const riderGps = lastGps ? { lat: lastGps.lat, lng: lastGps.lng, speed: lastGps.speed, t: lastGps.t } : null;

  return (
    <div>
      {/* Leaflet route map (same as observer) */}
      <div style={{ background:S.card, borderRadius:10, padding:10, border:`1px solid ${S.border}`, marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
          <span style={{ fontSize:14 }}>🗺️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:S.text, fontFamily:"system-ui" }}>Route Map</div>
            <div style={{ fontSize:8, color:S.dim, fontFamily:"system-ui" }}>
              <span style={{ color:"#22c55e" }}>● Done</span> · <span style={{ color:"#3b82f6" }}>● Remaining</span>
              {riderGps && <> · <span style={{ color:"#ec4899" }}>● You</span></>}
            </div>
          </div>
        </div>
        <LeafletMap riderGps={riderGps} segments={state.segments} kmDone={kmDone} brightness={brightness} height={360} />
      </div>

      {/* Segment progress bar */}
      <div style={{ background:S.card, borderRadius:8, padding:10, border:`1px solid ${S.border}`, marginBottom:8 }}>
        <div style={{ display:"flex", height:22, borderRadius:5, overflow:"hidden", marginBottom:4 }}>
          {state.segments.map((s,i)=>(
            <div key={i} style={{ flex:s.km, background:s.completed?s.c:"#1f2937", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:7, color:s.completed?"#fff":"#4b5563", fontWeight:700 }}>{s.km}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:8, color:S.dim }}>
          <span>0 km</span><span>{kmDone}/{TOTAL_KM} ({pct}%)</span><span>{TOTAL_KM}</span>
        </div>
      </div>

      {/* Full Chat Room */}
      <ChatRoom state={state} kmDone={kmDone} S={S} />
    </div>
  );
}

// ==========================================================================
// CHAT ROOM (Shared Storage)
// ==========================================================================
function ChatRoom({ state, kmDone, S }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  // Load name from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_NAME_KEY);
      if (saved) { setName(saved); setNameSet(true); }
    } catch(e) {}
  }, []);

  // Load messages from Supabase
  const loadMessages = useCallback(async () => {
    try {
      const msgs = await sb.get("rti_chat", "ride_id=eq.current&order=created_at.asc&limit=500");
      if (Array.isArray(msgs)) {
        setMessages(msgs.map(m => ({ id:m.id, name:m.name, text:m.text, time:new Date(m.created_at).getTime(), km:m.km, rideStatus:m.ride_status })));
      }
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMessages();
    const iv = setInterval(loadMessages, 5000);
    return () => clearInterval(iv);
  }, [loadMessages]);

  // Auto scroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const saveName = (n) => {
    if (!n.trim()) return;
    const clean = n.trim().slice(0, 20);
    try { localStorage.setItem(CHAT_NAME_KEY, clean); } catch(e) {}
    setName(clean); setNameSet(true);
  };

  const sendMessage = async () => {
    if (!draft.trim() || !name || sending) return;
    setSending(true);
    try {
      await sb.insert("rti_chat", {
        ride_id: "current",
        name,
        text: draft.trim().slice(0, 300),
        km: kmDone,
        ride_status: state.status,
      });
      setDraft("");
      await loadMessages();
    } catch(e) {
      alert("Failed to send. Try again.");
    }
    setSending(false);
  };

  const exportChat = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      rideDate: state.dateOption,
      rideStart: state.startTime,
      messageCount: messages.length,
      messages: messages.map(m => ({ ...m, timeISO: new Date(m.time).toISOString() })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rti-chat-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const clearChat = async () => {
    if (!confirm("Clear all chat messages? This cannot be undone.")) return;
    try {
      await sb.del("rti_chat", "ride_id=eq.current");
      setMessages([]);
    } catch(e) {}
  };

  return (
    <div style={{ background:S.card, borderRadius:10, padding:10, border:`1px solid ${S.border}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontSize:16 }}>💬</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:700, color:S.text, fontFamily:"system-ui" }}>Join the Chat</div>
          <div style={{ fontSize:9, color:S.dim, fontFamily:"system-ui" }}>
            {messages.length} messages{nameSet && <> · as <b style={{ color:"#93c5fd" }}>{name}</b> <button onClick={()=>setNameSet(false)} style={{ marginLeft:2, background:"transparent", border:"none", color:S.dim, fontSize:8, cursor:"pointer", textDecoration:"underline", fontFamily:"system-ui" }}>change</button></>}
          </div>
        </div>
        <button onClick={exportChat} title="Export for documentary" style={{ padding:"4px 8px", fontSize:9, fontWeight:700, borderRadius:4, border:`1px solid ${S.border}`, background:"transparent", color:S.mut, cursor:"pointer" }}>⬇</button>
        <button onClick={clearChat} title="Clear chat" style={{ padding:"4px 8px", fontSize:9, fontWeight:700, borderRadius:4, border:`1px solid ${S.border}`, background:"transparent", color:"#ef4444", cursor:"pointer" }}>🗑</button>
      </div>

      {/* Messages — always visible */}
      <div ref={listRef} style={{ maxHeight:280, minHeight:160, overflowY:"auto", background:"#050a12", borderRadius:6, padding:8, marginBottom:8, border:`1px solid ${S.border}` }}>
        {loading ? (
          <div style={{ textAlign:"center", color:S.dim, fontSize:10, padding:20, fontFamily:"system-ui" }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign:"center", color:S.dim, fontSize:10, padding:24, fontFamily:"system-ui" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>📣</div>
            <div>No messages yet</div>
            <div style={{ fontSize:9, marginTop:4 }}>Drop the first message for the rider</div>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} style={{ marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${S.border}` }}>
              <div style={{ display:"flex", gap:6, alignItems:"baseline", marginBottom:2 }}>
                <span style={{ fontSize:10, fontWeight:700, color: m.name===name ? "#22c55e" : "#93c5fd", fontFamily:"system-ui" }}>{m.name}</span>
                <span style={{ fontSize:8, color:S.dim, fontFamily:"system-ui" }}>{fmtClock(m.time)}</span>
                {typeof m.km === "number" && m.km > 0 && (
                  <span style={{ fontSize:8, color:"#fbbf24", fontFamily:"system-ui" }}>· km {m.km}</span>
                )}
              </div>
              <div style={{ fontSize:11, color:S.text, lineHeight:1.4, fontFamily:"system-ui", wordBreak:"break-word" }}>{m.text}</div>
            </div>
          ))
        )}
      </div>

      {/* Name entry (if not set) OR Compose (if set) */}
      {!nameSet ? (
        <div>
          <div style={{ fontSize:9, color:S.mut, marginBottom:6, fontFamily:"system-ui", textAlign:"center" }}>
            👋 Enter a display name to join the conversation
          </div>
          <div style={{ display:"flex", gap:4 }}>
            <input
              type="text" value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")saveName(name);}}
              placeholder="Your name"
              maxLength={20}
              style={{ flex:1, padding:"10px 12px", fontSize:11, borderRadius:5, border:`1px solid ${S.border}`, background:"#0a0f1a", color:S.text, outline:"none", boxSizing:"border-box", fontFamily:"system-ui" }}
            />
            <button onClick={()=>saveName(name)} disabled={!name.trim()} style={{ padding:"10px 16px", fontSize:10, fontWeight:700, borderRadius:5, border:"none", cursor:name.trim()?"pointer":"not-allowed", background:name.trim()?S.acc:"#374151", color:"#fff", opacity:name.trim()?1:0.5, fontFamily:"system-ui" }}>
              Join
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", gap:4 }}>
          <input
            type="text" value={draft} onChange={e=>setDraft(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")sendMessage();}}
            placeholder="Type a message..."
            maxLength={300}
            disabled={sending}
            style={{ flex:1, padding:"8px 10px", fontSize:11, borderRadius:5, border:`1px solid ${S.border}`, background:"#0a0f1a", color:S.text, outline:"none", fontFamily:"system-ui" }}
          />
          <button onClick={sendMessage} disabled={!draft.trim() || sending} style={{ padding:"8px 14px", fontSize:10, fontWeight:700, borderRadius:5, border:"none", cursor:draft.trim()&&!sending?"pointer":"not-allowed", background:S.acc, color:"#fff", opacity:draft.trim()&&!sending?1:0.4 }}>
            {sending ? "..." : "Send"}
          </button>
        </div>
      )}

      <div style={{ fontSize:8, color:S.dim, marginTop:6, fontFamily:"system-ui", textAlign:"center" }}>
        Messages saved with timestamps + km for documentary sync · Auto-refresh every 5s
      </div>
    </div>
  );
}

// ==========================================================================
// SYNC TAB
// ==========================================================================
function SyncTab({ state, gpsTracking, setGpsTracking, lastGps, gpsCurSpeed, gpsError, wakeLock, requestWakeLock, releaseWakeLock, updateField, exportData, S }) {
  return (
    <div style={{ fontFamily:"system-ui" }}>
      {/* Fenix course loading */}
      <div style={{ background:"#172554", borderRadius:10, padding:12, marginBottom:8, border:"2px solid #3b82f6" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <span style={{ fontSize:18 }}>⌚</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#93c5fd" }}>★ Load Course to Fenix 6S (Primary Nav)</div>
            <div style={{ fontSize:9, color:"#64b5f6" }}>Do this BEFORE ride day</div>
          </div>
        </div>
        <ol style={{ fontSize:9, color:"#bfdbfe", lineHeight:1.6, paddingLeft:16, margin:0 }}>
          <li>connect.garmin.com → Training → Courses → Create Course</li>
          <li>Select "Cycling" activity type</li>
          <li>Draw course or import GPX of 175km route</li>
          <li>Name "SG Round Island", save</li>
          <li>Garmin Connect mobile → Training → Courses → Send to Device</li>
          <li>Fenix 6S: Navigate → Courses → SG Round Island → Do Course</li>
          <li>Turn-by-turn vibration, offline, 40+hr battery</li>
        </ol>
      </div>

      {/* Phone GPS */}
      <div style={{ background:S.card, borderRadius:10, padding:12, marginBottom:8, border:`1px solid ${gpsTracking?"#22c55e":S.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ fontSize:16 }}>📍</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700 }}>Phone GPS Tracking</div>
            <div style={{ fontSize:9, color:S.dim }}>Powers Nav tab distance/bearing</div>
          </div>
          <button onClick={()=>setGpsTracking(!gpsTracking)} disabled={state.status === "idle"} style={{ padding:"5px 10px", fontSize:9, fontWeight:700, borderRadius:5, border:"none", cursor:state.status==="idle"?"not-allowed":"pointer", background:gpsTracking?"#ef4444":"#22c55e", color:"#fff", opacity:state.status==="idle"?0.4:1 }}>{gpsTracking ? "Stop" : "Start"}</button>
        </div>
        {gpsTracking && lastGps && (
          <div style={{ background:"#0a1a0a", borderRadius:5, padding:6, fontSize:9, color:S.mut }}>
            Accuracy: <span style={{ color:lastGps.accuracy<20?"#22c55e":lastGps.accuracy<50?"#eab308":"#ef4444" }}>±{lastGps.accuracy.toFixed(0)}m</span> · Speed: {gpsCurSpeed.toFixed(1)} km/h · Points: {state.gpsPoints.length}
          </div>
        )}
        {gpsError && <div style={{ fontSize:9, color:"#ef4444", marginTop:4 }}>⚠️ {gpsError}</div>}
      </div>

      {/* Wake Lock */}
      <div style={{ background:S.card, borderRadius:10, padding:12, marginBottom:8, border:`1px solid ${wakeLock?"#fbbf24":S.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>💡</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700 }}>Screen Wake Lock</div>
            <div style={{ fontSize:9, color:S.dim }}>{wakeLock?"Active":"Prevents screen sleep"}</div>
          </div>
          <button onClick={wakeLock?releaseWakeLock:requestWakeLock} style={{ padding:"5px 10px", fontSize:9, fontWeight:700, borderRadius:5, border:"none", cursor:"pointer", background:wakeLock?"#ef4444":"#fbbf24", color:"#000" }}>{wakeLock?"Release":"Enable"}</button>
        </div>
      </div>

      {/* LiveTrack */}
      <div style={{ background:S.card, borderRadius:10, padding:12, marginBottom:8, border:`1px solid ${S.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ fontSize:16 }}>⌚</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700 }}>Garmin LiveTrack URL</div>
            <div style={{ fontSize:9, color:S.dim }}>Settings → Safety → LiveTrack → Start</div>
          </div>
        </div>
        <input type="text" value={state.liveTrackUrl} onChange={e => updateField("liveTrackUrl", e.target.value)} placeholder="Paste LiveTrack URL" style={{ width:"100%", padding:"6px 8px", fontSize:9, borderRadius:5, border:`1px solid ${S.border}`, background:"#0a0f1a", color:S.text, outline:"none", boxSizing:"border-box" }} />
      </div>

      {/* Strava */}
      <div style={{ background:S.card, borderRadius:10, padding:12, marginBottom:8, border:`1px solid ${S.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ fontSize:16 }}>🟧</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700 }}>Strava Activity URL</div>
            <div style={{ fontSize:9, color:S.dim }}>Post-ride permanent record</div>
          </div>
        </div>
        <input type="text" value={state.stravaUrl} onChange={e => updateField("stravaUrl", e.target.value)} placeholder="https://www.strava.com/activities/..." style={{ width:"100%", padding:"6px 8px", fontSize:9, borderRadius:5, border:`1px solid ${S.border}`, background:"#0a0f1a", color:S.text, outline:"none", boxSizing:"border-box" }} />
      </div>

      {/* YouTube Live Stream — Burst Mode */}
      <div style={{ background:S.card, borderRadius:10, padding:12, marginBottom:8, border:`2px solid ${state.streamLive ? "#ef4444" : S.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <span style={{ fontSize:16 }}>📺</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700 }}>YouTube Live Stream</div>
            <div style={{ fontSize:9, color:S.dim }}>Burst mode — go live at key moments, return to tracker between</div>
          </div>
          {state.streamLive && <span style={{ fontSize:8, fontWeight:700, color:"#ef4444", background:"#ef444422", padding:"2px 6px", borderRadius:3 }}>● LIVE</span>}
        </div>

        {/* Stream URL (set once before ride) */}
        <div style={{ fontSize:9, color:S.mut, marginBottom:4, fontFamily:"system-ui" }}>Stream URL (set up a scheduled YouTube Live event before ride — same URL reuses)</div>
        <input type="text" value={state.youtubeStreamUrl} onChange={e => updateField("youtubeStreamUrl", e.target.value)} placeholder="https://youtube.com/live/... or youtube.com/watch?v=..." style={{ width:"100%", padding:"6px 8px", fontSize:9, borderRadius:5, border:`1px solid ${S.border}`, background:"#0a0f1a", color:S.text, outline:"none", boxSizing:"border-box", marginBottom:8 }} />
        {state.youtubeStreamUrl && ytEmbedUrl(state.youtubeStreamUrl) && (
          <div style={{ marginBottom:8, fontSize:8, color:"#22c55e" }}>✓ Valid YouTube URL</div>
        )}
        {state.youtubeStreamUrl && !ytEmbedUrl(state.youtubeStreamUrl) && (
          <div style={{ marginBottom:8, fontSize:8, color:"#ef4444" }}>⚠️ Could not parse YouTube URL</div>
        )}

        {/* Go Live / End Stream + Open YouTube */}
        <div style={{ display:"flex", gap:4 }}>
          {!state.streamLive ? (
            <button onClick={() => { updateField("streamLive", true); window.open("https://studio.youtube.com/channel/UC/livestreaming", "_blank"); }} style={{ flex:1, padding:"10px", fontSize:11, fontWeight:700, borderRadius:6, border:"none", cursor:"pointer", background:"#ef4444", color:"#fff" }}>
              🔴 Go Live — Open YouTube
            </button>
          ) : (
            <button onClick={() => updateField("streamLive", false)} style={{ flex:1, padding:"10px", fontSize:11, fontWeight:700, borderRadius:6, border:"none", cursor:"pointer", background:"#374151", color:"#ef4444" }}>
              ⏹ End Stream
            </button>
          )}
        </div>

        {/* Tips */}
        <div style={{ marginTop:8, fontSize:8, color:S.dim, lineHeight:1.5, fontFamily:"system-ui" }}>
          <div><b style={{ color:S.mut }}>Setup (before ride):</b> YouTube Studio → Go Live → Schedule → set date → copy stream URL → paste above</div>
          <div><b style={{ color:S.mut }}>During ride:</b> Tap "Go Live" at checkpoints (LP1, sunrise, finish) → stream a few min → tap "End Stream" → back to tracker</div>
          <div><b style={{ color:S.mut }}>Battery:</b> ~5-10 min bursts keep drain manageable. Kill YouTube app fully between bursts.</div>
        </div>
      </div>

      <button onClick={exportData} style={{ width:"100%", padding:"10px", fontSize:10, fontWeight:700, borderRadius:6, border:"none", cursor:"pointer", background:"#7c3aed", color:"#fff" }}>💾 Export Ride JSON</button>

      <div style={{ background:"#1a0d0d", borderRadius:8, padding:10, marginTop:8, border:"1px solid #7f1d1d", fontSize:9, color:"#fca5a5", lineHeight:1.5 }}>
        <b>⚠️ Reality Check:</b> Mobile browsers throttle GPS when backgrounded. Keep Fenix 6S as primary nav. Webapp is secondary reference.
      </div>
    </div>
  );
}

// ==========================================================================
// CARDS TAB
// ==========================================================================
function CardsTab({ state, setCardSeg, setShowCard, showCard, cardSeg, elapsed, kmDone, pct, dateInfo, S }) {
  return (
    <div>
      <p style={{ fontSize:10, color:S.mut, marginBottom:8, fontFamily:"system-ui" }}>Screenshot cards for Instagram</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:10 }}>
        {state.segments.map(s => (
          <button key={s.id} onClick={()=>{setCardSeg(s.id);setShowCard(true);}} style={{ padding:"4px 7px", fontSize:9, fontWeight:700, borderRadius:3, border:"none", cursor:"pointer", background: s.completed ? s.c+"33" : "#1f2937", color: s.completed ? s.c : S.dim }}>{s.id}</button>
        ))}
        <button onClick={()=>{setCardSeg("final");setShowCard(true);}} style={{ padding:"4px 9px", fontSize:9, fontWeight:700, borderRadius:3, border:"none", cursor:"pointer", background:"#3b82f622", color:"#3b82f6" }}>Final</button>
      </div>
      {showCard && <InstaCard seg={cardSeg} state={state} elapsed={elapsed} kmDone={kmDone} pct={pct} dateInfo={dateInfo} S={S} onClose={()=>setShowCard(false)} />}
    </div>
  );
}

// ==========================================================================
// SHARE TAB
// ==========================================================================
function ShareTab({ state, dateInfo, elapsed, kmDone, pct, segsDone, currentSeg, S }) {
  return (
    <div>
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e1b4b)", borderRadius:12, padding:16, border:"1px solid #312e81", marginBottom:10 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:10, letterSpacing:3, color:"#818cf8", fontWeight:700, marginBottom:2, fontFamily:"system-ui" }}>LIVE PROGRESS</div>
          <h2 style={{ fontSize:18, fontWeight:800, margin:"0 0 2px", fontFamily:"system-ui" }}>SG Round Island 🇸🇬</h2>
          <div style={{ fontSize:9, color:"#a5b4fc", marginBottom:12 }}>{dateInfo ? `${dateInfo.label} · Blitz · ${dateInfo.day}` : "Not started"}</div>
          <div style={{ position:"relative", width:120, height:120, margin:"0 auto 12px" }}>
            <svg viewBox="0 0 100 100" style={{ width:"100%", height:"100%", transform:"rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#grad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2*Math.PI*42*kmDone/TOTAL_KM} ${2*Math.PI*42}`} />
              <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
            </svg>
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
              <div style={{ fontSize:24, fontWeight:800 }}>{pct}%</div>
              <div style={{ fontSize:7, color:S.dim }}>COMPLETE</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
            <StatBox l="Distance" v={`${kmDone}/${TOTAL_KM}`} c="#22c55e" />
            <StatBox l="Time" v={fmtTime(elapsed)} c="#3b82f6" />
            <StatBox l="Pace" v={`${fmtPace(kmDone,elapsed)} km/h`} c="#eab308" />
          </div>
          {(state.liveTrackUrl || state.stravaUrl) && (
            <div style={{ display:"flex", gap:5, marginTop:10, justifyContent:"center" }}>
              {state.liveTrackUrl && <button onClick={()=>window.open(state.liveTrackUrl,"_blank")} style={{ padding:"5px 10px", fontSize:9, fontWeight:700, borderRadius:5, border:"1px solid #3b82f6", background:"transparent", color:"#3b82f6", cursor:"pointer" }}>⌚ LiveTrack</button>}
              {state.stravaUrl && <button onClick={()=>window.open(state.stravaUrl,"_blank")} style={{ padding:"5px 10px", fontSize:9, fontWeight:700, borderRadius:5, border:"1px solid #fc4c02", background:"transparent", color:"#fc4c02", cursor:"pointer" }}>🟧 Strava</button>}
            </div>
          )}
        </div>
      </div>

      <div style={{ background:S.card, borderRadius:8, padding:10, border:`1px solid ${S.border}` }}>
        <h3 style={{ margin:"0 0 6px", fontSize:11, color:"#93c5fd", fontFamily:"system-ui" }}>Segment Log</h3>
        {state.segments.map(s=>(
          <div key={s.id} style={{ display:"flex", gap:6, alignItems:"center", padding:"3px 0", borderBottom:`1px solid ${S.border}`, opacity:s.completed?1:0.4 }}>
            <span style={{ fontSize:9, fontWeight:700, color:s.completed?s.c:S.dim, minWidth:14 }}>{s.id}</span>
            <span style={{ flex:1, fontSize:9, fontFamily:"system-ui" }}>{s.name}</span>
            <span style={{ fontSize:8, color:S.dim }}>{s.km}km</span>
            {s.completedAt && <span style={{ fontSize:8, color:"#22c55e" }}>{fmtClock(s.completedAt)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================================================
// GUIDE MODAL
// ==========================================================================
function GuideModal({ onClose }) {
  const [gTab, setGTab] = useState("overview");
  const gS = { bg:"#0a0f1a", card:"#1e293b", border:"#334155", text:"#e2e8f0", mut:"#94a3b8", dim:"#64748b", acc:"#3b82f6" };
  const gTabs = [
    { id:"overview", l:"Overview" },
    { id:"segments", l:"Segments" },
    { id:"schedule", l:"Schedule" },
    { id:"skin", l:"Skin" },
    { id:"prep", l:"Prep" },
    { id:"gear", l:"Gear" },
    { id:"tips", l:"Tips" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:1000, overflow:"auto", padding:12, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ maxWidth:600, margin:"0 auto", background:gS.bg, borderRadius:14, padding:16, border:"1px solid #1e3a5f", color:gS.text }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:3, color:"#64b5f6", fontWeight:700 }}>FULL GUIDE</div>
            <h2 style={{ fontSize:18, fontWeight:800, margin:"2px 0 0", background:"linear-gradient(90deg,#fff,#90caf9)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>SG Round Island Cycling</h2>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"none", background:"#1e293b", color:"#fff", fontSize:16, cursor:"pointer" }}>×</button>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
          <GStat l="Distance" v={`${TOTAL_KM}km`} c="#22c55e" />
          <GStat l="Segments" v="11" c="#3b82f6" />
          <GStat l="Ride Time" v="9–11h" c="#eab308" />
          <GStat l="Schedule" v="Blitz" c="#ef4444" />
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:12 }}>
          {gTabs.map(t => <button key={t.id} onClick={()=>setGTab(t.id)} style={{ padding:"6px 10px", fontSize:10, fontWeight:700, borderRadius:6, border:"none", cursor:"pointer", background:gTab===t.id?gS.acc:gS.card, color:gTab===t.id?"#fff":gS.mut }}>{t.l}</button>)}
        </div>

        {/* OVERVIEW */}
        {gTab === "overview" && (
          <div>
            <GCard t="The Mission" s={gS}>
              <p style={{ margin:"0 0 6px" }}>Circumnavigate Singapore clockwise on a road bike. ~175km total over 11 segments. Start at East Coast Park, hit Tuas Lamp Post 1 (westernmost point), loop through Lim Chu Kang/Woodlands/Sembawang/Punggol/Changi, finish back at ECP.</p>
              <p style={{ margin:"0" }}>Target date: <b style={{ color:"#22c55e" }}>Apr 11 Sat (recommended)</b> or Apr 10 Fri (backup). Both are Day 12–13 post-treatment from Revival Clinic Bangkok (Mar 29 CO2 + subcision + TCA CROSS + PDLLA).</p>
            </GCard>
            <GCard t="Why Blitz?" s={gS}>
              Start midnight → finish ~11:30am. Minimizes total sweat + UV exposure on still-fragile post-tx skin. Tuas/LCK hit at 2–5am when traffic is lightest and temperatures coolest. Finish before peak UV (10am–4pm).
            </GCard>
            <GCard t="The Critical Risks" s={gS}>
              <div style={{ marginBottom:4 }}>• <b style={{ color:"#ef4444" }}>PIH (hyperpigmentation)</b> from UV on healing skin</div>
              <div style={{ marginBottom:4 }}>• <b style={{ color:"#ef4444" }}>Sweat contamination</b> of treated areas</div>
              <div style={{ marginBottom:4 }}>• <b style={{ color:"#ef4444" }}>Bonking</b> from cut-induced glycogen depletion</div>
              <div>• <b style={{ color:"#ef4444" }}>Mechanical failure</b> at 3am with no bike shops open</div>
            </GCard>
          </div>
        )}

        {/* SEGMENTS */}
        {gTab === "segments" && (
          <div>
            {SEGS.map(s => (
              <div key={s.id} style={{ background:gS.card, borderRadius:8, padding:10, marginBottom:6, borderLeft:`4px solid ${s.c}`, border:`1px solid ${gS.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:800, color:gS.dim }}>{String(s.id).padStart(2,"0")}</span>
                    <span style={{ fontSize:12, fontWeight:700 }}>{s.name}</span>
                  </div>
                  <span style={{ background:s.c, color:"#fff", padding:"1px 6px", borderRadius:3, fontSize:9, fontWeight:700 }}>{s.d}</span>
                </div>
                <div style={{ fontSize:9, color:gS.dim, marginBottom:4 }}>{s.km}km · target {s.ts}km/h · ~{(s.km/s.ts*60).toFixed(0)}min</div>
                {TURNS[s.id] && (
                  <>
                    <div style={{ fontSize:10, color:gS.mut, lineHeight:1.5 }}>
                      {TURNS[s.id].steps.map((step,i) => <div key={i}>{i+1}. {step}</div>)}
                    </div>
                    <div style={{ fontSize:9, color:"#fbbf24", marginTop:4 }}>⚠️ {TURNS[s.id].hazards}</div>
                    {TURNS[s.id].resupply && <div style={{ fontSize:9, color:"#22c55e", marginTop:2 }}>🚰 {TURNS[s.id].resupply}</div>}
                    {TURNS[s.id].toilets && <div style={{ fontSize:8, color:"#93c5fd", marginTop:2 }}>🚻 {TURNS[s.id].toilets.join(" · ")}</div>}
                    {TURNS[s.id].photo && <div style={{ fontSize:8, color:"#c084fc", marginTop:2 }}>📸 {TURNS[s.id].photo.join(" · ")}</div>}
                    <div style={{ display:"flex", gap:4, marginTop:4 }}>
                      {TURNS[s.id].gmaps && <button onClick={()=>window.open(TURNS[s.id].gmaps,"_blank")} style={{ padding:"4px 8px", fontSize:8, fontWeight:700, borderRadius:4, border:`1px solid ${gS.border}`, background:"transparent", color:"#93c5fd", cursor:"pointer" }}>🗺️ Google Maps</button>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SCHEDULE */}
        {gTab === "schedule" && (
          <div>
            <GCard t="Blitz Schedule (Both Dates)" s={gS}>
              <table style={{ width:"100%", fontSize:10, borderCollapse:"collapse", color:gS.mut }}>
                <tbody>
                  {[
                    ["23:00","Final bike check, carb meal"],
                    ["00:00","START → ECP → Marina Bay → Keppel"],
                    ["01:10","Lau Pa Sat water refill (5min)"],
                    ["01:15","Keppel → West Coast → Jurong"],
                    ["02:45","SPC Jalan Buroh refuel (10min)"],
                    ["02:55","Jurong → Tuas → Lamp Post 1"],
                    ["04:45","LP1! Photo + stretch (10min)"],
                    ["04:55","Neo Tiew hills → LCK → Kranji"],
                    ["07:00","Woodlands breakfast (30min) · Apply SPF50+"],
                    ["07:30","Woodlands → Sembawang → Punggol → Changi"],
                    ["09:30","Changi Village 2nd breakfast (20min)"],
                    ["09:50","TMCR → ECP (beat peak heat)"],
                    ["11:30","🏁 FINISH Marine Cove (~175km in ~11.5hr)"],
                  ].map((row,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${gS.border}` }}>
                      <td style={{ padding:"4px", fontWeight:700, color:gS.text, minWidth:50 }}>{row[0]}</td>
                      <td style={{ padding:"4px" }}>{row[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GCard>
            <GCard t="Speed Requirements" s={gS}>
              <div style={{ fontSize:10, color:gS.mut, lineHeight:1.6 }}>
                <div>• Average moving speed: <b style={{ color:"#fbbf24" }}>18–20 km/h</b></div>
                <div>• Total ride time: ~9–10 hours</div>
                <div>• Total elapsed (incl rests): ~11–12 hours</div>
                <div>• Difficulty: Advanced — requires prior 70+ km saddle time</div>
              </div>
            </GCard>
          </div>
        )}

        {/* SKIN */}
        {gTab === "skin" && (
          <div>
            <div style={{ background:"#1a0d0d", borderRadius:10, padding:12, marginBottom:10, border:"1px solid #7f1d1d" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#fca5a5", marginBottom:6 }}>🩹 Post-Treatment Recovery Protocol</div>
              <div style={{ fontSize:10, color:gS.mut, lineHeight:1.5 }}>
                Treatment: <b style={{ color:gS.text }}>Mar 29, Revival Clinic Bangkok</b><br/>
                Modalities: CO2 laser + subcision + TCA CROSS + PDLLA<br/>
                Ride day: <b style={{ color:gS.text }}>Day 12 (Apr 10) or Day 13 (Apr 11)</b>
              </div>
            </div>
            {SKIN_PROTOCOL.map((p,i) => {
              const [label, ...rest] = p.split(": ");
              return (
                <div key={i} style={{ background:gS.card, borderRadius:6, padding:10, marginBottom:4, border:`1px solid ${gS.border}`, borderLeft:"3px solid #ef4444" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#fca5a5", marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:10, color:gS.mut, lineHeight:1.5 }}>{rest.join(": ")}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* PREP */}
        {gTab === "prep" && (
          <div>
            <GCard t="2-Week Prep Plan (If riding Apr 18, shift earlier for Apr 10/11)" s={gS}>
              <table style={{ width:"100%", fontSize:10, borderCollapse:"collapse", color:gS.mut }}>
                <tbody>
                  {PREP_TIMELINE.map((row,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${gS.border}` }}>
                      <td style={{ padding:"4px 6px", fontWeight:700, color:gS.text, minWidth:80 }}>{row[0]}</td>
                      <td style={{ padding:"4px 6px", color:gS.text }}>{row[1]}</td>
                      <td style={{ padding:"4px 6px", fontSize:9, fontStyle:"italic" }}>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GCard>
            <GCard t="Nutrition Reset" s={gS}>
              <div style={{ fontSize:10, color:gS.mut, lineHeight:1.6 }}>
                <div>• <b style={{ color:"#22c55e" }}>3 days before:</b> Shift to ~2,400 kcal, 60% carbs. Break from cut.</div>
                <div>• <b style={{ color:"#22c55e" }}>Pre-ride (3-4hr before):</b> Large carb meal (pasta/rice/bread)</div>
                <div>• <b style={{ color:"#22c55e" }}>On ride:</b> 60-90g carbs/hr after hr 2. 1 gel + 1 electrolyte bottle per hour</div>
                <div>• <b style={{ color:"#22c55e" }}>After:</b> 1 day maintenance, then resume cut</div>
              </div>
            </GCard>
            <GCard t="Bike Fit Check" s={gS}>
              Non-negotiable. Get friend or shop to verify saddle height (slight knee bend), saddle fore/aft (knee over pedal spindle at 3 o'clock), reach/bars. Decathlon SG has free basic fit service.
            </GCard>
          </div>
        )}

        {/* GEAR */}
        {gTab === "gear" && (
          <div>
            <GCard t="Tier 1: Must-Buy (Decathlon)" s={gS}>
              <table style={{ width:"100%", fontSize:9, borderCollapse:"collapse" }}>
                <tbody>
                  {GEAR.tier1.map((row,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${gS.border}` }}>
                      <td style={{ padding:"3px 6px", color:gS.text, fontWeight:600 }}>{row[0]}</td>
                      <td style={{ padding:"3px 6px", color:gS.mut, fontSize:8 }}>{row[1]}</td>
                      <td style={{ padding:"3px 6px", color:"#22c55e", fontWeight:600, textAlign:"right" }}>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop:6, fontSize:10, color:"#22c55e", fontWeight:700, textAlign:"right" }}>Subtotal: ~$210–300</div>
            </GCard>
            <GCard t="Tier 2: Strongly Recommended" s={gS}>
              <table style={{ width:"100%", fontSize:9, borderCollapse:"collapse" }}>
                <tbody>
                  {GEAR.tier2.map((row,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${gS.border}` }}>
                      <td style={{ padding:"3px 6px", color:gS.text, fontWeight:600 }}>{row[0]}</td>
                      <td style={{ padding:"3px 6px", color:gS.mut, fontSize:8 }}>{row[1]}</td>
                      <td style={{ padding:"3px 6px", color:"#22c55e", fontWeight:600, textAlign:"right" }}>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop:6, fontSize:10, color:"#22c55e", fontWeight:700, textAlign:"right" }}>Subtotal: ~$125–190</div>
            </GCard>
            <GCard t="Pharmacy / Daiso" s={gS}>
              <table style={{ width:"100%", fontSize:9, borderCollapse:"collapse" }}>
                <tbody>
                  {GEAR.pharmacy.map((row,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${gS.border}` }}>
                      <td style={{ padding:"3px 6px", color:gS.text, fontWeight:600 }}>{row[0]}</td>
                      <td style={{ padding:"3px 6px", color:"#22c55e", fontWeight:600, textAlign:"right" }}>{row[1]}</td>
                      <td style={{ padding:"3px 6px", color:gS.dim, fontSize:8 }}>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop:6, fontSize:10, color:"#22c55e", fontWeight:700, textAlign:"right" }}>Subtotal: ~$70–90</div>
            </GCard>
            <div style={{ background:"#172554", borderRadius:8, padding:10, border:"1px solid #1e40af", marginTop:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#93c5fd", marginBottom:4 }}>Total Budget</div>
              <div style={{ fontSize:10, color:"#bfdbfe", lineHeight:1.6 }}>
                <div>• Bare minimum: ~$280–390</div>
                <div>• Recommended: ~$405–580</div>
              </div>
            </div>
          </div>
        )}

        {/* TIPS */}
        {gTab === "tips" && (
          <div>
            {TIPS.map(([t,c,b],i) => (
              <div key={i} style={{ background:gS.card, borderRadius:8, padding:10, marginBottom:6, borderLeft:`4px solid ${c}`, border:`1px solid ${gS.border}` }}>
                <div style={{ fontSize:11, fontWeight:700, color:c, marginBottom:3 }}>{t}</div>
                <div style={{ fontSize:10, color:gS.mut, lineHeight:1.5 }}>{b}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:16, fontSize:9, color:gS.dim }}>
          Combined guide · Revival Clinic BKK Mar 29 · Target Apr 10/11
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// SHARED COMPONENTS
// ==========================================================================
function RouteMap({ state, lastGps, gpsTracking, highlightWp, brightness }) {
  return (
    <svg viewBox="0 0 300 160" style={{ width:"100%", height:"auto" }}>
      <path d={SG} fill={brightness==="night"?"#0a0a0a":"#0d1b2a"} stroke={brightness==="night"?"#1a1a1a":"#1e3a5f"} strokeWidth="1" />
      {WP.slice(0,-1).map((w,i) => {
        const p = toS(w.lat,w.lng), n = toS(WP[Math.min(i+1,WP.length-1)].lat, WP[Math.min(i+1,WP.length-1)].lng);
        const seg = state.segments[Math.min(i, state.segments.length-1)];
        return <line key={i} x1={p.x} y1={p.y} x2={n.x} y2={n.y} stroke={seg?.completed?"#22c55e":"#334155"} strokeWidth={seg?.completed?3:1.5} strokeLinecap="round" opacity={seg?.completed?1:0.5} />;
      })}
      {(()=>{const p=toS(WP[WP.length-1].lat,WP[WP.length-1].lng),n=toS(WP[0].lat,WP[0].lng); return <line x1={p.x} y1={p.y} x2={n.x} y2={n.y} stroke={state.segments[10]?.completed?"#22c55e":"#334155"} strokeWidth={state.segments[10]?.completed?3:1.5} opacity={0.5} />;})()}
      {state.gpsPoints.length > 1 && <polyline points={state.gpsPoints.map(p => { const s = toS(p.lat, p.lng); return `${s.x},${s.y}`; }).join(" ")} fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeDasharray="3,2" opacity="0.9" />}
      {highlightWp && (()=>{const p=toS(highlightWp.lat, highlightWp.lng); return <><circle cx={p.x} cy={p.y} r={5} fill="#fbbf24" stroke="#000" strokeWidth="1.5" /><circle cx={p.x} cy={p.y} r={10} fill="none" stroke="#fbbf24" strokeWidth="1"><animate attributeName="r" from="5" to="16" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" /></circle></>;})()}
      {lastGps && gpsTracking && (()=>{
        const p = toS(lastGps.lat, lastGps.lng);
        return <><circle cx={p.x} cy={p.y} r={4} fill="#ec4899" stroke="#fff" strokeWidth="1" /><circle cx={p.x} cy={p.y} r={8} fill="none" stroke="#ec4899" strokeWidth="1"><animate attributeName="r" from="4" to="14" dur="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" /></circle></>;
      })()}
      {[{i:0,l:"START",dx:0,dy:10},{i:5,l:"LP1",dx:-10,dy:0},{i:7,l:"WDL",dx:0,dy:-6},{i:12,l:"CHG",dx:10,dy:0}].map(({i,l,dx,dy})=>{
        const p=toS(WP[i].lat,WP[i].lng);
        return <text key={l} x={p.x+dx} y={p.y+dy} fill="#64748b" fontSize="7" fontWeight="700" textAnchor="middle">{l}</text>;
      })}
    </svg>
  );
}

const CARD_PHOTOS_KEY = "rti-card-photos";
const loadCardPhotos = () => {
  try { return JSON.parse(localStorage.getItem(CARD_PHOTOS_KEY) || "{}"); } catch(e) { return {}; }
};
const saveCardPhotos = (photos) => {
  try { localStorage.setItem(CARD_PHOTOS_KEY, JSON.stringify(photos)); } catch(e) {}
};

function InstaCard({ seg, state, elapsed, kmDone, pct, dateInfo, S, onClose }) {
  const isFinal = seg === "final";
  const segData = isFinal ? null : SEGS.find(s=>s.id===seg);
  const [photo, setPhoto] = useState(() => loadCardPhotos()[seg] || null);
  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPhoto(dataUrl);
      const photos = loadCardPhotos();
      photos[seg] = dataUrl;
      saveCardPhotos(photos);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    const photos = loadCardPhotos();
    delete photos[seg];
    saveCardPhotos(photos);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{ position:"relative" }}>
      <button onClick={onClose} style={{ position:"absolute", top:4, right:4, zIndex:10, background:"#00000066", color:"#fff", border:"none", borderRadius:"50%", width:26, height:26, cursor:"pointer", fontSize:13 }}>×</button>
      <div style={{ aspectRatio:"4/5", background:"linear-gradient(160deg,#0a0a1a 0%,#0f172a 30%,#1e1b4b 70%,#0f172a 100%)", borderRadius:14, padding:20, display:"flex", flexDirection:"column", justifyContent:"space-between", border:"1px solid #312e81", overflow:"hidden", position:"relative" }}>
        {/* Background photo (if uploaded) */}
        {photo && (
          <>
            <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundImage:`url(${photo})`, backgroundSize:"cover", backgroundPosition:"center", zIndex:0 }} />
            {/* Dark overlay for text readability */}
            <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.75) 100%)", zIndex:0 }} />
          </>
        )}
        {/* Grid overlay (only if no photo) */}
        {!photo && (
          <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, opacity:0.03, backgroundImage:"repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px)" }} />
        )}
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:9, letterSpacing:4, color:photo?"#fff":"#818cf8", fontWeight:700, fontFamily:"system-ui", textShadow:photo?"0 1px 4px rgba(0,0,0,0.8)":"none" }}>SG ROUND ISLAND</div>
          <div style={{ fontSize:8, color:photo?"#e5e7eb":"#6366f1", marginTop:2, fontFamily:"system-ui", textShadow:photo?"0 1px 4px rgba(0,0,0,0.8)":"none" }}>{dateInfo ? `${dateInfo.label.toUpperCase()} · BLITZ · ${dateInfo.day.toUpperCase()}` : ""}</div>
        </div>
        <div style={{ textAlign:"center", position:"relative", zIndex:1 }}>
          {isFinal ? (
            <>
              <div style={{ fontSize:44, fontWeight:800, background:"linear-gradient(135deg,#22c55e,#3b82f6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", textShadow:photo?"0 2px 8px rgba(0,0,0,0.8)":"none" }}>DONE</div>
              <div style={{ fontSize:13, color:photo?"#fff":"#a5b4fc", marginTop:4, fontFamily:"system-ui", textShadow:photo?"0 1px 4px rgba(0,0,0,0.8)":"none" }}>{TOTAL_KM} km · {fmtTime(elapsed)}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:10, color:photo?"#fff":"#818cf8", fontWeight:700, marginBottom:3, fontFamily:"system-ui", textShadow:photo?"0 1px 4px rgba(0,0,0,0.8)":"none" }}>SEGMENT {seg} OF 11</div>
              <div style={{ fontSize:18, fontWeight:800, color:photo?"#fff":"#e2e8f0", fontFamily:"system-ui", marginBottom:4, textShadow:photo?"0 2px 6px rgba(0,0,0,0.9)":"none" }}>{segData?.name}</div>
              <div style={{ display:"inline-block", padding:"2px 8px", borderRadius:3, background:segData?.c, color:"#fff", fontSize:9, fontWeight:700 }}>{segData?.d} · {segData?.km} km</div>
            </>
          )}
        </div>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:10 }}>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:800, color:"#22c55e", textShadow:photo?"0 1px 4px rgba(0,0,0,0.9)":"none" }}>{kmDone}</div><div style={{ fontSize:7, color:photo?"#e5e7eb":"#64748b", textShadow:photo?"0 1px 2px rgba(0,0,0,0.8)":"none" }}>KM DONE</div></div>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:800, color:"#3b82f6", textShadow:photo?"0 1px 4px rgba(0,0,0,0.9)":"none" }}>{pct}%</div><div style={{ fontSize:7, color:photo?"#e5e7eb":"#64748b", textShadow:photo?"0 1px 2px rgba(0,0,0,0.8)":"none" }}>COMPLETE</div></div>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:800, color:"#eab308", textShadow:photo?"0 1px 4px rgba(0,0,0,0.9)":"none" }}>{fmtPace(kmDone,elapsed)}</div><div style={{ fontSize:7, color:photo?"#e5e7eb":"#64748b", textShadow:photo?"0 1px 2px rgba(0,0,0,0.8)":"none" }}>KM/H AVG</div></div>
          </div>
          <div style={{ height:3, background:photo?"rgba(255,255,255,0.2)":"#1f2937", borderRadius:2, overflow:"hidden", marginBottom:6 }}>
            <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg,#22c55e,#3b82f6)", borderRadius:2 }} />
          </div>
          <div style={{ display:"flex", height:6, borderRadius:3, overflow:"hidden" }}>
            {state.segments.map((s,i)=>(<div key={i} style={{ flex:s.km, background:s.completed?SEGS[i].c:(photo?"rgba(255,255,255,0.2)":"#1f2937") }} />))}
          </div>
          <div style={{ fontSize:7, color:photo?"#e5e7eb":"#4b5563", marginTop:6, textAlign:"center", fontFamily:"system-ui", textShadow:photo?"0 1px 2px rgba(0,0,0,0.8)":"none" }}>🚴 Round Island · Singapore {TOTAL_KM}km · Recovery Ride</div>
        </div>
      </div>

      {/* Photo controls */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:"none" }} />
      <div style={{ display:"flex", gap:4, marginTop:6 }}>
        {!photo ? (
          <button onClick={()=>fileInputRef.current?.click()} style={{ flex:1, padding:"8px", fontSize:10, fontWeight:700, borderRadius:5, border:`1px solid ${S.border}`, background:S.card, color:S.text, cursor:"pointer", fontFamily:"system-ui" }}>
            📷 Add Photo
          </button>
        ) : (
          <>
            <button onClick={()=>fileInputRef.current?.click()} style={{ flex:1, padding:"8px", fontSize:10, fontWeight:700, borderRadius:5, border:`1px solid ${S.border}`, background:S.card, color:S.text, cursor:"pointer", fontFamily:"system-ui" }}>
              🔄 Replace
            </button>
            <button onClick={removePhoto} style={{ padding:"8px 12px", fontSize:10, fontWeight:700, borderRadius:5, border:`1px solid ${S.border}`, background:"transparent", color:"#ef4444", cursor:"pointer", fontFamily:"system-ui" }}>
              🗑
            </button>
          </>
        )}
      </div>
      <p style={{ fontSize:8, color:S.dim, textAlign:"center", marginTop:4, fontFamily:"system-ui" }}>Screenshot card for Instagram · Photos stored on your phone only</p>
    </div>
  );
}

function NoteInput({ onAdd, S }) {
  const [v, setV] = useState("");
  return (
    <div style={{ display:"flex", gap:3 }}>
      <input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){onAdd(v);setV("");}}} placeholder="Add note..." style={{ flex:1, padding:"7px 8px", fontSize:10, borderRadius:5, border:`1px solid ${S.border}`, background:S.card, color:S.text, outline:"none", fontFamily:"system-ui" }} />
      <button onClick={()=>{onAdd(v);setV("");}} style={{ padding:"7px 10px", fontSize:9, fontWeight:700, borderRadius:5, border:"none", cursor:"pointer", background:S.acc, color:"#fff" }}>+</button>
    </div>
  );
}

function StatBox({ l, v, c }) {
  return <div style={{ textAlign:"center", background:"#0a0f1a", borderRadius:5, padding:"5px 3px" }}>
    <div style={{ fontSize:11, fontWeight:800, color:c, fontVariantNumeric:"tabular-nums" }}>{v}</div>
    <div style={{ fontSize:7, color:"#6b7280", textTransform:"uppercase", letterSpacing:1 }}>{l}</div>
  </div>;
}

function Btn({ onClick, bg, text }) {
  return <button onClick={onClick} style={{ padding:"7px 14px", fontSize:10, fontWeight:700, borderRadius:5, border:"none", cursor:"pointer", background:bg, color:bg==="#fbbf24"?"#000":"#fff" }}>{text}</button>;
}

function GCard({ t, s, children }) {
  return (
    <div style={{ background:s.card, borderRadius:8, padding:12, marginBottom:8, border:`1px solid ${s.border}` }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#93c5fd", marginBottom:6 }}>{t}</div>
      <div style={{ fontSize:11, color:s.mut, lineHeight:1.6 }}>{children}</div>
    </div>
  );
}

function GStat({ l, v, c }) {
  return (
    <div style={{ background:"#0d1b2a", borderRadius:6, padding:"6px 4px", textAlign:"center" }}>
      <div style={{ fontSize:14, fontWeight:800, color:c }}>{v}</div>
      <div style={{ fontSize:8, color:"#64748b", letterSpacing:1 }}>{l}</div>
    </div>
  );
}
