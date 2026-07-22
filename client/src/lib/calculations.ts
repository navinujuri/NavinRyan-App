import type {
  AppConfig,
  ExerciseTemplate,
  Measurement,
  MuscleGroup,
  PhysiqueRating,
  Profile,
  WorkoutLog,
} from '../types';
import { daysBetween, todayISO, weekKey } from './format';

// ─────────────────────────────────────────────────────────────────────────────
// Program state (Section 1)
// ─────────────────────────────────────────────────────────────────────────────
export interface ProgramState {
  totalDays: number;
  daysCompleted: number;
  daysRemaining: number;
  progressPct: number;
  currentWeek: number;
  totalWeeks: number;
  phase: string;
  phaseHint: string;
  isDeload: boolean;
}

function phaseForWeek(week: number, deloadWeek: number, totalWeeks: number) {
  if (week === deloadWeek) return { phase: 'Deload', hint: 'Recover — sets −40%, load −10–15%' };
  if (week < deloadWeek) {
    return week <= 4
      ? { phase: 'Foundation', hint: 'Groove technique, build base volume' }
      : { phase: 'Accumulation', hint: 'Add load & volume week over week' };
  }
  return week <= totalWeeks - 3
    ? { phase: 'Intensification', hint: 'Push near-max effort on priorities' }
    : { phase: 'Peak / Reveal', hint: 'Sharpen, lean out, showcase the physique' };
}

export function programState(profile: Profile, program: AppConfig['program']): ProgramState {
  const today = todayISO();
  const totalDays = Math.max(1, daysBetween(profile.startDate, profile.targetDate));
  const totalWeeks = program.durationWeeks || Math.round(totalDays / 7);
  const elapsedRaw = daysBetween(profile.startDate, today);
  const daysCompleted = Math.max(0, Math.min(totalDays, elapsedRaw));
  const daysRemaining = Math.max(0, totalDays - daysCompleted);
  const progressPct = (daysCompleted / totalDays) * 100;
  const currentWeek = Math.max(1, Math.min(totalWeeks, Math.floor(daysCompleted / 7) + 1));
  const { phase, hint } = phaseForWeek(currentWeek, program.deloadWeek, totalWeeks);
  return {
    totalDays,
    daysCompleted,
    daysRemaining,
    progressPct,
    currentWeek,
    totalWeeks,
    phase,
    phaseHint: hint,
    isDeload: currentWeek === program.deloadWeek,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise progression (Sections 2 & 3)
// ─────────────────────────────────────────────────────────────────────────────
export interface Session {
  date: string;
  weight: number; // top-set weight that day
  reps: number; // reps at the top set
  sets: number; // total sets that day
  volume: number; // total volume that day
  notes?: string; // note from the top-set row that day
}

export interface ExerciseProgression {
  exercise: ExerciseTemplate;
  sessions: Session[];
  current: Session | null;
  previous: Session | null;
  weightDelta: number;
  repDelta: number;
  volumeDelta: number;
  improvementPct: number; // volume-based
  direction: 'up' | 'down' | 'flat' | 'new' | 'none';
}

/**
 * Normalized identity of a movement, derived from its display name. Exercises
 * that share this key — e.g. "Seated Leg Curl" programmed on two different days,
 * or the "Single Arm" / "Single-Arm" spelling variants — are treated as ONE
 * movement so their history, log-screen prefill and progression are unified.
 */
export function movementKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Every exercise id that shares a movement with `exercise` (including itself). */
export function movementExerciseIds(exercise: ExerciseTemplate, all: ExerciseTemplate[]): string[] {
  const key = movementKey(exercise.name);
  const ids = all.filter((e) => movementKey(e.name) === key).map((e) => e.id);
  return ids.length ? ids : [exercise.id];
}

/** Collapse workout rows into per-date sessions — for a single exercise id, or
 *  for the set of ids that make up one movement (unified history). */
export function sessionsFor(logs: WorkoutLog[], exerciseId: string | string[]): Session[] {
  const ids = Array.isArray(exerciseId) ? new Set(exerciseId) : new Set([exerciseId]);
  const byDate = new Map<string, Session>();
  for (const l of logs) {
    if (!ids.has(l.exerciseId)) continue;
    const g = byDate.get(l.date) || { date: l.date, weight: 0, reps: 0, sets: 0, volume: 0, notes: '' };
    g.volume += l.volume;
    g.sets += l.sets;
    if (l.weight > g.weight) {
      g.weight = l.weight;
      g.reps = l.reps;
      g.notes = l.notes ?? '';
    }
    if (!g.notes && l.notes) g.notes = l.notes;
    byDate.set(l.date, g);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function exerciseProgression(
  logs: WorkoutLog[],
  exercise: ExerciseTemplate,
  allExercises?: ExerciseTemplate[],
): ExerciseProgression {
  // When the full exercise list is supplied, unify history across every day
  // that programs the same movement; otherwise fall back to this row alone.
  const ids = allExercises ? movementExerciseIds(exercise, allExercises) : exercise.id;
  const sessions = sessionsFor(logs, ids);
  const current = sessions.at(-1) ?? null;
  const previous = sessions.length >= 2 ? sessions[sessions.length - 2] : null;

  if (!current) {
    return {
      exercise, sessions, current: null, previous: null,
      weightDelta: 0, repDelta: 0, volumeDelta: 0, improvementPct: 0, direction: 'none',
    };
  }
  if (!previous) {
    return {
      exercise, sessions, current, previous: null,
      weightDelta: 0, repDelta: 0, volumeDelta: 0, improvementPct: 0, direction: 'new',
    };
  }
  const weightDelta = current.weight - previous.weight;
  const repDelta = current.reps - previous.reps;
  const volumeDelta = current.volume - previous.volume;
  const improvementPct = previous.volume ? (volumeDelta / previous.volume) * 100 : 0;
  const direction = volumeDelta > 0 ? 'up' : volumeDelta < 0 ? 'down' : 'flat';
  return { exercise, sessions, current, previous, weightDelta, repDelta, volumeDelta, improvementPct, direction };
}

export function allProgressions(
  logs: WorkoutLog[],
  exercises: ExerciseTemplate[],
): ExerciseProgression[] {
  // One entry per exercise ROW, but each carries the unified movement history.
  // The day-scoped Progression view relies on the per-row `.day`; callers that
  // want one row per movement should pipe through dedupeByMovement().
  return exercises
    .map((e) => exerciseProgression(logs, e, exercises))
    .filter((p) => p.sessions.length > 0);
}

/** Keep one progression per movement (first occurrence wins). Use wherever a
 *  movement should be counted once — analytics, RR-progress, "all lifts" lists —
 *  rather than once per day it appears on. */
export function dedupeByMovement(progs: ExerciseProgression[]): ExerciseProgression[] {
  const seen = new Set<string>();
  return progs.filter((p) => {
    const k = movementKey(p.exercise.name);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Muscle volume attribution (Section 4)
// ─────────────────────────────────────────────────────────────────────────────
export interface WeekVolumes {
  weekKey: string;
  weekStart: string;
  volumes: Record<string, number>;
}

// kg-equivalent credited per bodyweight rep (a 12×3 leg raise ≈ a light cable-
// crunch set). Only used for muscle attribution below — stored volume and the
// progression charts keep using raw `volume`.
export const BODYWEIGHT_REP_UNIT = 20;

/** Volume credited to the muscle map / dashboard. Bodyweight sets (logged at 0
 *  load → volume 0) still trained the muscle, so credit reps × sets × the
 *  bodyweight unit instead of nothing. */
function effectiveVolume(l: WorkoutLog): number {
  return l.volume > 0 ? l.volume : l.reps * l.sets * BODYWEIGHT_REP_UNIT;
}

/** Attribute a single log's volume across primary + secondary muscles. */
function attribute(
  target: Record<string, number>,
  ex: ExerciseTemplate,
  volume: number,
  secondaryWeight: number,
) {
  target[ex.primaryMuscle] = (target[ex.primaryMuscle] || 0) + volume;
  for (const m of ex.secondaryMuscles) {
    target[m] = (target[m] || 0) + volume * secondaryWeight;
  }
}

export function muscleVolumeByWeek(logs: WorkoutLog[], config: AppConfig): WeekVolumes[] {
  const byId = new Map(config.exercises.map((e) => [e.id, e]));
  const weeks = new Map<string, WeekVolumes>();
  for (const l of logs) {
    const ex = byId.get(l.exerciseId);
    if (!ex) continue;
    const wk = weekKey(l.date);
    if (!weeks.has(wk)) weeks.set(wk, { weekKey: wk, weekStart: l.date, volumes: {} });
    const bucket = weeks.get(wk)!;
    if (l.date < bucket.weekStart) bucket.weekStart = l.date;
    attribute(bucket.volumes, ex, effectiveVolume(l), config.secondaryVolumeWeight);
  }
  return [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export interface MuscleSummary {
  muscle: MuscleGroup;
  current: number;
  previous: number;
  monthly: number;
  total: number;
  deltaPct: number;
}

export function muscleSummaries(logs: WorkoutLog[], config: AppConfig): MuscleSummary[] {
  const weekly = muscleVolumeByWeek(logs, config);
  const currentWk = weekly.at(-1)?.volumes ?? {};
  const prevWk = weekly.at(-2)?.volumes ?? {};
  const lastFour = weekly.slice(-4);

  const byId = new Map(config.exercises.map((e) => [e.id, e]));
  const total: Record<string, number> = {};
  for (const l of logs) {
    const ex = byId.get(l.exerciseId);
    if (ex) attribute(total, ex, effectiveVolume(l), config.secondaryVolumeWeight);
  }

  return config.muscleGroups.map((muscle) => {
    const current = currentWk[muscle] || 0;
    const previous = prevWk[muscle] || 0;
    const monthly = lastFour.reduce((s, w) => s + (w.volumes[muscle] || 0), 0);
    return {
      muscle,
      current,
      previous,
      monthly,
      total: total[muscle] || 0,
      deltaPct: previous ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0,
    };
  });
}

/** Weekly volume series for one muscle (for the trend chart). */
export function muscleTrend(logs: WorkoutLog[], config: AppConfig, muscle: MuscleGroup) {
  return muscleVolumeByWeek(logs, config).map((w) => ({
    label: w.weekStart,
    value: Math.round(w.volumes[muscle] || 0),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Physique ratings (Section 7)
// ─────────────────────────────────────────────────────────────────────────────
export function sortedPhysique(ratings: PhysiqueRating[]): PhysiqueRating[] {
  return [...ratings].sort((a, b) => a.date.localeCompare(b.date));
}

export function avgRating(r: PhysiqueRating | undefined, muscles: MuscleGroup[]): number {
  if (!r) return 0;
  const vals = muscles.map((m) => r.ratings[m] || 0);
  return vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Body-metric helpers (Sections 5 & 8)
// ─────────────────────────────────────────────────────────────────────────────
export function sortedMeasurements(m: Measurement[]): Measurement[] {
  return [...m].sort((a, b) => a.date.localeCompare(b.date));
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics (Section 8)
// ─────────────────────────────────────────────────────────────────────────────
export interface Analytics {
  strongest: { name: string; detail: string } | null;
  mostImproved: { name: string; detail: string } | null;
  mostTrained: { name: string; detail: string } | null;
  lagging: { name: string; detail: string } | null;
  weightLoss: number;
  estimatedGoalDate: string | null;
  weeklyLossRate: number;
}

export function analytics(
  logs: WorkoutLog[],
  measurements: Measurement[],
  profile: Profile,
  config: AppConfig,
): Analytics {
  const progs = dedupeByMovement(allProgressions(logs, config.exercises));

  // Strongest = heaviest current top-set weight.
  let strongest: Analytics['strongest'] = null;
  let heaviest = -1;
  for (const p of progs) {
    if (p.current && p.current.weight > heaviest) {
      heaviest = p.current.weight;
      strongest = { name: p.exercise.name, detail: `${p.current.weight} kg top set` };
    }
  }

  // Most improved = biggest first→latest volume gain %.
  let mostImproved: Analytics['mostImproved'] = null;
  let bestGain = -Infinity;
  for (const p of progs) {
    if (p.sessions.length < 2) continue;
    const first = p.sessions[0].volume;
    const last = p.sessions.at(-1)!.volume;
    if (first <= 0) continue;
    const gain = ((last - first) / first) * 100;
    if (gain > bestGain) {
      bestGain = gain;
      mostImproved = { name: p.exercise.name, detail: `+${Math.round(gain)}% volume` };
    }
  }

  // Most trained / lagging by all-time attributed volume.
  const summaries = muscleSummaries(logs, config).filter((s) => s.total > 0);
  const byVol = [...summaries].sort((a, b) => b.total - a.total);
  const mostTrained = byVol[0]
    ? { name: byVol[0].muscle, detail: `${Math.round(byVol[0].total).toLocaleString()} total volume` }
    : null;
  const lagging = byVol.at(-1)
    ? { name: byVol.at(-1)!.muscle, detail: `${Math.round(byVol.at(-1)!.total).toLocaleString()} total volume` }
    : null;

  // Weight loss + projection.
  const ms = sortedMeasurements(measurements);
  const startW = ms[0]?.weight ?? profile.currentWeight;
  const lastM = ms.at(-1);
  const currentW = lastM?.weight ?? profile.currentWeight;
  const weightLoss = startW - currentW;

  let weeklyLossRate = 0;
  let estimatedGoalDate: string | null = null;
  if (ms.length >= 2 && lastM) {
    const weeksElapsed = Math.max(1, daysBetween(ms[0].date, lastM.date) / 7);
    weeklyLossRate = (startW - currentW) / weeksElapsed;
    if (weeklyLossRate > 0.01 && currentW > profile.goalWeight) {
      const weeksToGoal = (currentW - profile.goalWeight) / weeklyLossRate;
      const est = new Date(`${lastM.date}T00:00:00`);
      est.setDate(est.getDate() + Math.round(weeksToGoal * 7));
      estimatedGoalDate = est.toISOString().slice(0, 10);
    }
  }

  return {
    strongest, mostImproved, mostTrained, lagging,
    weightLoss, estimatedGoalDate, weeklyLossRate,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ryan Reynolds Progress % (Section 12)
//   40% body-fat reduction · 30% strength · 30% physique ratings
// ─────────────────────────────────────────────────────────────────────────────
export interface RRProgress {
  total: number; // 0–100
  bodyFat: number; // 0–1
  strength: number; // 0–1
  physique: number; // 0–1
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function ryanReynoldsProgress(
  logs: WorkoutLog[],
  measurements: Measurement[],
  physique: PhysiqueRating[],
  profile: Profile,
  config: AppConfig,
): RRProgress {
  // Body-fat reduction progress.
  const ms = sortedMeasurements(measurements);
  const startBF = ms[0]?.bodyFat ?? profile.bodyFat;
  const currentBF = ms.at(-1)?.bodyFat ?? profile.bodyFat;
  const bfSpan = startBF - profile.goalBodyFat;
  const bodyFat = bfSpan > 0 ? clamp01((startBF - currentBF) / bfSpan) : 0;

  // Strength progress: mean first→latest volume gain, 30% gain = 100%.
  const progs = dedupeByMovement(allProgressions(logs, config.exercises)).filter((p) => p.sessions.length >= 2);
  const gains = progs
    .map((p) => {
      const first = p.sessions[0].volume;
      const last = p.sessions.at(-1)!.volume;
      return first > 0 ? (last - first) / first : 0;
    })
    .filter((g) => Number.isFinite(g));
  const avgGain = gains.length ? gains.reduce((s, g) => s + g, 0) / gains.length : 0;
  const strength = clamp01(avgGain / 0.3);

  // Physique progress: first→latest average rating toward a target of 9/10.
  const sorted = sortedPhysique(physique);
  const first = avgRating(sorted[0], config.physiqueMuscles);
  const latest = avgRating(sorted.at(-1), config.physiqueMuscles);
  const baseline = sorted.length >= 2 ? first : 5;
  const physiqueProg = 9 - baseline > 0 ? clamp01((latest - baseline) / (9 - baseline)) : clamp01(latest / 9);

  const total = (0.4 * bodyFat + 0.3 * strength + 0.3 * physiqueProg) * 100;
  return { total, bodyFat, strength, physique: physiqueProg };
}
