const ROUTE_WIDTH = 1000;
const ROUTE_HEIGHT = 580;

export const ROUTE_POINTS = [
  { x: 70, y: 70 },
  { x: 250, y: 70 },
  { x: 250, y: 150 },
  { x: 70, y: 150 },
  { x: 70, y: 70 },
  { x: 330, y: 70 },
  { x: 520, y: 70 },
  { x: 610, y: 70 },
  { x: 610, y: 70 },
  { x: 610, y: 140 },
  { x: 720, y: 140 },
  { x: 720, y: 70 },
  { x: 880, y: 70 },
  { x: 960, y: 140 },
  { x: 880, y: 210 },
  { x: 800, y: 250 },
  { x: 720, y: 260 },
  { x: 650, y: 270 },
  { x: 600, y: 300 },
  { x: 560, y: 330 },
  { x: 520, y: 360 },
  { x: 470, y: 340 },
  { x: 420, y: 320 },
  { x: 360, y: 300 },
  { x: 320, y: 300 },
  { x: 300, y: 320 },
  { x: 280, y: 350 },
  { x: 260, y: 420 },
  { x: 340, y: 420 },
  { x: 430, y: 420 },
  { x: 520, y: 420 },
  { x: 600, y: 420 },
  { x: 720, y: 420 },
  { x: 720, y: 470 },
  { x: 540, y: 470 },
  { x: 430, y: 470 },
  { x: 320, y: 470 },
  { x: 210, y: 470 },
  { x: 130, y: 470 },
  { x: 130, y: 410 },
  { x: 180, y: 360 },
  { x: 220, y: 320 },
  { x: 250, y: 280 },
  { x: 270, y: 240 },
  { x: 300, y: 200 },
  { x: 340, y: 170 },
  { x: 380, y: 150 },
  { x: 430, y: 130 },
  { x: 520, y: 120 },
  { x: 610, y: 120 },
  { x: 610, y: 70 },
];

export const STOPS = [
  {
    id: 'commons',
    label: 'L3Harris Commons',
    x: 670,
    y: 100,
    lat: 28.0646,
    lng: -80.6234,
  },
  {
    id: 'wfit',
    label: 'Gleason & WFIT',
    x: 560,
    y: 210,
    lat: 28.0643,
    lng: -80.6244,
  },
  {
    id: 'miller',
    label: 'John E. Miller (Academic Quad)',
    x: 360,
    y: 280,
    lat: 28.0639,
    lng: -80.6249,
  },
  {
    id: 'res',
    label: 'Residence Hall Circle',
    x: 300,
    y: 420,
    lat: 28.0632,
    lng: -80.6256,
  },
  {
    id: 'olin',
    label: 'Between Olin Engineering',
    x: 480,
    y: 310,
    lat: 28.0641,
    lng: -80.6249,
  },
  {
    id: 'pdh',
    label: 'Clemente ↔ PDH',
    x: 520,
    y: 420,
    lat: 28.0634,
    lng: -80.6242,
  },
  {
    id: 'cob',
    label: 'Nathan Bisk COB',
    x: 160,
    y: 110,
    lat: 28.0651,
    lng: -80.6262,
  },
  {
    id: 'bridge',
    label: 'South Covered Bridge',
    x: 150,
    y: 470,
    lat: 28.0629,
    lng: -80.6268,
  },
];

function segmentLen(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function cumulative(route) {
  const L = [0];
  for (let i = 1; i < route.length; i += 1) {
    L[i] = L[i - 1] + segmentLen(route[i - 1], route[i]);
  }
  return { L, total: L[L.length - 1] };
}

function projectOnPath(route, Ltab, p) {
  const { L, total } = Ltab;
  let bestT = 0;
  let bestD = Infinity;
  let acc = 0;
  for (let i = 1; i < route.length; i += 1) {
    const a = route[i - 1];
    const b = route[i];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const ab2 = abx * abx + aby * aby || 1;
    let u = (apx * abx + apy * aby) / ab2;
    u = Math.max(0, Math.min(1, u));
    const rx = a.x + abx * u;
    const ry = a.y + aby * u;
    const d2 = (p.x - rx) ** 2 + (p.y - ry) ** 2;
    if (d2 < bestD) {
      bestD = d2;
      bestT = (acc + segmentLen(a, { x: rx, y: ry })) / total;
    }
    acc += segmentLen(a, b);
  }
  return Math.max(0, Math.min(1, bestT));
}

function pointAt(route, Ltab, t) {
  const { L, total } = Ltab;
  const target = t * total;
  let i = 1;
  while (i < L.length && L[i] < target) i += 1;
  const a = route[i - 1];
  const b = route[i] || route[i - 1];
  const seg = L[i] - L[i - 1] || 1;
  const lt = (target - L[i - 1]) / seg;
  return { x: a.x + (b.x - a.x) * lt, y: a.y + (b.y - a.y) * lt };
}

/**
 * Returns a memoizable description of the current SVG route.
 * Real GIS polyline data can be passed to `buildRouteGeometry` to reuse the
 * projection helpers without touching the rest of the UI.
 */
export function buildRouteGeometry(routePoints = ROUTE_POINTS, stops = STOPS) {
  const table = cumulative(routePoints);
  return {
    routePoints,
    routeWidth: ROUTE_WIDTH,
    routeHeight: ROUTE_HEIGHT,
    cumulative: table,
    stopsOnPath: stops.map((stop) => ({
      ...stop,
      progress: projectOnPath(routePoints, table, stop),
    })),
  };
}

export function positionAlongRoute(progress, geometry) {
  const geo = geometry ?? buildRouteGeometry();
  return pointAt(geo.routePoints, geo.cumulative, progress);
}

export function normaliseStops(stops = STOPS, geometry) {
  const geo = geometry ?? buildRouteGeometry();
  return stops.map((stop) => {
    const ratioX = stop.x / geo.routeWidth;
    const ratioY = stop.y / geo.routeHeight;
    return {
      ...stop,
      ratioX,
      ratioY,
      progress: projectOnPath(geo.routePoints, geo.cumulative, stop),
    };
  });
}

export const LOOP_MIN = 18;
