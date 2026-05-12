import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  SupersetProgram,
  SsDef,
  SsExercise,
  SsSessionEntry,
  SsSession,
  SsSetState,
  CustomMuscleGroup,
} from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import { BUILT_IN_EXERCISE_DB, ssExSlug } from '../data/supersets';

const KEY = 'ww_superset_v3'; // bumped — exerciseDb replaces defStates
const DEFAULT_WEIGHT = 45;

interface StartEntry {
  defId: string;
  defName: string;
  exerciseAId: string;
  exerciseBId: string;
  muscleGroup: SsDef['muscleGroup'];
  numSets: 1 | 3 | 5;
}

interface SupersetStore extends SupersetProgram {
  startSession: (entries: StartEntry[]) => void;
  toggleSetState: (sessionId: string, entryIdx: number, setIdx: number, side: 'A' | 'B') => void;
  adjustWeight: (sessionId: string, entryIdx: number, side: 'A' | 'B', delta: number) => void;
  completeSession: (sessionId: string) => void;
  cancelSession: (sessionId: string) => void;
  addCustomDef: (def: Omit<SsDef, 'id' | 'isCustom'>) => SsDef;
  removeCustomDef: (defId: string) => void;
  addCustomMuscleGroup: (group: Omit<CustomMuscleGroup, 'id'>) => CustomMuscleGroup;
  removeCustomMuscleGroup: (groupId: string) => void;
  /** Ensure an exercise with this name exists in exerciseDb; returns its ID */
  ensureExercise: (name: string, muscleGroup?: string) => string;
  /** Explicitly add a new standalone exercise */
  addExercise: (name: string, weightLbs?: number, muscleGroup?: string) => SsExercise;
  /** Set the weight for an exercise in the db */
  updateExerciseWeight: (id: string, delta: number) => void;
}

function persist(state: SupersetProgram) {
  saveToStorage(KEY, state);
}

function nextSetState(s: SsSetState): SsSetState {
  if (s === 'pending') return 'done';
  if (s === 'done') return 'failed';
  return 'pending';
}

function getExercise(db: Record<string, SsExercise>, id: string): SsExercise {
  return db[id] ?? { id, name: id, muscleGroup: '', weightLbs: DEFAULT_WEIGHT, lastWeightLbs: null, lastOutcome: null };
}

export const useSupersetStore = create<SupersetStore>()(
  subscribeWithSelector((set, get) => {
    const loaded = loadFromStorage<Partial<SupersetProgram>>(KEY, {});

    // Merge built-in exercise DB with any saved DB (saved takes precedence for weights/outcomes)
    // Backfill muscleGroup from built-in DB for any saved entries that predate this field
    const savedDb = (loaded as SupersetProgram).exerciseDb ?? {};
    const mergedDb: Record<string, SsExercise> = { ...BUILT_IN_EXERCISE_DB };
    for (const [id, saved] of Object.entries(savedDb)) {
      mergedDb[id] = {
        ...(BUILT_IN_EXERCISE_DB[id] ?? {}),
        ...saved,
        // backfill muscleGroup if the saved entry is missing it
        muscleGroup: saved.muscleGroup || BUILT_IN_EXERCISE_DB[id]?.muscleGroup || '',
      } as SsExercise;
    }

    const initial: SupersetProgram = {
      exerciseDb: mergedDb,
      customDefs: (loaded as SupersetProgram).customDefs ?? [],
      customMuscleGroups: (loaded as SupersetProgram).customMuscleGroups ?? [],
      sessions: (loaded as SupersetProgram).sessions ?? [],
      activeSessionId: (loaded as SupersetProgram).activeSessionId ?? null,
    };

    return {
      ...initial,

      startSession: (entries) => {
        const id = crypto.randomUUID();
        const db = get().exerciseDb;

        const sessionEntries: SsSessionEntry[] = entries.map((e) => {
          const exA = getExercise(db, e.exerciseAId);
          const exB = getExercise(db, e.exerciseBId);
          const makeSets = (n: number) =>
            Array.from({ length: n }, () => ({
              stateA: 'pending' as SsSetState,
              stateB: 'pending' as SsSetState,
            }));
          return {
            defId: e.defId,
            name: e.defName,
            muscleGroup: e.muscleGroup,
            exerciseAId: e.exerciseAId,
            exerciseBId: e.exerciseBId,
            exerciseAName: exA.name,
            exerciseBName: exB.name,
            numSets: e.numSets,
            weightA: exA.weightLbs,
            weightB: exB.weightLbs,
            lastWeightA: exA.lastWeightLbs,
            lastWeightB: exB.lastWeightLbs,
            lastOutcomeA: exA.lastOutcome,
            lastOutcomeB: exB.lastOutcome,
            sets: makeSets(e.numSets),
          };
        });

        const session: SsSession = {
          id,
          date: new Date().toISOString(),
          entries: sessionEntries,
          completed: false,
        };

        set((s) => {
          const next: SupersetProgram = {
            ...s,
            sessions: [...s.sessions, session],
            activeSessionId: id,
          };
          persist(next);
          return next;
        });
      },

      toggleSetState: (sessionId, entryIdx, setIdx, side) =>
        set((s) => {
          const sessions = s.sessions.map((session) => {
            if (session.id !== sessionId) return session;
            const entries = session.entries.map((entry, ei) => {
              if (ei !== entryIdx) return entry;
              const sets = entry.sets.map((st, si) => {
                if (si !== setIdx) return st;
                if (side === 'A') return { ...st, stateA: nextSetState(st.stateA) };
                return { ...st, stateB: nextSetState(st.stateB) };
              });
              return { ...entry, sets };
            });
            return { ...session, entries };
          });
          const next: SupersetProgram = { ...s, sessions };
          persist(next);
          return next;
        }),

      adjustWeight: (sessionId, entryIdx, side, delta) =>
        set((s) => {
          const sessions = s.sessions.map((session) => {
            if (session.id !== sessionId) return session;
            const entries = session.entries.map((entry, ei) => {
              if (ei !== entryIdx) return entry;
              if (side === 'A') return { ...entry, weightA: Math.max(0, entry.weightA + delta) };
              return { ...entry, weightB: Math.max(0, entry.weightB + delta) };
            });
            return { ...session, entries };
          });
          const next: SupersetProgram = { ...s, sessions };
          persist(next);
          return next;
        }),

      completeSession: (sessionId) =>
        set((s) => {
          const session = s.sessions.find((ss) => ss.id === sessionId);
          if (!session) return s;

          const newDb = { ...s.exerciseDb };

          for (const entry of session.entries) {
            const anyFailedA = entry.sets.some((st) => st.stateA === 'failed');
            const allDoneA = entry.sets.every((st) => st.stateA === 'done');
            const anyFailedB = entry.sets.some((st) => st.stateB === 'failed');
            const allDoneB = entry.sets.every((st) => st.stateB === 'done');

            const newWeightA = allDoneA ? entry.weightA + 5 : anyFailedA ? Math.max(0, entry.weightA - 5) : entry.weightA;
            const newWeightB = allDoneB ? entry.weightB + 5 : anyFailedB ? Math.max(0, entry.weightB - 5) : entry.weightB;
            const outcomeA: 'success' | 'failure' | null = allDoneA ? 'success' : anyFailedA ? 'failure' : null;
            const outcomeB: 'success' | 'failure' | null = allDoneB ? 'success' : anyFailedB ? 'failure' : null;

            const prevA = getExercise(newDb, entry.exerciseAId);
            newDb[entry.exerciseAId] = {
              ...prevA,
              weightLbs: newWeightA,
              lastWeightLbs: entry.weightA,
              lastOutcome: outcomeA ?? prevA.lastOutcome,
            };
            const prevB = getExercise(newDb, entry.exerciseBId);
            newDb[entry.exerciseBId] = {
              ...prevB,
              weightLbs: newWeightB,
              lastWeightLbs: entry.weightB,
              lastOutcome: outcomeB ?? prevB.lastOutcome,
            };
          }

          const sessions = s.sessions.map((ss) =>
            ss.id === sessionId ? { ...ss, completed: true } : ss,
          );
          const next: SupersetProgram = {
            ...s,
            exerciseDb: newDb,
            sessions,
            activeSessionId: null,
          };
          persist(next);
          return next;
        }),

      cancelSession: (sessionId) =>
        set((s) => {
          const next: SupersetProgram = {
            ...s,
            sessions: s.sessions.filter((ss) => ss.id !== sessionId),
            activeSessionId: null,
          };
          persist(next);
          return next;
        }),

      ensureExercise: (name, muscleGroup = '') => {
        const id = ssExSlug(name);
        set((s) => {
          if (s.exerciseDb[id]) return s;
          const newEx: SsExercise = { id, name, muscleGroup, weightLbs: DEFAULT_WEIGHT, lastWeightLbs: null, lastOutcome: null };
          const next: SupersetProgram = { ...s, exerciseDb: { ...s.exerciseDb, [id]: newEx } };
          persist(next);
          return next;
        });
        return id;
      },

      addCustomDef: (defData) => {
        const id = crypto.randomUUID();
        const newDef: SsDef = { ...defData, id, isCustom: true };
        set((s) => {
          // Ensure both exercises exist in db
          const dbUpdates: Record<string, SsExercise> = {};
          for (const exId of [newDef.exerciseAId, newDef.exerciseBId]) {
            if (!s.exerciseDb[exId]) {
              dbUpdates[exId] = { id: exId, name: exId, muscleGroup: newDef.muscleGroup ?? '', weightLbs: DEFAULT_WEIGHT, lastWeightLbs: null, lastOutcome: null };
            }
          }
          const next: SupersetProgram = {
            ...s,
            exerciseDb: { ...s.exerciseDb, ...dbUpdates },
            customDefs: [...s.customDefs, newDef],
          };
          persist(next);
          return next;
        });
        return newDef;
      },

      removeCustomDef: (defId) =>
        set((s) => {
          const next: SupersetProgram = { ...s, customDefs: s.customDefs.filter((d) => d.id !== defId) };
          persist(next);
          return next;
        }),

      addCustomMuscleGroup: (groupData) => {
        const id = crypto.randomUUID();
        const newGroup: CustomMuscleGroup = { ...groupData, id };
        set((s) => {
          const next: SupersetProgram = { ...s, customMuscleGroups: [...s.customMuscleGroups, newGroup] };
          persist(next);
          return next;
        });
        return newGroup;
      },

      removeCustomMuscleGroup: (groupId) =>
        set((s) => {
          const next: SupersetProgram = { ...s, customMuscleGroups: s.customMuscleGroups.filter((g) => g.id !== groupId) };
          persist(next);
          return next;
        }),

      addExercise: (name, weightLbs = DEFAULT_WEIGHT, muscleGroup = '') => {
        const id = ssExSlug(name);
        const existing = get().exerciseDb[id];
        if (existing) return existing;
        const newEx: SsExercise = { id, name, muscleGroup, weightLbs, lastWeightLbs: null, lastOutcome: null };
        set((s) => {
          const next: SupersetProgram = { ...s, exerciseDb: { ...s.exerciseDb, [id]: newEx } };
          persist(next);
          return next;
        });
        return newEx;
      },

      updateExerciseWeight: (id, delta) =>
        set((s) => {
          const ex = s.exerciseDb[id];
          if (!ex) return s;
          const next: SupersetProgram = {
            ...s,
            exerciseDb: { ...s.exerciseDb, [id]: { ...ex, weightLbs: Math.max(0, ex.weightLbs + delta) } },
          };
          persist(next);
          return next;
        }),
    };
  }),
);
