/**
 * Built-in "Phase 0" starter template — an 8-week beginner on-ramp that
 * precedes the Phase 1 RR program. Offered in the Program Editor via
 * "Copy Phase 0 template" (any user), seeded through importProgram(), so it
 * uses the same JSON spec shape as a user import.
 *
 * Goal: build technique, tendon strength, mind-muscle connection, and prepare
 * for Phase 1. Split: Upper / Lower / Rest / Upper / Lower / Rest / Rest.
 * Progression: when all sets hit the top of the rep range with clean technique,
 * add the smallest increment next session.
 *
 * Graduation to Phase 1: 6+ weeks consistent · all Phase 1 lifts with clean
 * technique · assisted pull-ups with less assistance · understands progressive
 * overload · no persistent joint pain · ready for 5 days/week.
 */
export const PHASE0_TEMPLATE = {
  name: 'Ryan Reynolds Aesthetic — Phase 0',
  durationWeeks: 8,
  priorities: [],
  nonNegotiables: [],
  days: [
    {
      title: 'Upper A',
      focus: 'Technique + Push/Pull Balance',
      type: 'train',
      exercises: [
        { name: 'Machine Chest Press', primaryMuscle: 'Chest', sets: 3, reps: '10-12', cue: 'Slow lowering, slight pause, controlled press' },
        { name: 'Neutral Grip Lat Pulldown', primaryMuscle: 'Lats', sets: 3, reps: '10-12', cue: 'Pull elbows toward hips' },
        { name: 'Chest Supported Row', primaryMuscle: 'Mid Back', sets: 3, reps: '10-12', cue: 'Squeeze shoulder blades' },
        { name: 'Machine Lateral Raise', primaryMuscle: 'Side Delts', sets: 3, reps: '12-15', cue: 'Control both directions' },
        { name: 'Cable Rope Pushdown', primaryMuscle: 'Triceps', sets: 2, reps: '12-15', cue: 'Full elbow extension' },
        { name: 'Cable Curl', primaryMuscle: 'Biceps', sets: 2, reps: '12-15', cue: 'No body swing' },
      ],
    },
    {
      title: 'Lower A',
      focus: 'Leg Fundamentals',
      type: 'train',
      exercises: [
        { name: 'Leg Press', primaryMuscle: 'Quads', sets: 3, reps: '10-12', cue: 'Shoulder-width feet' },
        { name: 'Seated Leg Curl', primaryMuscle: 'Hamstrings', sets: 3, reps: '12-15', cue: 'Control lowering' },
        { name: 'Leg Extension', primaryMuscle: 'Quads', sets: 2, reps: '12-15', cue: 'Pause at top' },
        { name: 'Standing Calf Raise', primaryMuscle: 'Calves', sets: 3, reps: '15-20', cue: 'Full stretch' },
        { name: 'Cable Crunch', primaryMuscle: 'Abs', sets: 3, reps: '15-20', cue: 'Ribs toward pelvis' },
      ],
    },
    { title: 'Rest', type: 'rest', focus: 'Walking + Mobility', exercises: [] },
    {
      title: 'Upper B',
      focus: 'Upper Chest + Shoulders',
      type: 'train',
      exercises: [
        { name: 'Incline Machine Press', primaryMuscle: 'Upper Chest', sets: 3, reps: '10-12', cue: '30° incline' },
        { name: 'Assisted Pull-Up', primaryMuscle: 'Lats', sets: 3, reps: '8-10', cue: 'Neutral grip' },
        { name: 'Face Pull', primaryMuscle: 'Rear Delts', sets: 3, reps: '15-20', cue: 'Rope to forehead' },
        { name: 'Machine Lateral Raise', primaryMuscle: 'Side Delts', sets: 3, reps: '15-20', cue: 'Constant tension' },
        { name: 'Hammer Curl', primaryMuscle: 'Biceps', sets: 2, reps: '12-15', cue: 'Neutral grip' },
        { name: 'Overhead Rope Extension', primaryMuscle: 'Triceps', sets: 2, reps: '12-15', cue: 'Stretch long head' },
      ],
    },
    {
      title: 'Lower B',
      focus: 'Glutes + Posterior Chain',
      type: 'train',
      exercises: [
        { name: 'Smith Squat', primaryMuscle: 'Quads', sets: 3, reps: '10-12', cue: 'Feet slightly forward' },
        { name: 'Romanian Deadlift (DB)', primaryMuscle: 'Hamstrings', sets: 3, reps: '10-12', cue: 'Hip hinge' },
        { name: 'Walking Lunges', primaryMuscle: 'Glutes', sets: 2, reps: '12', cue: 'Controlled stride — 12 each leg' },
        { name: 'Standing Calf Raise', primaryMuscle: 'Calves', sets: 3, reps: '15-20', cue: 'Pause at stretch' },
        { name: 'Plank', primaryMuscle: 'Core', sets: 3, reps: '30-60 sec', cue: 'Neutral spine' },
      ],
    },
    { title: 'Rest', type: 'rest', focus: 'Walking + Stretching', exercises: [] },
    { title: 'Rest', type: 'rest', focus: 'Recovery', exercises: [] },
  ],
};
