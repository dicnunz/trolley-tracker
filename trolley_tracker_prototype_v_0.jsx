import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Bus, Clock, Bell, AlertTriangle, WifiOff, SignalHigh, Route, Phone, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ---- Campus + schedule baseline ----
const CAMPUS = {
  free: true,
  hours: {
    announcement: "Mon–Fri during Spring/Fall. No Trolley service during Summer.",
  },
  notices: [
    "After 3:30 p.m. use Panther Shuttle.",
    "Special ADA Transportation: (321) 674-8796 • transportation@fit.edu",
  ],
  contact: "Facilities Ops: (321) 674-8038 (Mon–Fri 8a–5p)",
};

const SURVEY = {
  responses: 41,
  adoptionTop: 70.7,
  avgWTP: 2.0,
  pains: ["ETA accuracy", "Delayed/no updates", "Weak cell signal", "Last‑minute schedule changes"],
  gains: ["Plan day with reliable ETAs", "Know next arrival at a glance", "Fewer missed rides & wait time"],
};

// ---- Trolley geometry approximated to match the official map shape ----
// Coordinate system: SVG viewBox 0..1000 (x), 0..580 (y)
// The polyline below traces the maroon route shown in the campus map.
const ROUTE_POINTS = [
  // West off-campus (COB loop)
  { x: 70,  y: 70 }, { x: 250, y: 70 }, { x: 250, y: 150 }, { x: 70,  y: 150 }, { x: 70,  y: 70 },
  // Return to main campus eastbound on University Blvd
  { x: 330, y: 70 }, { x: 520, y: 70 }, { x: 610, y: 70 },
  // North loop around Commons and sports fields
  { x: 610, y: 70 }, { x: 610, y: 140 }, { x: 720, y: 140 }, { x: 720, y: 70 }, { x: 880, y: 70 }, { x: 960, y: 140 }, { x: 880, y: 210 },
  // East side down toward Botanical and then west along University/Country Club
  { x: 800, y: 250 }, { x: 720, y: 260 }, { x: 650, y: 270 }, { x: 600, y: 300 }, { x: 560, y: 330 },
  // Center campus loop (Student Center → Olin → Quad)
  { x: 520, y: 360 }, { x: 470, y: 340 }, { x: 420, y: 320 }, { x: 360, y: 300 }, { x: 320, y: 300 }, { x: 300, y: 320 }, { x: 280, y: 350 },
  // South corridor across Dorms → PDH → Covered Bridge
  { x: 260, y: 420 }, { x: 340, y: 420 }, { x: 430, y: 420 }, { x: 520, y: 420 }, { x: 600, y: 420 },
  // West to Residence and South Covered Bridge
  { x: 720, y: 420 }, { x: 720, y: 470 }, { x: 540, y: 470 }, { x: 430, y: 470 }, { x: 320, y: 470 }, { x: 210, y: 470 }, { x: 130, y: 470 },
  // Back north to tie loop
  { x: 130, y: 410 }, { x: 180, y: 360 }, { x: 220, y: 320 }, { x: 250, y: 280 }, { x: 270, y: 240 }, { x: 300, y: 200 }, { x: 340, y: 170 }, { x: 380, y: 150 }, { x: 430, y: 130 }, { x: 520, y: 120 }, { x: 610, y: 120 }, { x: 610, y: 70 },
];

// Map the eight official stops to approximate coordinates seen on the map
const STOPS = [
  { id: "commons", label: "L3Harris Commons", x: 670, y: 100 },
  { id: "wfit", label: "Gleason & WFIT", x: 560, y: 210 },
  { id: "miller", label: "John E. Miller (Academic Quad)", x: 360, y: 280 },
  { id: "res", label: "Residence Hall Circle", x: 300, y: 420 },
  { id: "olin", label: "Between Olin Engineering", x: 480, y: 310 },
  { id: "pdh", label: "Clemente ↔ PDH", x: 520, y: 420 },
  { id: "cob", label: "Nathan Bisk COB", x: 160, y: 110 },
  { id: "bridge", label: "South Covered Bridge", x: 150, y: 470 },
];

// ---- Schedule blocks (same as v0.3) ----
const RAW_MON_THU = `PDH\tCommons\tCOB\tCovered Bridge\tCOB\tPDH\tCommons\tWFIT\tMiller Bldg.\tDorm Circle\tOlin Quad\n7:41\t7:46\t\t7:51\t7:54\t7:59\t8:04\t8:09\t8:11\t8:12\t8:15\n8:16\t8:21\t\t\t\t\t\t8:26\t8:28\t8:29\t8:32\n8:33\t8:38\t\t\t\t\t\t8:53\t8:55\t8:56\t8:59\n9:00\t9:05\t\t\t\t\t\t9:10\t9:12\t9:13\t\n\t\t9:18\t9:21\t9:24\t9:29\t9:34\t9:39\t9:41\t9:42\t9:45\n9:46\t9:51\tTrolley Waiting for Tour 9:51-9:59\t10:00\t10:09\t10:11\t10:12\t10:15\n10:16\t10:21\t\t\t\t10:26\t10:31\t10:36\t10:38\t10:39\t10:42\n10:43\t10:48\t10:53\t10:56\t10:59\t11:04\t11:09\tDriver Meal Break\n11:51\t11:56\t\t\t\t\t\t12:01\t12:03\t12:04\t12:07\n12:08\t12:13\t12:18\t12:21\t12:24\t12:29\t12:34\t12:39\t12:41\t12:42\t12:45\n12:46\t12:51\t\t\t\t\t\t12:56\t12:58\t12:59\t1:02\n1:03\t1:08\t\t\t\t1:20\t1:25\t1:30\t1:32\t1:33\t1:36\n1:37\t1:42\t1:53\t1:56\t1:59\t\t2:04\t2:09\t2:11\t2:12\t2:15\n2:16\t2:21\t\t\t\t\t\t2:26\t2:28\t2:29\t2:32\n2:33\t2:38\t\t\t\t\t\t2:43\t2:45\t2:46\t2:49\n2:50\t2:55\t\t\t\t\t\t3:00\t3:02\t3:03\t3:06\n3:07\t3:12\t3:18\t3:21\t3:24\t3:29\t3:34\tDrop off as needed`;

const RAW_FRI = `PDH\tCommons\tCOB\tCovered Bridge\tCOB\tPDH\tCommons\tWFIT\tMiller Bldg.\tDorm Circle\tOlin Quad\n7:41\t7:46\t\t7:51\t7:54\t7:59\t8:04\t8:09\t8:11\t8:12\t8:15\n8:16\t8:21\t\t\t\t\t\t8:26\t8:28\t8:29\t8:32\n8:33\t8:38\t\t\t\t\t\t8:43\t8:45\t8:46\t\n\t\t8:51\t8:54\t8:57\t9:02\t9:07\t9:12\t9:14\t9:15\t9:18\n9:19\t9:24\t\t\t\t\t\t9:29\t9:31\t9:32\t9:35\n9:36\t9:41\t\t\t\t\t\t9:46\t9:48\t9:50\t9:53\n9:54\t9:59\t\t\t\t10:00\t10:09\t10:11\t10:12\t10:15\n10:16\t10:21\t\t\t\t\t\t10:26\t10:28\t10:29\t10:32\n10:33\t10:38\t10:43\t10:46\t10:49\t10:54\t11:00\t11:09\t11:11\t11:12\t11:15\n11:16\t11:21\t\t\t\t\t\t11:26\t11:28\t11:29\t11:32\n11:33\t11:38\t11:43\t11:46\t11:49\t12:04\t\tDriver Meal Break 12:10-12:40\n12:48\t12:53\t\t\t\t\t\t12:58\t1:00\t1:01\t1:04\n1:05\t1:10\t\t\t\t\t\t1:15\t1:17\t1:18\t1:21\n1:22\t1:27\t\t\t\t\t\t1:32\t1:34\t1:35\t1:38\n1:39\t1:44\t\t\t\t\t\t1:49\t1:51\t1:52\t1:55\n1:56\t2:01\t\t\t\t2:00\t2:08\t2:10\t2:11\t2:14\n2:15\t2:20\t\t\t\t\t\t2:25\t2:27\t2:28\t2:31\n2:32\t2:37\t2:45\t2:48\t2:51\t2:56\t3:01\t3:06\t3:08\t3:09\t3:12\n3:13\t3:18\t\t\t\t\t\tDrop off as needed`;

// ---- Schedule helpers ----
const TIME_RE = /^(\d{1,2}):(\d{2})(?:\s?[AP]M)?$/i;
function parseTimeToMinutes(t, prev = null) {
  if (!t || typeof t !== "string") return null;
  const m = t.trim().match(TIME_RE);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  let mm = parseInt(m[2], 10);
  let minutes = hh * 60 + mm;
  if (prev != null && minutes + 5 < prev) minutes += 12 * 60; // noon rollover
  return minutes;
}
function parseGrid(raw) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { header: [], rows: [] };
  const header = dedupeHeader(lines[0].split(/\t|\s{2,}/).map(s => s.trim()).filter(Boolean));
  const rows = [];
  let prevByCol = Array(header.length).fill(null);
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/\t|\s{2,}/);
    const row = Array(header.length).fill(null);
    for (let c = 0; c < header.length && c < cols.length; c++) {
      const tok = String(cols[c] ?? "").trim();
      const tmin = parseTimeToMinutes(tok, prevByCol[c]);
      if (tmin != null) { row[c] = tmin; prevByCol[c] = tmin; }
    }
    if (row.some(v => v != null)) rows.push(row);
  }
  return { header, rows };
}
function dedupeHeader(arr) {
  const seen = {};
  return arr.map(label => { const base = label || "Stop"; const key = base.replace(/\./g, ""); const count = (seen[key] = (seen[key] || 0) + 1); return count > 1 ? `${base} (${count})` : base; });
}
function minutesNow() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function nextTimesByStop(parsed) {
  const byStop = {}; parsed.header.forEach((h) => (byStop[h] = []));
  parsed.rows.forEach(row => row.forEach((m, i) => { if (m != null) byStop[parsed.header[i]].push(m); }));
  Object.keys(byStop).forEach(k => byStop[k].sort((a, b) => a - b));
  return byStop;
}
function formatHM(m) { const mm = ((m % (24*60)) + 24*60) % (24*60); const h = Math.floor(mm/60); const min = mm%60; const ampm = h>=12?"PM":"AM"; const h12 = h%12===0?12:h%12; return `${h12}:${String(min).padStart(2,"0")} ${ampm}`; }

// ---- Geometry helpers: length + interpolation + projection ----
function segmentLen(a, b){ const dx=b.x-a.x, dy=b.y-a.y; return Math.hypot(dx,dy); }
function cumulative(route){ const L=[0]; for(let i=1;i<route.length;i++){ L[i]=L[i-1]+segmentLen(route[i-1],route[i]); } return { L, total:L[L.length-1] }; }
function pointAt(route, Ltab, t){ const {L,total}=Ltab; const target=t*total; let i=1; while(i<L.length && L[i]<target) i++; const a=route[i-1], b=route[i]||route[i-1]; const seg=L[i]-L[i-1]||1; const lt=(target-L[i-1])/seg; return { x:a.x+(b.x-a.x)*lt, y:a.y+(b.y-a.y)*lt } }
function projectOnPath(route, Ltab, p){ const {L,total}=Ltab; let bestT=0, bestD=Infinity, acc=0; for(let i=1;i<route.length;i++){ const a=route[i-1], b=route[i]; const abx=b.x-a.x, aby=b.y-a.y; const apx=p.x-a.x, apy=p.y-a.y; const ab2=abx*abx+aby*aby||1; let u=(apx*abx+apy*aby)/ab2; u=Math.max(0,Math.min(1,u)); const rx=a.x+abx*u, ry=a.y+aby*u; const d2=(p.x-rx)**2+(p.y-ry)**2; if(d2<bestD){ bestD=d2; bestT=(acc+segmentLen(a,{x:rx,y:ry}))/total; } acc+=segmentLen(a,b); }
  return Math.max(0,Math.min(1,bestT)); }

// Map stops to path-progress for ETA calculations
function useMappedStops(){
  const Ltab = useMemo(()=>cumulative(ROUTE_POINTS),[]);
  return useMemo(()=> STOPS.map(s=>({ ...s, t: projectOnPath(ROUTE_POINTS, Ltab, s) })), [Ltab]);
}

// ---- Live map that follows the real-ish campus shape ----
const LOOP_MIN = 18; // a bit slower than ring demo
function MapLikeCampus(){
  const Ltab = useMemo(()=>cumulative(ROUTE_POINTS),[]);
  const [progress, setProgress] = useState(0); // 0..1 along path
  const [gpsAccuracy, setGpsAccuracy] = useState(0.85);
  const [lastUpdate, setLastUpdate] = useState(null);
  useEffect(()=>{ const id=setInterval(()=>{ const jitter=(1-gpsAccuracy)*(Math.random()-0.5)*0.001; setProgress(p=>{ let n=p+(1/LOOP_MIN)/60 + jitter; if(n>=1) n-=1; if(n<0) n+=1; return n; }); setLastUpdate(new Date()); },1000); return ()=>clearInterval(id); },[gpsAccuracy]);
  const pos = pointAt(ROUTE_POINTS, Ltab, progress);
  const stopsOnPath = useMappedStops();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Route className="h-5 w-5" /> Live map (campus-shaped)</CardTitle>
          <div className="text-xs text-neutral-600">Loop ≈ {LOOP_MIN} min • Last update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : "—"}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[380px] md:h-[440px] rounded-xl bg-white border">
          <svg viewBox="0 0 1000 580" className="w-full h-full">
            {/* light grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="1000" height="580" fill="url(#grid)" />

            {/* route polyline matching campus shape */}
            <polyline
              points={ROUTE_POINTS.map(p=>`${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#7a1b22"
              strokeWidth="10"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* numbered stops */}
            {useMappedStops().map((s, idx)=> (
              <g key={s.id}>
                <circle cx={s.x} cy={s.y} r="13" fill="#7a1b22" stroke="#fff" strokeWidth="3" />
                <text x={s.x} y={s.y+4} fontSize="12" textAnchor="middle" fill="#fff">{idx+1}</text>
                <text x={s.x+18} y={s.y-14} fontSize="12" fill="#334155">{s.label}</text>
              </g>
            ))}

            {/* live bus dot */}
            <g transform={`translate(${pos.x},${pos.y})`}>
              <circle r="12" fill="#111827" />
              <Bus x={-9} y={-9} width={18} height={18} color="white" />
            </g>

            {/* compass */}
            <g transform="translate(950,30)" fontSize="12" fill="#334155">
              <text x="0" y="0">N</text>
              <line x1="-6" y1="6" x2="0" y2="-12" stroke="#334155" strokeWidth="2" />
              <text x="0" y="40">S</text>
              <line x1="-6" y1="24" x2="0" y2="42" stroke="#334155" strokeWidth="2" />
            </g>
          </svg>

          {/* legend */}
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur border rounded-md px-2 py-1 text-xs flex items-center gap-3">
            <div className="flex items-center gap-1"><Bus className="h-3.5 w-3.5" /> Live bus</div>
            <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> 8 official stops</div>
            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Loop ~{LOOP_MIN}m</div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm text-neutral-600">GPS accuracy</span>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={()=>{}} className={`h-3 w-5 rounded ${n/5 <= 0.85 ? "bg-green-600" : "bg-neutral-200"}`} />
            ))}
          </div>
          <div className="ml-auto text-xs text-neutral-500 flex items-center gap-1">
            <SignalHigh className="h-4 w-4" /> Good
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Schedule UI (same as v0.3) ----
function UpcomingList({ parsed }){
  const byStop = useMemo(()=> nextTimesByStop(parsed), [parsed]);
  const now = minutesNow();
  const entries = Object.entries(byStop).map(([stop,times])=>{
    const next = times.find(t => t >= now) ?? null; const next2 = times.find(t => t > (next ?? -1)) ?? null; return { stop, next, next2 };
  });
  return (
    <div className="space-y-2">
      {entries.map(({stop,next,next2}) => (
        <div key={stop} className="flex items-center gap-3 py-2 border-b last:border-b-0">
          <div className="h-6 w-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs">•</div>
          <div className="flex-1">
            <div className="text-sm font-medium">{stop}</div>
            <div className="text-xs text-neutral-600">Next: {next!=null?formatHM(next):"—"}{next2!=null && <span className="ml-2">Then: {formatHM(next2)}</span>}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App(){
  const [dayType, setDayType] = useState("monthu");
  const parsedMonThu = useMemo(()=>parseGrid(RAW_MON_THU),[]);
  const parsedFri = useMemo(()=>parseGrid(RAW_FRI),[]);
  const parsed = dayType === "monthu" ? parsedMonThu : parsedFri;

  return (
    <div className="w-full min-h-screen bg-neutral-50 text-neutral-900 p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Panther Trolley Tracker</h1>
          <p className="text-sm text-neutral-600">Map approximates official route with numbered stops. Schedule parsing and demo live vehicle included.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Badge variant="secondary" className="text-xs">Free rides</Badge>
          <Badge variant="secondary" className="text-xs">Map-like route</Badge>
          <Badge variant="secondary" className="text-xs">{SURVEY.responses} survey responses</Badge>
        </div>
      </header>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <MapLikeCampus />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5" /> Coming soon</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-neutral-700 space-y-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Alerts when your watched stop ETA ≤ lead time.</li>
                    <li>Signal-aware ETAs with graceful degradation.</li>
                    <li>Admin KPIs for on-time and wait-time.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Why students want this</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-neutral-700 list-disc pl-5 space-y-1">
                    {SURVEY.gains.map(g => <li key={g}>{g}</li>)}
                  </ul>
                  <div className="mt-3 text-xs text-neutral-500">Survey: {SURVEY.responses} responses. {SURVEY.adoptionTop}% rated 4–5. Avg WTP ${SURVEY.avgWTP.toFixed(2)}.</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Trolley schedule</CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <Button size="sm" variant={dayType === "monthu" ? "default" : "outline"} onClick={() => setDayType("monthu")}>Mon–Thu</Button>
                      <Button size="sm" variant={dayType === "fri" ? "default" : "outline"} onClick={() => setDayType("fri")}>Fri</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-neutral-600 mb-3">Next two times per stop for the selected day. Parsed from the schedule text.</div>
                  <UpcomingList parsed={parsed} />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Data quality notes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-neutral-700 space-y-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Parser ignores non-time cells like meal breaks or notes.</li>
                    <li>When times wrap from 12:xx to 1:xx, parser assumes afternoon.</li>
                    <li>Swap the raw blocks to update schedules without code changes.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Campus service facts</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-neutral-700 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {CAMPUS.free && <Badge variant="secondary" className="text-xs">Rides free</Badge>}
                    <Badge variant="secondary" className="text-xs">{CAMPUS.hours.announcement}</Badge>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {CAMPUS.notices.map(n => <li key={n}>{n}</li>)}
                  </ul>
                  <div className="flex items-center gap-2 text-sm mt-2"><Phone className="h-4 w-4" /> {CAMPUS.contact}</div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Reliability pains</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-neutral-700 list-disc pl-5 space-y-1">
                    {SURVEY.pains.map(p => <li key={p}>{p}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <footer className="mt-6 text-xs text-neutral-500">Prototype v0.4 • Campus-shaped route • Schedule parsed • Demo live vehicle. Approximate geometry; can be refined with GIS or lat/long.
      </footer>
    </div>
  );
}
