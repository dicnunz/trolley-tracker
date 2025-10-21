import { useEffect, useMemo, useState } from 'react';
import { LOOP_MIN, buildRouteGeometry, normaliseStops, positionAlongRoute } from '../lib/route';
import { formatRelativeMinutes } from '../lib/time';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

const geometry = buildRouteGeometry();
const stopsOnRoute = normaliseStops(undefined, geometry);

function useVehicleProgress(vehicles) {
  const [progress, setProgress] = useState(() => {
    const map = {};
    vehicles.forEach((vehicle, index) => {
      const key = vehicle.id || `vehicle-${index}`;
      map[key] = typeof vehicle.progress === 'number' ? vehicle.progress : index / Math.max(1, vehicles.length);
    });
    return map;
  });

  useEffect(() => {
    setProgress((prev) => {
      const next = { ...prev };
      vehicles.forEach((vehicle, index) => {
        const key = vehicle.id || `vehicle-${index}`;
        if (typeof vehicle.progress === 'number') {
          next[key] = vehicle.progress % 1;
        } else if (!(key in next)) {
          next[key] = index / Math.max(1, vehicles.length);
        }
      });
      return next;
    });
  }, [vehicles]);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((prev) => {
        const entries = Object.entries(prev);
        if (!entries.length) return prev;
        const delta = 1 / (LOOP_MIN * 60);
        const next = {};
        entries.forEach(([key, value]) => {
          let updated = value + delta;
          if (updated >= 1) updated -= 1;
          next[key] = updated;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return progress;
}

export default function MapView({
  vehicles,
  arrivals,
  selectedStopId,
  onSelectStop,
  mode,
  lastUpdatedLabel,
}) {
  const progress = useVehicleProgress(vehicles);
  const selectedStop = useMemo(
    () => stopsOnRoute.find((stop) => stop.id === selectedStopId) ?? stopsOnRoute[0],
    [selectedStopId]
  );
  const selectedArrival = arrivals?.[selectedStop?.id];
  const etaLabel = selectedArrival?.times?.length ? formatRelativeMinutes(selectedArrival.times[0]) : '—';

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" role="img" aria-label="Trolley route map">
      <svg viewBox="0 0 1000 580" className="h-full w-full">
        <defs>
          <pattern id="campus-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1000" height="580" fill="url(#campus-grid)" />
        <polyline
          points={geometry.routePoints.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#7a1b22"
          strokeWidth="12"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {stopsOnRoute.map((stop) => (
          <g key={stop.id}>
            <circle cx={stop.x} cy={stop.y} r="12" fill="#7a1b22" stroke="#fff" strokeWidth="4" />
            <text x={stop.x + 16} y={stop.y - 14} fontSize="12" fill="#1f2937">
              {stop.label}
            </text>
          </g>
        ))}
        {Object.entries(progress).map(([key, value]) => {
          const point = positionAlongRoute(value, geometry);
          return (
            <g key={key} transform={`translate(${point.x},${point.y})`}>
              <circle r="14" fill="#0f172a" />
              <text x="0" y="5" textAnchor="middle" fontSize="18" aria-hidden="true">
                🚌
              </text>
            </g>
          );
        })}
      </svg>

      {stopsOnRoute.map((stop) => (
        <button
          key={stop.id}
          type="button"
          onClick={() => onSelectStop?.(stop.id)}
          style={{ left: `${stop.ratioX * 100}%`, top: `${stop.ratioY * 100}%` }}
          className={cx(
            'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-4 text-sm font-medium shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-slate-500/60',
            'h-12 min-w-[3rem] bg-white/90 backdrop-blur',
            selectedStopId === stop.id
              ? 'border-slate-900 text-slate-900'
              : 'border-slate-200 text-slate-600 hover:border-slate-400'
          )}
          aria-pressed={selectedStopId === stop.id}
          aria-label={`Focus ${stop.label} on map`}
        >
          {stop.label}
        </button>
      ))}

      {selectedStop && (
        <div
          className="pointer-events-none absolute -translate-y-full rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-lg"
          style={{ left: `${selectedStop.ratioX * 100}%`, top: `${selectedStop.ratioY * 100}%` }}
        >
          <div className="font-semibold text-slate-900">{selectedStop.label}</div>
          <div>{selectedArrival?.sourceLabel ?? (mode === 'live' ? 'Live ETA' : 'Schedule estimate')}</div>
          <div className="text-sm font-medium text-emerald-600">{etaLabel}</div>
        </div>
      )}

      <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1 rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm">
        <span className="font-semibold text-slate-900">{mode === 'live' ? 'Live feed' : 'Schedule estimate'}</span>
        <span>Last updated {lastUpdatedLabel}</span>
      </div>
    </div>
  );
}
