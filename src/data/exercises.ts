// ─── Exercise Areas ───────────────────────────────────────────────────────────

export const ALL_EXERCISE_AREAS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Core',
  'Lower Back',
  'Glutes',
  'Quads',
  'Hamstrings',
  'Calves',
  'Hip Flexors',
  'Hip Abductors',
  'Hip Adductors',
  'Full-Body',
] as const;

export type ExerciseArea = (typeof ALL_EXERCISE_AREAS)[number];

export interface AreaMeta {
  emoji: string;
  bgClass: string;
  textClass: string;
}

export const AREA_META: Record<ExerciseArea, AreaMeta> = {
  Chest:          { emoji: '🏋️', bgClass: 'bg-red-50',      textClass: 'text-red-700' },
  Back:           { emoji: '🔗', bgClass: 'bg-blue-50',     textClass: 'text-blue-700' },
  Shoulders:      { emoji: '💪', bgClass: 'bg-purple-50',   textClass: 'text-purple-700' },
  Biceps:         { emoji: '💪', bgClass: 'bg-orange-50',   textClass: 'text-orange-700' },
  Triceps:        { emoji: '💪', bgClass: 'bg-yellow-50',   textClass: 'text-yellow-700' },
  Forearms:       { emoji: '🤝', bgClass: 'bg-amber-50',    textClass: 'text-amber-700' },
  Core:           { emoji: '⚡', bgClass: 'bg-lime-50',     textClass: 'text-lime-700' },
  'Lower Back':   { emoji: '🦴', bgClass: 'bg-stone-50',    textClass: 'text-stone-700' },
  Glutes:         { emoji: '🍑', bgClass: 'bg-pink-50',     textClass: 'text-pink-700' },
  Quads:          { emoji: '🦵', bgClass: 'bg-cyan-50',     textClass: 'text-cyan-700' },
  Hamstrings:     { emoji: '🦵', bgClass: 'bg-teal-50',     textClass: 'text-teal-700' },
  Calves:         { emoji: '🦶', bgClass: 'bg-sky-50',      textClass: 'text-sky-700' },
  'Hip Flexors':  { emoji: '🔄', bgClass: 'bg-indigo-50',   textClass: 'text-indigo-700' },
  'Hip Abductors':{ emoji: '↔️', bgClass: 'bg-violet-50',   textClass: 'text-violet-700' },
  'Hip Adductors':{ emoji: '↔️', bgClass: 'bg-fuchsia-50',  textClass: 'text-fuchsia-700' },
  'Full-Body':    { emoji: '🌟', bgClass: 'bg-emerald-50',  textClass: 'text-emerald-700' },
};

// ─── Built-in exercise definitions ───────────────────────────────────────────

export interface BuiltInExercise {
  id: string;
  name: string;
  area: ExerciseArea;
  muscleGroups: ExerciseArea[]; // all areas worked, including primary area
}

export const BUILT_IN_EXERCISES: BuiltInExercise[] = [
  // ── Chest ──
  { id: 'bx-bench-press',        name: 'Bench Press',             area: 'Chest',         muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'bx-incline-bench',      name: 'Incline Bench Press',     area: 'Chest',         muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'bx-decline-bench',      name: 'Decline Bench Press',     area: 'Chest',         muscleGroups: ['Chest', 'Triceps'] },
  { id: 'bx-chest-press',        name: 'Machine Chest Press',     area: 'Chest',         muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'bx-push-ups',           name: 'Push-ups',                area: 'Chest',         muscleGroups: ['Chest', 'Triceps', 'Shoulders', 'Core'] },
  { id: 'bx-chest-flyes',        name: 'Dumbbell Flyes',          area: 'Chest',         muscleGroups: ['Chest', 'Shoulders'] },
  { id: 'bx-cable-flyes',        name: 'Cable Flyes',             area: 'Chest',         muscleGroups: ['Chest', 'Shoulders'] },
  { id: 'bx-pec-deck',           name: 'Pec Deck',                area: 'Chest',         muscleGroups: ['Chest'] },

  // ── Back ──
  { id: 'bx-barbell-rows',       name: 'Barbell Rows',            area: 'Back',          muscleGroups: ['Back', 'Biceps', 'Lower Back'] },
  { id: 'bx-dumbbell-rows',      name: 'Dumbbell Rows',           area: 'Back',          muscleGroups: ['Back', 'Biceps'] },
  { id: 'bx-cable-rows',         name: 'Seated Cable Rows',       area: 'Back',          muscleGroups: ['Back', 'Biceps'] },
  { id: 'bx-lat-pulldown',       name: 'Lat Pulldown',            area: 'Back',          muscleGroups: ['Back', 'Biceps'] },
  { id: 'bx-pull-ups',           name: 'Pull-ups',                area: 'Back',          muscleGroups: ['Back', 'Biceps'] },
  { id: 'bx-chin-ups',           name: 'Chin-ups',                area: 'Back',          muscleGroups: ['Back', 'Biceps'] },
  { id: 'bx-deadlifts',          name: 'Deadlifts',               area: 'Back',          muscleGroups: ['Back', 'Lower Back', 'Hamstrings', 'Glutes', 'Quads'] },
  { id: 'bx-t-bar-rows',         name: 'T-Bar Rows',              area: 'Back',          muscleGroups: ['Back', 'Biceps'] },
  { id: 'bx-face-pulls',         name: 'Face Pulls',              area: 'Back',          muscleGroups: ['Back', 'Shoulders'] },

  // ── Shoulders ──
  { id: 'bx-ohp',                name: 'Overhead Press',          area: 'Shoulders',     muscleGroups: ['Shoulders', 'Triceps'] },
  { id: 'bx-db-shoulder-press',  name: 'Dumbbell Shoulder Press', area: 'Shoulders',     muscleGroups: ['Shoulders', 'Triceps'] },
  { id: 'bx-lateral-raises',     name: 'Lateral Raises',          area: 'Shoulders',     muscleGroups: ['Shoulders'] },
  { id: 'bx-front-raises',       name: 'Front Raises',            area: 'Shoulders',     muscleGroups: ['Shoulders'] },
  { id: 'bx-rear-delt-flyes',    name: 'Rear Delt Flyes',         area: 'Shoulders',     muscleGroups: ['Shoulders', 'Back'] },
  { id: 'bx-arnold-press',       name: 'Arnold Press',            area: 'Shoulders',     muscleGroups: ['Shoulders', 'Triceps'] },
  { id: 'bx-upright-rows',       name: 'Upright Rows',            area: 'Shoulders',     muscleGroups: ['Shoulders', 'Back', 'Biceps'] },

  // ── Biceps ──
  { id: 'bx-barbell-curls',      name: 'Barbell Curls',           area: 'Biceps',        muscleGroups: ['Biceps', 'Forearms'] },
  { id: 'bx-dumbbell-curls',     name: 'Dumbbell Curls',          area: 'Biceps',        muscleGroups: ['Biceps', 'Forearms'] },
  { id: 'bx-hammer-curls',       name: 'Hammer Curls',            area: 'Biceps',        muscleGroups: ['Biceps', 'Forearms'] },
  { id: 'bx-cable-curls',        name: 'Cable Curls',             area: 'Biceps',        muscleGroups: ['Biceps'] },
  { id: 'bx-incline-curls',      name: 'Incline Dumbbell Curls',  area: 'Biceps',        muscleGroups: ['Biceps'] },
  { id: 'bx-concentration-curl', name: 'Concentration Curls',     area: 'Biceps',        muscleGroups: ['Biceps'] },
  { id: 'bx-preacher-curls',     name: 'Preacher Curls',          area: 'Biceps',        muscleGroups: ['Biceps'] },

  // ── Triceps ──
  { id: 'bx-pushdowns',          name: 'Cable Pushdowns',         area: 'Triceps',       muscleGroups: ['Triceps'] },
  { id: 'bx-rope-pushdowns',     name: 'Rope Pushdowns',          area: 'Triceps',       muscleGroups: ['Triceps'] },
  { id: 'bx-dips',               name: 'Dips',                    area: 'Triceps',       muscleGroups: ['Triceps', 'Chest', 'Shoulders'] },
  { id: 'bx-skull-crushers',     name: 'Skull Crushers',          area: 'Triceps',       muscleGroups: ['Triceps'] },
  { id: 'bx-overhead-ext',       name: 'Overhead Tricep Extension',area: 'Triceps',      muscleGroups: ['Triceps'] },
  { id: 'bx-close-grip-bench',   name: 'Close Grip Bench Press',  area: 'Triceps',       muscleGroups: ['Triceps', 'Chest'] },
  { id: 'bx-kickbacks',          name: 'Tricep Kickbacks',        area: 'Triceps',       muscleGroups: ['Triceps'] },

  // ── Forearms ──
  { id: 'bx-farmers-carry',      name: "Farmer's Carry",          area: 'Forearms',      muscleGroups: ['Forearms', 'Core'] },
  { id: 'bx-wrist-curls',        name: 'Wrist Curls',             area: 'Forearms',      muscleGroups: ['Forearms'] },
  { id: 'bx-reverse-wrist-curls',name: 'Reverse Wrist Curls',     area: 'Forearms',      muscleGroups: ['Forearms'] },
  { id: 'bx-dead-hangs',         name: 'Dead Hangs',              area: 'Forearms',      muscleGroups: ['Forearms', 'Back'] },
  { id: 'bx-reverse-curls',      name: 'Reverse Curls',           area: 'Forearms',      muscleGroups: ['Forearms', 'Biceps'] },

  // ── Core / Abs ──
  { id: 'bx-crunches',           name: 'Crunches',                area: 'Core',          muscleGroups: ['Core'] },
  { id: 'bx-planks',             name: 'Planks',                  area: 'Core',          muscleGroups: ['Core', 'Shoulders', 'Glutes'] },
  { id: 'bx-cable-chops',        name: 'Cable Chops',             area: 'Core',          muscleGroups: ['Core'] },
  { id: 'bx-hanging-knee-raises',name: 'Hanging Knee Raises',     area: 'Core',          muscleGroups: ['Core', 'Hip Flexors'] },
  { id: 'bx-hanging-leg-raises-abs', name: 'Hanging Leg Raises',  area: 'Core',          muscleGroups: ['Core', 'Hip Flexors'] },
  { id: 'bx-russian-twists',     name: 'Russian Twists',          area: 'Core',          muscleGroups: ['Core'] },
  { id: 'bx-ab-wheel',           name: 'Ab Wheel Rollout',        area: 'Core',          muscleGroups: ['Core', 'Shoulders'] },
  { id: 'bx-bicycle-crunches',   name: 'Bicycle Crunches',        area: 'Core',          muscleGroups: ['Core'] },
  { id: 'bx-cable-crunches',     name: 'Cable Crunches',          area: 'Core',          muscleGroups: ['Core'] },

  // ── Lower Back ──
  { id: 'bx-back-extensions',    name: 'Back Extensions',         area: 'Lower Back',    muscleGroups: ['Lower Back', 'Glutes', 'Hamstrings'] },
  { id: 'bx-bird-dogs',          name: 'Bird Dogs',               area: 'Lower Back',    muscleGroups: ['Lower Back', 'Core'] },
  { id: 'bx-good-mornings',      name: 'Good Mornings',           area: 'Lower Back',    muscleGroups: ['Lower Back', 'Hamstrings'] },
  { id: 'bx-reverse-hypers',     name: 'Reverse Hyperextensions', area: 'Lower Back',    muscleGroups: ['Lower Back', 'Glutes', 'Hamstrings'] },

  // ── Glutes ──
  { id: 'bx-hip-thrusts',        name: 'Hip Thrusts',             area: 'Glutes',        muscleGroups: ['Glutes', 'Hamstrings', 'Lower Back'] },
  { id: 'bx-glute-bridges',      name: 'Glute Bridges',           area: 'Glutes',        muscleGroups: ['Glutes', 'Hamstrings'] },
  { id: 'bx-cable-kickbacks',    name: 'Cable Kickbacks',         area: 'Glutes',        muscleGroups: ['Glutes'] },
  { id: 'bx-donkey-kicks',       name: 'Donkey Kicks',            area: 'Glutes',        muscleGroups: ['Glutes'] },
  { id: 'bx-step-ups',           name: 'Step-ups',                area: 'Glutes',        muscleGroups: ['Glutes', 'Quads', 'Hamstrings'] },

  // ── Quads ──
  { id: 'bx-squats',             name: 'Squats',                  area: 'Quads',         muscleGroups: ['Quads', 'Glutes', 'Hamstrings', 'Lower Back'] },
  { id: 'bx-front-squats',       name: 'Front Squats',            area: 'Quads',         muscleGroups: ['Quads', 'Glutes', 'Core'] },
  { id: 'bx-leg-press',          name: 'Leg Press',               area: 'Quads',         muscleGroups: ['Quads', 'Glutes', 'Hamstrings'] },
  { id: 'bx-leg-extensions',     name: 'Leg Extensions',          area: 'Quads',         muscleGroups: ['Quads'] },
  { id: 'bx-lunges',             name: 'Lunges',                  area: 'Quads',         muscleGroups: ['Quads', 'Glutes', 'Hamstrings'] },
  { id: 'bx-bulgarian-split',    name: 'Bulgarian Split Squats',  area: 'Quads',         muscleGroups: ['Quads', 'Glutes', 'Hamstrings'] },
  { id: 'bx-hack-squats',        name: 'Hack Squats',             area: 'Quads',         muscleGroups: ['Quads', 'Glutes'] },

  // ── Hamstrings ──
  { id: 'bx-rdl',                name: 'Romanian Deadlifts',      area: 'Hamstrings',    muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back'] },
  { id: 'bx-lying-hamstring-curl',name: 'Lying Hamstring Curls',  area: 'Hamstrings',    muscleGroups: ['Hamstrings'] },
  { id: 'bx-seated-hamstring-curl',name:'Seated Hamstring Curls', area: 'Hamstrings',    muscleGroups: ['Hamstrings'] },
  { id: 'bx-nordic-curls',       name: 'Nordic Curls',            area: 'Hamstrings',    muscleGroups: ['Hamstrings', 'Lower Back'] },

  // ── Calves ──
  { id: 'bx-standing-calf-raise',name: 'Standing Calf Raises',   area: 'Calves',        muscleGroups: ['Calves'] },
  { id: 'bx-seated-calf-raise',  name: 'Seated Calf Raises',     area: 'Calves',        muscleGroups: ['Calves'] },
  { id: 'bx-donkey-calf-raise',  name: 'Donkey Calf Raises',     area: 'Calves',        muscleGroups: ['Calves'] },

  // ── Hip Flexors ──
  { id: 'bx-hanging-leg-raises', name: 'Hanging Leg Raises (Hip)',area: 'Hip Flexors',   muscleGroups: ['Hip Flexors', 'Core'] },
  { id: 'bx-cable-marches',      name: 'Cable Marches',           area: 'Hip Flexors',   muscleGroups: ['Hip Flexors'] },
  { id: 'bx-psoas-march',        name: 'Psoas March',             area: 'Hip Flexors',   muscleGroups: ['Hip Flexors'] },

  // ── Hip Abductors ──
  { id: 'bx-abductor-machine',   name: 'Abductor Machine',        area: 'Hip Abductors', muscleGroups: ['Hip Abductors', 'Glutes'] },
  { id: 'bx-band-walks',         name: 'Band Walks',              area: 'Hip Abductors', muscleGroups: ['Hip Abductors', 'Glutes'] },
  { id: 'bx-side-lying-raises',  name: 'Side-lying Leg Raises',   area: 'Hip Abductors', muscleGroups: ['Hip Abductors'] },
  { id: 'bx-cable-abductions',   name: 'Cable Abductions',        area: 'Hip Abductors', muscleGroups: ['Hip Abductors', 'Glutes'] },

  // ── Hip Adductors ──
  { id: 'bx-adductor-machine',   name: 'Adductor Machine',        area: 'Hip Adductors', muscleGroups: ['Hip Adductors'] },
  { id: 'bx-copenhagen-planks',  name: 'Copenhagen Planks',       area: 'Hip Adductors', muscleGroups: ['Hip Adductors', 'Core'] },
  { id: 'bx-sumo-squats',        name: 'Sumo Squats',             area: 'Hip Adductors', muscleGroups: ['Hip Adductors', 'Quads', 'Glutes'] },
  { id: 'bx-cable-adductions',   name: 'Cable Adductions',        area: 'Hip Adductors', muscleGroups: ['Hip Adductors'] },

  // ── Full-Body ──
  { id: 'bx-power-cleans',       name: 'Power Cleans',            area: 'Full-Body',     muscleGroups: ['Full-Body'] },
  { id: 'bx-push-press',         name: 'Push Press',              area: 'Full-Body',     muscleGroups: ['Full-Body'] },
  { id: 'bx-loaded-carries',     name: 'Loaded Carries',          area: 'Full-Body',     muscleGroups: ['Full-Body'] },
  { id: 'bx-kettlebell-swings',  name: 'Kettlebell Swings',       area: 'Full-Body',     muscleGroups: ['Full-Body'] },
  { id: 'bx-thrusters',          name: 'Thrusters',               area: 'Full-Body',     muscleGroups: ['Full-Body'] },
  { id: 'bx-clean-and-press',    name: 'Clean & Press',           area: 'Full-Body',     muscleGroups: ['Full-Body'] },
];

/** Lookup built-in exercises by normalized name (for superset exercise matching) */
export const BUILT_IN_EXERCISE_BY_NAME: Record<string, BuiltInExercise> = Object.fromEntries(
  BUILT_IN_EXERCISES.map((e) => [e.name.toLowerCase(), e]),
);

/** Lookup built-in exercises by ID (for individual exercise matching) */
export const BUILT_IN_EXERCISE_BY_ID: Record<string, BuiltInExercise> = Object.fromEntries(
  BUILT_IN_EXERCISES.map((e) => [e.id, e]),
);
