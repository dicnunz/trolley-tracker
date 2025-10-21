const TIME_RE = /^(\d{1,2}):(\d{2})(?:\s?[AP]M)?$/i;

export function parseTimeToMinutes(label, prev = null) {
  if (!label || typeof label !== 'string') return null;
  const m = label.trim().match(TIME_RE);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  let minutes = hh * 60 + mm;
  if (/pm$/i.test(label) && hh < 12) {
    minutes += 12 * 60;
  } else if (/am$/i.test(label) && hh === 12) {
    minutes -= 12 * 60;
  }
  if (prev != null && minutes + 5 < prev) {
    // Assume schedule rolled forward in the afternoon.
    minutes += 12 * 60;
  }
  return minutes;
}

export function parseScheduleSeries(series) {
  const result = [];
  let prev = null;
  series.forEach((label) => {
    const minutes = parseTimeToMinutes(label, prev);
    if (minutes != null) {
      result.push({ label, minutes });
      prev = minutes;
    }
  });
  return result;
}

export function minutesUntil(targetMinutes, nowMinutes) {
  let diff = targetMinutes - nowMinutes;
  while (diff < 0) diff += 24 * 60;
  return diff;
}

export function formatRelativeMinutes(minutes) {
  if (minutes == null) return '—';
  if (minutes < 0.5) return 'arriving';
  if (minutes < 1.5) return 'in 1m';
  return `in ${Math.round(minutes)}m`;
}

export function formatClock(time) {
  const date = typeof time === 'number' ? new Date(time) : time ? new Date(time) : null;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
