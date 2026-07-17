/**
 * The exact Phase 1 program (16 weeks) transcribed from
 * "NAVIN FINAL PHASE 1 - RYAN REYNOLDS AESTHETIC PROGRAM".
 *
 * Each exercise maps to a primary muscle (100% of its volume) and optional
 * secondary muscles (weighted, see SECONDARY_VOLUME_WEIGHT). The muscle
 * dashboard uses this map to attribute training volume.
 *
 * Days: Monday/Pull, Tuesday/Push, Wednesday/Legs+Abs, Friday/RR Specialization,
 * Saturday/Lower+Abs. (Thursday & Sunday are rest.)
 */

/** @type {{key:string,label:string,focus:string}[]} */
export const TRAINING_DAYS = [
  { key: 'monday', label: 'Monday', focus: 'Pull — V-Taper Day' },
  { key: 'tuesday', label: 'Tuesday', focus: 'Push — Upper Chest + Shoulders' },
  { key: 'wednesday', label: 'Wednesday', focus: 'Legs + Abs' },
  { key: 'friday', label: 'Friday', focus: 'Ryan Reynolds Specialization' },
  { key: 'saturday', label: 'Saturday', focus: 'Lower + Abs' },
];

/**
 * The weekly program as a Day 1–7 schedule, including the two rest days
 * (Thursday & Sunday from the plan). `dayKey` links a training day to its
 * exercises; rest days have dayKey = null.
 * @type {{day:number,dayKey:string|null,type:'train'|'rest',title:string,focus:string}[]}
 */
export const SCHEDULE = [
  { day: 1, dayKey: 'monday', type: 'train', title: 'Pull', focus: 'V-Taper Day' },
  { day: 2, dayKey: 'tuesday', type: 'train', title: 'Push', focus: 'Upper Chest + Shoulders' },
  { day: 3, dayKey: 'wednesday', type: 'train', title: 'Legs + Abs', focus: 'Quads / Hams / Calves' },
  { day: 4, dayKey: null, type: 'rest', title: 'Rest', focus: '30 min walk + mobility' },
  { day: 5, dayKey: 'friday', type: 'train', title: 'RR Specialization', focus: 'Delts / Chest / Arms' },
  { day: 6, dayKey: 'saturday', type: 'train', title: 'Lower + Abs', focus: 'Glutes / Hams / Core' },
  { day: 7, dayKey: null, type: 'rest', title: 'Rest', focus: 'Recovery, walking, meal prep' },
];

/**
 * @typedef {Object} ExerciseTemplate
 * @property {string} id            stable slug
 * @property {string} name
 * @property {string} day           one of TRAINING_DAYS keys
 * @property {number} order         position within the day
 * @property {string} cue           setup / form cue from the program
 * @property {string} primaryMuscle
 * @property {string[]} secondaryMuscles
 * @property {number} targetSets
 * @property {[number, number]} repRange
 */

/** @type {ExerciseTemplate[]} */
export const EXERCISES = [
  // ── MONDAY · PULL (V-Taper) ──────────────────────────────────────────────
  { id: 'assisted-pull-up', name: 'Assisted Pull-Up', day: 'monday', order: 1, cue: 'Neutral Handles', primaryMuscle: 'Lats', secondaryMuscles: ['Biceps'], targetSets: 4, repRange: [8, 12] },
  { id: 'chest-supported-row', name: 'Chest Supported Row', day: 'monday', order: 2, cue: 'Neutral Grip', primaryMuscle: 'Lats', secondaryMuscles: ['Rear Delts', 'Traps'], targetSets: 4, repRange: [8, 12] },
  { id: 'single-arm-lat-pulldown', name: 'Single Arm Cable Lat Pulldown', day: 'monday', order: 3, cue: 'D Handle — lower lats', primaryMuscle: 'Lats', secondaryMuscles: ['Biceps'], targetSets: 3, repRange: [10, 12] },
  { id: 'face-pull', name: 'Face Pull', day: 'monday', order: 4, cue: 'Rope attachment', primaryMuscle: 'Rear Delts', secondaryMuscles: ['Traps'], targetSets: 3, repRange: [15, 20] },
  { id: 'incline-db-curl', name: 'Incline DB Curl', day: 'monday', order: 5, cue: '45° bench', primaryMuscle: 'Biceps', secondaryMuscles: [], targetSets: 3, repRange: [10, 12] },
  { id: 'hammer-curl', name: 'Hammer Curl', day: 'monday', order: 6, cue: 'Brachialis / forearms', primaryMuscle: 'Biceps', secondaryMuscles: [], targetSets: 3, repRange: [10, 12] },

  // ── TUESDAY · PUSH (Upper Chest + Shoulders) ─────────────────────────────
  { id: 'incline-db-press', name: 'Incline DB Press', day: 'tuesday', order: 1, cue: '30° bench', primaryMuscle: 'Upper Chest', secondaryMuscles: ['Triceps'], targetSets: 4, repRange: [8, 12] },
  { id: 'low-to-high-cable-fly', name: 'Low-to-High Cable Fly', day: 'tuesday', order: 2, cue: 'Squeeze up & in', primaryMuscle: 'Upper Chest', secondaryMuscles: [], targetSets: 3, repRange: [12, 15] },
  { id: 'pec-deck-fly', name: 'Pec Deck Fly', day: 'tuesday', order: 3, cue: 'Mid chest', primaryMuscle: 'Upper Chest', secondaryMuscles: [], targetSets: 3, repRange: [12, 15] },
  { id: 'machine-lateral-raise', name: 'Machine Lateral Raise', day: 'tuesday', order: 4, cue: 'Constant tension', primaryMuscle: 'Side Delts', secondaryMuscles: [], targetSets: 4, repRange: [15, 20] },
  { id: 'smith-shoulder-press', name: 'Smith Shoulder Press', day: 'tuesday', order: 5, cue: 'Seated', primaryMuscle: 'Side Delts', secondaryMuscles: ['Triceps'], targetSets: 3, repRange: [8, 10] },
  { id: 'rope-pushdown', name: 'Rope Pushdown', day: 'tuesday', order: 6, cue: 'Full lockout', primaryMuscle: 'Triceps', secondaryMuscles: [], targetSets: 3, repRange: [12, 15] },

  // ── WEDNESDAY · LEGS + ABS ───────────────────────────────────────────────
  { id: 'smith-squat', name: 'Smith Squat', day: 'wednesday', order: 1, cue: 'Feet slightly forward', primaryMuscle: 'Quads', secondaryMuscles: ['Glutes'], targetSets: 4, repRange: [8, 12] },
  { id: 'leg-press', name: 'Leg Press', day: 'wednesday', order: 2, cue: 'Mid-low foot placement', primaryMuscle: 'Quads', secondaryMuscles: ['Glutes'], targetSets: 4, repRange: [10, 15] },
  { id: 'leg-extension', name: 'Leg Extension', day: 'wednesday', order: 3, cue: 'Pause at top', primaryMuscle: 'Quads', secondaryMuscles: [], targetSets: 3, repRange: [12, 15] },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', day: 'wednesday', order: 4, cue: 'Controlled negative', primaryMuscle: 'Hamstrings', secondaryMuscles: [], targetSets: 3, repRange: [12, 15] },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', day: 'wednesday', order: 5, cue: 'DB — hip hinge', primaryMuscle: 'Hamstrings', secondaryMuscles: ['Glutes'], targetSets: 3, repRange: [8, 12] },
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', day: 'wednesday', order: 6, cue: 'Full stretch', primaryMuscle: 'Calves', secondaryMuscles: [], targetSets: 4, repRange: [15, 20] },
  { id: 'cable-crunch-wed', name: 'Cable Crunch', day: 'wednesday', order: 7, cue: 'Crunch the ribs down', primaryMuscle: 'Abs', secondaryMuscles: [], targetSets: 3, repRange: [15, 20] },

  // ── FRIDAY · RYAN REYNOLDS SPECIALIZATION ────────────────────────────────
  { id: 'incline-smith-press', name: 'Incline Smith Press', day: 'friday', order: 1, cue: '30°', primaryMuscle: 'Upper Chest', secondaryMuscles: ['Triceps'], targetSets: 3, repRange: [8, 12] },
  { id: 'incline-cable-fly', name: 'Incline Cable Fly', day: 'friday', order: 2, cue: 'Upper chest', primaryMuscle: 'Upper Chest', secondaryMuscles: [], targetSets: 3, repRange: [12, 15] },
  { id: 'lean-away-lateral-raise', name: 'Lean Away DB Lateral Raise', day: 'friday', order: 3, cue: 'Lean away from pulley', primaryMuscle: 'Side Delts', secondaryMuscles: [], targetSets: 4, repRange: [15, 20] },
  { id: 'cable-y-raise', name: 'Cable Y Raise', day: 'friday', order: 4, cue: 'Rear delts / traps', primaryMuscle: 'Rear Delts', secondaryMuscles: ['Traps'], targetSets: 3, repRange: [15, 20] },
  { id: 'overhead-cable-lateral-raise', name: 'Overhead Cable Lateral Raise', day: 'friday', order: 5, cue: 'Peak contraction', primaryMuscle: 'Side Delts', secondaryMuscles: [], targetSets: 3, repRange: [15, 20] },
  { id: 'ez-bar-curl', name: 'EZ Bar Curl', day: 'friday', order: 6, cue: 'No swing', primaryMuscle: 'Biceps', secondaryMuscles: [], targetSets: 3, repRange: [10, 12] },
  { id: 'overhead-rope-extension', name: 'Overhead Rope Extension', day: 'friday', order: 7, cue: 'Long head stretch', primaryMuscle: 'Triceps', secondaryMuscles: [], targetSets: 3, repRange: [12, 15] },
  { id: 'machine-shrug', name: 'Machine Shrug', day: 'friday', order: 8, cue: 'Machine or DB', primaryMuscle: 'Traps', secondaryMuscles: [], targetSets: 3, repRange: [12, 15] },

  // ── SATURDAY · LOWER + ABS ───────────────────────────────────────────────
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', day: 'saturday', order: 1, cue: 'Glutes / quads', primaryMuscle: 'Glutes', secondaryMuscles: ['Quads'], targetSets: 3, repRange: [10, 12] },
  { id: 'leg-press-wide', name: 'Leg Press (High Wide)', day: 'saturday', order: 2, cue: 'High wide feet', primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings'], targetSets: 3, repRange: [12, 15] },
  { id: 'seated-leg-curl-sat', name: 'Seated Leg Curl', day: 'saturday', order: 3, cue: 'Controlled negative', primaryMuscle: 'Hamstrings', secondaryMuscles: [], targetSets: 3, repRange: [12, 15] },
  { id: 'cable-crunch-sat', name: 'Cable Crunch', day: 'saturday', order: 4, cue: 'Crunch the ribs down', primaryMuscle: 'Abs', secondaryMuscles: [], targetSets: 3, repRange: [15, 20] },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', day: 'saturday', order: 5, cue: 'Lower abs — no swing', primaryMuscle: 'Abs', secondaryMuscles: [], targetSets: 3, repRange: [12, 15] },
  { id: 'leg-press-calf-raise', name: 'Leg Press Calf Raise', day: 'saturday', order: 6, cue: 'Full stretch', primaryMuscle: 'Calves', secondaryMuscles: [], targetSets: 4, repRange: [15, 20] },
];

// Program-level metadata (from the PDF).
export const PROGRAM = {
  name: 'Ryan Reynolds Aesthetic — Phase 1',
  durationWeeks: 16,
  deloadWeek: 9,
  priorities: ['Side Delts', 'Upper Chest', 'Lats', 'Rear Delts', 'Triceps', 'Biceps', 'Traps'],
  nonNegotiables: [
    'Protein 160g+ per day',
    'Sleep 7.5–8h',
    'Calories 2000–2200',
    'Creatine 5g/day (optional)',
    'Cardio after workouts',
  ],
  progressionRule:
    'When you hit the top of the rep range on all sets with clean form, increase weight next session.',
};

export const exerciseById = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
