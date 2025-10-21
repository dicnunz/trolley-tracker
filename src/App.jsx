import { useEffect, useMemo, useState } from 'react';
import AlertControls from './components/AlertControls.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import MapView from './components/MapView.jsx';
import ServiceBanner from './components/ServiceBanner.jsx';
import StopsList from './components/StopsList.jsx';
import { TrolleyDataProvider, useTrolleyData } from './lib/trolley-provider.jsx';

const PREFS_KEY = 'trolley.prefs.v2';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestStop(coords, stops) {
  if (!coords) return stops[0];
  let best = null;
  let bestDist = Infinity;
  stops.forEach((stop) => {
    if (typeof stop.lat !== 'number' || typeof stop.lng !== 'number') return;
    const dist = haversine(coords.lat, coords.lng, stop.lat, stop.lng);
    if (dist < bestDist) {
      best = stop;
      bestDist = dist;
    }
  });
  return best ?? stops[0];
}

function usePreferences(defaultStopId) {
  const initial = useMemo(() => ({ stopId: defaultStopId, alertLead: 5 }), [defaultStopId]);
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const stored = window.localStorage.getItem(PREFS_KEY);
      if (!stored) return initial;
      const parsed = JSON.parse(stored);
      return {
        stopId: parsed?.stopId ?? initial.stopId,
        alertLead: parsed?.alertLead ?? initial.alertLead,
      };
    } catch (error) {
      console.warn('Failed to read preferences', error);
      return initial;
    }
  });

  useEffect(() => {
    if (defaultStopId && !prefs.stopId) {
      setPrefs((prev) => ({ ...prev, stopId: defaultStopId }));
    }
  }, [defaultStopId, prefs.stopId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ stopId: prefs.stopId, alertLead: prefs.alertLead })
    );
  }, [prefs]);

  const setSelectedStopId = (stopId) => setPrefs((prev) => ({ ...prev, stopId }));
  const setPreferredLead = (alertLead) => setPrefs((prev) => ({ ...prev, alertLead }));

  return {
    selectedStopId: prefs.stopId,
    setSelectedStopId,
    preferredLead: prefs.alertLead,
    setPreferredLead,
  };
}

function AppShell() {
  const {
    arrivals,
    lastUpdatedLabel,
    liveVehicles,
    mode,
    serviceState,
    status,
    stops,
    stopsById,
    refreshLive,
  } = useTrolleyData();

  const defaultStopId = stops[0]?.id;
  const { selectedStopId, setSelectedStopId, preferredLead, setPreferredLead } = usePreferences(defaultStopId);
  const [manualSelection, setManualSelection] = useState(false);
  const [nearestStopId, setNearestStopId] = useState(selectedStopId ?? defaultStopId);
  const [geoStatus, setGeoStatus] = useState('pending');
  const [geoRequested, setGeoRequested] = useState(false);

  useEffect(() => {
    if (!defaultStopId || selectedStopId) return;
    setSelectedStopId(defaultStopId);
  }, [defaultStopId, selectedStopId, setSelectedStopId]);

  useEffect(() => {
    if (!nearestStopId && defaultStopId) {
      setNearestStopId(defaultStopId);
    }
  }, [defaultStopId, nearestStopId]);

  useEffect(() => {
    if (!stops.length || geoRequested) return;
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGeoStatus('denied');
      setGeoRequested(true);
      return;
    }
    setGeoRequested(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const nearest = findNearestStop(coords, stops);
        if (nearest?.id) {
          setNearestStopId(nearest.id);
          if (!manualSelection) {
            setSelectedStopId(nearest.id);
          }
        }
        setGeoStatus('granted');
      },
      () => {
        setGeoStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60_000 }
    );
  }, [geoRequested, manualSelection, setSelectedStopId, stops]);

  const handleSelectStop = (stopId) => {
    if (!stopId) return;
    setManualSelection(true);
    setSelectedStopId(stopId);
    if (geoStatus !== 'granted') {
      setNearestStopId(stopId);
    }
  };

  const selectedStop = selectedStopId ? stopsById[selectedStopId] : null;
  const nearestStop = nearestStopId ? stopsById[nearestStopId] : null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Panther Trolley Tracker</h1>
          <p className="text-sm text-slate-600">
            Live trolley positions, arrivals, and schedule fallback so you never miss a ride.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshLive}
          className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:outline-none focus-visible:ring focus-visible:ring-slate-500/60"
        >
          Refresh now
        </button>
      </header>

      <main className="mx-auto mt-6 flex w-full max-w-6xl flex-col gap-6">
        <ServiceBanner state={serviceState} status={status} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <ErrorBoundary
              fallback={({ reset }) => (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800" role="alert">
                  <p className="font-semibold">The map isn&apos;t available right now.</p>
                  <p className="mt-1 text-xs text-rose-700">Try reloading to continue tracking the trolley.</p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 inline-flex h-12 items-center justify-center rounded-md bg-rose-600 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-rose-500/60"
                  >
                    Reload map
                  </button>
                </div>
              )}
            >
              <MapView
                vehicles={liveVehicles}
                arrivals={arrivals}
                selectedStopId={selectedStopId}
                onSelectStop={handleSelectStop}
                mode={mode}
                lastUpdatedLabel={lastUpdatedLabel}
              />
            </ErrorBoundary>
          </div>

          <div className="space-y-4">
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <header className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Stop focus</h2>
                  {nearestStop ? (
                    <p className="text-xs text-slate-500">Nearest stop: {nearestStop.label}</p>
                  ) : null}
                </div>
                {selectedStop && (
                  <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700">
                    {selectedStop.label}
                  </span>
                )}
              </header>
              <p className="text-sm text-slate-600">
                {geoStatus === 'granted'
                  ? 'We matched your nearest stop automatically. Use the picker if you want to jump somewhere else.'
                  : 'Location access is off. Pick the stop you want to follow.'}
              </p>
              <label className="block text-sm font-medium text-slate-700" htmlFor="stop-picker">
                Change stop
              </label>
              <select
                id="stop-picker"
                value={selectedStopId ?? ''}
                onChange={(event) => handleSelectStop(event.target.value)}
                className="mt-2 block h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring focus:ring-slate-500/40"
              >
                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.label}
                  </option>
                ))}
              </select>
              {geoStatus === 'pending' && <p className="text-xs text-slate-500">Locating you…</p>}
              {geoStatus === 'denied' && (
                <p className="text-xs text-amber-700">We couldn&apos;t access your location. Manual selection stays on.</p>
              )}
            </section>

            <StopsList
              stops={stops}
              arrivals={arrivals}
              selectedStopId={selectedStopId}
              onSelectStop={handleSelectStop}
              nearestStopId={nearestStopId}
            />

            <AlertControls
              arrivals={arrivals}
              selectedStopId={selectedStopId}
              stopsById={stopsById}
              preferredLead={preferredLead}
              onPreferredLeadChange={setPreferredLead}
              serviceState={serviceState}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TrolleyDataProvider>
      <AppShell />
    </TrolleyDataProvider>
  );
}
