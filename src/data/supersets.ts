import type { SsDef, SsExercise, SsMuscleGroup } from '../types';

export interface MuscleGroupMeta {
  label: string;
  emoji: string;
  description: string;
}

export const MUSCLE_GROUP_META: Record<SsMuscleGroup, MuscleGroupMeta> = {
  chest_back:       { label: 'Chest / Back',        emoji: '💪', description: 'Push & pull' },
  biceps_triceps:   { label: 'Biceps / Triceps',     emoji: '🦾', description: 'Arm flexors & extensors' },
  quads_hamstrings: { label: 'Quads / Hamstrings',   emoji: '🦵', description: 'Front & back of leg' },
  shoulders_traps:  { label: 'Shoulders / Traps',    emoji: '🏋️', description: 'Upper body push & pull' },
  core_glutes:      { label: 'Core / Glutes',        emoji: '🔥', description: 'Anterior & posterior chain' },
};

export const SS_MUSCLE_GROUPS: SsMuscleGroup[] = [
  'chest_back',
  'biceps_triceps',
  'quads_hamstrings',
  'shoulders_traps',
  'core_glutes',
];

/** Stable, deterministic ID from an exercise name */
export function ssExSlug(name: string): string {
  return 'ss-ex-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Internal registry — populated as def() is called, used to build BUILT_IN_EXERCISE_DB
const _exEntries = new Map<string, { name: string; muscleGroup: string }>(); // id → { name, muscleGroup }

function ex(name: string, muscleGroup: string): string {
  const id = ssExSlug(name);
  if (!_exEntries.has(id)) _exEntries.set(id, { name, muscleGroup }); // first-seen muscle group wins
  return id;
}

function def(
  id: string,
  name: string,
  muscleGroup: SsMuscleGroup,
  exerciseAName: string,
  exerciseBName: string,
): SsDef {
  return { id, name, muscleGroup, exerciseAId: ex(exerciseAName, muscleGroup), exerciseBId: ex(exerciseBName, muscleGroup), isCustom: false };
}

export const BUILT_IN_SS_DEFS: SsDef[] = [
  // ─── Chest / Back ──────────────────────────────────────────────────────────
  def('cb-01', 'Bench Press + Bent-Over Row',      'chest_back', 'Bench Press',           'Bent-Over Barbell Row'),
  def('cb-02', 'Push-Up + Pull-Up',                'chest_back', 'Push-Up',               'Pull-Up'),
  def('cb-03', 'Incline Press + Lat Pulldown',     'chest_back', 'Incline Dumbbell Press','Lat Pulldown'),
  def('cb-04', 'Cable Fly + Seated Cable Row',     'chest_back', 'Cable Fly',             'Seated Cable Row'),
  def('cb-05', 'Dumbbell Press + Face Pull',       'chest_back', 'Dumbbell Chest Press',  'Face Pull'),

  // ─── Biceps / Triceps ──────────────────────────────────────────────────────
  def('bt-01', 'Barbell Curl + Skull Crusher',     'biceps_triceps', 'Barbell Curl',            'Skull Crusher'),
  def('bt-02', 'Hammer Curl + Tricep Pushdown',    'biceps_triceps', 'Hammer Curl',             'Tricep Pushdown'),
  def('bt-03', 'Preacher Curl + Overhead Extension','biceps_triceps', 'Preacher Curl',          'Overhead Tricep Extension'),
  def('bt-04', 'Incline Curl + Dips',              'biceps_triceps', 'Incline Dumbbell Curl',   'Dips'),
  def('bt-05', 'Cable Curl + Rope Pushdown',       'biceps_triceps', 'Cable Curl',              'Rope Pushdown'),

  // ─── Quads / Hamstrings ────────────────────────────────────────────────────
  def('qh-01', 'Leg Press + Romanian Deadlift',    'quads_hamstrings', 'Leg Press',           'Romanian Deadlift'),
  def('qh-02', 'Squat + Lying Leg Curl',           'quads_hamstrings', 'Barbell Squat',       'Lying Leg Curl'),
  def('qh-03', 'Bulgarian Split Squat + Nordic Curl','quads_hamstrings','Bulgarian Split Squat','Nordic Hamstring Curl'),
  def('qh-04', 'Leg Extension + Leg Curl',         'quads_hamstrings', 'Leg Extension',       'Seated Leg Curl'),
  def('qh-05', 'Hack Squat + Stiff-Leg Deadlift',  'quads_hamstrings', 'Hack Squat',          'Stiff-Leg Deadlift'),

  // ─── Shoulders / Traps ────────────────────────────────────────────────────
  def('st-01', 'Lateral Raise + Face Pull',        'shoulders_traps', 'Lateral Raise',       'Face Pull'),
  def('st-02', 'Overhead Press + Shrugs',          'shoulders_traps', 'Overhead Press',       'Barbell Shrugs'),
  def('st-03', 'Arnold Press + Rear Delt Fly',     'shoulders_traps', 'Arnold Press',         'Rear Delt Fly'),
  def('st-04', 'Front Raise + Upright Row',        'shoulders_traps', 'Front Raise',          'Upright Row'),
  def('st-05', 'DB Shoulder Press + Cable Row',    'shoulders_traps', 'DB Shoulder Press',    'Cable Upright Row'),

  // ─── Core / Glutes ────────────────────────────────────────────────────────
  def('cg-01', 'Plank + Hip Thrust',               'core_glutes', 'Plank',                  'Barbell Hip Thrust'),
  def('cg-02', 'Ab Crunch + Glute Bridge',         'core_glutes', 'Ab Crunch',               'Glute Bridge'),
  def('cg-03', 'Ab Rollout + Cable Kickback',      'core_glutes', 'Ab Rollout',              'Cable Glute Kickback'),
  def('cg-04', 'Hanging Leg Raise + Hip Thrust',   'core_glutes', 'Hanging Leg Raise',       'Dumbbell Hip Thrust'),
  def('cg-05', 'Russian Twist + Glute Squeeze',    'core_glutes', 'Russian Twist',           'Glute Squeeze Hold'),
  def('cg-06', 'Hip Abduction + Hip Adduction',    'core_glutes', 'Hip Abduction Machine',   'Hip Adduction Machine'),
  def('cg-07', 'Cable Row + Plank',                'core_glutes', 'Cable Row',               'Plank'),
  def('cg-08', 'Farmer\'s Carry + Hanging Knee Raise','core_glutes', 'Farmer\'s Carry',     'Hanging Knee Raise'),
  def('cg-09', 'Back Extension + Cable Crunch',    'core_glutes', 'Back Extension',           'Cable Crunch'),

  // ─── Chest / Back — from CSV ───────────────────────────────────────────────
  def('cb-06', 'Incline DB Press + Chest-Supported Row', 'chest_back', 'Incline DB Press',   'Chest-Supported Row'),
  def('cb-07', 'Push-Ups + Seated Cable Row',      'chest_back', 'Push-Ups',                 'Seated Cable Row'),
  def('cb-08', 'Machine Chest Press + Lat Pulldown','chest_back', 'Machine Chest Press',     'Lat Pulldown'),
  def('cb-09', 'DB Shoulder Press + Pull-Ups',     'chest_back', 'DB Shoulder Press',        'Pull-Ups'),
  def('cb-10', 'Pec Deck + Reverse Pec Deck',      'chest_back', 'Pec Deck',                 'Reverse Pec Deck'),
  def('cb-11', 'Deadlift + Push-Up',               'chest_back', 'Deadlift',                 'Push-Up'),
  def('cb-12', 'Romanian Deadlift + DB Bench Press','chest_back', 'Romanian Deadlift',       'DB Bench Press'),
  def('cb-13', 'Kettlebell Swing + Push-Up',       'chest_back', 'Kettlebell Swing',         'Push-Up'),

  // ─── Biceps / Triceps — from CSV ───────────────────────────────────────────
  def('bt-06', 'Hammer Curl + Close-Grip Push-Up', 'biceps_triceps', 'Hammer Curl',          'Close-Grip Push-Up'),
  def('bt-07', 'Barbell Curl + Barbell Row',        'biceps_triceps', 'Barbell Curl',         'Barbell Row'),

  // ─── Quads / Hamstrings — from CSV ────────────────────────────────────────
  def('qh-06', 'Goblet Squat + Romanian Deadlift', 'quads_hamstrings', 'Goblet Squat',       'Romanian Deadlift'),
  def('qh-07', 'Leg Press + Hamstring Curl',        'quads_hamstrings', 'Leg Press',          'Hamstring Curl'),
  def('qh-08', 'Front Squat + Hip Thrust',          'quads_hamstrings', 'Front Squat',        'Hip Thrust'),
  def('qh-09', 'Bulgarian Split Squat + Single-Leg RDL','quads_hamstrings','Bulgarian Split Squat','Single-Leg RDL'),
  def('qh-10', 'Walking Lunge + Seated Leg Curl',   'quads_hamstrings', 'Walking Lunge',      'Seated Leg Curl'),
  def('qh-11', 'Calf Raise + Tibialis Raise',       'quads_hamstrings', 'Calf Raise',         'Tibialis Raise'),
  def('qh-12', 'Squat + Pull-Up',                   'quads_hamstrings', 'Barbell Squat',      'Pull-Up'),

  // ─── Shoulders / Traps — from CSV ─────────────────────────────────────────
  def('st-06', 'Step-Ups + DB Shoulder Press',      'shoulders_traps', 'Step-Ups',           'DB Shoulder Press'),
];

/**
 * All built-in exercises, deduplicated by name.
 * An exercise that appears in multiple supersets (e.g. "Face Pull") gets exactly one entry here.
 * This is seeded into SupersetProgram.exerciseDb on first load.
 */
export const BUILT_IN_EXERCISE_DB: Record<string, SsExercise> = Object.fromEntries(
  Array.from(_exEntries.entries()).map(([id, { name, muscleGroup }]) => [
    id,
    { id, name, muscleGroup, weightLbs: 45, lastWeightLbs: null, lastOutcome: null } satisfies SsExercise,
  ]),
);
