import { useEffect, useMemo, useState } from 'react';
import {
  getLiveETAs,
  getScheduleEstimate,
  getStatus,
} from './lib/data.js';

const CAMPUS = {
  free: true,
  hours: {
    announcement: 'Mon–Fri during Spring/Fall. No Trolley service during Summer.',
  },
  notices: [
    'After 3:30 p.m. use Panther Shuttle.',
    'Special ADA Transportation: (321) 674-8796 • transportation@fit.edu',
  ],
  contact: 'Facilities Ops: (321) 674-8038 (Mon–Fri 8a–5p)',
};

const SURVEY = {
  responses: 41,
  adoptionTop: 70.7,
  avgWTP: 2.0,
  pains: ['ETA accuracy', 'Delayed/no updates', 'Weak cell signal', 'Last-minute schedule changes'],
  gains: [
    'Plan day with reliable ETAs',
    'Know next arrival at a glance',
    'Fewer missed rides & wait time',
  ],
};

const ROUTE_POINTS = [
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

const STOPS = [
  { id: 'commons', label: 'L3Harris Commons', x: 670, y: 100 },
  { id: 'wfit', label: 'Gleason & WFIT', x: 560, y: 210 },
  { id: 'miller', label: 'John E. Miller (Academic Quad)', x: 360, y: 280 },
  { id: 'res', label: 'Residence Hall Circle', x: 300, y: 420 },
  { id: 'olin', label: 'Between Olin Engineering', x: 480, y: 310 },
  { id: 'pdh', label: 'Clemente ↔ PDH', x: 520, y: 420 },
  { id: 'cob', label: 'Nathan Bisk COB', x: 160, y: 110 },
  { id: 'bridge', label: 'South Covered Bridge', x: 150, y: 470 },
];

const RAW_MON_THU = `PDH\tCommons\tCOB\tCovered Bridge\tCOB\tPDH\tCommons\tWFIT\tMiller Bldg.\tDorm Circle\tOlin Quad\n7:41\t7:46\t\t7:51\t7:54\t7:59\t8:04\t8:09\t8:11\t8:12\t8:15\n8:16\t8:21\t\t\t\t\t\t8:26\t8:28\t8:29\t8:32\n8:33\t8:38\t\t\t\t\t\t8:53\t8:55\t8:56\t8:59\n9:00\t9:05\t\t\t\t\t\t9:10\t9:12\t9:13\t\n\t\t9:18\t9:21\t9:24\t9:29\t9:34\t9:39\t9:41\t9:42\t9:45\n9:46\t9:51\tTrolley Waiting for Tour 9:51-9:59\t10:00\t10:09\t10:11\t10:12\t10:15\n10:16\t10:21\t\t\t\t10:26\t10:31\t10:36\t10:38\t10:39\t10:42\n10:43\t10:48\t10:53\t10:56\t10:59\t11:04\t11:09\tDriver Meal Break\n11:51\t11:56\t\t\t\t\t\t12:01\t12:03\t12:04\t12:07\n12:08\t12:13\t12:18\t12:21\t12:24\t12:29\t12:34\t12:39\t12:41\t12:42\t12:45\n12:46\t12:51\t\t\t\t\t\t12:56\t12:58\t12:59\t1:02\n1:03\t1:08\t\t\t\t1:20\t1:25\t1:30\t1:32\t1:33\t1:36\n1:37\t1:42\t1:53\t1:56\t1:59\t\t2:04\t2:09\t2:11\t2:12\t2:15\n2:16\t2:21\t\t\t\t\t\t2:26\t2:28\t2:29\t2:32\n2:33\t2:38\t\t\t\t\t\t2:43\t2:45\t2:46\t2:49\n2:50\t2:55\t\t\t\t\t\t3:00\t3:02\t3:03\t3:06\n3:07\t3:12\t3:18\t3:21\t3:24\t3:29\t3:34\tDrop off as needed`;

const RAW_FRI = `PDH\tCommons\tCOB\tCovered Bridge\tCOB\tPDH\tCommons\tWFIT\tMiller Bldg.\tDorm Circle\tOlin Quad\n7:41\t7:46\t\t7:51\t7:54\t7:59\t8:04\t8:09\t8:11\t8:12\t8:15\n8:16\t8:21\t\t\t\t\t\t8:26\t8:28\t8:29\t8:32\n8:33\t8:38\t\t\t\t\t\t8:43\t8:45\t8:46\t\n\t\t8:51\t8:54\t8:57\t9:02\t9:07\t9:12\t9:14\t9:15\t9:18\n9:19\t9:24\t\t\t\t\t\t9:29\t9:31\t9:32\t9:35\n9:36\t9:41\t\t\t\t\t\t9:46\t9:48\t9:50\t9:53\n9:54\t9:59\t\t\t\t10:00\t10:09\t10:11\t10:12\t10:15\n10:16\t10:21\t\t\t\t\t\t10:26\t10:28\t10:29\t10:32\n10:33\t10:38\t10:43\t10:46\t10:49\t10:54\t11:00\t11:09\t11:11\t11:12\t11:15\n11:16\t11:21\t\t\t\t\t\t11:26\t11:28\t11:29\t11:32\n11:33\t11:38\t11:43\t11:46\t11:49\t12:04\t\tDriver Meal Break 12:10-12:40\n12:48\t12:53\t\t\t\t\t\t12:58\t1:00\t1:01\t1:04\n1:05\t1:10\t\t\t\t\t\t1:15\t1:17\t1:18\t1:21\n1:22\t1:27\t\t\t\t\t\t1:32\t1:34\t1:35\t1:38\n1:39\t1:44\t\t\t\t\t\t1:49\t1:51\t1:52\t1:55\n1:56\t2:01\t\t\t\t2:00\t2:08\t2:10\t2:11\t2:14\n2:15\t2:20\t\t\t\t\t\t2:25\t2:27\t2:28\t2:31\n2:32\t2:37\t2:45\t2:48\t2:51\t2:56\t3:01\t3:06\t3:08\t3:09\t3:12\n3:13\t3:18\t\t\t\t\t\tDrop off as needed`;

const LOOP_MIN = 18;

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

function useMappedStops() {
  const Ltab = useMemo(() => cumulative(ROUTE_POINTS), []);
  return useMemo(
    () => STOPS.map((s) => ({ ...s, t: projectOnPath(ROUTE_POINTS, Ltab, s) })),
    [Ltab]
  );
}

function minutesNow() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

const TIME_RE = /^(\d{1,2}):(\d{2})(?:\s?[AP]M)?$/i;

function parseTimeToMinutes(t, prev = null) {
  if (!t || typeof t !== 'string') return null;
  const m = t.trim().match(TIME_RE);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  let minutes = hh * 60 + mm;
  if (prev != null && minutes + 5 < prev) minutes += 12 * 60;
  return minutes;
}

function dedupeHeader(arr) {
  const seen = {};
  return arr.map((label) => {
    const base = label || 'Stop';
    const key = base.replace(/\./g, '');
    const count = (seen[key] = (seen[key] || 0) + 1);
    return count > 1 ? `${base} (${count})` : base;
  });
}

function parseGrid(raw) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { header: [], rows: [] };
  const header = dedupeHeader(
    lines[0]
      .split(/\t|\s{2,}/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const rows = [];
  const prevByCol = Array(header.length).fill(null);
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(/\t|\s{2,}/);
    const row = Array(header.length).fill(null);
    for (let c = 0; c < header.length && c < cols.length; c += 1) {
      const tok = String(cols[c] ?? '').trim();
      const tmin = parseTimeToMinutes(tok, prevByCol[c]);
      if (tmin != null) {
        row[c] = tmin;
        prevByCol[c] = tmin;
      }
    }
    if (row.some((v) => v != null)) rows.push(row);
  }
  return { header, rows };
}

function nextTimesByStop(parsed) {
  const byStop = {};
  parsed.header.forEach((h) => {
    byStop[h] = [];
  });
  parsed.rows.forEach((row) =>
    row.forEach((m, i) => {
      if (m != null) byStop[parsed.header[i]].push(m);
    })
  );
  Object.keys(byStop).forEach((k) => byStop[k].sort((a, b) => a - b));
  return byStop;
}

function formatHM(m) {
  const mm = ((m % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(mm / 60);
  const min = mm % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
}

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function Card({ className = '', children }) {
  return (
    <section className={cx('bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden', className)}>
      {children}
    </section>
  );
}

function CardHeader({ className = '', children }) {
  return <div className={cx('px-4 py-3 border-b border-slate-200', className)}>{children}</div>;
}

function CardTitle({ className = '', children }) {
  return <h2 className={cx('text-base font-semibold tracking-tight text-slate-900', className)}>{children}</h2>;
}

function CardContent({ className = '', children }) {
  return <div className={cx('px-4 py-4', className)}>{children}</div>;
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function TabTrigger({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
      )}
    >
      {children}
    </button>
  );
}

function StopButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-md border px-3 py-1 text-sm transition-colors',
        active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
      )}
    >
      {children}
    </button>
  );
}

function MapLikeCampus({ vehicles, updatedAt }) {
  const Ltab = useMemo(() => cumulative(ROUTE_POINTS), []);
  const stopsOnPath = useMappedStops();
  const [progressMap, setProgressMap] = useState(() => {
    const base = {};
    vehicles.forEach((v, idx) => {
      base[v.id || `vehicle-${idx}`] = typeof v.progress === 'number' ? v.progress : idx / vehicles.length;
    });
    return base;
  });
  const [gpsAccuracy, setGpsAccuracy] = useState(0.85);

  useEffect(() => {
    setProgressMap((prev) => {
      const next = { ...prev };
      vehicles.forEach((v, idx) => {
        const key = v.id || `vehicle-${idx}`;
        if (typeof v.progress === 'number') next[key] = v.progress;
        else if (!(key in next)) next[key] = idx / Math.max(1, vehicles.length);
      });
      return next;
    });
  }, [vehicles]);

  useEffect(() => {
    const id = setInterval(() => {
      setProgressMap((prev) => {
        const entries = Object.entries(prev);
        if (!entries.length) return prev;
        const updated = {};
        entries.forEach(([key, value]) => {
          let nextVal = value + (1 / LOOP_MIN) / 60;
          const jitter = (1 - gpsAccuracy) * (Math.random() - 0.5) * 0.002;
          nextVal += jitter;
          if (nextVal >= 1) nextVal -= 1;
          if (nextVal < 0) nextVal += 1;
          updated[key] = nextVal;
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [gpsAccuracy]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live map (campus-shaped)</CardTitle>
          <div className="text-xs text-slate-500">
            Loop ≈ {LOOP_MIN} min • Last feed: {updatedAt ? new Date(updatedAt).toLocaleTimeString() : '—'}
          </div>
        </div>
        <p className="text-xs text-slate-500">
          The maroon polyline is sized to resemble the official campus route. Vehicles are animated along the path.
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative h-[360px] rounded-xl bg-white border border-slate-200">
          <svg viewBox="0 0 1000 580" className="h-full w-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="1000" height="580" fill="url(#grid)" />
            <polyline
              points={ROUTE_POINTS.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#7a1b22"
              strokeWidth="10"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {stopsOnPath.map((s, idx) => (
              <g key={s.id}>
                <circle cx={s.x} cy={s.y} r="13" fill="#7a1b22" stroke="#fff" strokeWidth="3" />
                <text x={s.x} y={s.y + 4} fontSize="12" textAnchor="middle" fill="#fff">
                  {idx + 1}
                </text>
                <text x={s.x + 18} y={s.y - 14} fontSize="12" fill="#334155">
                  {s.label}
                </text>
              </g>
            ))}
            {Object.entries(progressMap).map(([key, progress]) => {
              const pos = pointAt(ROUTE_POINTS, Ltab, progress);
              return (
                <g key={key} transform={`translate(${pos.x},${pos.y})`}>
                  <circle r="12" fill="#0f172a" />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#fff"
                    fontFamily="sans-serif"
                  >
                    🚌
                  </text>
                </g>
              );
            })}
            <g transform="translate(950,30)" fontSize="12" fill="#334155">
              <text x="0" y="0">
                N
              </text>
              <line x1="-6" y1="6" x2="0" y2="-12" stroke="#334155" strokeWidth="2" />
              <text x="0" y="40">
                S
              </text>
              <line x1="-6" y1="24" x2="0" y2="42" stroke="#334155" strokeWidth="2" />
            </g>
          </svg>
          <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-xs text-slate-600 shadow-sm">
            <span>🚌 Live trolley</span>
            <span>📍 Eight official stops</span>
            <span>⏱ Loop ≈ {LOOP_MIN}m</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-slate-600">GPS accuracy</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                aria-label={`Accuracy level ${n}`}
                onClick={() => setGpsAccuracy(n / 5)}
                className={cx('h-3 w-5 rounded transition-colors', n / 5 <= gpsAccuracy ? 'bg-emerald-500' : 'bg-slate-200')}
              />
            ))}
          </div>
          <div className="ml-auto text-xs text-slate-500">{gpsAccuracy >= 0.8 ? 'Strong signal' : 'Degraded signal'}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingList({ parsed }) {
  const byStop = useMemo(() => nextTimesByStop(parsed), [parsed]);
  const now = minutesNow();
  const entries = Object.entries(byStop).map(([stop, times]) => {
    const next = times.find((t) => t >= now) ?? null;
    const next2 = times.find((t) => t > (next ?? -1)) ?? null;
    return { stop, next, next2 };
  });
  return (
    <div className="space-y-2">
      {entries.map(({ stop, next, next2 }) => (
        <div key={stop} className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">•</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">{stop}</div>
            <div className="text-xs text-slate-600">
              Next: {next != null ? formatHM(next) : '—'}
              {next2 != null && <span className="ml-2">Then: {formatHM(next2)}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveEtaPanel({ selectedStop, onSelectStop, liveEtas, status, schedule }) {
  const etas = liveEtas?.etas?.[selectedStop] ?? [];
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Stop ETAs & status</CardTitle>
          <div className="text-xs text-slate-500">
            Updated {liveEtas?.updatedAt ? new Date(liveEtas.updatedAt).toLocaleTimeString() : '—'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STOPS.map((stop) => (
            <StopButton key={stop.id} active={stop.id === selectedStop} onClick={() => onSelectStop(stop.id)}>
              {stop.label}
            </StopButton>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-700">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Live arrivals</div>
          {etas.length ? (
            <ul className="mt-2 space-y-1">
              {etas.map((item) => (
                <li key={`${item.vehicleId}-${item.etaMinutes}`} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="font-medium">Vehicle {item.vehicleId}</span>
                  <span>{item.etaMinutes} min</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">
              No live arrival predictions for this stop.
            </div>
          )}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Schedule estimates</div>
          {schedule?.nextArrivals?.length ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {schedule.nextArrivals.map((slot) => (
                <Badge key={slot}>{slot}</Badge>
              ))}
            </div>
          ) : (
            <div className="mt-2 rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">
              Schedule not available.
            </div>
          )}
          {schedule?.generatedAt && (
            <div className="mt-2 text-xs text-slate-500">
              Schedule generated {new Date(schedule.generatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Service status</div>
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {status?.message ?? 'No alerts posted.'}
          </p>
          {status?.incidents?.length ? (
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {status.incidents.map((incident) => (
                <li key={incident.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                  <div className="font-medium text-slate-800">{incident.title}</div>
                  <div>{incident.detail}</div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function App() {
  const [tab, setTab] = useState('live');
  const [dayType, setDayType] = useState('monthu');
  const [selectedStop, setSelectedStop] = useState(STOPS[0].id);
  const [liveEtas, setLiveEtas] = useState(null);
  const [status, setStatus] = useState(null);
  const [scheduleEstimates, setScheduleEstimates] = useState({});

  const parsedMonThu = useMemo(() => parseGrid(RAW_MON_THU), []);
  const parsedFri = useMemo(() => parseGrid(RAW_FRI), []);
  const parsed = dayType === 'monthu' ? parsedMonThu : parsedFri;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await getLiveETAs();
      if (!mounted) return;
      setLiveEtas(data);
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await getStatus();
      if (!mounted) return;
      setStatus(data);
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const schedule = scheduleEstimates[selectedStop];

  useEffect(() => {
    if (schedule) return;
    let mounted = true;
    const load = async () => {
      const data = await getScheduleEstimate(selectedStop);
      if (!mounted) return;
      setScheduleEstimates((prev) => ({ ...prev, [selectedStop]: data }));
    };
    load();
    return () => {
      mounted = false;
    };
  }, [selectedStop, schedule]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Panther Trolley Tracker</h1>
          <p className="text-sm text-slate-600">
            Campus-shaped live route demo with numbered stops, parsed schedule blocks, and mock data hooks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Free rides</Badge>
          <Badge>Map-like route</Badge>
          <Badge>{SURVEY.responses} survey responses</Badge>
        </div>
      </header>

      <main className="mx-auto mt-6 w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap gap-2">
          <TabTrigger active={tab === 'live'} onClick={() => setTab('live')}>
            Live
          </TabTrigger>
          <TabTrigger active={tab === 'schedule'} onClick={() => setTab('schedule')}>
            Schedule
          </TabTrigger>
          <TabTrigger active={tab === 'info'} onClick={() => setTab('info')}>
            Info
          </TabTrigger>
        </div>

        {tab === 'live' && (
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-4">
              <MapLikeCampus vehicles={liveEtas?.vehicles ?? []} updatedAt={liveEtas?.updatedAt} />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <LiveEtaPanel
                selectedStop={selectedStop}
                onSelectStop={setSelectedStop}
                liveEtas={liveEtas}
                status={status}
                schedule={schedule}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why students want this</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {SURVEY.gains.map((gain) => (
                      <li key={gain}>{gain}</li>
                    ))}
                  </ul>
                  <div className="mt-3 text-xs text-slate-500">
                    Survey: {SURVEY.responses} responses. {SURVEY.adoptionTop}% rated 4–5. Avg WTP ${SURVEY.avgWTP.toFixed(2)}.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {tab === 'schedule' && (
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardHeader className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">Trolley schedule</CardTitle>
                    <div className="flex gap-2">
                      <StopButton active={dayType === 'monthu'} onClick={() => setDayType('monthu')}>
                        Mon–Thu
                      </StopButton>
                      <StopButton active={dayType === 'fri'} onClick={() => setDayType('fri')}>
                        Fri
                      </StopButton>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Next two times per stop for the selected day. Parsed from the raw schedule blocks.
                  </p>
                </CardHeader>
                <CardContent>
                  <UpcomingList parsed={parsed} />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data quality notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                    <li>Parser ignores non-time cells like meal breaks or notes.</li>
                    <li>Times that wrap from 12:xx to 1:xx assume afternoon rollover.</li>
                    <li>Swap the raw text blocks to update schedules without code changes.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {tab === 'info' && (
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campus service facts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <div className="flex flex-wrap gap-2">
                    {CAMPUS.free && <Badge>Rides free</Badge>}
                    <Badge>{CAMPUS.hours.announcement}</Badge>
                  </div>
                  <ul className="list-disc space-y-1 pl-4">
                    {CAMPUS.notices.map((notice) => (
                      <li key={notice}>{notice}</li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <span role="img" aria-hidden="true">
                      ☎️
                    </span>
                    {CAMPUS.contact}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reliability pains</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {SURVEY.pains.map((pain) => (
                      <li key={pain}>{pain}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto mt-8 w-full max-w-6xl text-xs text-slate-500">
        Prototype v0.4 • Campus-shaped route • Schedule parsed • Demo live vehicle. Geometry is approximate and can be refined
        with GIS or GPS data.
      </footer>
    </div>
  );
}
