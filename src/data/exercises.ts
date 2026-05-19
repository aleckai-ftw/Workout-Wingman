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
  area: ExerciseArea;
  muscleGroup: string;
}

export const BUILT_IN_EXERCISES: BuiltInExercise[] = [
  // ── Chest ──
  { id: 'bx-bench-press',        name: 'Bench Press',             area: 'Chest',         muscleGroup: 'Pectorals' },
  { id: 'bx-incline-bench',      name: 'Incline Bench Press',     area: 'Chest',         muscleGroup: 'Upper Pectorals' },
  { id: 'bx-decline-bench',      name: 'Decline Bench Press',     area: 'Chest',         muscleGroup: 'Lower Pectorals' },
  { id: 'bx-chest-press',        name: 'Machine Chest Press',     area: 'Chest',         muscleGroup: 'Pectorals' },
  { id: 'bx-push-ups',           name: 'Push-ups',                area: 'Chest',         muscleGroup: 'Pectorals' },
  { id: 'bx-chest-flyes',        name: 'Dumbbell Flyes',          area: 'Chest',         muscleGroup: 'Pectorals' },
  { id: 'bx-cable-flyes',        name: 'Cable Flyes',             area: 'Chest',         muscleGroup: 'Pectorals' },
  { id: 'bx-pec-deck',           name: 'Pec Deck',                area: 'Chest',         muscleGroup: 'Pectorals' },

  // ── Back ──
  { id: 'bx-barbell-rows',       name: 'Barbell Rows',            area: 'Back',          muscleGroup: 'Lats / Rhomboids' },
  { id: 'bx-dumbbell-rows',      name: 'Dumbbell Rows',           area: 'Back',          muscleGroup: 'Lats / Rhomboids' },
  { id: 'bx-cable-rows',         name: 'Seated Cable Rows',       area: 'Back',          muscleGroup: 'Rhomboids / Lats' },
  { id: 'bx-lat-pulldown',       name: 'Lat Pulldown',            area: 'Back',          muscleGroup: 'Lats' },
  { id: 'bx-pull-ups',           name: 'Pull-ups',                area: 'Back',          muscleGroup: 'Lats' },
  { id: 'bx-chin-ups',           name: 'Chin-ups',                area: 'Back',          muscleGroup: 'Lats / Biceps' },
  { id: 'bx-deadlifts',          name: 'Deadlifts',               area: 'Back',          muscleGroup: 'Lats / Spinal Erectors' },
  { id: 'bx-t-bar-rows',         name: 'T-Bar Rows',              area: 'Back',          muscleGroup: 'Rhomboids / Lats' },
  { id: 'bx-face-pulls',         name: 'Face Pulls',              area: 'Back',          muscleGroup: 'Rear Delts / Traps' },

  // ── Shoulders ──
  { id: 'bx-ohp',                name: 'Overhead Press',          area: 'Shoulders',     muscleGroup: 'Front / Side Delts' },
  { id: 'bx-db-shoulder-press',  name: 'Dumbbell Shoulder Press', area: 'Shoulders',     muscleGroup: 'Front / Side Delts' },
  { id: 'bx-lateral-raises',     name: 'Lateral Raises',          area: 'Shoulders',     muscleGroup: 'Side Delts' },
  { id: 'bx-front-raises',       name: 'Front Raises',            area: 'Shoulders',     muscleGroup: 'Front Delts' },
  { id: 'bx-rear-delt-flyes',    name: 'Rear Delt Flyes',         area: 'Shoulders',     muscleGroup: 'Rear Delts' },
  { id: 'bx-arnold-press',       name: 'Arnold Press',            area: 'Shoulders',     muscleGroup: 'Front / Side Delts' },
  { id: 'bx-upright-rows',       name: 'Upright Rows',            area: 'Shoulders',     muscleGroup: 'Side Delts / Traps' },

  // ── Biceps ──
  { id: 'bx-barbell-curls',      name: 'Barbell Curls',           area: 'Biceps',        muscleGroup: 'Biceps Brachii' },
  { id: 'bx-dumbbell-curls',     name: 'Dumbbell Curls',          area: 'Biceps',        muscleGroup: 'Biceps Brachii' },
  { id: 'bx-hammer-curls',       name: 'Hammer Curls',            area: 'Biceps',        muscleGroup: 'Brachialis' },
  { id: 'bx-cable-curls',        name: 'Cable Curls',             area: 'Biceps',        muscleGroup: 'Biceps Brachii' },
  { id: 'bx-incline-curls',      name: 'Incline Dumbbell Curls',  area: 'Biceps',        muscleGroup: 'Biceps Brachii' },
  { id: 'bx-concentration-curl', name: 'Concentration Curls',     area: 'Biceps',        muscleGroup: 'Biceps Brachii' },
  { id: 'bx-preacher-curls',     name: 'Preacher Curls',          area: 'Biceps',        muscleGroup: 'Biceps Brachii' },

  // ── Triceps ──
  { id: 'bx-pushdowns',          name: 'Cable Pushdowns',         area: 'Triceps',       muscleGroup: 'Triceps' },
  { id: 'bx-rope-pushdowns',     name: 'Rope Pushdowns',          area: 'Triceps',       muscleGroup: 'Triceps' },
  { id: 'bx-dips',               name: 'Dips',                    area: 'Triceps',       muscleGroup: 'Triceps' },
  { id: 'bx-skull-crushers',     name: 'Skull Crushers',          area: 'Triceps',       muscleGroup: 'Triceps' },
  { id: 'bx-overhead-ext',       name: 'Overhead Tricep Extension',area: 'Triceps',      muscleGroup: 'Long Head Triceps' },
  { id: 'bx-close-grip-bench',   name: 'Close Grip Bench Press',  area: 'Triceps',       muscleGroup: 'Triceps' },
  { id: 'bx-kickbacks',          name: 'Tricep Kickbacks',        area: 'Triceps',       muscleGroup: 'Triceps' },

  // ── Forearms ──
  { id: 'bx-farmers-carry',      name: "Farmer's Carry",          area: 'Forearms',      muscleGroup: 'Grip Muscles' },
  { id: 'bx-wrist-curls',        name: 'Wrist Curls',             area: 'Forearms',      muscleGroup: 'Wrist Flexors' },
  { id: 'bx-reverse-wrist-curls',name: 'Reverse Wrist Curls',     area: 'Forearms',      muscleGroup: 'Wrist Extensors' },
  { id: 'bx-dead-hangs',         name: 'Dead Hangs',              area: 'Forearms',      muscleGroup: 'Grip Muscles' },
  { id: 'bx-reverse-curls',      name: 'Reverse Curls',           area: 'Forearms',      muscleGroup: 'Brachioradialis' },

  // ── Core / Abs ──
  { id: 'bx-crunches',           name: 'Crunches',                area: 'Core',          muscleGroup: 'Rectus Abdominis' },
  { id: 'bx-planks',             name: 'Planks',                  area: 'Core',          muscleGroup: 'Transverse Abdominis' },
  { id: 'bx-cable-chops',        name: 'Cable Chops',             area: 'Core',          muscleGroup: 'Obliques' },
  { id: 'bx-hanging-knee-raises',name: 'Hanging Knee Raises',     area: 'Core',          muscleGroup: 'Rectus Abdominis' },
  { id: 'bx-hanging-leg-raises-abs', name: 'Hanging Leg Raises',  area: 'Core',          muscleGroup: 'Lower Abs' },
  { id: 'bx-russian-twists',     name: 'Russian Twists',          area: 'Core',          muscleGroup: 'Obliques' },
  { id: 'bx-ab-wheel',           name: 'Ab Wheel Rollout',        area: 'Core',          muscleGroup: 'Transverse Abdominis' },
  { id: 'bx-bicycle-crunches',   name: 'Bicycle Crunches',        area: 'Core',          muscleGroup: 'Obliques / Abs' },
  { id: 'bx-cable-crunches',     name: 'Cable Crunches',          area: 'Core',          muscleGroup: 'Rectus Abdominis' },

  // ── Lower Back ──
  { id: 'bx-back-extensions',    name: 'Back Extensions',         area: 'Lower Back',    muscleGroup: 'Erector Spinae' },
  { id: 'bx-bird-dogs',          name: 'Bird Dogs',               area: 'Lower Back',    muscleGroup: 'Deep Spinal Stabilizers' },
  { id: 'bx-good-mornings',      name: 'Good Mornings',           area: 'Lower Back',    muscleGroup: 'Erector Spinae' },
  { id: 'bx-reverse-hypers',     name: 'Reverse Hyperextensions', area: 'Lower Back',    muscleGroup: 'Erector Spinae / Glutes' },

  // ── Glutes ──
  { id: 'bx-hip-thrusts',        name: 'Hip Thrusts',             area: 'Glutes',        muscleGroup: 'Glute Max' },
  { id: 'bx-glute-bridges',      name: 'Glute Bridges',           area: 'Glutes',        muscleGroup: 'Glute Max' },
  { id: 'bx-cable-kickbacks',    name: 'Cable Kickbacks',         area: 'Glutes',        muscleGroup: 'Glute Max' },
  { id: 'bx-donkey-kicks',       name: 'Donkey Kicks',            area: 'Glutes',        muscleGroup: 'Glute Max' },
  { id: 'bx-step-ups',           name: 'Step-ups',                area: 'Glutes',        muscleGroup: 'Glute Max / Quads' },

  // ── Quads ──
  { id: 'bx-squats',             name: 'Squats',                  area: 'Quads',         muscleGroup: 'Quadriceps' },
  { id: 'bx-front-squats',       name: 'Front Squats',            area: 'Quads',         muscleGroup: 'Quadriceps' },
  { id: 'bx-leg-press',          name: 'Leg Press',               area: 'Quads',         muscleGroup: 'Quadriceps' },
  { id: 'bx-leg-extensions',     name: 'Leg Extensions',          area: 'Quads',         muscleGroup: 'Quadriceps' },
  { id: 'bx-lunges',             name: 'Lunges',                  area: 'Quads',         muscleGroup: 'Quadriceps' },
  { id: 'bx-bulgarian-split',    name: 'Bulgarian Split Squats',  area: 'Quads',         muscleGroup: 'Quadriceps' },
  { id: 'bx-hack-squats',        name: 'Hack Squats',             area: 'Quads',         muscleGroup: 'Quadriceps' },

  // ── Hamstrings ──
  { id: 'bx-rdl',                name: 'Romanian Deadlifts',      area: 'Hamstrings',    muscleGroup: 'Hamstrings' },
  { id: 'bx-lying-hamstring-curl',name: 'Lying Hamstring Curls',  area: 'Hamstrings',    muscleGroup: 'Hamstrings' },
  { id: 'bx-seated-hamstring-curl',name:'Seated Hamstring Curls', area: 'Hamstrings',    muscleGroup: 'Hamstrings' },
  { id: 'bx-nordic-curls',       name: 'Nordic Curls',            area: 'Hamstrings',    muscleGroup: 'Hamstrings' },

  // ── Calves ──
  { id: 'bx-standing-calf-raise',name: 'Standing Calf Raises',   area: 'Calves',        muscleGroup: 'Gastrocnemius' },
  { id: 'bx-seated-calf-raise',  name: 'Seated Calf Raises',     area: 'Calves',        muscleGroup: 'Soleus' },
  { id: 'bx-donkey-calf-raise',  name: 'Donkey Calf Raises',     area: 'Calves',        muscleGroup: 'Gastrocnemius' },

  // ── Hip Flexors ──
  { id: 'bx-hanging-leg-raises', name: 'Hanging Leg Raises (Hip)',area: 'Hip Flexors',   muscleGroup: 'Iliopsoas' },
  { id: 'bx-cable-marches',      name: 'Cable Marches',           area: 'Hip Flexors',   muscleGroup: 'Hip Flexors' },
  { id: 'bx-psoas-march',        name: 'Psoas March',             area: 'Hip Flexors',   muscleGroup: 'Iliopsoas' },

  // ── Hip Abductors ──
  { id: 'bx-abductor-machine',   name: 'Abductor Machine',        area: 'Hip Abductors', muscleGroup: 'Glute Medius' },
  { id: 'bx-band-walks',         name: 'Band Walks',              area: 'Hip Abductors', muscleGroup: 'Glute Medius' },
  { id: 'bx-side-lying-raises',  name: 'Side-lying Leg Raises',   area: 'Hip Abductors', muscleGroup: 'Glute Medius' },
  { id: 'bx-cable-abductions',   name: 'Cable Abductions',        area: 'Hip Abductors', muscleGroup: 'Glute Medius' },

  // ── Hip Adductors ──
  { id: 'bx-adductor-machine',   name: 'Adductor Machine',        area: 'Hip Adductors', muscleGroup: 'Hip Adductors' },
  { id: 'bx-copenhagen-planks',  name: 'Copenhagen Planks',       area: 'Hip Adductors', muscleGroup: 'Hip Adductors' },
  { id: 'bx-sumo-squats',        name: 'Sumo Squats',             area: 'Hip Adductors', muscleGroup: 'Hip Adductors' },
  { id: 'bx-cable-adductions',   name: 'Cable Adductions',        area: 'Hip Adductors', muscleGroup: 'Hip Adductors' },

  // ── Full-Body ──
  { id: 'bx-power-cleans',       name: 'Power Cleans',            area: 'Full-Body',     muscleGroup: 'Full Body' },
  { id: 'bx-push-press',         name: 'Push Press',              area: 'Full-Body',     muscleGroup: 'Full Body' },
  { id: 'bx-loaded-carries',     name: 'Loaded Carries',          area: 'Full-Body',     muscleGroup: 'Full Body' },
  { id: 'bx-kettlebell-swings',  name: 'Kettlebell Swings',       area: 'Full-Body',     muscleGroup: 'Full Body' },
  { id: 'bx-thrusters',          name: 'Thrusters',               area: 'Full-Body',     muscleGroup: 'Full Body' },
  { id: 'bx-clean-and-press',    name: 'Clean & Press',           area: 'Full-Body',     muscleGroup: 'Full Body' },
];
