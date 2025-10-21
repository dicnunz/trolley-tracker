import { formatRelativeMinutes } from '../lib/time';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function StopsList({
  stops,
  arrivals,
  selectedStopId,
  onSelectStop,
  nearestStopId,
}) {
  return (
    <ul className="flex flex-col divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm" role="list">
      {stops.map((stop) => {
        const data = arrivals?.[stop.id];
        const upcoming = data?.times?.slice(0, 2) ?? [];
        const source = data?.sourceLabel ?? 'Live ETA';
        const isSelected = selectedStopId === stop.id;
        const isNearest = nearestStopId === stop.id;
        return (
          <li key={stop.id}>
            <button
              type="button"
              onClick={() => onSelectStop?.(stop.id)}
              className={cx(
                'flex w-full items-center justify-between gap-3 px-4 text-left transition-colors focus:outline-none focus-visible:ring focus-visible:ring-slate-500/60',
                'h-16',
                isSelected ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50'
              )}
              aria-pressed={isSelected}
              aria-label={`${stop.label} ${source} ${upcoming.map((m) => formatRelativeMinutes(m)).join(', ')}`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">{stop.label}</span>
                <span className={cx('text-xs', isSelected ? 'text-slate-200' : 'text-slate-500')}>{source}</span>
                {isNearest && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Nearest stop
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm font-medium">
                {upcoming.length ? (
                  upcoming.map((minutes, index) => (
                    <span key={index} className={cx(isSelected ? 'text-emerald-200' : 'text-emerald-600')}>
                      {formatRelativeMinutes(minutes)}
                    </span>
                  ))
                ) : (
                  <span className={cx(isSelected ? 'text-slate-200' : 'text-slate-400')}>No data</span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
