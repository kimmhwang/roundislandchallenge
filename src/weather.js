// NEA 2-hour weather forecast mapped to ride segments
// API: https://api.data.gov.sg/v1/environment/2-hour-weather-forecast
// Free, no API key, updates every 30 min

const NEA_URL = "https://api.data.gov.sg/v1/environment/2-hour-weather-forecast";

// Map NEA area names to segment IDs
const AREA_TO_SEGS = {
  "Marine Parade": [1, 11],
  "City": [2],
  "Bukit Merah": [3],
  "Clementi": [3],
  "Jurong West": [4],
  "Boon Lay": [4],
  "Tuas": [5],
  "Jalan Bahar": [6],
  "Lim Chu Kang": [6],
  "Woodlands": [7],
  "Sembawang": [8],
  "Yishun": [8],
  "Sengkang": [9],
  "Punggol": [9],
  "Pasir Ris": [9],
  "Changi": [10],
  "Bedok": [11],
};

// Weather condition → severity (0=clear, 1=cloudy, 2=light rain, 3=heavy rain, 4=thunderstorm)
const SEVERITY = {
  "Fair": 0, "Fair (Day)": 0, "Fair (Night)": 0,
  "Fair & Warm": 0, "Partly Cloudy": 0, "Partly Cloudy (Day)": 0, "Partly Cloudy (Night)": 0,
  "Cloudy": 1, "Hazy": 1, "Slightly Hazy": 1, "Windy": 1,
  "Passing Showers": 2, "Light Showers": 2, "Showers": 2, "Light Rain": 2,
  "Moderate Rain": 3, "Heavy Showers": 3, "Heavy Rain": 3,
  "Thundery Showers": 4, "Heavy Thundery Showers": 4,
  "Heavy Thundery Showers with Gusty Winds": 4,
};

const severityOf = (forecast) => {
  if (!forecast) return -1;
  return SEVERITY[forecast] ?? 1;
};

// Severity → display info
const weatherBadge = (forecast) => {
  const sev = severityOf(forecast);
  if (sev <= 0) return { icon: "☀️", color: "#22c55e", label: forecast, level: "clear" };
  if (sev === 1) return { icon: "☁️", color: "#a3a3a3", label: forecast, level: "cloudy" };
  if (sev === 2) return { icon: "🌦️", color: "#fbbf24", label: forecast, level: "showers" };
  if (sev === 3) return { icon: "🌧️", color: "#f97316", label: forecast, level: "rain" };
  return { icon: "⛈️", color: "#ef4444", label: forecast, level: "storm" };
};

// Trend comparison
const trendOf = (currentForecast, prevForecast) => {
  if (!prevForecast) return "new";
  const curr = severityOf(currentForecast);
  const prev = severityOf(prevForecast);
  if (curr > prev) return "worse";  // more rain
  if (curr < prev) return "better"; // less rain
  return "same";
};

// Per-segment weather state
// Returns: { [segId]: { forecast, badge, trend, area, updatedAt } }
const mapForecastToSegments = (forecasts, prevSegWeather) => {
  const segWeather = {};

  // Build a lookup: segId → best area forecast (pick the worst one if multiple areas map to same segment)
  for (const f of forecasts) {
    const segs = AREA_TO_SEGS[f.area];
    if (!segs) continue;
    for (const segId of segs) {
      const existing = segWeather[segId];
      const sev = severityOf(f.forecast);
      if (!existing || sev > severityOf(existing.forecast)) {
        const prev = prevSegWeather?.[segId]?.forecast;
        segWeather[segId] = {
          forecast: f.forecast,
          badge: weatherBadge(f.forecast),
          trend: trendOf(f.forecast, prev),
          area: f.area,
        };
      }
    }
  }
  return segWeather;
};

// NEA area coordinates (from area_metadata)
const AREA_COORDS = {
  "Marine Parade": [1.297, 103.891], "City": [1.292, 103.844],
  "Bukit Merah": [1.277, 103.819], "Clementi": [1.315, 103.76],
  "Jurong West": [1.34039, 103.705], "Boon Lay": [1.304, 103.701],
  "Tuas": [1.294947, 103.635], "Jalan Bahar": [1.347, 103.67],
  "Lim Chu Kang": [1.423, 103.717332], "Woodlands": [1.432, 103.786528],
  "Sembawang": [1.445, 103.818495], "Yishun": [1.418, 103.839],
  "Sengkang": [1.384, 103.891443], "Punggol": [1.401, 103.904],
  "Pasir Ris": [1.37, 103.948], "Changi": [1.357, 103.987],
  "Bedok": [1.321, 103.924],
};

// Build area weather map for map overlay: [{ area, lat, lng, forecast, badge }]
const buildAreaWeatherOverlay = (forecasts) => {
  const overlay = [];
  for (const f of forecasts) {
    const coords = AREA_COORDS[f.area];
    if (!coords) continue;
    overlay.push({
      area: f.area,
      lat: coords[0],
      lng: coords[1],
      forecast: f.forecast,
      badge: weatherBadge(f.forecast),
    });
  }
  return overlay;
};

// Fetch and return segment weather
let _prevSegWeather = null;

export const fetchSegmentWeather = async () => {
  try {
    const res = await fetch(NEA_URL);
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.items?.[0];
    if (!items) return null;

    const segWeather = mapForecastToSegments(items.forecasts, _prevSegWeather);
    _prevSegWeather = segWeather;
    const areaOverlay = buildAreaWeatherOverlay(items.forecasts);

    return {
      segWeather,
      areaOverlay,
      validPeriod: items.valid_period,
      updatedAt: items.update_timestamp,
    };
  } catch (e) {
    return null;
  }
};

export { weatherBadge, severityOf };
