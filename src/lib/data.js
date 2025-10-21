import liveMock from '../../data/mock/live-etas.json';
import statusMock from '../../data/mock/status.json';
import scheduleMock from '../../data/mock/schedule.json';

const clone = (value) => (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)));

const useMock = String(
  import.meta.env.VITE_USE_MOCK_FEED ?? import.meta.env.USE_MOCK_FEED ?? 'false'
).toLowerCase() === 'true';

const liveUrl = import.meta.env.VITE_LIVE_FEED_URL;
const statusUrl = import.meta.env.VITE_STATUS_URL;
const scheduleUrl = import.meta.env.VITE_SCHEDULE_JSON;

async function fetchJson(url, fallback) {
  if (!url) return clone(fallback);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Falling back to mock data for', url, err);
    return clone(fallback);
  }
}

let liveCache = null;
let statusCache = null;
let scheduleCache = null;

async function loadLiveFeed() {
  if (useMock) return clone(liveMock);
  if (liveCache) return clone(liveCache);
  liveCache = await fetchJson(liveUrl, liveMock);
  return clone(liveCache);
}

async function loadStatus() {
  if (useMock) return clone(statusMock);
  if (statusCache) return clone(statusCache);
  statusCache = await fetchJson(statusUrl, statusMock);
  return clone(statusCache);
}

async function loadSchedule() {
  if (useMock) return clone(scheduleMock);
  if (scheduleCache) return clone(scheduleCache);
  scheduleCache = await fetchJson(scheduleUrl, scheduleMock);
  return clone(scheduleCache);
}

function toMinutes(time) {
  const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
  return hh * 60 + mm;
}

function getTodayMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export async function getLiveETAs(stopId) {
  const data = await loadLiveFeed();
  if (!stopId) return data;
  const items = data.etas?.[stopId] ?? [];
  return {
    updatedAt: data.updatedAt,
    vehicles: data.vehicles ?? [],
    list: items,
  };
}

export async function getStatus() {
  return loadStatus();
}

export async function getScheduleEstimate(stopId) {
  const data = await loadSchedule();
  if (!stopId) return data;
  const minutesNow = getTodayMinutes();
  const times = (data.stops?.[stopId] ?? []).map((time) => ({
    label: time,
    minutes: toMinutes(time),
  }));
  const upcoming = times
    .filter((item) => item.minutes >= minutesNow)
    .slice(0, 3)
    .map((item) => item.label);
  const rollover = times
    .filter((item) => item.minutes < minutesNow)
    .slice(0, Math.max(0, 3 - upcoming.length))
    .map((item) => item.label);
  return {
    generatedAt: data.generatedAt,
    times,
    nextArrivals: [...upcoming, ...rollover],
  };
}
