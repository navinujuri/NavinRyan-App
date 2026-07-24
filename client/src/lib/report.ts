import type {
  AppConfig,
  Measurement,
  PhysiqueRating,
  Photo,
  Profile,
  RestLog,
  WorkoutLog,
} from '../types';
import {
  allProgressions,
  analytics,
  avgRating,
  dedupeByMovement,
  muscleSummaries,
  programState,
  ryanReynoldsProgress,
  sortedMeasurements,
  sortedPhysique,
} from './calculations';
import { fmt, fmtDateFull, fmtVolume } from './format';

export interface Bundle {
  profile: Profile;
  config: AppConfig;
  workouts: WorkoutLog[];
  measurements: Measurement[];
  physique: PhysiqueRating[];
  photos: Photo[];
  restLogs: RestLog[];
}

// ── Section 9 · EXPORT JSON ──────────────────────────────────────────────────
export function buildExport(b: Bundle): Record<string, unknown> {
  const muscleVolumes = muscleSummaries(b.workouts, b.config).map((s) => ({
    muscle: s.muscle,
    currentWeek: Math.round(s.current),
    previousWeek: Math.round(s.previous),
    monthly: Math.round(s.monthly),
    total: Math.round(s.total),
  }));

  return {
    _meta: {
      app: 'Ryan Reynolds Physique Tracker',
      program: b.config.program.name,
      exportedAt: new Date().toISOString(),
      version: 1,
    },
    profile: b.profile,
    measurements: b.measurements,
    workouts: b.workouts,
    muscleVolumes,
    physiqueRatings: b.physique,
    photos: b.photos,
    restLogs: b.restLogs,
  };
}

// ── Section 10 · CHATGPT COACHING REPORT ─────────────────────────────────────
export function buildReport(b: Bundle): string {
  const ms = sortedMeasurements(b.measurements);
  const first = ms[0];
  const last = ms.at(-1);
  const state = programState(b.profile, b.config.program);
  const a = analytics(b.workouts, b.measurements, b.profile, b.config);
  const rr = ryanReynoldsProgress(b.workouts, b.measurements, b.physique, b.profile, b.config);

  const weightChange = first && last ? last.weight - first.weight : 0;
  const waistChange = first && last ? last.waist - first.waist : 0;
  const bfChange = first && last ? last.bodyFat - first.bodyFat : 0;

  // Top improved exercises.
  const improved = dedupeByMovement(allProgressions(b.workouts, b.config.exercises))
    .filter((p) => p.sessions.length >= 2 && p.sessions[0].volume > 0)
    .map((p) => ({
      name: p.exercise.name,
      pct: ((p.sessions.at(-1)!.volume - p.sessions[0].volume) / p.sessions[0].volume) * 100,
    }))
    .sort((x, y) => y.pct - x.pct)
    .slice(0, 5);

  const summaries = muscleSummaries(b.workouts, b.config).filter((s) => s.total > 0);
  const topMuscles = [...summaries].sort((x, y) => y.total - x.total).slice(0, 5);

  // Last 30 days.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  const recent = b.workouts.filter((w) => w.date >= cutoffISO);
  const recentSessions = new Set(recent.map((w) => w.date)).size;
  const recentVolume = recent.reduce((s, w) => s + w.volume, 0);
  const recentWeight = ms.filter((m) => m.date >= cutoffISO);
  const recentWeightChange =
    recentWeight.length >= 2 ? recentWeight.at(-1)!.weight - recentWeight[0].weight : 0;

  const latestPhysique = sortedPhysique(b.physique).at(-1);
  const physiqueAvg = avgRating(latestPhysique, b.config.physiqueMuscles);

  const L: string[] = [];
  L.push('════════════════════════════════════════════');
  L.push('  RYAN REYNOLDS PHYSIQUE — COACHING REPORT');
  L.push('════════════════════════════════════════════');
  L.push(`Athlete: ${b.profile.name} (age ${b.profile.age}, ${b.profile.height} cm)`);
  L.push(`Program: ${b.config.program.name}`);
  L.push(`Timeline: Week ${state.currentWeek}/${state.totalWeeks} · ${state.phase} phase`);
  L.push(`  (${state.daysCompleted} days done, ${state.daysRemaining} remaining)`);
  L.push(`My Progress Score: ${Math.round(rr.total)}%`);
  L.push('');

  L.push('── CURRENT STATUS ──');
  L.push(`Current weight: ${fmt(last?.weight ?? b.profile.currentWeight)} kg (goal ${b.profile.goalWeight} kg)`);
  L.push(`Weight change: ${fmt(weightChange)} kg since start`);
  L.push(`Waist change: ${fmt(waistChange)} cm (now ${fmt(last?.waist ?? b.profile.currentWaist)} cm, goal ${b.profile.goalWaist} cm)`);
  L.push(`Body-fat change: ${fmt(bfChange)}% (now ${fmt(last?.bodyFat ?? b.profile.bodyFat)}%, goal ${b.profile.goalBodyFat}%)`);
  if (a.estimatedGoalDate) L.push(`Projected goal-weight date: ${fmtDateFull(a.estimatedGoalDate)} (~${fmt(a.weeklyLossRate, 2)} kg/week)`);
  L.push('');

  L.push('── TOP IMPROVED EXERCISES ──');
  if (improved.length) improved.forEach((e, i) => L.push(`${i + 1}. ${e.name} — +${Math.round(e.pct)}% volume`));
  else L.push('Not enough history yet.');
  L.push('');

  L.push('── TOP TRAINED MUSCLES ──');
  if (topMuscles.length) topMuscles.forEach((m, i) => L.push(`${i + 1}. ${m.muscle} — ${fmtVolume(m.total)} total volume`));
  else L.push('No volume logged yet.');
  L.push('');

  L.push('── CURRENT WEEKLY VOLUME PER MUSCLE ──');
  summaries
    .sort((x, y) => y.current - x.current)
    .forEach((m) => L.push(`${m.muscle.padEnd(13)} ${fmtVolume(m.current).padStart(7)}  (prev ${fmtVolume(m.previous)})`));
  L.push('');

  L.push('── LAST 30 DAYS ──');
  L.push(`Sessions logged: ${recentSessions}`);
  L.push(`Total volume: ${fmtVolume(recentVolume)}`);
  L.push(`Weight change: ${fmt(recentWeightChange)} kg`);
  if (latestPhysique) L.push(`Physique self-score: ${fmt(physiqueAvg, 1)}/10`);
  L.push('');

  L.push('── FOCUS / LAGGING ──');
  if (a.lagging) L.push(`Lagging muscle: ${a.lagging.name} (${a.lagging.detail}) — consider extra volume.`);
  L.push(`Priorities: ${b.config.program.priorities.join(', ')}.`);
  L.push('');

  L.push('════════════════════════════════════════════');
  L.push('Coach: based on the data above, please review my');
  L.push('progress, flag anything off-track, and suggest');
  L.push('adjustments to hit the Ryan Reynolds aesthetic.');
  L.push('════════════════════════════════════════════');

  return L.join('\n');
}

// ── download helper ──────────────────────────────────────────────────────────
export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
