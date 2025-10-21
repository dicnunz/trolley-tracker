import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLiveETAs, getScheduleEstimate, getStatus } from './data';
import { STOPS } from './route';
import { formatClock, minutesUntil, parseScheduleSeries } from './time';

const TrolleyDataContext = createContext(null);

const STALE_AFTER_MS = Number(import.meta.env.VITE_LIVE_STALE_MS ?? 45_000);
const DEFAULT_SERVICE_STATE = (import.meta.env.VITE_SERVICE_DEFAULT_STATE ?? 'on').toLowerCase();
const SERVICE_STATES = new Set(['on', 'off', 'limited']);

const STOPS_BY_ID = STOPS.reduce((acc, stop) => {
  acc[stop.id] = stop;
  return acc;
}, {});

function getServiceState(status) {
  const candidate = (status?.state ?? status?.service ?? DEFAULT_SERVICE_STATE)?.toString().toLowerCase();
  return SERVICE_STATES.has(candidate) ? candidate : DEFAULT_SERVICE_STATE;
}

function computeArrivals({
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

export function TrolleyDataProvider({ children }) {
  const [liveState, setLiveState] = useState({ status: 'idle', data: null, fetchedAt: null });
  const [scheduleState, setScheduleState] = useState({ status: 'idle', data: null, fetchedAt: null });
  const [statusState, setStatusState] = useState({ status: 'idle', data: null, fetchedAt: null });
  const [clock, setClock] = useState(() => Date.now());

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

  const isLiveFresh = useMemo(() => {
    if (liveState.status !== 'success') return false;
    const updatedAt = liveState.data?.updatedAt;
    const updatedMs = updatedAt ? Date.parse(updatedAt) : null;
    const hasArrivals = liveState.data?.etas && Object.values(liveState.data.etas).some((list) => list?.length);
    if (!hasArrivals) return false;
    if (updatedMs && Number.isFinite(updatedMs)) {
      return clock - updatedMs <= STALE_AFTER_MS;
    }
    if (liveState.fetchedAt) {
      return clock - liveState.fetchedAt <= STALE_AFTER_MS;
    }
    return false;
  }, [clock, liveState]);

  const mode = isLiveFresh ? 'live' : 'schedule';

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
    [arrivals, lastUpdated, mode, refreshLive, scheduleState.data, serviceState, statusState.data, liveState.data]
  );

  return <TrolleyDataContext.Provider value={contextValue}>{children}</TrolleyDataContext.Provider>;
}

export function useTrolleyData() {
  const context = useContext(TrolleyDataContext);
  if (!context) throw new Error('useTrolleyData must be used within a TrolleyDataProvider');
  return context;
}
