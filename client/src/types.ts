// ── Domain types (mirror the server's domain/*.js) ──────────────────────────

// Muscle names and day keys are now user-defined data (custom muscles, dynamic
// program days), so these are open strings rather than fixed unions.
export type MuscleGroup = string;

export type DayKey = string; // the active program's schedule-day id

export interface ExerciseTemplate {
  id: string;
  name: string;
  day: DayKey; // schedule-day id it belongs to
  order: number;
  cue: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  targetSets: number;
  repRange: [number, number];
  active?: boolean; // false = soft-deleted (kept for history, not loggable)
}

export interface TrainingDay {
  key: DayKey;
  label: string;
  focus: string;
}

export interface ScheduleEntry {
  day: number; // 1–7
  dayKey: DayKey | null; // null on rest days
  type: 'train' | 'rest';
  title: string;
  focus: string;
}

export interface Program {
  name: string;
  durationWeeks: number;
  deloadWeek: number;
  priorities: string[];
  nonNegotiables: string[];
  progressionRule?: string;
}

/** A saved program/phase the user owns (for the phase switcher + editor). */
export interface ProgramMeta {
  id: string;
  name: string;
  isActive?: boolean;
  order?: number;
  durationWeeks: number;
  deloadWeek: number;
  startDate?: string | null;
  targetDate?: string | null;
  priorities?: string[];
  nonNegotiables?: string[];
}

export interface AppConfig {
  exercises: ExerciseTemplate[];
  trainingDays: TrainingDay[];
  schedule: ScheduleEntry[];
  muscleGroups: MuscleGroup[];
  physiqueMuscles: MuscleGroup[];
  secondaryVolumeWeight: number;
  program: Program;
}

// ── User data ────────────────────────────────────────────────────────────────

export interface Profile {
  name: string;
  age: number;
  height: number; // cm
  currentWeight: number; // kg
  goalWeight: number;
  currentWaist: number; // cm
  goalWaist: number;
  startDate: string; // YYYY-MM-DD
  targetDate: string;
  bodyFat: number; // %
  goalBodyFat: number;
  units: 'metric' | 'imperial';
}

export interface WorkoutLog {
  id: string;
  exerciseId: string;
  date: string;
  weight: number;
  reps: number;
  sets: number;
  volume: number;
  notes?: string;
}

export interface Measurement {
  id: string;
  date: string;
  weight: number;
  waist: number;
  neck: number;
  chest: number;
  arms: number;
  thighs: number;
  bodyFat: number;
}

export interface PhysiqueRating {
  id: string;
  date: string;
  ratings: Partial<Record<MuscleGroup, number>>;
}

export interface Photo {
  id: string;
  month: number;
  view: 'front' | 'side' | 'back';
  date: string;
  dataUrl: string;
  caption?: string;
}

export interface RestLog {
  id: string;
  date: string;
  day: number; // schedule day number (e.g. 4 or 7)
  minutes: number; // active minutes (walk / cardio)
  activities: string[]; // e.g. ['Walk', 'Mobility']
  notes?: string;
}

export interface Bootstrap {
  config: AppConfig;
  programs: ProgramMeta[];
  activeProgramId: string | null;
  profile: Profile;
  measurements: Measurement[];
  workouts: WorkoutLog[];
  physiqueRatings: PhysiqueRating[];
  photos: Photo[];
  restLogs: RestLog[];
}
