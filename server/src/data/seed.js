import crypto from 'node:crypto';
import { EXERCISES } from '../domain/exercises.js';

/**
 * Deterministic mock-data generator for demonstration.
 *
 * Simulates ~6.5 weeks of a 16-week cut: bodyweight & waist trending down,
 * lean mass measurements up, progressive overload on every lift, and two
 * physique self-assessments. Dates are fixed (not `Date.now()`) so the seed
 * is fully reproducible.
 */

const START = '2026-06-01'; // Monday — week 1, day 1
const WORKOUT_CUTOFF = '2026-07-16'; // last generated training session
const DURATION_WEEKS = 16;

// ── date helpers ────────────────────────────────────────────────────────────
const DAY_MS = 86_400_000;
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (dateStr, n) => iso(new Date(new Date(dateStr).getTime() + n * DAY_MS));
const weekOf = (dateStr) =>
  Math.floor((new Date(dateStr) - new Date(START)) / (7 * DAY_MS));

const DAY_INDEX_TO_KEY = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 5: 'friday', 6: 'saturday' };

// ── progressive-overload parameters per exercise ────────────────────────────
// w0 = week-1 working weight (kg), step = rounding increment, reps = base reps.
const SEED_PARAMS = {
  'assisted-pull-up': { w0: 45, step: 2.5, reps: 9 },
  'chest-supported-row': { w0: 40, step: 2.5, reps: 10 },
  'single-arm-lat-pulldown': { w0: 25, step: 2.5, reps: 11 },
  'face-pull': { w0: 20, step: 2.5, reps: 18 },
  'incline-db-curl': { w0: 12, step: 1, reps: 10 },
  'hammer-curl': { w0: 14, step: 1, reps: 10 },

  'incline-db-press': { w0: 26, step: 2, reps: 9 },
  'low-to-high-cable-fly': { w0: 12, step: 1, reps: 13 },
  'pec-deck-fly': { w0: 45, step: 2.5, reps: 13 },
  'machine-lateral-raise': { w0: 25, step: 2.5, reps: 16 },
  'smith-shoulder-press': { w0: 40, step: 2.5, reps: 9 },
  'rope-pushdown': { w0: 30, step: 2.5, reps: 13 },

  'smith-squat': { w0: 70, step: 5, reps: 9 },
  'leg-press': { w0: 140, step: 10, reps: 12 },
  'leg-extension': { w0: 55, step: 5, reps: 13 },
  'seated-leg-curl': { w0: 45, step: 2.5, reps: 13 },
  'romanian-deadlift': { w0: 24, step: 2, reps: 10 },
  'standing-calf-raise': { w0: 60, step: 5, reps: 16 },
  'cable-crunch-wed': { w0: 40, step: 2.5, reps: 17 },

  'incline-smith-press': { w0: 50, step: 2.5, reps: 9 },
  'incline-cable-fly': { w0: 12, step: 1, reps: 13 },
  'lean-away-lateral-raise': { w0: 10, step: 1, reps: 16 },
  'cable-y-raise': { w0: 9, step: 1, reps: 16 },
  'overhead-cable-lateral-raise': { w0: 7, step: 1, reps: 16 },
  'ez-bar-curl': { w0: 25, step: 2.5, reps: 10 },
  'overhead-rope-extension': { w0: 25, step: 2.5, reps: 13 },
  'machine-shrug': { w0: 60, step: 5, reps: 13 },

  'bulgarian-split-squat': { w0: 16, step: 2, reps: 10 },
  'leg-press-wide': { w0: 120, step: 10, reps: 13 },
  'seated-leg-curl-sat': { w0: 45, step: 2.5, reps: 13 },
  'cable-crunch-sat': { w0: 40, step: 2.5, reps: 17 },
  'hanging-leg-raise': { w0: 4, step: 2, reps: 12 },
  'leg-press-calf-raise': { w0: 120, step: 10, reps: 16 },
};

const roundToStep = (value, step) => Math.round(value / step) * step;

const SESSION_NOTES = [
  'Felt strong — great pump.',
  'Focused on slow eccentrics.',
  'Left side lagging slightly, added a rep.',
  'Deep stretch, mind-muscle dialled in.',
  'Energy a bit low but hit all sets.',
  'PR day — everything moved well.',
];

function buildWorkouts() {
  const byDay = EXERCISES.reduce((acc, ex) => {
    (acc[ex.day] ||= []).push(ex);
    return acc;
  }, {});

  const logs = [];
  let date = START;
  while (date <= WORKOUT_CUTOFF) {
    const dow = new Date(date).getDay();
    const dayKey = DAY_INDEX_TO_KEY[dow];
    if (dayKey) {
      const week = weekOf(date);
      const dayExercises = [...byDay[dayKey]].sort((a, b) => a.order - b.order);
      dayExercises.forEach((ex, i) => {
        const p = SEED_PARAMS[ex.id];
        const weight = roundToStep(p.w0 * (1 + 0.025 * week), p.step);
        const reps = Math.min(p.reps + Math.floor(week / 3), ex.repRange[1]);
        const sets = ex.targetSets;
        logs.push({
          id: crypto.randomUUID(),
          exerciseId: ex.id,
          date,
          weight,
          reps,
          sets,
          volume: weight * reps * sets,
          notes: i === 0 ? SESSION_NOTES[week % SESSION_NOTES.length] : '',
        });
      });
    }
    date = addDays(date, 1);
  }
  return logs;
}

function buildMeasurements() {
  const weight = [82.0, 81.2, 80.5, 79.9, 79.3, 78.7, 78.2];
  const waist = [92.0, 91.1, 90.2, 89.4, 88.6, 87.8, 87.0];
  const neck = [40.0, 40.1, 40.2, 40.3, 40.4, 40.5, 40.6];
  const chest = [104.0, 104.3, 104.7, 105.0, 105.3, 105.6, 106.0];
  const arms = [37.5, 37.8, 38.0, 38.2, 38.4, 38.6, 38.8];
  const thighs = [58.0, 58.3, 58.6, 58.8, 59.0, 59.2, 59.4];
  const bodyFat = [21.5, 20.8, 20.2, 19.6, 19.0, 18.4, 17.9];

  return weight.map((_, i) => ({
    id: crypto.randomUUID(),
    date: addDays(START, i * 7),
    weight: weight[i],
    waist: waist[i],
    neck: neck[i],
    chest: chest[i],
    arms: arms[i],
    thighs: thighs[i],
    bodyFat: bodyFat[i],
  }));
}

function buildPhysique() {
  const muscles = ['Side Delts', 'Upper Chest', 'Lats', 'Rear Delts', 'Triceps', 'Biceps', 'Traps', 'Abs'];
  const snapshots = [
    { date: addDays(START, 0), values: [5, 4, 5, 3, 6, 6, 4, 4] },
    { date: addDays(START, 28), values: [6, 5, 6, 4, 7, 7, 5, 5] },
    { date: addDays(START, 42), values: [7, 6, 7, 5, 7, 7, 6, 6] },
  ];
  return snapshots.map((s) => ({
    id: crypto.randomUUID(),
    date: s.date,
    ratings: Object.fromEntries(muscles.map((m, i) => [m, s.values[i]])),
  }));
}

// ── placeholder progress photos (self-contained SVG data URLs) ──────────────
// A clean, symmetric athletic silhouette that leans out / widens each month.
function photoDataUrl(month, view) {
  const cx = 200;
  const shoulderHalf = 74 + (month - 1) * 5; // wider delts over time
  const waistHalf = 44 - (month - 1) * 4; // tighter waist over time
  const hipHalf = 50 - (month - 1) * 2;
  const accent = { front: '#ef4444', side: '#f97316', back: '#3987e5' }[view];

  // Symmetric outline: neck → shoulders → taper to waist → hips → legs (with
  // an inner notch at the crotch so the two legs read as separate).
  const pts = [
    [cx - 15, 112], [cx - 20, 128],
    [cx - shoulderHalf, 156], [cx - shoulderHalf + 6, 182], // left delt
    [cx - waistHalf, 300], // left waist
    [cx - hipHalf, 336], // left hip
    [cx - hipHalf + 6, 452], [cx - hipHalf + 12, 542], // left leg outer
    [cx - 14, 542], [cx - 8, 360], // left leg inner → crotch
    [cx + 8, 360], [cx + 14, 542], // right leg inner
    [cx + hipHalf - 12, 542], [cx + hipHalf - 6, 452], // right leg outer
    [cx + hipHalf, 336], // right hip
    [cx + waistHalf, 300], // right waist
    [cx + shoulderHalf - 6, 182], [cx + shoulderHalf, 156], // right delt
    [cx + 20, 128], [cx + 15, 112],
  ];
  const polygon = pts.map((p) => `${p[0]},${p[1]}`).join(' ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="400" height="560">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#17181c"/><stop offset="1" stop-color="#0c0d10"/>
    </linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0.30"/>
    </linearGradient>
  </defs>
  <rect width="400" height="560" fill="url(#bg)"/>
  ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${70 * (i + 1)}" x2="400" y2="${70 * (i + 1)}" stroke="#ffffff" stroke-opacity="0.03"/>`).join('')}
  <circle cx="${cx}" cy="90" r="27" fill="url(#body)"/>
  <polygon points="${polygon}" fill="url(#body)" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5" stroke-linejoin="round"/>
  <text x="24" y="42" fill="#f5f6f7" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="22" font-weight="700">MONTH ${month}</text>
  <text x="24" y="66" fill="${accent}" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="14" font-weight="600" letter-spacing="2">${view.toUpperCase()}</text>
  <text x="376" y="540" text-anchor="end" fill="#6b7079" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="11">placeholder</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function buildPhotos() {
  const photos = [];
  for (const month of [1, 2]) {
    for (const view of ['front', 'side', 'back']) {
      photos.push({
        id: crypto.randomUUID(),
        month,
        view,
        date: addDays(START, (month - 1) * 28),
        dataUrl: photoDataUrl(month, view),
        caption: `Month ${month} — ${view}`,
      });
    }
  }
  return photos;
}

export function buildSeed() {
  return {
    profile: {
      name: 'Navin',
      age: 31,
      height: 176, // cm
      currentWeight: 78.2, // kg — mirrors the latest measurement
      goalWeight: 73,
      currentWaist: 87.0, // cm
      goalWaist: 79,
      startDate: START,
      targetDate: addDays(START, DURATION_WEEKS * 7),
      bodyFat: 17.9,
      goalBodyFat: 11,
      units: 'metric',
    },
    measurements: buildMeasurements(),
    workouts: buildWorkouts(),
    physiqueRatings: buildPhysique(),
    photos: buildPhotos(),
    restLogs: [],
  };
}
