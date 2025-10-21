
import React, { useEffect, useMemo, useRef, useState } from "react";

/** Panther Trolley Tracker — Prototype v1
 *  - Live looped vehicle on a campus-like polyline
 *  - Next arrivals list per stop
 *  - "Watch this stop" with 5-min alert (demo toast)
 *  - Headway ETA fallback when gpsAvailable = false
 *  - Basic a11y (aria labels, focus states) and high-contrast toggle
 */

const LOOP_MIN = 18; // full route loop in minutes
const MS = (m) => m * 60 * 1000;

const STOPS = [
  { id: "denius", name: "Denius Quad", tMin: 0 },
  { id: "library", name: "Evans Library", tMin: 3 },
  { id: "babcock", name: "Babcock Oaks", tMin: 6 },
  { id: "cov", name: "Center for Organizational Value", tMin: 9 },
  { id: "sls", name: "Skurla/SLS", tMin: 12 },
  { id: "crawford", name: "Crawford", tMin: 15 },
];

function etaSequence(now, headwayMin = LOOP_MIN, offsetMin = 0, count = 2) {
  // Return the next N arrival minutes from now using a periodic headway and stop offset
  // If the bus does a full loop in LOOP_MIN minutes, each stop occurs at offset tMin
  const result = [];
  const nowMin = 0; // treat "now" as 0, we compute deltas only
  // next arrival after offsetMin with period = headwayMin
  let k = Math.ceil((nowMin - offsetMin) / headwayMin);
  if (!Number.isFinite(k)) k = 0;
  for (let i = 0; i < count; i++) {
    const arr = offsetMin + (k + i) * headwayMin - nowMin;
    const val = ((arr % headwayMin) + headwayMin) % headwayMin;
    result.push(Math.round(val));
  }
  return result;
}

export default function PantherTrolleyPrototype() {
  const [gpsAvailable, setGpsAvailable] = useState(true);
  const [progressMin, setProgressMin] = useState(0); // 0..LOOP_MIN
  const [highContrast, setHighContrast] = useState(false);

  // Watch-stop controls
  const [watchStopId, setWatchStopId] = useState("denius");
  const [watchLead, setWatchLead] = useState(5); // minutes

  // Simulate loop progress
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsedMin = (Date.now() - start) / MS(1);
      setProgressMin((elapsedMin % LOOP_MIN));
      req = requestAnimationFrame(tick);
    };
    let req = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(req);
  }, []);

  // Compute ETAs per stop: if gpsAvailable then compute from live progress,
  // else fallback to headway model using tMin offsets
  const etas = useMemo(() => {
    const list = {};
    STOPS.forEach((s) => {
      if (gpsAvailable) {
        // Next pass when progress >= s.tMin -> wrap
        const next = progressMin <= s.tMin ? (s.tMin - progressMin) : (LOOP_MIN - (progressMin - s.tMin));
        const following = next + LOOP_MIN;
        list[s.id] = [Math.round(next), Math.round(following)];
      } else {
        list[s.id] = etaSequence(Date.now(), LOOP_MIN, s.tMin, 2);
      }
    });
    return list;
  }, [gpsAvailable, progressMin]);

  // Simple watch-stop notifier (demo): if the selected stop is within watchLead min, flash a toast
  const [toast, setToast] = useState(null);
  const lastSignalRef = useRef(null);
  useEffect(() => {
    const nextMin = etas[watchStopId]?.[0] ?? 999;
    const shouldNotify = nextMin <= watchLead;
    const prev = lastSignalRef.current;
    if (shouldNotify && prev !== "shown") {
      setToast(`Heads up: ${STOPS.find(s => s.id === watchStopId)?.name} in ~${nextMin} min.`);
      lastSignalRef.current = "shown";
      setTimeout(() => setToast(null), 3500);
    }
    if (!shouldNotify) lastSignalRef.current = null;
  }, [etas, watchStopId, watchLead]);

  const containerStyle = {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    lineHeight: 1.3,
    color: highContrast ? "#000" : "#111",
    background: highContrast ? "#fff" : "#fafafa",
    padding: "16px",
  };

  const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    background: "#fff",
  };

  const btnStyle = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#f2f2f2",
    cursor: "pointer"
  };

  return (
    <div style={containerStyle}>
      <h1 aria-label="Panther Trolley Tracker heading">Panther Trolley Tracker — Prototype v1</h1>

      <div style={{display:"flex", gap:12, flexWrap:"wrap", marginBottom: 12}}>
        <button style={btnStyle} onClick={()=> setGpsAvailable((v)=>!v)} aria-pressed={!gpsAvailable} aria-label="Toggle GPS availability">
          GPS: {gpsAvailable ? "available (live ETA)" : "unavailable (fallback ETA)"}
        </button>
        <button style={btnStyle} onClick={()=> setHighContrast((v)=>!v)} aria-pressed={highContrast} aria-label="Toggle high contrast mode">
          {highContrast ? "High-contrast: on" : "High-contrast: off"}
        </button>

        <label style={{display:"inline-flex", alignItems:"center", gap:8}} aria-label="Watch stop selector">
          <span>Watch stop</span>
          <select value={watchStopId} onChange={(e)=> setWatchStopId(e.target.value)} aria-label="Choose a stop to watch">
            {STOPS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        <label style={{display:"inline-flex", alignItems:"center", gap:8}} aria-label="Lead time selector">
          <span>Alert at</span>
          <select value={watchLead} onChange={(e)=> setWatchLead(parseInt(e.target.value,10))} aria-label="Choose alert lead time">
            {[3,5,7,10].map(m => <option key={m} value={m}>{m} min</option>)}
          </select>
        </label>
      </div>

      {/* Next arrivals list */}
      <div style={cardStyle} role="region" aria-label="Next arrivals list">
        <h2>Next arrivals</h2>
        <ul>
          {STOPS.map(s => {
            const [n1, n2] = etas[s.id] ?? ["–","–"];
            return (
              <li key={s.id} style={{marginBottom:6}}>
                <strong>{s.name}</strong>: {n1} min, {n2} min
              </li>
            );
          })}
        </ul>
        <p style={{fontSize:12, opacity:0.8}}>Loop duration ~{LOOP_MIN} min. Fallback uses headway when GPS is unavailable.</p>
      </div>

      {/* Simple demo map stub */}
      <div style={cardStyle} role="img" aria-label="Map placeholder showing bus along route">
        <h2>Map (demo)</h2>
        <p>Bus progress on loop: <strong>{Math.round((progressMin/LOOP_MIN)*100)}%</strong></p>
        <div style={{height:12, background:"#eee", borderRadius:8, overflow:"hidden"}}>
          <div style={{height:12, width:`${(progressMin/LOOP_MIN)*100}%`, background:"#888"}} />
        </div>
        <p style={{fontSize:12, opacity:0.8, marginTop:8}}>Replace this with campus polyline + bus icon when data feed is wired.</p>
      </div>

      {toast && (
        <div role="status" aria-live="polite" style={{position:"fixed", bottom:16, right:16, background:"#111", color:"#fff", padding:"10px 12px", borderRadius:8}}>
          {toast}
        </div>
      )}
    </div>
  );
}
