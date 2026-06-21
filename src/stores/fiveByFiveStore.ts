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
import { BUILT_IN_EXERCISE_BY_NAME } from '../data/exercises';
import { recordMasterPerformance, syncMasterExerciseMetadata } from './exerciseMasterStore';

const KEY = 'ww_5x5_v3'; // bumped — clean slate; exerciseDb is now shared
const FAILURE_REPS = 7;

function makeExDef(
  id: string,
  name: string,
  weightLbs = 45,
  numSets = 5,
  area?: string,
  muscleGroup?: string,
  muscleGroups?: string[],
): FxFExerciseDef {
  return { id, name, numSets, weightLbs, targetReps: 5, lastWeightLbs: null, lastOutcome: null, area, muscleGroup, muscleGroups };
}

// Stable IDs — Squat appears in both A & B and shares the same entry
export const DEFAULT_EXERCISE_DB: Record<string, FxFExerciseDef> = {
  squat:    makeExDef('squat',    'Squat',           45, 5, 'Quads',      'Quads',      ['Quads', 'Glutes', 'Hamstrings', 'Lower Back']),
  bench:    makeExDef('bench',    'Bench Press',     45, 5, 'Chest',      'Chest',      ['Chest', 'Triceps', 'Shoulders']),
  row:      makeExDef('row',      'Barbell Row',     45, 5, 'Back',       'Back',       ['Back', 'Biceps', 'Lower Back']),
  ohp:      makeExDef('ohp',      'Overhead Press',  45, 5, 'Shoulders',  'Shoulders',  ['Shoulders', 'Triceps']),
  deadlift: makeExDef('deadlift', 'Deadlift',        45, 1, 'Lower Back', 'Lower Back', ['Lower Back', 'Back', 'Hamstrings', 'Glutes', 'Quads']),
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
  addExerciseToPlan: (
    workout: FxFWorkoutKey,
    name: string,
    weightLbs?: number,
    numSets?: number,
    area?: string,
    muscleGroup?: string,
    muscleGroups?: string[],
  ) => void;
  removeExerciseFromPlan: (workout: FxFWorkoutKey, defId: string) => void;
  setPlanExerciseWeight: (workout: FxFWorkoutKey, defId: string, weight: number) => void;
  reorderPlanExercises: (workout: FxFWorkoutKey, fromIndex: number, toIndex: number) => void;
  swapSessionExercise: (sessionId: string, exIdx: number, name: string, weightLbs: number, numSets: number) => void;
}

function save(state: FiveByFiveProgram) {
  saveToStorage(KEY, state);
}

/**
 * Migration: if the same exercise name appears more than once in exerciseDb
 * (e.g. because it was added to a second workout before the dedup fix),
 * keep the canonical entry (prefer DEFAULT_EXERCISE_DB id, then the one with
 * real progress data) and remap any plan references to the duplicate ids.
 */
function deduplicateExerciseDb(
  db: Record<string, FxFExerciseDef>,
  plan: FxFPlan,
): { exerciseDb: Record<string, FxFExerciseDef>; plan: FxFPlan; changed: boolean } {
  // Group ids by normalized name
  const byName: Record<string, string[]> = {};
  for (const id of Object.keys(db)) {
    const key = db[id].name.toLowerCase().trim();
    if (!byName[key]) byName[key] = [];
    byName[key].push(id);
  }

  const idRemap: Record<string, string> = {};
  const cleanDb: Record<string, FxFExerciseDef> = { ...db };

  for (const ids of Object.values(byName)) {
    if (ids.length <= 1) continue;

    // Pick canonical: prefer a DEFAULT_EXERCISE_DB key, then any entry with real data
    const canonical =
      ids.find((id) => DEFAULT_EXERCISE_DB[id] !== undefined) ??
      ids.find((id) => db[id].lastWeightLbs !== null) ??
      ids[0];

    // Merge best real-data fields into the canonical entry
    let best: FxFExerciseDef = { ...db[canonical] };
    for (const id of ids) {
      if (id === canonical) continue;
      const dup = db[id];
      // Prefer a non-default weight and real last-performance data
      if (best.lastWeightLbs === null && dup.lastWeightLbs !== null) {
        best = { ...best, lastWeightLbs: dup.lastWeightLbs, lastOutcome: dup.lastOutcome };
      }
      if (best.weightLbs === 45 && dup.weightLbs !== 45) {
        best = { ...best, weightLbs: dup.weightLbs };
      }
      idRemap[id] = canonical;
      delete cleanDb[id];
    }
    cleanDb[canonical] = best;
  }

  if (Object.keys(idRemap).length === 0) {
    return { exerciseDb: db, plan, changed: false };
  }

  const remap = (ids: string[]) => ids.map((id) => idRemap[id] ?? id);
  return {
    exerciseDb: cleanDb,
    plan: { A: remap(plan.A), B: remap(plan.B) },
    changed: true,
  };
}

export const useFiveByFiveStore = create<FiveByFiveStore>()(
  subscribeWithSelector((set, get) => {
    const loaded = loadFromStorage<Partial<FiveByFiveProgram>>(KEY, {});
    const loadedDb = (loaded as FiveByFiveProgram).exerciseDb ?? DEFAULT_EXERCISE_DB;
    // Backfill area/muscleGroup/muscleGroups for built-in exercises that predate this feature
    const exerciseDb = Object.fromEntries(
      Object.entries(loadedDb).map(([id, def]) => {
        const builtIn = DEFAULT_EXERCISE_DB[id];
        if (builtIn) {
          return [id, {
            ...def,
            area: def.area ?? builtIn.area,
            muscleGroup: def.muscleGroup ?? builtIn.muscleGroup,
            muscleGroups: def.muscleGroups ?? builtIn.muscleGroups,
          }];
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

    // Deduplicate any exercises that were added to multiple workouts before the
    // name-based dedup fix — this is a one-time migration that self-heals on load.
    const deduped = deduplicateExerciseDb(initial.exerciseDb, initial.plan);
    if (deduped.changed) {
      initial.exerciseDb = deduped.exerciseDb;
      initial.plan = deduped.plan;
      save(initial); // persist the cleaned-up state immediately
    }

    for (const def of Object.values(exerciseDb)) {
      syncMasterExerciseMetadata({
        id: def.id,
        name: def.name,
        primaryArea: def.area,
        areas: def.muscleGroups,
        primaryMuscleGroup: def.muscleGroup,
        muscleGroups: def.muscleGroups ?? (def.muscleGroup ? [def.muscleGroup] : []),
        source: 'custom',
      });
    }

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
              muscleGroups: def.muscleGroups,
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
              recordMasterPerformance({
                exerciseId: ex.defId,
                mode: '5x5',
                weightLbs: ex.weightLbs,
                reps: ex.targetReps,
                outcome: 'failure',
              });
            } else if (allDone) {
              updatedDb[ex.defId] = {
                ...current,
                weightLbs: ex.weightLbs + 5,
                targetReps: 5,
                lastWeightLbs: ex.weightLbs,
                lastOutcome: 'success',
              };
              recordMasterPerformance({
                exerciseId: ex.defId,
                mode: '5x5',
                weightLbs: ex.weightLbs,
                reps: ex.targetReps,
                outcome: 'success',
              });
            } else {
              updatedDb[ex.defId] = {
                ...current,
                lastWeightLbs: ex.weightLbs,
                lastOutcome: null,
              };
              recordMasterPerformance({
                exerciseId: ex.defId,
                mode: '5x5',
                weightLbs: ex.weightLbs,
                reps: ex.targetReps,
                outcome: null,
              });
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

      addExerciseToPlan: (workout, name, weightLbs = 45, numSets = 5, area?, muscleGroup?, muscleGroups?) =>
        set((s) => {
          // Reuse an existing exerciseDb entry if the name already exists (preserves weight/progress)
          const existingDef = Object.values(s.exerciseDb).find(
            (d) => d.name.toLowerCase() === name.toLowerCase(),
          );
          if (existingDef) {
            // Already in this workout's plan? Skip
            if (s.plan[workout].includes(existingDef.id)) return s;
            const next: FiveByFiveProgram = {
              ...s,
              plan: { ...s.plan, [workout]: [...s.plan[workout], existingDef.id] },
            };
            save(next);
            return next;
          }

          const mergedMuscleGroups = muscleGroups?.length
            ? muscleGroups
            : (muscleGroup ? [muscleGroup] : []);
          const newId = syncMasterExerciseMetadata({
            id: crypto.randomUUID(),
            name,
            primaryArea: area,
            areas: area ? [area, ...mergedMuscleGroups] : mergedMuscleGroups,
            primaryMuscleGroup: muscleGroup ?? mergedMuscleGroups[0],
            muscleGroups: mergedMuscleGroups,
            source: 'custom',
          });
          const newDef = makeExDef(
            newId,
            name,
            weightLbs,
            numSets,
            area,
            muscleGroup ?? mergedMuscleGroups[0],
            mergedMuscleGroups,
          );
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
            const builtIn = BUILT_IN_EXERCISE_BY_NAME[name.toLowerCase()];
            defId = syncMasterExerciseMetadata({
              id: crypto.randomUUID(),
              name,
              primaryArea: builtIn?.area,
              areas: builtIn?.muscleGroups,
              primaryMuscleGroup: builtIn?.muscleGroups?.[0] ?? builtIn?.area,
              muscleGroups: builtIn?.muscleGroups,
              source: 'custom',
            });
            const newDef = makeExDef(
              defId,
              name,
              weightLbs,
              numSets,
              builtIn?.area,
              builtIn?.muscleGroups?.[0] ?? builtIn?.area,
              builtIn?.muscleGroups,
            );
            updatedDb = { ...s.exerciseDb, [defId]: newDef };
          }
          const def = updatedDb[defId];
          const newEx: FxFSessionExercise = {
            defId,
            name: def.name,
            area: def.area,
            muscleGroup: def.muscleGroup,
            muscleGroups: def.muscleGroups,
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

