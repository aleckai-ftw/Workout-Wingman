// ─── Shared ───────────────────────────────────────────────────────────────────

export type ID = string;

// ─── Profile & Settings ───────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  avatarInitials: string;
}

export interface AppSettings {
  defaultRestSeconds: number;     // rest timer default
  weightUnit: 'lbs' | 'kg';
  dailyProteinGoalG: number;
}

// ─── Protein Tracker ──────────────────────────────────────────────────────────

export type FoodCategory =
  | 'meat'
  | 'fish'
  | 'dairy'
  | 'eggs'
  | 'nuts'
  | 'legumes'
  | 'grains'
  | 'vegetables'
  | 'fruit'
  | 'supplements'
  | 'other';

export interface FoodItem {
  id: ID;
  name: string;
  category: FoodCategory;
  proteinPerServing: number; // grams
  servingSize: string;       // descriptive, e.g. "1 breast (120g)"
  isCustom: boolean;
}

export interface DailyServing {
  id: ID;
  foodId: ID;
  servings: number;
  timestamp: string; // ISO-8601 — when first logged
}

export interface ProteinDay {
  date: string; // YYYY-MM-DD
  servings: DailyServing[];
  goalG: number;
}

// ─── Timer ────────────────────────────────────────────────────────────────────

export interface TimerState {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  label: string;
}

// ─── 5x5 Tracker ──────────────────────────────────────────────────────────────

export type FxFWorkoutKey = 'A' | 'B';
export type FxFSetState = 'pending' | 'done' | 'failed';

export interface FxFExerciseDef {
  id: ID;
  name: string;
  numSets: number;              // 5 normally; 1 for Deadlift
  weightLbs: number;            // current planned weight for next session
  targetReps: number;           // 5 normally, 7 after failure
  lastWeightLbs: number | null; // weight used last time this exercise was done
  lastOutcome: 'success' | 'failure' | null;
}

export interface FxFPlan {
  A: FxFExerciseDef[];
  B: FxFExerciseDef[];
}

export interface FxFSet {
  state: FxFSetState;
}

export interface FxFSessionExercise {
  defId: ID;            // links to FxFExerciseDef.id
  name: string;
  numSets: number;      // snapshot of numSets at session start
  weightLbs: number;    // snapshot at session start (may be bumped via +5)
  targetReps: number;   // snapshot at session start
  lastWeightLbs: number | null;
  lastOutcome: 'success' | 'failure' | null;
  sets: FxFSet[];       // length === numSets
}

export interface FxFSession {
  id: ID;
  workout: FxFWorkoutKey;
  date: string;         // ISO-8601
  exercises: FxFSessionExercise[];
  completed: boolean;
}

export interface FiveByFiveProgram {
  plan: FxFPlan;
  sessions: FxFSession[];
  activeSessionId: ID | null;
}

// ─── Superset Tracker ─────────────────────────────────────────────────────────

export type SsMuscleGroup = string;

export interface CustomMuscleGroup {
  id: string;
  label: string;
  emoji: string;
}

export type SsSetState = 'pending' | 'done' | 'failed';

/** A superset pairing definition (from library or user-created) */
export interface SsDef {
  id: ID;
  name: string;         // e.g. "Bench Press + Bent-Over Row"
  muscleGroup: SsMuscleGroup;
  exerciseA: string;
  exerciseB: string;
  isCustom: boolean;
}

/** Persistent weight/outcome state tracked per SsDef across sessions */
export interface SsDefState {
  defId: ID;
  weightA: number;
  weightB: number;
  lastWeightA: number | null;
  lastWeightB: number | null;
  lastOutcomeA: 'success' | 'failure' | null;
  lastOutcomeB: 'success' | 'failure' | null;
}

export interface SsSessionSet {
  stateA: SsSetState;
  stateB: SsSetState;
}

/** One superset entry inside an active/completed session */
export interface SsSessionEntry {
  defId: ID;
  name: string;
  muscleGroup: SsMuscleGroup;
  exerciseA: string;
  exerciseB: string;
  numSets: 1 | 3 | 5;
  weightA: number;          // weight snapshot at session start
  weightB: number;
  lastWeightA: number | null;
  lastWeightB: number | null;
  lastOutcomeA: 'success' | 'failure' | null;
  lastOutcomeB: 'success' | 'failure' | null;
  sets: SsSessionSet[];
}

export interface SsSession {
  id: ID;
  date: string;             // ISO-8601
  entries: SsSessionEntry[];
  completed: boolean;
}

export interface SupersetProgram {
  customDefs: SsDef[];
  customMuscleGroups: CustomMuscleGroup[];
  defStates: Record<string, SsDefState>; // keyed by defId
  sessions: SsSession[];
  activeSessionId: ID | null;
}
