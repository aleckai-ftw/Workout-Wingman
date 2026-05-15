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
  SsWorkoutTemplate,
  SsWorkoutTemplateEntry,
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
  /** Cycle pending → done → failed for one side of one set */
  toggleSetState: (sessionId: string, entryIdx: number, setIdx: number, side: 'A' | 'B') => void;
  /** Adjust target reps for one exercise side in the active session (also persists to exerciseDb) */
  adjustTargetReps: (sessionId: string, entryIdx: number, side: 'A' | 'B', delta: number) => void;
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
  addExercise: (name: string, weightLbs?: number, muscleGroup?: string, targetReps?: number) => SsExercise;
  /** Adjust the weight for an exercise in the db */
  updateExerciseWeight: (id: string, delta: number) => void;
  /** Adjust the target reps for an exercise in the db */
  updateExerciseTargetReps: (id: string, delta: number) => void;
  /** Swap an entry in the active session for a different superset */
  swapSessionEntry: (sessionId: string, entryIdx: number, newEntry: StartEntry) => void;
  /** Save the current slot plan as a named template */
  saveWorkoutTemplate: (title: string, entries: SsWorkoutTemplateEntry[]) => SsWorkoutTemplate;
  /** Delete a saved workout template */
  deleteWorkoutTemplate: (id: string) => void;
  /** Rename a saved workout template */
  renameWorkoutTemplate: (id: string, title: string) => void;
}

function persist(state: SupersetProgram) {
  saveToStorage(KEY, state);
}

function nextSetState(s: SsSetState): SsSetState {
  if (s === 'pending') return 'done';
  if (s === 'done') return 'failed';
  return 'pending';
}

function deriveSetState(reps: number, target: number): SsSetState {
  if (reps === 0) return 'pending';
  if (reps >= target) return 'done';
  return 'failed';
}

function getExercise(db: Record<string, SsExercise>, id: string): SsExercise {
  return db[id] ?? { id, name: id, muscleGroup: '', weightLbs: DEFAULT_WEIGHT, lastWeightLbs: null, lastOutcome: null, targetReps: 10 };
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
        muscleGroup: saved.muscleGroup || BUILT_IN_EXERCISE_DB[id]?.muscleGroup || '',
        targetReps: saved.targetReps ?? BUILT_IN_EXERCISE_DB[id]?.targetReps ?? 10,
      } as SsExercise;
    }

    // Migrate old session format: repsA/repsB → stateA/stateB, backfill targetRepsA/B
    const rawSessions = (loaded as SupersetProgram).sessions ?? [];
    const migratedSessions: SsSession[] = rawSessions.map((session) => ({
      ...session,
      entries: session.entries.map((entry) => {
        const tA = (entry as any).targetRepsA ?? 10;
        const tB = (entry as any).targetRepsB ?? 10;
        return {
          ...entry,
          targetRepsA: tA,
          targetRepsB: tB,
          sets: entry.sets.map((st) => {
            const s = st as any;
            // Already new stateA/stateB format
            if (s.stateA !== undefined) return st;
            // Migrate from repsA/repsB format
            return {
              stateA: deriveSetState(s.repsA ?? 0, tA),
              stateB: deriveSetState(s.repsB ?? 0, tB),
            };
          }),
        };
      }),
    }));

    const initial: SupersetProgram = {
      exerciseDb: mergedDb,
      customDefs: (loaded as SupersetProgram).customDefs ?? [],
      customMuscleGroups: (loaded as SupersetProgram).customMuscleGroups ?? [],
      sessions: migratedSessions,
      activeSessionId: (loaded as SupersetProgram).activeSessionId ?? null,
      workoutTemplates: (loaded as SupersetProgram).workoutTemplates ?? [],
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
            targetRepsA: exA.targetReps ?? 10,
            targetRepsB: exB.targetReps ?? 10,
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

      adjustTargetReps: (sessionId, entryIdx, side, delta) =>
        set((s) => {
          const session = s.sessions.find((ss) => ss.id === sessionId);
          if (!session) return s;
          const entry = session.entries[entryIdx];
          if (!entry) return s;
          const exId = side === 'A' ? entry.exerciseAId : entry.exerciseBId;
          const currentTarget = side === 'A' ? entry.targetRepsA : entry.targetRepsB;
          const newTarget = Math.max(1, currentTarget + delta);
          const sessions = s.sessions.map((ss) => {
            if (ss.id !== sessionId) return ss;
            const entries = ss.entries.map((e, ei) => {
              if (ei !== entryIdx) return e;
              return side === 'A' ? { ...e, targetRepsA: newTarget } : { ...e, targetRepsB: newTarget };
            });
            return { ...ss, entries };
          });
          const ex = s.exerciseDb[exId];
          const newDb = ex
            ? { ...s.exerciseDb, [exId]: { ...ex, targetReps: newTarget } }
            : s.exerciseDb;
          const next: SupersetProgram = { ...s, sessions, exerciseDb: newDb };
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
              targetReps: tA,
            };
            const prevB = getExercise(newDb, entry.exerciseBId);
            newDb[entry.exerciseBId] = {
              ...prevB,
              weightLbs: newWeightB,
              lastWeightLbs: entry.weightB,
              lastOutcome: outcomeB ?? prevB.lastOutcome,
              targetReps: tB,
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

      addExercise: (name, weightLbs = DEFAULT_WEIGHT, muscleGroup = '', targetReps = 10) => {
        const id = ssExSlug(name);
        const existing = get().exerciseDb[id];
        if (existing) return existing;
        const newEx: SsExercise = { id, name, muscleGroup, weightLbs, lastWeightLbs: null, lastOutcome: null, targetReps };
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

      updateExerciseTargetReps: (id, delta) =>
        set((s) => {
          const ex = s.exerciseDb[id];
          if (!ex) return s;
          const next: SupersetProgram = {
            ...s,
            exerciseDb: { ...s.exerciseDb, [id]: { ...ex, targetReps: Math.max(1, (ex.targetReps ?? 10) + delta) } },
          };
          persist(next);
          return next;
        }),

      swapSessionEntry: (sessionId, entryIdx, newEntry) =>
        set((s) => {
          const db = s.exerciseDb;
          const exA = getExercise(db, newEntry.exerciseAId);
          const exB = getExercise(db, newEntry.exerciseBId);
          const makeSets = (n: number) =>
            Array.from({ length: n }, () => ({
              stateA: 'pending' as SsSetState,
              stateB: 'pending' as SsSetState,
            }));
          const newEntryData: SsSessionEntry = {
            defId: newEntry.defId,
            name: newEntry.defName,
            muscleGroup: newEntry.muscleGroup,
            exerciseAId: newEntry.exerciseAId,
            exerciseBId: newEntry.exerciseBId,
            exerciseAName: exA.name,
            exerciseBName: exB.name,
            numSets: newEntry.numSets,
            weightA: exA.weightLbs,
            weightB: exB.weightLbs,
            lastWeightA: exA.lastWeightLbs,
            lastWeightB: exB.lastWeightLbs,
            lastOutcomeA: exA.lastOutcome,
            lastOutcomeB: exB.lastOutcome,
            targetRepsA: exA.targetReps ?? 10,
            targetRepsB: exB.targetReps ?? 10,
            sets: makeSets(newEntry.numSets),
          };
          const sessions = s.sessions.map((session) => {
            if (session.id !== sessionId) return session;
            const entries = session.entries.map((entry, ei) =>
              ei !== entryIdx ? entry : newEntryData,
            );
            return { ...session, entries };
          });
          const next: SupersetProgram = { ...s, sessions };
          persist(next);
          return next;
        }),

      saveWorkoutTemplate: (title, entries) => {
        const template: SsWorkoutTemplate = {
          id: crypto.randomUUID(),
          title: title.trim() || 'My Workout',
          createdAt: new Date().toISOString(),
          entries,
        };
        set((s) => {
          const next: SupersetProgram = { ...s, workoutTemplates: [...s.workoutTemplates, template] };
          persist(next);
          return next;
        });
        return template;
      },

      deleteWorkoutTemplate: (id) =>
        set((s) => {
          const next: SupersetProgram = { ...s, workoutTemplates: s.workoutTemplates.filter((t) => t.id !== id) };
          persist(next);
          return next;
        }),

      renameWorkoutTemplate: (id, title) =>
        set((s) => {
          const next: SupersetProgram = {
            ...s,
            workoutTemplates: s.workoutTemplates.map((t) =>
              t.id === id ? { ...t, title: title.trim() || t.title } : t,
            ),
          };
          persist(next);
          return next;
        }),
    };
  }),
);
