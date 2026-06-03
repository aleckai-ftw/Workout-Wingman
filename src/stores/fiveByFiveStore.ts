import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  FiveByFiveProgram,
  FxFExerciseDef,
  FxFPlan,
  FxFSession,
  FxFSessionExercise,
  FxFSetState,
  FxFWorkoutKey,
} from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';

const KEY = 'ww_5x5_v3'; // bumped — clean slate; exerciseDb is now shared
const FAILURE_REPS = 7;

function makeExDef(
  id: string,
  name: string,
  weightLbs = 45,
  numSets = 5,
  area?: string,
  muscleGroup?: string,
  areas?: string[],
): FxFExerciseDef {
  return { id, name, numSets, weightLbs, targetReps: 5, lastWeightLbs: null, lastOutcome: null, area, muscleGroup, areas };
}

// Stable IDs — Squat appears in both A & B and shares the same entry
export const DEFAULT_EXERCISE_DB: Record<string, FxFExerciseDef> = {
  squat:    makeExDef('squat',    'Squat',           45, 5, 'Quads',      'Quadriceps',        ['Quads', 'Glutes', 'Hamstrings', 'Lower Back']),
  bench:    makeExDef('bench',    'Bench Press',     45, 5, 'Chest',      'Pectorals',         ['Chest', 'Triceps', 'Shoulders']),
  row:      makeExDef('row',      'Barbell Row',     45, 5, 'Back',       'Lats / Rhomboids',  ['Back', 'Biceps', 'Lower Back']),
  ohp:      makeExDef('ohp',      'Overhead Press',  45, 5, 'Shoulders',  'Front / Side Delts',['Shoulders', 'Triceps']),
  deadlift: makeExDef('deadlift', 'Deadlift',        45, 1, 'Lower Back', 'Spinal Erectors',   ['Lower Back', 'Back', 'Hamstrings', 'Glutes', 'Quads']),
};

const DEFAULT_PLAN: FxFPlan = {
  A: ['squat', 'bench', 'row'],
  B: ['squat', 'ohp', 'deadlift'],
};

function makeSets(numSets: number) {
  return Array.from({ length: numSets }, () => ({ state: 'pending' as FxFSetState }));
}

interface FiveByFiveStore extends FiveByFiveProgram {
  startSession: (workout: FxFWorkoutKey) => void;
  toggleSetState: (sessionId: string, exIdx: number, setIdx: number) => void;
  adjustSessionWeight: (sessionId: string, exIdx: number, delta: number) => void;
  completeSession: (sessionId: string) => void;
  cancelSession: (sessionId: string) => void;
  addExerciseToPlan: (workout: FxFWorkoutKey, name: string, weightLbs?: number, numSets?: number, area?: string, muscleGroup?: string) => void;
  removeExerciseFromPlan: (workout: FxFWorkoutKey, defId: string) => void;
  setPlanExerciseWeight: (workout: FxFWorkoutKey, defId: string, weight: number) => void;
  reorderPlanExercises: (workout: FxFWorkoutKey, fromIndex: number, toIndex: number) => void;
  swapSessionExercise: (sessionId: string, exIdx: number, name: string, weightLbs: number, numSets: number) => void;
}

function save(state: FiveByFiveProgram) {
  saveToStorage(KEY, state);
}

export const useFiveByFiveStore = create<FiveByFiveStore>()(
  subscribeWithSelector((set, get) => {
    const loaded = loadFromStorage<Partial<FiveByFiveProgram>>(KEY, {});
    const loadedDb = (loaded as FiveByFiveProgram).exerciseDb ?? DEFAULT_EXERCISE_DB;
    // Backfill area/muscleGroup/areas for built-in exercises that predate this feature
    const exerciseDb = Object.fromEntries(
      Object.entries(loadedDb).map(([id, def]) => {
        const builtIn = DEFAULT_EXERCISE_DB[id];
        if (builtIn) {
          return [id, { ...def, area: def.area ?? builtIn.area, muscleGroup: def.muscleGroup ?? builtIn.muscleGroup, areas: def.areas ?? builtIn.areas }];
        }
        return [id, def];
      }),
    );
    const initial: FiveByFiveProgram = {
      exerciseDb,
      plan: (loaded as FiveByFiveProgram).plan ?? DEFAULT_PLAN,
      sessions: (loaded as FiveByFiveProgram).sessions ?? [],
      activeSessionId: (loaded as FiveByFiveProgram).activeSessionId ?? null,
    };

    return {
      ...initial,

      startSession: (workout) => {
        const state = get();
        const ids = state.plan[workout];
        const id = crypto.randomUUID();
        const session: FxFSession = {
          id,
          workout,
          date: new Date().toISOString(),
          exercises: ids.map((defId): FxFSessionExercise => {
            const def = state.exerciseDb[defId];
            return {
              defId,
              name: def.name,
              area: def.area,
              muscleGroup: def.muscleGroup,
              areas: def.areas,
              numSets: def.numSets,
              weightLbs: def.weightLbs,
              targetReps: def.targetReps,
              lastWeightLbs: def.lastWeightLbs,
              lastOutcome: def.lastOutcome,
              sets: makeSets(def.numSets),
            };
          }),
          completed: false,
        };
        set((s) => {
          const next: FiveByFiveProgram = {
            ...s,
            sessions: [...s.sessions, session],
            activeSessionId: id,
          };
          save(next);
          return next;
        });
      },

      toggleSetState: (sessionId, exIdx, setIdx) =>
        set((s) => {
          const cycle: Record<FxFSetState, FxFSetState> = {
            pending: 'done',
            done: 'failed',
            failed: 'pending',
          };
          const sessions = s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            const exercises = sess.exercises.map((ex, ei) => {
              if (ei !== exIdx) return ex;
              const sets = ex.sets.map((st, si) =>
                si === setIdx ? { state: cycle[st.state] } : st,
              );
              return { ...ex, sets };
            });
            return { ...sess, exercises };
          });
          const next: FiveByFiveProgram = { ...s, sessions };
          save(next);
          return next;
        }),

      adjustSessionWeight: (sessionId, exIdx, delta) =>
        set((s) => {
          const sessions = s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            const exercises = sess.exercises.map((ex, ei) => {
              if (ei !== exIdx) return ex;
              return { ...ex, weightLbs: Math.max(0, ex.weightLbs + delta) };
            });
            return { ...sess, exercises };
          });
          const next: FiveByFiveProgram = { ...s, sessions };
          save(next);
          return next;
        }),

      completeSession: (sessionId) =>
        set((s) => {
          const session = s.sessions.find((sess) => sess.id === sessionId);
          if (!session) return s;

          // Update exerciseDb for each exercise in the session
          const updatedDb = { ...s.exerciseDb };
          session.exercises.forEach((ex) => {
            const failed = ex.sets.some((st) => st.state === 'failed');
            const allDone = ex.sets.every((st) => st.state === 'done');
            const current = updatedDb[ex.defId];
            if (!current) return;

            if (failed) {
              updatedDb[ex.defId] = {
                ...current,
                weightLbs: Math.max(0, ex.weightLbs - 5),
                targetReps: FAILURE_REPS,
                lastWeightLbs: ex.weightLbs,
                lastOutcome: 'failure',
              };
            } else if (allDone) {
              updatedDb[ex.defId] = {
                ...current,
                weightLbs: ex.weightLbs + 5,
                targetReps: 5,
                lastWeightLbs: ex.weightLbs,
                lastOutcome: 'success',
              };
            } else {
              updatedDb[ex.defId] = {
                ...current,
                lastWeightLbs: ex.weightLbs,
                lastOutcome: null,
              };
            }
          });

          const sessions = s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, completed: true } : sess,
          );

          const next: FiveByFiveProgram = {
            ...s,
            exerciseDb: updatedDb,
            sessions,
            activeSessionId: null,
          };
          save(next);
          return next;
        }),

      cancelSession: (sessionId) =>
        set((s) => {
          const sessions = s.sessions.filter((sess) => sess.id !== sessionId);
          const next: FiveByFiveProgram = {
            ...s,
            sessions,
            activeSessionId: s.activeSessionId === sessionId ? null : s.activeSessionId,
          };
          save(next);
          return next;
        }),

      addExerciseToPlan: (workout, name, weightLbs = 45, numSets = 5, area?, muscleGroup?) =>
        set((s) => {
          const newId = crypto.randomUUID();
          const newDef = makeExDef(newId, name, weightLbs, numSets, area, muscleGroup);
          const next: FiveByFiveProgram = {
            ...s,
            exerciseDb: { ...s.exerciseDb, [newId]: newDef },
            plan: { ...s.plan, [workout]: [...s.plan[workout], newId] },
          };
          save(next);
          return next;
        }),

      removeExerciseFromPlan: (workout, defId) =>
        set((s) => {
          const next: FiveByFiveProgram = {
            ...s,
            plan: {
              ...s.plan,
              [workout]: s.plan[workout].filter((id) => id !== defId),
            },
          };
          save(next);
          return next;
        }),

      setPlanExerciseWeight: (_workout, defId, weight) =>
        set((s) => {
          // Weight lives in exerciseDb, not the plan array
          const current = s.exerciseDb[defId];
          if (!current) return s;
          const next: FiveByFiveProgram = {
            ...s,
            exerciseDb: { ...s.exerciseDb, [defId]: { ...current, weightLbs: weight } },
          };
          save(next);
          return next;
        }),

      reorderPlanExercises: (workout, fromIndex, toIndex) =>
        set((s) => {
          const ids = [...s.plan[workout]];
          const [moved] = ids.splice(fromIndex, 1);
          ids.splice(toIndex, 0, moved);
          const next: FiveByFiveProgram = {
            ...s,
            plan: { ...s.plan, [workout]: ids },
          };
          save(next);
          return next;
        }),

      swapSessionExercise: (sessionId, exIdx, name, weightLbs, numSets) =>
        set((s) => {
          // Find existing def by name (case-insensitive) or create new one
          const existingDef = Object.values(s.exerciseDb).find(
            (d) => d.name.toLowerCase() === name.toLowerCase(),
          );
          let defId: string;
          let updatedDb = s.exerciseDb;
          if (existingDef) {
            defId = existingDef.id;
          } else {
            defId = crypto.randomUUID();
            const newDef = makeExDef(defId, name, weightLbs, numSets);
            updatedDb = { ...s.exerciseDb, [defId]: newDef };
          }
          const def = updatedDb[defId];
          const newEx: FxFSessionExercise = {
            defId,
            name: def.name,
            numSets,
            weightLbs: existingDef ? existingDef.weightLbs : weightLbs,
            targetReps: def.targetReps,
            lastWeightLbs: def.lastWeightLbs,
            lastOutcome: def.lastOutcome,
            sets: makeSets(numSets),
          };
          const sessions = s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            const exercises = sess.exercises.map((ex, ei) => (ei === exIdx ? newEx : ex));
            return { ...sess, exercises };
          });
          const next: FiveByFiveProgram = { ...s, exerciseDb: updatedDb, sessions };
          save(next);
          return next;
        }),
    };
  }),
);

