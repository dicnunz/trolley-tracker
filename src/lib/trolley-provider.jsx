import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getLiveETAs, getScheduleEstimate, getStatus } from './data';
import { STOPS } from './route';
import { formatClock, minutesUntil, parseScheduleSeries } from './time';
import { recordTelemetry } from './telemetry';

const TrolleyDataContext = createContext(null);

const STALE_AFTER_MS = Number(import.meta.env.VITE_LIVE_STALE_MS ?? 45_000);
const DEFAULT_SERVICE_STATE = (import.meta.env.VITE_SERVICE_DEFAULT_STATE ?? 'on').toLowerCase();
const SERVICE_STATES = new Set(['on', 'off', 'limited']);

const STOPS_BY_ID = STOPS.reduce((acc, stop) => {
  acc[stop.id] = stop;
  return acc;
}, {});

const TEST_MODE_ENV = String(import.meta.env?.VITE_TEST_MODE ?? 'false').toLowerCase() === 'true';

function isTestMode() {
  if (typeof window !== 'undefined' && window.__TROLLEY_TEST_MODE === true) return true;
  return TEST_MODE_ENV;
}

export function getServiceState(status) {
  const candidate = (status?.state ?? status?.service ?? DEFAULT_SERVICE_STATE)?.toString().toLowerCase();
  return SERVICE_STATES.has(candidate) ? candidate : DEFAULT_SERVICE_STATE;
}

export function computeArrivals({
  mode,
  live,
  liveFetchedAt,
  scheduleSeries,
  clock,
}) {
  const nowDate = new Date(clock);
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes() + nowDate.getSeconds() / 60;
  const elapsedSinceLiveFetch = liveFetchedAt ? (clock - liveFetchedAt) / 60000 : 0;
  const arrivals = {};

  STOPS.forEach((stop) => {
    if (mode === 'live') {
      const entries = live?.etas?.[stop.id] ?? [];
      const times = entries
        .map((item) => (typeof item?.etaMinutes === 'number' ? Math.max(0, item.etaMinutes - elapsedSinceLiveFetch) : null))
        .filter((value) => value != null)
        .sort((a, b) => a - b);
      if (times.length) {
        arrivals[stop.id] = {
          source: 'live',
          sourceLabel: 'Live ETA',
          times,
        };
        return;
      }
    }

    const schedule = scheduleSeries?.[stop.id] ?? [];
    if (schedule.length) {
      const times = schedule
        .map(({ minutes, label }) => ({
          eta: minutesUntil(minutes, nowMinutes),
          label,
        }))
        .sort((a, b) => a.eta - b.eta);
      arrivals[stop.id] = {
        source: 'schedule',
        sourceLabel: 'Schedule estimate',
        times: times.map((item) => item.eta),
        labels: times.map((item) => item.label),
      };
      return;
    }

    arrivals[stop.id] = {
      source: mode,
      sourceLabel: mode === 'live' ? 'Live ETA' : 'Schedule estimate',
      times: [],
    };
  });

  return arrivals;
}

export function isLiveDataFresh({ liveState, clock, staleAfterMs }) {
  if (!liveState || liveState.status !== 'success') return false;
  const hasArrivals =
    liveState.data?.etas && Object.values(liveState.data.etas).some((list) => Array.isArray(list) && list.length > 0);
  if (!hasArrivals) return false;
  const updatedMs = liveState.data?.updatedAt ? Date.parse(liveState.data.updatedAt) : Number.NaN;
  if (Number.isFinite(updatedMs)) {
    return clock - updatedMs <= staleAfterMs;
  }
  if (liveState.fetchedAt) {
    return clock - liveState.fetchedAt <= staleAfterMs;
  }
  return false;
}

export function TrolleyDataProvider({ children }) {
  const [liveState, setLiveState] = useState({ status: 'idle', data: null, fetchedAt: null });
  const [scheduleState, setScheduleState] = useState({ status: 'idle', data: null, fetchedAt: null });
  const [statusState, setStatusState] = useState({ status: 'idle', data: null, fetchedAt: null });
  const [clock, setClock] = useState(() => Date.now());
  const prevModeRef = useRef(null);

  const scheduleSeries = useMemo(() => {
    if (!scheduleState.data?.stops) return null;
    const map = {};
    Object.entries(scheduleState.data.stops).forEach(([stopId, series]) => {
      map[stopId] = parseScheduleSeries(series ?? []);
    });
    return map;
  }, [scheduleState.data]);

  const refreshLive = useCallback(async () => {
    try {
      const data = await getLiveETAs();
      setLiveState({ status: 'success', data, fetchedAt: Date.now() });
    } catch (error) {
      console.error('Failed to load live ETAs', error);
      recordTelemetry('live_eta_error', { message: error?.message });
      setLiveState({ status: 'error', data: null, error, fetchedAt: Date.now() });
    }
  }, []);

  const refreshSchedule = useCallback(async () => {
    try {
      const data = await getScheduleEstimate();
      setScheduleState({ status: 'success', data, fetchedAt: Date.now() });
    } catch (error) {
      console.error('Failed to load schedule data', error);
      setScheduleState({ status: 'error', data: null, error, fetchedAt: Date.now() });
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await getStatus();
      setStatusState({ status: 'success', data, fetchedAt: Date.now() });
    } catch (error) {
      console.error('Failed to load service status', error);
      setStatusState({ status: 'error', data: null, error, fetchedAt: Date.now() });
    }
  }, []);

  useEffect(() => {
    refreshLive();
    const id = setInterval(refreshLive, 30_000);
    return () => clearInterval(id);
  }, [refreshLive]);

  useEffect(() => {
    refreshSchedule();
  }, [refreshSchedule]);

  useEffect(() => {
    refreshStatus();
    const id = setInterval(refreshStatus, 60_000);
    return () => clearInterval(id);
  }, [refreshStatus]);

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const isLiveFresh = useMemo(
    () => isLiveDataFresh({ liveState, clock, staleAfterMs: STALE_AFTER_MS }),
    [clock, liveState]
  );

  const mode = isLiveFresh ? 'live' : 'schedule';

  useEffect(() => {
    if (prevModeRef.current === 'live' && mode === 'schedule') {
      const reason = liveState.status === 'success' ? 'stale' : liveState.status;
      recordTelemetry('fallback_used', { reason });
    }
    prevModeRef.current = mode;
  }, [mode, liveState.status]);

  const arrivals = useMemo(
    () =>
      computeArrivals({
        mode,
        live: liveState.data,
        liveFetchedAt: liveState.fetchedAt,
        scheduleSeries,
        clock,
      }),
    [clock, liveState.data, liveState.fetchedAt, mode, scheduleSeries]
  );

  const lastUpdated =
    mode === 'live'
      ? liveState.data?.updatedAt ?? liveState.fetchedAt
      : scheduleState.data?.generatedAt ?? scheduleState.fetchedAt;
  const serviceState = getServiceState(statusState.data);

  const contextValue = useMemo(
    () => ({
      stops: STOPS,
      stopsById: STOPS_BY_ID,
      mode,
      arrivals,
      lastUpdated,
      lastUpdatedLabel: formatClock(lastUpdated),
      liveVehicles: liveState.data?.vehicles ?? [],
      liveUpdatedAt: liveState.data?.updatedAt,
      scheduleGeneratedAt: scheduleState.data?.generatedAt,
      refreshLive,
      isLiveFresh,
      status: statusState.data,
      serviceState,
      serviceUpdatedAt: statusState.data?.updatedAt,
    }),
    [
      arrivals,
      isLiveFresh,
      lastUpdated,
      mode,
      refreshLive,
      scheduleState.data,
      serviceState,
      statusState.data,
      liveState.data,
    ]
  );

  useEffect(() => {
    if (!isTestMode() || typeof window === 'undefined') return undefined;
    const hooks = {
      setServiceState(next) {
        if (!next) {
          setStatusState((prev) => ({
            ...prev,
            data: prev.data ? { ...prev.data, state: undefined } : prev.data,
          }));
          return;
        }
        const normalized = next.toString().toLowerCase();
        if (!SERVICE_STATES.has(normalized)) return;
        setStatusState((prev) => ({
          status: 'success',
          data: { ...(prev.data ?? {}), state: normalized },
          fetchedAt: Date.now(),
        }));
      },
      simulateLiveError() {
        setLiveState({ status: 'error', data: null, error: new Error('test live error'), fetchedAt: Date.now() });
      },
    };
    window.__trolleyTestHooks = hooks;
    return () => {
      if (window.__trolleyTestHooks === hooks) {
        delete window.__trolleyTestHooks;
      }
    };
  }, []);

  return <TrolleyDataContext.Provider value={contextValue}>{children}</TrolleyDataContext.Provider>;
}

export function useTrolleyData() {
  const context = useContext(TrolleyDataContext);
  if (!context) throw new Error('useTrolleyData must be used within a TrolleyDataProvider');
  return context;
}
