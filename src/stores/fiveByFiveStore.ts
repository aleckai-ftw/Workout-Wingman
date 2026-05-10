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

const KEY = 'ww_5x5_v2';
const FAILURE_REPS = 7;

function makeExDef(name: string, weightLbs = 45, numSets = 5): FxFExerciseDef {
  return {
    id: crypto.randomUUID(),
    name,
    numSets,
    weightLbs,
    targetReps: 5,
    lastWeightLbs: null,
    lastOutcome: null,
  };
}

const DEFAULT_PLAN: FxFPlan = {
  A: [
    makeExDef('Squat'),
    makeExDef('Bench Press'),
    makeExDef('Barbell Row'),
  ],
  B: [
    makeExDef('Squat'),
    makeExDef('Overhead Press'),
    makeExDef('Deadlift', 45, 1),
  ],
};

function makeSets(numSets: number): FxFSetState[] {
  return Array.from({ length: numSets }, () => 'pending' as FxFSetState);
}

interface FiveByFiveStore extends FiveByFiveProgram {
  startSession: (workout: FxFWorkoutKey) => void;
  toggleSetState: (sessionId: string, exIdx: number, setIdx: number) => void;
  adjustSessionWeight: (sessionId: string, exIdx: number, delta: number) => void;
  completeSession: (sessionId: string) => void;
  cancelSession: (sessionId: string) => void;
  addExerciseToPlan: (workout: FxFWorkoutKey, name: string, weightLbs?: number, numSets?: number) => void;
  removeExerciseFromPlan: (workout: FxFWorkoutKey, defId: string) => void;
  setPlanExerciseWeight: (workout: FxFWorkoutKey, defId: string, weight: number) => void;
}

function save(state: FiveByFiveProgram) {
  saveToStorage(KEY, state);
}

export const useFiveByFiveStore = create<FiveByFiveStore>()(
  subscribeWithSelector((set, get) => {
    const loaded = loadFromStorage<Partial<FiveByFiveProgram>>(KEY, {});
    const initial: FiveByFiveProgram = {
      plan: (loaded as FiveByFiveProgram).plan ?? DEFAULT_PLAN,
      sessions: (loaded as FiveByFiveProgram).sessions ?? [],
      activeSessionId: (loaded as FiveByFiveProgram).activeSessionId ?? null,
    };

    return {
      ...initial,

      startSession: (workout) => {
        const state = get();
        const exDefs = state.plan[workout];
        const id = crypto.randomUUID();
        const session: FxFSession = {
          id,
          workout,
          date: new Date().toISOString(),
          exercises: exDefs.map((def): FxFSessionExercise => ({
            defId: def.id,
            name: def.name,
            numSets: def.numSets,
            weightLbs: def.weightLbs,
            targetReps: def.targetReps,
            lastWeightLbs: def.lastWeightLbs,
            lastOutcome: def.lastOutcome,
            sets: makeSets(def.numSets).map((state) => ({ state })),
          })),
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

          const planUpdates: Record<string, Partial<FxFExerciseDef>> = {};
          session.exercises.forEach((ex) => {
            const failed = ex.sets.some((st) => st.state === 'failed');
            const allDone = ex.sets.every((st) => st.state === 'done');
            if (failed) {
              planUpdates[ex.defId] = {
                weightLbs: Math.max(0, ex.weightLbs - 5),
                targetReps: FAILURE_REPS,
                lastWeightLbs: ex.weightLbs,
                lastOutcome: 'failure',
              };
            } else if (allDone) {
              planUpdates[ex.defId] = {
                weightLbs: ex.weightLbs + 5,
                targetReps: 5,
                lastWeightLbs: ex.weightLbs,
                lastOutcome: 'success',
              };
            } else {
              planUpdates[ex.defId] = {
                lastWeightLbs: ex.weightLbs,
                lastOutcome: null,
              };
            }
          });

          const applyUpdates = (defs: FxFExerciseDef[]) =>
            defs.map((def) =>
              planUpdates[def.id] ? { ...def, ...planUpdates[def.id] } : def,
            );

          const newPlan: FxFPlan = {
            A: applyUpdates(s.plan.A),
            B: applyUpdates(s.plan.B),
          };

          const sessions = s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, completed: true } : sess,
          );

          const next: FiveByFiveProgram = {
            plan: newPlan,
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

      addExerciseToPlan: (workout, name, weightLbs = 45, numSets = 5) =>
        set((s) => {
          const newDef = makeExDef(name, weightLbs, numSets);
          const next: FiveByFiveProgram = {
            ...s,
            plan: { ...s.plan, [workout]: [...s.plan[workout], newDef] },
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
              [workout]: s.plan[workout].filter((d) => d.id !== defId),
            },
          };
          save(next);
          return next;
        }),

      setPlanExerciseWeight: (workout, defId, weight) =>
        set((s) => {
          const next: FiveByFiveProgram = {
            ...s,
            plan: {
              ...s.plan,
              [workout]: s.plan[workout].map((d) =>
                d.id === defId ? { ...d, weightLbs: weight } : d,
              ),
            },
          };
          save(next);
          return next;
        }),
    };
  }),
);
