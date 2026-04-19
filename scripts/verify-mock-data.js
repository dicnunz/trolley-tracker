#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const mockDir = path.join(root, 'data', 'mock');

const expectedStops = ['commons', 'wfit', 'miller', 'res', 'olin', 'pdh', 'cob', 'bridge'];

const readJson = async (name) => {
  const raw = await readFile(path.join(mockDir, name), 'utf8');
  return JSON.parse(raw);
};

const isIsoDate = (value) => Number.isFinite(Date.parse(value));

async function main() {
  const [live, status, schedule] = await Promise.all([
    readJson('live-etas.json'),
    readJson('status.json'),
    readJson('schedule.json'),
  ]);

  const failures = [];

  if (!isIsoDate(live.updatedAt)) failures.push('live-etas.json: `updatedAt` must be an ISO date string');
  if (!isIsoDate(status.updatedAt)) failures.push('status.json: `updatedAt` must be an ISO date string');
  if (!isIsoDate(schedule.generatedAt)) failures.push('schedule.json: `generatedAt` must be an ISO date string');

  for (const stopId of expectedStops) {
    const liveEtas = live.etas?.[stopId];
    const scheduleTimes = schedule.stops?.[stopId];

    if (!Array.isArray(liveEtas)) {
      failures.push(`live-etas.json: missing etas for stop "${stopId}"`);
    } else if (!liveEtas.every((item) => typeof item?.etaMinutes === 'number')) {
      failures.push(`live-etas.json: etas for stop "${stopId}" must include numeric etaMinutes`);
    }

    if (!Array.isArray(scheduleTimes)) {
      failures.push(`schedule.json: missing schedule for stop "${stopId}"`);
    } else if (!scheduleTimes.every((value) => typeof value === 'string' && /^\d{2}:\d{2}$/.test(value))) {
      failures.push(`schedule.json: schedule for stop "${stopId}" must be HH:MM strings`);
    }
  }

  if (failures.length) {
    console.error('Mock data validation failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Mock data validation passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
