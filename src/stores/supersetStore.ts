import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  SupersetProgram,
  SsDef,
  SsDefState,
  SsSessionEntry,
  SsSession,
  SsSetState,
  CustomMuscleGroup,
} from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';

const KEY = 'ww_superset_v2';

const DEFAULT_WEIGHT = 45;

interface StartEntry {
  defId: string;
  defName: string;
  exerciseA: string;
  exerciseB: string;
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
}

function persist(state: SupersetProgram) {
  saveToStorage(KEY, state);
}

function nextSetState(s: SsSetState): SsSetState {
  if (s === 'pending') return 'done';
  if (s === 'done') return 'failed';
  return 'pending';
}

function makeDefState(defId: string): SsDefState {
  return {
    defId,
    weightA: DEFAULT_WEIGHT,
    weightB: DEFAULT_WEIGHT,
    lastWeightA: null,
    lastWeightB: null,
    lastOutcomeA: null,
    lastOutcomeB: null,
  };
}

function getOrMakeState(defStates: Record<string, SsDefState>, defId: string): SsDefState {
  return defStates[defId] ?? makeDefState(defId);
}

export const useSupersetStore = create<SupersetStore>()(
  subscribeWithSelector((set, get) => {
    const initial = loadFromStorage<SupersetProgram>(KEY, {
      customDefs: [],
      customMuscleGroups: [],
      defStates: {},
      sessions: [],
      activeSessionId: null,
    });
    // backfill for existing saves without the field
    if (!initial.customMuscleGroups) initial.customMuscleGroups = [];

    return {
      ...initial,

      startSession: (entries) => {
        const id = crypto.randomUUID();
        const defStates = get().defStates;

        const sessionEntries: SsSessionEntry[] = entries.map((e) => {
          const state = getOrMakeState(defStates, e.defId);
          const makeSets = (n: number) =>
            Array.from({ length: n }, () => ({
              stateA: 'pending' as SsSetState,
              stateB: 'pending' as SsSetState,
            }));
          return {
            defId: e.defId,
            name: e.defName,
            muscleGroup: e.muscleGroup,
            exerciseA: e.exerciseA,
            exerciseB: e.exerciseB,
            numSets: e.numSets,
            weightA: state.weightA,
            weightB: state.weightB,
            lastWeightA: state.lastWeightA,
            lastWeightB: state.lastWeightB,
            lastOutcomeA: state.lastOutcomeA,
            lastOutcomeB: state.lastOutcomeB,
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

          const newDefStates = { ...s.defStates };

          for (const entry of session.entries) {
            const anyFailedA = entry.sets.some((st) => st.stateA === 'failed');
            const allDoneA = entry.sets.every((st) => st.stateA === 'done');
            const anyFailedB = entry.sets.some((st) => st.stateB === 'failed');
            const allDoneB = entry.sets.every((st) => st.stateB === 'done');

            const newWeightA = allDoneA
              ? entry.weightA + 5
              : anyFailedA
              ? Math.max(0, entry.weightA - 5)
              : entry.weightA;
            const newWeightB = allDoneB
              ? entry.weightB + 5
              : anyFailedB
              ? Math.max(0, entry.weightB - 5)
              : entry.weightB;

            const outcomeA: 'success' | 'failure' | null = allDoneA
              ? 'success'
              : anyFailedA
              ? 'failure'
              : null;
            const outcomeB: 'success' | 'failure' | null = allDoneB
              ? 'success'
              : anyFailedB
              ? 'failure'
              : null;

            const prev = getOrMakeState(newDefStates, entry.defId);
            newDefStates[entry.defId] = {
              defId: entry.defId,
              weightA: newWeightA,
              weightB: newWeightB,
              lastWeightA: entry.weightA,
              lastWeightB: entry.weightB,
              lastOutcomeA: outcomeA ?? prev.lastOutcomeA,
              lastOutcomeB: outcomeB ?? prev.lastOutcomeB,
            };
          }

          const sessions = s.sessions.map((ss) =>
            ss.id === sessionId ? { ...ss, completed: true } : ss,
          );
          const next: SupersetProgram = {
            ...s,
            sessions,
            defStates: newDefStates,
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

      addCustomDef: (defData) => {
        const id = crypto.randomUUID();
        const newDef: SsDef = { ...defData, id, isCustom: true };
        set((s) => {
          const next: SupersetProgram = { ...s, customDefs: [...s.customDefs, newDef] };
          persist(next);
          return next;
        });
        return newDef;
      },

      removeCustomDef: (defId) =>
        set((s) => {
          const next: SupersetProgram = {
            ...s,
            customDefs: s.customDefs.filter((d) => d.id !== defId),
          };
          persist(next);
          return next;
        }),

      addCustomMuscleGroup: (groupData) => {
        const id = crypto.randomUUID();
        const newGroup: CustomMuscleGroup = { ...groupData, id };
        set((s) => {
          const next: SupersetProgram = {
            ...s,
            customMuscleGroups: [...s.customMuscleGroups, newGroup],
          };
          persist(next);
          return next;
        });
        return newGroup;
      },
    };
  }),
);
