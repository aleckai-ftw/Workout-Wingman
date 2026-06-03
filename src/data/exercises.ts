// ─── Exercise Areas ───────────────────────────────────────────────────────────

export type ExerciseArea =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Core'
  | 'Lower Back'
  | 'Glutes'
  | 'Quads'
  | 'Hamstrings'
  | 'Calves'
  | 'Hip Flexors'
  | 'Hip Abductors'
  | 'Hip Adductors'
  | 'Full-Body';

export const ALL_EXERCISE_AREAS: ExerciseArea[] = [
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
];

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
  area: ExerciseArea;        // primary area — used for display & grouping
  muscleGroup: string;
  areas: ExerciseArea[];     // all areas worked — used for staleness tracking
}

export const BUILT_IN_EXERCISES: BuiltInExercise[] = [
  // ── Chest ──
  { id: 'bx-bench-press',        name: 'Bench Press',             area: 'Chest',         muscleGroup: 'Pectorals',                areas: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'bx-incline-bench',      name: 'Incline Bench Press',     area: 'Chest',         muscleGroup: 'Upper Pectorals',          areas: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'bx-decline-bench',      name: 'Decline Bench Press',     area: 'Chest',         muscleGroup: 'Lower Pectorals',          areas: ['Chest', 'Triceps'] },
  { id: 'bx-chest-press',        name: 'Machine Chest Press',     area: 'Chest',         muscleGroup: 'Pectorals',                areas: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'bx-push-ups',           name: 'Push-ups',                area: 'Chest',         muscleGroup: 'Pectorals',                areas: ['Chest', 'Triceps', 'Shoulders', 'Core'] },
  { id: 'bx-chest-flyes',        name: 'Dumbbell Flyes',          area: 'Chest',         muscleGroup: 'Pectorals',                areas: ['Chest', 'Shoulders'] },
  { id: 'bx-cable-flyes',        name: 'Cable Flyes',             area: 'Chest',         muscleGroup: 'Pectorals',                areas: ['Chest', 'Shoulders'] },
  { id: 'bx-pec-deck',           name: 'Pec Deck',                area: 'Chest',         muscleGroup: 'Pectorals',                areas: ['Chest'] },

  // ── Back ──
  { id: 'bx-barbell-rows',       name: 'Barbell Rows',            area: 'Back',          muscleGroup: 'Lats / Rhomboids',         areas: ['Back', 'Biceps', 'Lower Back'] },
  { id: 'bx-dumbbell-rows',      name: 'Dumbbell Rows',           area: 'Back',          muscleGroup: 'Lats / Rhomboids',         areas: ['Back', 'Biceps'] },
  { id: 'bx-cable-rows',         name: 'Seated Cable Rows',       area: 'Back',          muscleGroup: 'Rhomboids / Lats',         areas: ['Back', 'Biceps'] },
  { id: 'bx-lat-pulldown',       name: 'Lat Pulldown',            area: 'Back',          muscleGroup: 'Lats',                     areas: ['Back', 'Biceps'] },
  { id: 'bx-pull-ups',           name: 'Pull-ups',                area: 'Back',          muscleGroup: 'Lats',                     areas: ['Back', 'Biceps'] },
  { id: 'bx-chin-ups',           name: 'Chin-ups',                area: 'Back',          muscleGroup: 'Lats / Biceps',            areas: ['Back', 'Biceps'] },
  { id: 'bx-deadlifts',          name: 'Deadlifts',               area: 'Back',          muscleGroup: 'Lats / Spinal Erectors',   areas: ['Back', 'Lower Back', 'Hamstrings', 'Glutes', 'Quads'] },
  { id: 'bx-t-bar-rows',         name: 'T-Bar Rows',              area: 'Back',          muscleGroup: 'Rhomboids / Lats',         areas: ['Back', 'Biceps'] },
  { id: 'bx-face-pulls',         name: 'Face Pulls',              area: 'Back',          muscleGroup: 'Rear Delts / Traps',       areas: ['Back', 'Shoulders'] },

  // ── Shoulders ──
  { id: 'bx-ohp',                name: 'Overhead Press',          area: 'Shoulders',     muscleGroup: 'Front / Side Delts',       areas: ['Shoulders', 'Triceps'] },
  { id: 'bx-db-shoulder-press',  name: 'Dumbbell Shoulder Press', area: 'Shoulders',     muscleGroup: 'Front / Side Delts',       areas: ['Shoulders', 'Triceps'] },
  { id: 'bx-lateral-raises',     name: 'Lateral Raises',          area: 'Shoulders',     muscleGroup: 'Side Delts',               areas: ['Shoulders'] },
  { id: 'bx-front-raises',       name: 'Front Raises',            area: 'Shoulders',     muscleGroup: 'Front Delts',              areas: ['Shoulders'] },
  { id: 'bx-rear-delt-flyes',    name: 'Rear Delt Flyes',         area: 'Shoulders',     muscleGroup: 'Rear Delts',               areas: ['Shoulders', 'Back'] },
  { id: 'bx-arnold-press',       name: 'Arnold Press',            area: 'Shoulders',     muscleGroup: 'Front / Side Delts',       areas: ['Shoulders', 'Triceps'] },
  { id: 'bx-upright-rows',       name: 'Upright Rows',            area: 'Shoulders',     muscleGroup: 'Side Delts / Traps',       areas: ['Shoulders', 'Back', 'Biceps'] },

  // ── Biceps ──
  { id: 'bx-barbell-curls',      name: 'Barbell Curls',           area: 'Biceps',        muscleGroup: 'Biceps Brachii',           areas: ['Biceps', 'Forearms'] },
  { id: 'bx-dumbbell-curls',     name: 'Dumbbell Curls',          area: 'Biceps',        muscleGroup: 'Biceps Brachii',           areas: ['Biceps', 'Forearms'] },
  { id: 'bx-hammer-curls',       name: 'Hammer Curls',            area: 'Biceps',        muscleGroup: 'Brachialis',               areas: ['Biceps', 'Forearms'] },
  { id: 'bx-cable-curls',        name: 'Cable Curls',             area: 'Biceps',        muscleGroup: 'Biceps Brachii',           areas: ['Biceps'] },
  { id: 'bx-incline-curls',      name: 'Incline Dumbbell Curls',  area: 'Biceps',        muscleGroup: 'Biceps Brachii',           areas: ['Biceps'] },
  { id: 'bx-concentration-curl', name: 'Concentration Curls',     area: 'Biceps',        muscleGroup: 'Biceps Brachii',           areas: ['Biceps'] },
  { id: 'bx-preacher-curls',     name: 'Preacher Curls',          area: 'Biceps',        muscleGroup: 'Biceps Brachii',           areas: ['Biceps'] },

  // ── Triceps ──
  { id: 'bx-pushdowns',          name: 'Cable Pushdowns',         area: 'Triceps',       muscleGroup: 'Triceps',                  areas: ['Triceps'] },
  { id: 'bx-rope-pushdowns',     name: 'Rope Pushdowns',          area: 'Triceps',       muscleGroup: 'Triceps',                  areas: ['Triceps'] },
  { id: 'bx-dips',               name: 'Dips',                    area: 'Triceps',       muscleGroup: 'Triceps',                  areas: ['Triceps', 'Chest', 'Shoulders'] },
  { id: 'bx-skull-crushers',     name: 'Skull Crushers',          area: 'Triceps',       muscleGroup: 'Triceps',                  areas: ['Triceps'] },
  { id: 'bx-overhead-ext',       name: 'Overhead Tricep Extension',area: 'Triceps',      muscleGroup: 'Long Head Triceps',        areas: ['Triceps'] },
  { id: 'bx-close-grip-bench',   name: 'Close Grip Bench Press',  area: 'Triceps',       muscleGroup: 'Triceps',                  areas: ['Triceps', 'Chest'] },
  { id: 'bx-kickbacks',          name: 'Tricep Kickbacks',        area: 'Triceps',       muscleGroup: 'Triceps',                  areas: ['Triceps'] },

  // ── Forearms ──
  { id: 'bx-farmers-carry',      name: "Farmer's Carry",          area: 'Forearms',      muscleGroup: 'Grip Muscles',             areas: ['Forearms', 'Core'] },
  { id: 'bx-wrist-curls',        name: 'Wrist Curls',             area: 'Forearms',      muscleGroup: 'Wrist Flexors',            areas: ['Forearms'] },
  { id: 'bx-reverse-wrist-curls',name: 'Reverse Wrist Curls',     area: 'Forearms',      muscleGroup: 'Wrist Extensors',          areas: ['Forearms'] },
  { id: 'bx-dead-hangs',         name: 'Dead Hangs',              area: 'Forearms',      muscleGroup: 'Grip Muscles',             areas: ['Forearms', 'Back'] },
  { id: 'bx-reverse-curls',      name: 'Reverse Curls',           area: 'Forearms',      muscleGroup: 'Brachioradialis',          areas: ['Forearms', 'Biceps'] },

  // ── Core / Abs ──
  { id: 'bx-crunches',           name: 'Crunches',                area: 'Core',          muscleGroup: 'Rectus Abdominis',         areas: ['Core'] },
  { id: 'bx-planks',             name: 'Planks',                  area: 'Core',          muscleGroup: 'Transverse Abdominis',     areas: ['Core', 'Shoulders', 'Glutes'] },
  { id: 'bx-cable-chops',        name: 'Cable Chops',             area: 'Core',          muscleGroup: 'Obliques',                 areas: ['Core'] },
  { id: 'bx-hanging-knee-raises',name: 'Hanging Knee Raises',     area: 'Core',          muscleGroup: 'Rectus Abdominis',         areas: ['Core', 'Hip Flexors'] },
  { id: 'bx-hanging-leg-raises-abs', name: 'Hanging Leg Raises',  area: 'Core',          muscleGroup: 'Lower Abs',                areas: ['Core', 'Hip Flexors'] },
  { id: 'bx-russian-twists',     name: 'Russian Twists',          area: 'Core',          muscleGroup: 'Obliques',                 areas: ['Core'] },
  { id: 'bx-ab-wheel',           name: 'Ab Wheel Rollout',        area: 'Core',          muscleGroup: 'Transverse Abdominis',     areas: ['Core', 'Shoulders'] },
  { id: 'bx-bicycle-crunches',   name: 'Bicycle Crunches',        area: 'Core',          muscleGroup: 'Obliques / Abs',           areas: ['Core'] },
  { id: 'bx-cable-crunches',     name: 'Cable Crunches',          area: 'Core',          muscleGroup: 'Rectus Abdominis',         areas: ['Core'] },

  // ── Lower Back ──
  { id: 'bx-back-extensions',    name: 'Back Extensions',         area: 'Lower Back',    muscleGroup: 'Erector Spinae',           areas: ['Lower Back', 'Glutes', 'Hamstrings'] },
  { id: 'bx-bird-dogs',          name: 'Bird Dogs',               area: 'Lower Back',    muscleGroup: 'Deep Spinal Stabilizers',  areas: ['Lower Back', 'Core'] },
  { id: 'bx-good-mornings',      name: 'Good Mornings',           area: 'Lower Back',    muscleGroup: 'Erector Spinae',           areas: ['Lower Back', 'Hamstrings'] },
  { id: 'bx-reverse-hypers',     name: 'Reverse Hyperextensions', area: 'Lower Back',    muscleGroup: 'Erector Spinae / Glutes',  areas: ['Lower Back', 'Glutes', 'Hamstrings'] },

  // ── Glutes ──
  { id: 'bx-hip-thrusts',        name: 'Hip Thrusts',             area: 'Glutes',        muscleGroup: 'Glute Max',                areas: ['Glutes', 'Hamstrings', 'Lower Back'] },
  { id: 'bx-glute-bridges',      name: 'Glute Bridges',           area: 'Glutes',        muscleGroup: 'Glute Max',                areas: ['Glutes', 'Hamstrings'] },
  { id: 'bx-cable-kickbacks',    name: 'Cable Kickbacks',         area: 'Glutes',        muscleGroup: 'Glute Max',                areas: ['Glutes'] },
  { id: 'bx-donkey-kicks',       name: 'Donkey Kicks',            area: 'Glutes',        muscleGroup: 'Glute Max',                areas: ['Glutes'] },
  { id: 'bx-step-ups',           name: 'Step-ups',                area: 'Glutes',        muscleGroup: 'Glute Max / Quads',        areas: ['Glutes', 'Quads', 'Hamstrings'] },

  // ── Quads ──
  { id: 'bx-squats',             name: 'Squats',                  area: 'Quads',         muscleGroup: 'Quadriceps',               areas: ['Quads', 'Glutes', 'Hamstrings', 'Lower Back'] },
  { id: 'bx-front-squats',       name: 'Front Squats',            area: 'Quads',         muscleGroup: 'Quadriceps',               areas: ['Quads', 'Glutes', 'Core'] },
  { id: 'bx-leg-press',          name: 'Leg Press',               area: 'Quads',         muscleGroup: 'Quadriceps',               areas: ['Quads', 'Glutes', 'Hamstrings'] },
  { id: 'bx-leg-extensions',     name: 'Leg Extensions',          area: 'Quads',         muscleGroup: 'Quadriceps',               areas: ['Quads'] },
  { id: 'bx-lunges',             name: 'Lunges',                  area: 'Quads',         muscleGroup: 'Quadriceps',               areas: ['Quads', 'Glutes', 'Hamstrings'] },
  { id: 'bx-bulgarian-split',    name: 'Bulgarian Split Squats',  area: 'Quads',         muscleGroup: 'Quadriceps',               areas: ['Quads', 'Glutes', 'Hamstrings'] },
  { id: 'bx-hack-squats',        name: 'Hack Squats',             area: 'Quads',         muscleGroup: 'Quadriceps',               areas: ['Quads', 'Glutes'] },

  // ── Hamstrings ──
  { id: 'bx-rdl',                name: 'Romanian Deadlifts',      area: 'Hamstrings',    muscleGroup: 'Hamstrings',               areas: ['Hamstrings', 'Glutes', 'Lower Back'] },
  { id: 'bx-lying-hamstring-curl',name: 'Lying Hamstring Curls',  area: 'Hamstrings',    muscleGroup: 'Hamstrings',               areas: ['Hamstrings'] },
  { id: 'bx-seated-hamstring-curl',name:'Seated Hamstring Curls', area: 'Hamstrings',    muscleGroup: 'Hamstrings',               areas: ['Hamstrings'] },
  { id: 'bx-nordic-curls',       name: 'Nordic Curls',            area: 'Hamstrings',    muscleGroup: 'Hamstrings',               areas: ['Hamstrings', 'Lower Back'] },

  // ── Calves ──
  { id: 'bx-standing-calf-raise',name: 'Standing Calf Raises',   area: 'Calves',        muscleGroup: 'Gastrocnemius',            areas: ['Calves'] },
  { id: 'bx-seated-calf-raise',  name: 'Seated Calf Raises',     area: 'Calves',        muscleGroup: 'Soleus',                   areas: ['Calves'] },
  { id: 'bx-donkey-calf-raise',  name: 'Donkey Calf Raises',     area: 'Calves',        muscleGroup: 'Gastrocnemius',            areas: ['Calves'] },

  // ── Hip Flexors ──
  { id: 'bx-hanging-leg-raises', name: 'Hanging Leg Raises (Hip)',area: 'Hip Flexors',   muscleGroup: 'Iliopsoas',                areas: ['Hip Flexors', 'Core'] },
  { id: 'bx-cable-marches',      name: 'Cable Marches',           area: 'Hip Flexors',   muscleGroup: 'Hip Flexors',              areas: ['Hip Flexors'] },
  { id: 'bx-psoas-march',        name: 'Psoas March',             area: 'Hip Flexors',   muscleGroup: 'Iliopsoas',                areas: ['Hip Flexors'] },

  // ── Hip Abductors ──
  { id: 'bx-abductor-machine',   name: 'Abductor Machine',        area: 'Hip Abductors', muscleGroup: 'Glute Medius',             areas: ['Hip Abductors', 'Glutes'] },
  { id: 'bx-band-walks',         name: 'Band Walks',              area: 'Hip Abductors', muscleGroup: 'Glute Medius',             areas: ['Hip Abductors', 'Glutes'] },
  { id: 'bx-side-lying-raises',  name: 'Side-lying Leg Raises',   area: 'Hip Abductors', muscleGroup: 'Glute Medius',             areas: ['Hip Abductors'] },
  { id: 'bx-cable-abductions',   name: 'Cable Abductions',        area: 'Hip Abductors', muscleGroup: 'Glute Medius',             areas: ['Hip Abductors', 'Glutes'] },

  // ── Hip Adductors ──
  { id: 'bx-adductor-machine',   name: 'Adductor Machine',        area: 'Hip Adductors', muscleGroup: 'Hip Adductors',            areas: ['Hip Adductors'] },
  { id: 'bx-copenhagen-planks',  name: 'Copenhagen Planks',       area: 'Hip Adductors', muscleGroup: 'Hip Adductors',            areas: ['Hip Adductors', 'Core'] },
  { id: 'bx-sumo-squats',        name: 'Sumo Squats',             area: 'Hip Adductors', muscleGroup: 'Hip Adductors',            areas: ['Hip Adductors', 'Quads', 'Glutes'] },
  { id: 'bx-cable-adductions',   name: 'Cable Adductions',        area: 'Hip Adductors', muscleGroup: 'Hip Adductors',            areas: ['Hip Adductors'] },

  // ── Full-Body ──
  { id: 'bx-power-cleans',       name: 'Power Cleans',            area: 'Full-Body',     muscleGroup: 'Full Body',                areas: ['Full-Body'] },
  { id: 'bx-push-press',         name: 'Push Press',              area: 'Full-Body',     muscleGroup: 'Full Body',                areas: ['Full-Body'] },
  { id: 'bx-loaded-carries',     name: 'Loaded Carries',          area: 'Full-Body',     muscleGroup: 'Full Body',                areas: ['Full-Body'] },
  { id: 'bx-kettlebell-swings',  name: 'Kettlebell Swings',       area: 'Full-Body',     muscleGroup: 'Full Body',                areas: ['Full-Body'] },
  { id: 'bx-thrusters',          name: 'Thrusters',               area: 'Full-Body',     muscleGroup: 'Full Body',                areas: ['Full-Body'] },
  { id: 'bx-clean-and-press',    name: 'Clean & Press',           area: 'Full-Body',     muscleGroup: 'Full Body',                areas: ['Full-Body'] },
];

/** Lookup built-in exercises by normalized name (for superset exercise matching) */
export const BUILT_IN_EXERCISE_BY_NAME: Record<string, BuiltInExercise> = Object.fromEntries(
  BUILT_IN_EXERCISES.map((e) => [e.name.toLowerCase(), e]),
);

/** Lookup built-in exercises by ID (for individual exercise matching) */
export const BUILT_IN_EXERCISE_BY_ID: Record<string, BuiltInExercise> = Object.fromEntries(
  BUILT_IN_EXERCISES.map((e) => [e.id, e]),
);
