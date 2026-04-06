# SG Round Island Tracker — Claude Code Handoff

**Purpose:** Continue developing a cycling tracker webapp for a ~175km circumnavigation of Singapore. Current state is a single React/JSX artifact. Migrating to Claude Code for real deployment + backend.

---

## 1. Project Context

**Rider:** 30M, Singapore-based. Target ride date: **Apr 11 Sat 2026 (primary)** or **Apr 10 Fri (backup)**. Both are Blitz schedules (23:00 → ~11:30 next day).

**Medical context driving schedule:** Post acne-scar treatment on Mar 29 2026 at Revival Clinic Bangkok (Dr. George): CO2 laser + subcision + TCA CROSS + PDLLA. Ride dates are Day 12–13 post-treatment. Still "high risk but mitigated" for skin recovery. This is why the ride is Blitz (midnight start) — minimizes total UV + sweat exposure on still-healing skin.

**Hardware owned:**
- Garmin Fenix 6S (primary nav via Follow Course)
- Insta360 X5 (footage, no live sync)
- Phone (webapp + secondary nav)
- Power bank (critical — phone will be on continuous GPS for 11+ hours)

**Project constraints from user:**
1. Practical advice with cited proven sources
2. 80/20 methodology
3. Organized tabular output for easy copy/adaptation
4. International metrics (km, kg, °C)
5. Cross-platform compatible output (JSX preferred)

---

## 2. Route Data (Definitive)

**Total: ~175km clockwise**, 11 segments, start/finish at ECP Marine Cove.

```javascript
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
// c=color, ts=target speed km/h
```

**Waypoints (with coordinates):**
```javascript
const WP = [
  { lat:1.301, lng:103.912, name:"ECP Marine Cove", short:"ECP" },
  { lat:1.281, lng:103.859, name:"Marina Bay Sands", short:"MBS" },
  { lat:1.264, lng:103.822, name:"HarbourFront", short:"KEP" },
  { lat:1.281, lng:103.766, name:"West Coast Park", short:"WCP" },
  { lat:1.331, lng:103.710, name:"Jurong/Boon Lay", short:"JUR" },
  { lat:1.295, lng:103.637, name:"Lamp Post 1", short:"LP1" },  // Westernmost
  { lat:1.422, lng:103.712, name:"Lim Chu Kang", short:"LCK" },
  { lat:1.438, lng:103.769, name:"Woodlands Waterfront", short:"WDL" },
  { lat:1.449, lng:103.820, name:"Sembawang", short:"SBW" },
  { lat:1.418, lng:103.841, name:"Yishun Dam", short:"YIS" },
  { lat:1.405, lng:103.902, name:"Punggol", short:"PGL" },
  { lat:1.376, lng:103.949, name:"Pasir Ris", short:"PR" },
  { lat:1.358, lng:103.991, name:"Changi Village", short:"CHG" },
  { lat:1.325, lng:103.962, name:"TMCR End", short:"TMCR" },
];
```

Turn-by-turn steps and hazards for all 11 segments are hardcoded in `TURNS` object in the current file. Key hazards:
- **Seg 5 (Tuas LP1):** Zero shelter, no water, buff needed for dust
- **Seg 6 (LCK/Neo Tiew):** Hardest climbs, stray dogs, very dark
- **Seg 7 (Woodlands descent):** Steep descent Admiralty Rd W
- **Seg 10 (TMCR):** 15km shelterless, never 10am–4pm

---

## 3. Blitz Schedule (Both Dates)

```
23:00  Pre-ride carb meal, final bike check
00:00  START — ECP → Marina Bay → Keppel
01:10  Lau Pa Sat water refill (5min)
02:45  SPC Jalan Buroh refuel (10min)
04:45  LP1! Photo + stretch (10min)
04:55  Neo Tiew hills → LCK → Kranji
07:00  Woodlands breakfast (30min), apply SPF50+
07:30  Woodlands → Sembawang → Punggol → Changi
09:30  Changi Village 2nd breakfast (20min)
11:30  🏁 FINISH ECP Marine Cove (~11.5hr total)
```

Target pace: **18–20 km/h** moving. Total elapsed 11–12hr with rests.

---

## 4. Current App State

**File:** `sg-rti-app.jsx` (single React functional component, ~1200 lines)

**Architecture:** Single-file React 18 JSX. Uses only inline styles (no Tailwind, no external CSS). Runs in Claude artifacts environment currently.

**Tabs (6):**

| Tab | Purpose |
|---|---|
| 🧭 Nav | Primary ride view. Big next-waypoint card with distance+bearing compass, turn-by-turn for current segment, mini route map, quick controls |
| 🚴 Track | Start screen (Apr 11/10 picker), timer, stats, segment checklist with Done buttons, note input |
| 🗺️ Map+Chat | Route map with GPS trail overlay, segment progress bar, **observer chat below map** |
| 📡 Sync | Fenix course loading instructions, phone GPS toggle, Wake Lock toggle, LiveTrack URL input, Strava URL input, JSON export |
| 📸 Cards | Instagram 4:5 card generator per segment + final card |
| 🔗 Share | Circular progress ring dashboard, segment log with timestamps, external links |

**Hidden guide modal:** Triggered by subtle italic link at footer: `·—· full ride guide ·—·`. Opens fullscreen modal with 7 internal tabs (overview, segments, schedule, skin, prep, gear, tips).

**Features implemented:**
- Screen Wake Lock API (auto-enables on ride start)
- Fullscreen toggle (⤢)
- Night mode toggle (🌙) — pure black bg + red text for OLED/night vision
- Phone Geolocation API (watchPosition, filters accuracy>50m, dedupes <5m movements)
- Haversine distance + bearing calculations for waypoint compass
- Auto-enables GPS + Wake Lock on ride start
- JSON export of all ride data
- Persistent state via `window.storage`
- Observer chat via `window.storage` shared mode (polling every 5s, capped at 500 messages)

---

## 5. Key Data Structures

```javascript
const initState = () => ({
  status: "idle",          // idle | active | paused | finished
  startTime: null,         // Date.now() on start
  pauseTime: null,         // Date.now() on pause/finish
  totalPaused: 0,          // Accumulated pause duration ms
  segments: SEGS.map(s => ({ ...s, completed: false, completedAt: null })),
  dateOption: null,        // "apr10" | "apr11"
  notes: [],               // [{text, time, km}]
  gpsPoints: [],           // [{lat, lng, speed, accuracy, t}]
  liveTrackUrl: "",        // Garmin LiveTrack URL
  stravaUrl: "",           // Post-ride Strava URL
});

// Chat message structure
const msg = {
  id: "timestamp_random",
  name: "observer_name",
  text: "message content (max 300)",
  time: Date.now(),
  km: kmDoneAtTime,        // For documentary sync
  rideStatus: state.status,
};
```

---

## 6. Storage — CRITICAL MIGRATION POINT

**Current (artifact-only):** Uses `window.storage` API which only exists in the Claude artifacts runtime.

```javascript
// Current artifact pattern
await window.storage.get(key);           // Personal
await window.storage.set(key, value);    // Personal
await window.storage.get(key, true);     // Shared (all users of artifact)
await window.storage.set(key, value, true);  // Shared write
```

**For Claude Code deployment, you MUST replace `window.storage` with one of:**

1. **localStorage** (single-user, personal state only):
```javascript
localStorage.setItem(key, value);
localStorage.getItem(key);
localStorage.removeItem(key);
```
Simplest migration. Works offline. No shared state — observer chat won't work across users.

2. **Supabase** (for shared chat + cross-device persistence):
User already has Supabase infrastructure in their main projects. Schema needed:
```sql
create table rti_rides (
  id uuid primary key default gen_random_uuid(),
  state jsonb,
  updated_at timestamptz default now()
);

create table rti_chat (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid,
  name text,
  text text,
  km numeric,
  ride_status text,
  created_at timestamptz default now()
);

-- Enable realtime on rti_chat for websocket subscriptions
alter publication supabase_realtime add table rti_chat;
```

Use Supabase realtime subscriptions instead of 5-second polling:
```javascript
supabase.channel('rti_chat')
  .on('postgres_changes', { event:'INSERT', schema:'public', table:'rti_chat' },
    (payload) => setMessages(prev => [...prev, payload.new]))
  .subscribe();
```

3. **Hybrid:** localStorage for rider state (private), Supabase for chat (shared). This is probably the right architecture.

**Storage keys currently in use:**
- `rti-tracker-v4` — main ride state (personal)
- `rti-chat-shared-v1` — chat messages (shared)
- `rti-chat-name` — user display name (personal)

---

## 7. Sync & Hardware Integration

**Fenix 6S (primary nav):**
- Load course via Garmin Connect web → Training → Courses → Create Course
- Send to Device via Garmin Connect mobile
- Watch: Navigate → Courses → SG Round Island → Do Course
- Gives turn-by-turn vibration alerts, offline, 40+hr battery
- **Recommendation: Generate a proper GPX file** of the 175km route for Fenix import. Currently only waypoints exist — need interpolated route along actual PCN paths. This is a TODO.

**Garmin LiveTrack:**
- Built-in, free, no dev work needed
- Fenix 6S: Settings → Safety → LiveTrack → Start
- Generates public shareable URL
- Rider pastes into webapp Sync tab → Share tab shows button to open

**Phone GPS (secondary):**
- `navigator.geolocation.watchPosition()` 
- Throttled by mobile browsers when backgrounded/screen locked
- Requires Wake Lock + foreground tab to work continuously
- Battery: ~3-4hr screen-on with GPS. Power bank required.

**Insta360 X5:**
- No live sync possible
- Post-production: import Fenix FIT file into Insta360 Studio for GPS/speed/HR overlay on footage

**Strava:** Post-ride auto-sync from Fenix → Garmin Connect → Strava. Paste activity URL into webapp after finish.

---

## 8. Known Technical Constraints

1. **Mobile browser GPS throttling** — watchPosition gets deprioritized when tab backgrounded or screen dims. Even with Wake Lock, expect drops. **This is why Fenix is primary nav, not webapp.**

2. **window.storage shared mode is last-write-wins** — concurrent chat sends may be lost. Current code mitigates by re-reading before append but it's not atomic. Supabase realtime would fix this.

3. **Chat polling at 5s intervals** creates ~5s lag for observers. Fine for cycling but not instant.

4. **No offline map tiles** — currently uses a hand-drawn SVG path of Singapore outline only. No actual street-level map. Real street maps would require Mapbox/Leaflet + offline tile caching (complex).

5. **Artifact storage size limits** — values under 5MB, keys under 200 chars. GPS trail can grow — currently no compression. Consider encoding with polyline algorithm if moving to real backend.

6. **No service worker / PWA** — can't install to home screen as true offline app. Would require manifest.json + service worker for Claude Code deployment.

---

## 9. Decisions Log

| Decision | Rationale |
|---|---|
| **Blitz schedule for both dates** | Day 12–13 post-tx skin fragility demands minimizing total UV+sweat exposure. Midnight start puts Tuas/LCK at 2-5am (coolest, emptiest) and finishes before 10am peak UV. |
| **Apr 11 Sat primary over Apr 10 Fri** | Sunday morning has lightest Tuas truck traffic of the week. Apr 11 also gives Day 13 vs Day 12 (marginal skin advantage). Apr 10 is weather contingency backup. |
| **Fenix 6S as primary nav, not webapp** | Purpose-built device: offline, 40hr battery, sunlight-readable, turn-by-turn vibration, can't crash. Mobile browsers can't match this. |
| **Webapp as secondary visual reference** | Adds value for: progress tracking, segment check-ins, Instagram cards, observer chat, rest-stop dashboards. Not for turn-by-turn. |
| **window.storage for chat (current)** | Zero-infra solution that works in artifact. Will migrate to Supabase for Claude Code. |
| **No React component library** | Single JSX file, no dependencies, inline styles only. Keeps artifact portable. Claude Code version can use shadcn/ui. |

---

## 10. Prep & Gear (for context)

**Prep timeline** (if still applicable post-conversation):
- Day 10 post-tx (Apr 8): First 30km saddle time ride
- Day 12 post-tx (Apr 10): 50km gear shakedown OR ride day
- Day 13 post-tx (Apr 11): Ride day primary

**Nutrition reset required:** Cannot ride 175km in calorie deficit. 3 days before: shift to ~2,400 kcal, 60% carbs. On ride: 60-90g carbs/hr after hour 2. Post: 1 day maintenance then resume cut.

**Decathlon Singapore gear budget:**
- Minimum: ~SGD 280–390 (helmet, lights, bib shorts, tools, tubes, hydration)
- Recommended: ~SGD 405–580 (+ jersey, arm sleeves, CO2, frame bag)
- Pharmacy (Guardian/Watsons): ~SGD 70–90 (Sudocrem as chamois alt, SPF50+, saline, gloves, etc.)

**Tier 1 must-buy items:**
Van Rysel RCR 100 helmet, Btwin Vioo Road 900 front light, Btwin Vioo Clip 300 rear, Triban RC 100 bib shorts, Triban RC 100 gloves, 2x spare tubes, tyre levers, Btwin 500 mini pump, multi-tool, 2x water bottles, saddle bag.

---

## 11. Post-Treatment Skin Protocol

```
PRE-RIDE: Gentle cleanse → Aquaphor/Sudocrem occlusive on treated areas
EVERY STOP: Saline spray mist face, pat with clean microfibre
TUAS SEGMENT: Buff over lower face for dust
FROM 07:00: SPF50+ on face (Biore UV Aqua Rich recommended). Reapply every stop. Arm sleeves.
GLOVES RULE: NEVER touch face with cycling gloves. Use nitrile gloves for face touching.
POST-RIDE: Immediate shower → gentle cleanse → post-tx ointment → stay indoors
```

---

## 12. Open Items / Next Steps for Claude Code

**High priority:**
1. **Migrate storage** from `window.storage` to localStorage (personal) + Supabase (chat)
2. **Generate real GPX file** for Fenix 6S course loading — currently only waypoints. Need to interpolate route along actual PCN paths. Could use Strava heatmap or Garmin Connect drawing.
3. **Deploy to GitHub Pages** via user's existing `build.mjs` pipeline. File prefix convention: `extras-sg-rti-app.jsx` at repo root (build.mjs only scans root). URL will be `extras.kimhwang.me/sg-rti-app.html`.
4. **AES-256-GCM password protection** if using existing extras deploy pattern.

**Nice to have:**
5. **Real street maps** — Leaflet + OpenStreetMap tiles, cached offline via service worker
6. **Supabase realtime chat** — replace 5s polling with websocket subscriptions
7. **Telegram alerts** on segment completion (auto-post to a group chat)
8. **Share URL** with ride ID param — observers open specific ride instead of local state
9. **Post-ride video sync export** — take exported chat JSON + exported ride JSON + FIT file, generate DaVinci Resolve marker CSV
10. **PWA manifest + service worker** for offline "install to home screen"
11. **Heart rate from Fenix** via BLE Web Bluetooth (experimental, complex)

**Post-ride ideas:**
12. Template this for future endurance challenges
13. Static site generator for permanent ride record pages

---

## 13. Current File Reference

Main file: `/mnt/user-data/outputs/sg-rti-app.jsx`

Imports:
```javascript
import { useState, useEffect, useRef, useCallback } from "react";
```

Component hierarchy:
```
App
├── Status bar (night mode + fullscreen toggles)
├── Tab navigation
├── NavTab        (next waypoint card, turn-by-turn, mini map)
├── TrackerTab    (start screen, timer, segment checklist)
├── MapChatTab    (route map, segment bar, ChatRoom)
│   └── ChatRoom  (name entry, message list, composer, export)
├── SyncTab       (Fenix, GPS, Wake Lock, LiveTrack, Strava)
├── CardsTab      (Instagram card grid)
│   └── InstaCard (4:5 rendered card)
├── ShareTab      (progress ring, segment log)
└── GuideModal    (7 internal tabs, fullscreen overlay)
```

Shared utility components: `RouteMap`, `InstaCard`, `NoteInput`, `StatBox`, `Btn`, `GCard`, `GStat`

Helper functions: `fmtTime`, `fmtClock`, `fmtPace`, `hav` (haversine), `bearing`, `bearingCompass`, `toS` (SVG coordinate conversion)

---

## 14. Testing Checklist Before Ride Day

- [ ] Full file loads without errors in target environment
- [ ] State persists across page refreshes
- [ ] GPS permission works on target mobile browser
- [ ] Wake Lock holds during 30+ min test
- [ ] Segment complete → Insta card renders correctly
- [ ] Fenix 6S course loads and navigates correctly on a test ride
- [ ] LiveTrack URL opens in shareable mode
- [ ] Battery test: 4hr continuous use with power bank
- [ ] Chat works with 2+ devices (requires real backend for Claude Code version)
- [ ] Export JSON produces valid downloadable file
- [ ] Night mode + fullscreen combo readable in dark

---

## 15. User Project Context (External to This Project)

User has existing infrastructure in their main Claude Projects:
- **Deployment:** GitHub Pages at `extras.kimhwang.me`, `build.mjs` pipeline (root-level files only), AES-256-GCM password protection
- **Database:** Supabase PostgreSQL, REST API via fetch (no SDK), anon key public-facing, RLS policies
- **Naming convention:** `extras-` prefix for these utility artifacts
- **Style:** Dense tabular, prose-minimal, JSX single-file, localStorage persistence, no external CDN deps

Apply these patterns when migrating to Claude Code deployment.

---

**END HANDOFF** — Load this file into Claude Code context to continue development.
