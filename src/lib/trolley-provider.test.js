import { describe, expect, it } from 'vitest';
import { parseScheduleSeries } from './time';
import { computeArrivals, isLiveDataFresh } from './trolley-provider.jsx';

describe('computeArrivals', () => {
  const baseClock = Date.parse('2024-03-01T12:00:00Z');

  it('prefers live ETAs when available', () => {
    const arrivals = computeArrivals({
      mode: 'live',
      live: {
        etas: {
          commons: [
            { etaMinutes: 4 },
            { etaMinutes: 10 },
          ],
        },
      },
      liveFetchedAt: baseClock,
      scheduleSeries: {
        commons: parseScheduleSeries(['12:05', '12:20']),
      },
      clock: baseClock,
    });
    expect(arrivals.commons.source).toBe('live');
    expect(arrivals.commons.times).toEqual([4, 10]);
  });

  it('falls back to schedule when live data is empty', () => {
    const arrivals = computeArrivals({
      mode: 'live',
      live: {
        etas: {
          commons: [],
        },
      },
      liveFetchedAt: baseClock,
      scheduleSeries: {
        commons: parseScheduleSeries(['12:05', '12:20']),
      },
      clock: baseClock,
    });
    expect(arrivals.commons.source).toBe('schedule');
    expect(arrivals.commons.times.map(Math.round)).toEqual([5, 20]);
  });
});

describe('isLiveDataFresh', () => {
  const now = Date.parse('2024-03-01T12:00:30Z');

  it('returns true for recent live data with arrivals', () => {
    const result = isLiveDataFresh({
      liveState: {
        status: 'success',
        data: {
          updatedAt: '2024-03-01T12:00:10Z',
          etas: { commons: [{ etaMinutes: 2 }] },
        },
        fetchedAt: now - 5000,
      },
      clock: now,
      staleAfterMs: 45_000,
    });
    expect(result).toBe(true);
  });

  it('rejects stale live data even if arrivals exist', () => {
    const result = isLiveDataFresh({
      liveState: {
        status: 'success',
        data: {
          updatedAt: '2024-03-01T11:58:00Z',
          etas: { commons: [{ etaMinutes: 2 }] },
        },
        fetchedAt: now - 120_000,
      },
      clock: now,
      staleAfterMs: 45_000,
    });
    expect(result).toBe(false);
  });
});
