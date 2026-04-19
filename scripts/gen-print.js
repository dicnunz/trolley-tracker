#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const mockDir = path.join(root, 'data', 'mock');
const outDir = path.join(root, 'public', 'print');
const markdownPath = path.join(outDir, 'service-board.md');
const jsonPath = path.join(outDir, 'service-board.json');

const readJson = async (name) => {
  const raw = await readFile(path.join(mockDir, name), 'utf8');
  return JSON.parse(raw);
};

const toClock = (isoValue) => {
  const value = Date.parse(isoValue);
  if (!Number.isFinite(value)) return 'Unknown';
  return new Date(value).toLocaleString();
};

async function main() {
  const [live, status, schedule] = await Promise.all([
    readJson('live-etas.json'),
    readJson('status.json'),
    readJson('schedule.json'),
  ]);

  const stops = Object.keys(schedule.stops ?? {});
  const summary = {
    generatedAt: new Date().toISOString(),
    liveUpdatedAt: live.updatedAt ?? null,
    statusUpdatedAt: status.updatedAt ?? null,
    statusMessage: status.message ?? 'No status message',
    incidents: status.incidents ?? [],
    stops: stops.map((stopId) => ({
      stopId,
      nextLiveEtas: (live.etas?.[stopId] ?? []).slice(0, 2).map((item) => item.etaMinutes),
      nextScheduledTimes: (schedule.stops?.[stopId] ?? []).slice(0, 3),
    })),
  };

  const lines = [
    '# Panther Trolley Service Board',
    '',
    `Generated: ${toClock(summary.generatedAt)}`,
    `Live feed updated: ${toClock(summary.liveUpdatedAt)}`,
    `Status feed updated: ${toClock(summary.statusUpdatedAt)}`,
    '',
    '## Service message',
    summary.statusMessage,
    '',
  ];

  if (summary.incidents.length) {
    lines.push('## Active incidents');
    for (const incident of summary.incidents) {
      lines.push(`- ${incident.title}: ${incident.detail}`);
    }
    lines.push('');
  }

  lines.push('## Stop snapshot');
  for (const stop of summary.stops) {
    const liveEtas = stop.nextLiveEtas.length ? stop.nextLiveEtas.map((v) => `${v} min`).join(', ') : 'No live ETAs';
    const scheduleTimes = stop.nextScheduledTimes.length ? stop.nextScheduledTimes.join(', ') : 'No schedule times';
    lines.push(`- ${stop.stopId}: live ${liveEtas}; schedule ${scheduleTimes}`);
  }
  lines.push('');

  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(markdownPath, lines.join('\n'), 'utf8'),
    writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8'),
  ]);

  console.log(`Wrote ${path.relative(root, markdownPath)}`);
  console.log(`Wrote ${path.relative(root, jsonPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
