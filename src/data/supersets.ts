import type { SsDef, SsExercise, SsMuscleGroup } from '../types';
import { BUILT_IN_EXERCISES, BUILT_IN_EXERCISE_BY_NAME } from './exercises';

export interface MuscleGroupMeta {
  label: string;
  emoji: string;
  description: string;
}

export const MUSCLE_GROUP_META: Record<SsMuscleGroup, MuscleGroupMeta> = {
  chest_back:       { label: 'Chest / Back',        emoji: '💪', description: 'Push & pull' },
  biceps_triceps:   { label: 'Biceps / Triceps',    emoji: '🦾', description: 'Arm flexors & extensors' },
  quads_hamstrings: { label: 'Quads / Hamstrings',  emoji: '🦵', description: 'Front & back of leg' },
  shoulders_traps:  { label: 'Shoulders / Traps',   emoji: '🏋️', description: 'Upper body push & pull' },
  core_glutes:      { label: 'Core / Glutes',       emoji: '🔥', description: 'Anterior & posterior chain' },
};

export const SS_MUSCLE_GROUPS: SsMuscleGroup[] = [
  'chest_back',
  'biceps_triceps',
  'quads_hamstrings',
  'shoulders_traps',
  'core_glutes',
];

const SS_GROUP_FALLBACK_AREAS: Record<SsMuscleGroup, string[]> = {
  chest_back: ['Chest', 'Back'],
  biceps_triceps: ['Biceps', 'Triceps'],
  quads_hamstrings: ['Quads', 'Hamstrings'],
  shoulders_traps: ['Shoulders'],
  core_glutes: ['Core', 'Glutes'],
};

/** Stable, deterministic legacy ID from an exercise name */
export function ssExSlug(name: string): string {
  return 'ss-ex-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeLookupName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemToken(token: string): string {
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('s') && token.length > 2) return token.slice(0, -1);
  return token;
}

function nameTokens(name: string): string[] {
  return normalizeLookupName(name)
    .split(' ')
    .map(stemToken)
    .filter(Boolean);
}

const BUILT_IN_EXERCISE_BY_NORMALIZED_NAME: Record<string, (typeof BUILT_IN_EXERCISES)[number]> =
  Object.fromEntries(BUILT_IN_EXERCISES.map((e) => [normalizeLookupName(e.name), e]));

const BUILT_IN_EXERCISES_WITH_TOKENS = BUILT_IN_EXERCISES.map((exercise) => ({
  exercise,
  tokens: new Set(nameTokens(exercise.name)),
}));

function fuzzyMatchBuiltInExerciseByName(name: string) {
  const tokens = nameTokens(name);
  if (tokens.length === 0) return undefined;

  let best: (typeof BUILT_IN_EXERCISES)[number] | undefined;
  let bestScore = 0;
  let bestCoverage = 0;

  for (const candidate of BUILT_IN_EXERCISES_WITH_TOKENS) {
    let overlap = 0;
    for (const token of tokens) {
      if (candidate.tokens.has(token)) overlap += 1;
    }
    if (overlap < 2) continue;

    const coverage = overlap / tokens.length;
    if (overlap > bestScore || (overlap === bestScore && coverage > bestCoverage)) {
      best = candidate.exercise;
      bestScore = overlap;
      bestCoverage = coverage;
    }
  }

  return best;
}

function findBuiltInExerciseByName(name: string) {
  const direct = BUILT_IN_EXERCISE_BY_NAME[name.toLowerCase()];
  if (direct) return direct;
  const normalized = BUILT_IN_EXERCISE_BY_NORMALIZED_NAME[normalizeLookupName(name)];
  if (normalized) return normalized;
  return fuzzyMatchBuiltInExerciseByName(name);
}

/** Resolve a superset exercise name to its canonical ID (built-in exercise ID when known). */
export function resolveSupersetExerciseId(name: string): string {
  const builtIn = findBuiltInExerciseByName(name);
  return builtIn?.id ?? ssExSlug(name);
}

type SupersetExerciseSeed = {
  name: string;
  muscleGroup: string;
  area?: string;
  muscleGroups?: string[];
};

// Internal registry — populated as def() is called, used to build BUILT_IN_EXERCISE_DB.
const _exEntries = new Map<string, SupersetExerciseSeed>(); // id -> metadata
const _legacyToCanonical = new Map<string, string>();

function ex(name: string, muscleGroup: string): string {
  const builtIn = findBuiltInExerciseByName(name);
  const id = builtIn?.id ?? ssExSlug(name);
  const legacyId = ssExSlug(name);

  if (legacyId !== id) _legacyToCanonical.set(legacyId, id);

  if (!_exEntries.has(id)) {
    _exEntries.set(id, {
      name: builtIn?.name ?? name,
      muscleGroup,
      area: builtIn?.area ?? undefined,
      muscleGroups: builtIn?.muscleGroups ?? undefined,
    });
  }
  return id;
}

function def(
  id: string,
  name: string,
  muscleGroup: SsMuscleGroup,
  exerciseAName: string,
  exerciseBName: string,
): SsDef {
  return {
    id,
    name,
    muscleGroup,
    exerciseAId: ex(exerciseAName, muscleGroup),
    exerciseBId: ex(exerciseBName, muscleGroup),
    isCustom: false,
  };
}

export const BUILT_IN_SS_DEFS: SsDef[] = [
  // --- Chest / Back ---------------------------------------------------------
  def('cb-01', 'Bench Press + Bent-Over Row',      'chest_back', 'Bench Press',           'Bent-Over Barbell Row'),
  def('cb-02', 'Push-Up + Pull-Up',                'chest_back', 'Push-Up',               'Pull-Up'),
  def('cb-03', 'Incline Press + Lat Pulldown',     'chest_back', 'Incline Dumbbell Press','Lat Pulldown'),
  def('cb-04', 'Cable Fly + Seated Cable Row',     'chest_back', 'Cable Fly',             'Seated Cable Row'),
  def('cb-05', 'Dumbbell Press + Face Pull',       'chest_back', 'Dumbbell Chest Press',  'Face Pull'),

  // --- Biceps / Triceps -----------------------------------------------------
  def('bt-01', 'Barbell Curl + Skull Crusher',      'biceps_triceps', 'Barbell Curl',            'Skull Crusher'),
  def('bt-02', 'Hammer Curl + Tricep Pushdown',     'biceps_triceps', 'Hammer Curl',             'Tricep Pushdown'),
  def('bt-03', 'Preacher Curl + Overhead Extension','biceps_triceps', 'Preacher Curl',           'Overhead Tricep Extension'),
  def('bt-04', 'Incline Curl + Dips',               'biceps_triceps', 'Incline Dumbbell Curl',   'Dips'),
  def('bt-05', 'Cable Curl + Rope Pushdown',        'biceps_triceps', 'Cable Curl',              'Rope Pushdown'),

  // --- Quads / Hamstrings ---------------------------------------------------
  def('qh-01', 'Leg Press + Romanian Deadlift',      'quads_hamstrings', 'Leg Press',             'Romanian Deadlift'),
  def('qh-02', 'Squat + Lying Leg Curl',             'quads_hamstrings', 'Barbell Squat',         'Lying Leg Curl'),
  def('qh-03', 'Bulgarian Split Squat + Nordic Curl','quads_hamstrings', 'Bulgarian Split Squat', 'Nordic Hamstring Curl'),
  def('qh-04', 'Leg Extension + Leg Curl',           'quads_hamstrings', 'Leg Extension',         'Seated Leg Curl'),
  def('qh-05', 'Hack Squat + Stiff-Leg Deadlift',    'quads_hamstrings', 'Hack Squat',            'Stiff-Leg Deadlift'),

  // --- Shoulders / Traps ----------------------------------------------------
  def('st-01', 'Lateral Raise + Face Pull',         'shoulders_traps', 'Lateral Raise',       'Face Pull'),
  def('st-02', 'Overhead Press + Shrugs',           'shoulders_traps', 'Overhead Press',       'Barbell Shrugs'),
  def('st-03', 'Arnold Press + Rear Delt Fly',      'shoulders_traps', 'Arnold Press',         'Rear Delt Fly'),
  def('st-04', 'Front Raise + Upright Row',         'shoulders_traps', 'Front Raise',          'Upright Row'),
  def('st-05', 'DB Shoulder Press + Cable Row',     'shoulders_traps', 'DB Shoulder Press',    'Cable Upright Row'),

  // --- Core / Glutes --------------------------------------------------------
  def('cg-01', 'Plank + Hip Thrust',                'core_glutes', 'Plank',                    'Barbell Hip Thrust'),
  def('cg-02', 'Ab Crunch + Glute Bridge',          'core_glutes', 'Ab Crunch',                 'Glute Bridge'),
  def('cg-03', 'Ab Rollout + Cable Kickback',       'core_glutes', 'Ab Rollout',                'Cable Glute Kickback'),
  def('cg-04', 'Hanging Leg Raise + Hip Thrust',    'core_glutes', 'Hanging Leg Raise',         'Dumbbell Hip Thrust'),
  def('cg-05', 'Russian Twist + Glute Squeeze',     'core_glutes', 'Russian Twist',             'Glute Squeeze Hold'),
  def('cg-06', 'Hip Abduction + Hip Adduction',     'core_glutes', 'Hip Abduction Machine',     'Hip Adduction Machine'),
  def('cg-07', 'Cable Row + Plank',                 'core_glutes', 'Cable Row',                 'Plank'),
  def('cg-08', "Farmer's Carry + Hanging Knee Raise", 'core_glutes', "Farmer's Carry",       'Hanging Knee Raise'),
  def('cg-09', 'Back Extension + Cable Crunch',     'core_glutes', 'Back Extension',            'Cable Crunch'),

  // --- Chest / Back from CSV -----------------------------------------------
  def('cb-06', 'Incline DB Press + Chest-Supported Row', 'chest_back', 'Incline DB Press',     'Chest-Supported Row'),
  def('cb-07', 'Push-Ups + Seated Cable Row',       'chest_back', 'Push-Ups',                 'Seated Cable Row'),
  def('cb-08', 'Machine Chest Press + Lat Pulldown','chest_back', 'Machine Chest Press',      'Lat Pulldown'),
  def('cb-09', 'DB Shoulder Press + Pull-Ups',      'chest_back', 'DB Shoulder Press',         'Pull-Ups'),
  def('cb-10', 'Pec Deck + Reverse Pec Deck',       'chest_back', 'Pec Deck',                  'Reverse Pec Deck'),
  def('cb-11', 'Deadlift + Push-Up',                'chest_back', 'Deadlift',                  'Push-Up'),
  def('cb-12', 'Romanian Deadlift + DB Bench Press','chest_back', 'Romanian Deadlift',        'DB Bench Press'),
  def('cb-13', 'Kettlebell Swing + Push-Up',        'chest_back', 'Kettlebell Swing',          'Push-Up'),

  // --- Biceps / Triceps from CSV -------------------------------------------
  def('bt-06', 'Hammer Curl + Close-Grip Push-Up',  'biceps_triceps', 'Hammer Curl',          'Close-Grip Push-Up'),
  def('bt-07', 'Barbell Curl + Barbell Row',        'biceps_triceps', 'Barbell Curl',         'Barbell Row'),

  // --- Quads / Hamstrings from CSV -----------------------------------------
  def('qh-06', 'Goblet Squat + Romanian Deadlift',  'quads_hamstrings', 'Goblet Squat',       'Romanian Deadlift'),
  def('qh-07', 'Leg Press + Hamstring Curl',        'quads_hamstrings', 'Leg Press',          'Hamstring Curl'),
  def('qh-08', 'Front Squat + Hip Thrust',          'quads_hamstrings', 'Front Squat',        'Hip Thrust'),
  def('qh-09', 'Bulgarian Split Squat + Single-Leg RDL', 'quads_hamstrings', 'Bulgarian Split Squat', 'Single-Leg RDL'),
  def('qh-10', 'Walking Lunge + Seated Leg Curl',   'quads_hamstrings', 'Walking Lunge',      'Seated Leg Curl'),
  def('qh-11', 'Calf Raise + Tibialis Raise',       'quads_hamstrings', 'Calf Raise',         'Tibialis Raise'),
  def('qh-12', 'Squat + Pull-Up',                   'quads_hamstrings', 'Barbell Squat',      'Pull-Up'),

  // --- Shoulders / Traps from CSV ------------------------------------------
  def('st-06', 'Step-Ups + DB Shoulder Press',      'shoulders_traps', 'Step-Ups',            'DB Shoulder Press'),
];

/** Map legacy `ss-ex-*` IDs to canonical built-in IDs for persisted data migration. */
export const LEGACY_SS_EXERCISE_ID_MAP: Record<string, string> = Object.fromEntries(_legacyToCanonical.entries());

/**
 * All built-in supersets exercises, deduplicated by canonical ID where possible.
 * This seeds SupersetProgram.exerciseDb on first load.
 */
export const BUILT_IN_EXERCISE_DB: Record<string, SsExercise> = Object.fromEntries(
  Array.from(_exEntries.entries()).map(([id, entry]) => {
    const fallbackAreas = SS_GROUP_FALLBACK_AREAS[entry.muscleGroup as SsMuscleGroup] ?? [];
    const area = entry.area ?? fallbackAreas[0] ?? '';
    const muscleGroups = entry.muscleGroups?.length ? entry.muscleGroups : fallbackAreas;
    return [
      id,
      {
        id,
        name: entry.name,
        muscleGroup: entry.muscleGroup,
        area,
        muscleGroups,
        weightLbs: 45,
        lastWeightLbs: null,
        lastOutcome: null,
        targetReps: 10,
      } satisfies SsExercise,
    ];
  }),
);
