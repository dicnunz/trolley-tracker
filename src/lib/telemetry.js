const counters = {};
const TELEMETRY_URL = import.meta.env?.VITE_TELEMETRY_URL;

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return undefined;
  }
}

export function recordTelemetry(event, payload = undefined) {
  if (!event) return;
  counters[event] = (counters[event] ?? 0) + 1;
  const count = counters[event];
  if (payload !== undefined) {
    console.info(`[telemetry] ${event} #${count}`, payload);
  } else {
    console.info(`[telemetry] ${event} #${count}`);
  }
  if (!TELEMETRY_URL || typeof fetch !== 'function') return;
  const body = safeStringify({
    event,
    count,
    payload,
    timestamp: Date.now(),
  });
  if (!body) return;
  try {
    fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch((error) => {
      console.warn('[telemetry] POST failed', error);
    });
  } catch (error) {
    console.warn('[telemetry] POST failed', error);
  }
}

export function getTelemetryCounters() {
  return { ...counters };
}
