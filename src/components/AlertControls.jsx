import { useEffect, useRef, useState } from 'react';
import { formatRelativeMinutes } from '../lib/time';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

const PRESETS = [3, 5, 8];

function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
}

export default function AlertControls({
  arrivals,
  selectedStopId,
  stopsById,
  preferredLead,
  onPreferredLeadChange,
  serviceState,
}) {
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [banner, setBanner] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const alertTimerRef = useRef(null);
  const bannerTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const showBanner = (message) => {
    setBanner(message);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setBanner(null), 10_000);
  };

  const cancelAlert = () => {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = null;
    setActiveAlert(null);
  };

  const scheduleAlert = async (leadMinutes) => {
    if (!selectedStopId) return;
    if (serviceState === 'off') {
      showBanner('Service is paused. Alerts are unavailable while the trolley is offline.');
      return;
    }

    onPreferredLeadChange?.(leadMinutes);
    const stopArrivals = arrivals?.[selectedStopId];
    const eta = stopArrivals?.times?.find((value) => value >= leadMinutes);
    if (eta == null) {
      showBanner('No arrivals remain beyond that alert window.');
      return;
    }

    const delayMs = Math.max(0, (eta - leadMinutes) * 60_000);
    cancelAlert();

    let nextPermission = permission;
    if (permission === 'default' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        nextPermission = await window.Notification.requestPermission();
      } catch (error) {
        console.warn('Notification permission request failed', error);
        nextPermission = 'denied';
      }
      setPermission(nextPermission);
    }

    const stop = stopsById[selectedStopId];
    const arrivalLabel = formatRelativeMinutes(eta);
    const sourceLabel = stopArrivals?.sourceLabel ?? 'Live ETA';

    const triggerAlert = () => {
      if (nextPermission === 'granted' && typeof window !== 'undefined' && 'Notification' in window) {
        // eslint-disable-next-line no-new
        new window.Notification('Trolley arriving soon', {
          body: `${stop.label}: ${sourceLabel.toLowerCase()} ${arrivalLabel}`,
        });
      } else {
        showBanner(`${stop.label}: ${sourceLabel} ${arrivalLabel}`);
      }
      setActiveAlert(null);
    };

    alertTimerRef.current = setTimeout(() => {
      triggerAlert();
      alertTimerRef.current = null;
    }, delayMs);

    setActiveAlert({
      stopId: selectedStopId,
      leadMinutes,
      eta,
      fireAt: Date.now() + delayMs,
      sourceLabel,
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" role="region" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Alerts</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{serviceState}</span>
      </div>
      <p className="text-sm text-slate-600">
        Get a heads-up before the trolley arrives. Choose a lead time and we&apos;ll notify you {preferredLead ? `~${preferredLead} minutes` : 'a few minutes'} before arrival.
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => scheduleAlert(minutes)}
            className={cx(
              'inline-flex h-12 min-w-[4.5rem] items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring focus-visible:ring-slate-500/60',
              minutes === preferredLead ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
            )}
            disabled={serviceState === 'off'}
          >
            {minutes} min
          </button>
        ))}
      </div>
      {(permission === 'denied' || permission === 'unsupported') && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800" role="status">
          Browser notifications are {permission === 'unsupported' ? 'not available here' : 'blocked'}. We&apos;ll use in-app banners instead.
        </p>
      )}
      {banner && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
          {banner}
        </div>
      )}
      {activeAlert ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <div>
            Alert set for {stopsById[activeAlert.stopId]?.label} {formatRelativeMinutes(activeAlert.eta)} ({activeAlert.sourceLabel.toLowerCase()})
          </div>
          <button
            type="button"
            onClick={cancelAlert}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-medium uppercase tracking-wide text-slate-600 transition-colors hover:border-slate-400 focus:outline-none focus-visible:ring focus-visible:ring-slate-500/60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Tap a preset to arm an alert for the selected stop.</p>
      )}
    </div>
  );
}
