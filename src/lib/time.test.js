import { describe, expect, it } from 'vitest';
import { formatRelativeMinutes } from './time';

describe('formatRelativeMinutes', () => {
  it('returns em dash for nullish values', () => {
    expect(formatRelativeMinutes(null)).toBe('—');
    expect(formatRelativeMinutes(undefined)).toBe('—');
  });

  it('labels imminent arrivals as arriving', () => {
    expect(formatRelativeMinutes(0)).toBe('arriving');
    expect(formatRelativeMinutes(0.3)).toBe('arriving');
  });

  it('rounds to one minute when under 1.5 minutes', () => {
    expect(formatRelativeMinutes(0.8)).toBe('in 1m');
    expect(formatRelativeMinutes(1.49)).toBe('in 1m');
  });

  it('rounds to the nearest minute for longer waits', () => {
    expect(formatRelativeMinutes(2)).toBe('in 2m');
    expect(formatRelativeMinutes(4.6)).toBe('in 5m');
  });
});
