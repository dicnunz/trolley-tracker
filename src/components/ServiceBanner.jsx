function toneClasses(state) {
  switch (state) {
    case 'off':
      return {
        container: 'border-rose-200 bg-rose-50 text-rose-800',
        badge: 'bg-rose-600 text-white',
      };
    case 'limited':
      return {
        container: 'border-amber-200 bg-amber-50 text-amber-800',
        badge: 'bg-amber-500 text-white',
      };
    default:
      return {
        container: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        badge: 'bg-emerald-600 text-white',
      };
  }
}

export default function ServiceBanner({ state = 'on', status }) {
  const tone = toneClasses(state);
  const title = state === 'off' ? 'Service paused' : state === 'limited' ? 'Service limited' : 'Service running';
  const fallback =
    state === 'off'
      ? 'Trolley is offline. Check the schedule estimate and campus shuttle signage for alternatives.'
      : state === 'limited'
      ? 'Delays possible. Thanks for your patience while we keep the route moving.'
      : 'Live ETAs are active.';

  return (
    <section
      className={`rounded-2xl border ${tone.container} px-4 py-3 text-sm shadow-sm`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide ${tone.badge}`}>
            {state}
          </span>
          <p className="font-semibold text-base">{title}</p>
        </div>
        <p className="text-xs font-medium text-slate-500">{status?.updatedAt ? new Date(status.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Status auto-refreshes'}</p>
      </div>
      <p className="mt-2 text-sm">{status?.message ?? fallback}</p>
      {state === 'off' && (
        <p className="mt-1 text-xs font-medium">Alerts are disabled until the service resumes.</p>
      )}
      {status?.incidents?.length ? (
        <ul className="mt-3 space-y-2">
          {status.incidents.map((incident) => (
            <li key={incident.id} className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">{incident.title}</div>
              <div>{incident.detail}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
