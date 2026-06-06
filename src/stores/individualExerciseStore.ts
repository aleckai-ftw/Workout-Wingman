import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { IndivExerciseDef, IndivExerciseEntry, IndivSet } from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import { BUILT_IN_EXERCISES } from '../data/exercises';
import { recordMasterPerformance, syncMasterExerciseMetadata } from './exerciseMasterStore';

const STORAGE_KEY = 'ww_indiv_exercises';

export function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersistedState {
  entries: IndivExerciseEntry[];
  customDefs: IndivExerciseDef[];
}

interface IndivExerciseStore extends PersistedState {
  /** All exercise definitions (built-in + custom) */
  allDefs: () => IndivExerciseDef[];
  /** Entries for today */
  todayEntries: () => IndivExerciseEntry[];
  /** Log a new exercise with one or more sets */
  logExercise: (
    defId: string,
    name: string,
    area: string,
    muscleGroup: string,
    sets: Omit<IndivSet, 'id'>[],
  ) => void;
  /** Add a set to an existing entry */
  addSet: (entryId: string, set: Omit<IndivSet, 'id'>) => void;
  /** Remove a set from an existing entry (removes the entry if it was the last set) */
  removeSet: (entryId: string, setId: string) => void;
  /** Update reps or weight for an existing set */
  updateSet: (entryId: string, setId: string, patch: Partial<Pick<IndivSet, 'reps' | 'weightLbs'>>) => void;
  /** Replace all sets on an entry at once (used by the edit sheet) */
  replaceEntrySets: (entryId: string, sets: Omit<IndivSet, 'id'>[]) => void;
  /** Delete an entire exercise entry */
  removeEntry: (entryId: string) => void;
  /** Create a new custom exercise definition */
  addCustomDef: (name: string, area: string, muscleGroup: string) => IndivExerciseDef;
  /** Delete a custom exercise definition */
  removeCustomDef: (defId: string) => void;
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

function loadState(): PersistedState {
  return loadFromStorage<PersistedState>(STORAGE_KEY, { entries: [], customDefs: [] });
}

function persist(state: PersistedState) {
  saveToStorage(STORAGE_KEY, { entries: state.entries, customDefs: state.customDefs });
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useIndivExerciseStore = create<IndivExerciseStore>()(
  subscribeWithSelector((set, get) => {
    const initial = loadState();

    return {
      entries: initial.entries,
      customDefs: initial.customDefs,

      allDefs: () => {
        const { customDefs } = get();
        const builtIn: IndivExerciseDef[] = BUILT_IN_EXERCISES.map((e) => ({
          id: e.id,
          name: e.name,
          area: e.area,
          muscleGroup: e.muscleGroups[0] ?? e.area,
          isCustom: false,
        }));
        return [...builtIn, ...customDefs];
      },

      todayEntries: () => {
        const date = todayDateKey();
        return get().entries.filter((e) => e.date === date);
      },

      logExercise: (defId, name, area, muscleGroup, rawSets) =>
        set((s) => {
          const canonicalId = syncMasterExerciseMetadata({
            id: defId,
            name,
            primaryArea: area,
            areas: [area],
            primaryMuscleGroup: muscleGroup,
            muscleGroups: [muscleGroup],
            source: 'custom',
          });
          const date = todayDateKey();
          const sets: IndivSet[] = rawSets.map((rs) => ({
            id: crypto.randomUUID(),
            reps: rs.reps,
            weightLbs: rs.weightLbs,
          }));
          const entry: IndivExerciseEntry = {
            id: crypto.randomUUID(),
            defId: canonicalId,
            name,
            area,
            muscleGroup,
            date,
            timestamp: new Date().toISOString(),
            sets,
          };
          const next: PersistedState = {
            ...s,
            entries: [...s.entries, entry],
          };
          persist(next);
          const lastSet = sets[sets.length - 1];
          recordMasterPerformance({
            exerciseId: canonicalId,
            mode: 'individual',
            weightLbs: lastSet?.weightLbs ?? null,
            reps: lastSet?.reps ?? null,
            outcome: null,
            at: entry.timestamp,
          });
          return next;
        }),

      addSet: (entryId, rawSet) =>
        set((s) => {
          const newSet: IndivSet = { id: crypto.randomUUID(), ...rawSet };
          const next: PersistedState = {
            ...s,
            entries: s.entries.map((e) =>
              e.id === entryId ? { ...e, sets: [...e.sets, newSet] } : e,
            ),
          };
          persist(next);
          return next;
        }),

      removeSet: (entryId, setId) =>
        set((s) => {
          const entry = s.entries.find((e) => e.id === entryId);
          if (!entry) return {};
          if (entry.sets.length <= 1) {
            // Remove the whole entry if last set
            const next: PersistedState = {
              ...s,
              entries: s.entries.filter((e) => e.id !== entryId),
            };
            persist(next);
            return next;
          }
          const next: PersistedState = {
            ...s,
            entries: s.entries.map((e) =>
              e.id === entryId
                ? { ...e, sets: e.sets.filter((st) => st.id !== setId) }
                : e,
            ),
          };
          persist(next);
          return next;
        }),

      updateSet: (entryId, setId, patch) =>
        set((s) => {
          const next: PersistedState = {
            ...s,
            entries: s.entries.map((e) =>
              e.id === entryId
                ? {
                    ...e,
                    sets: e.sets.map((st) =>
                      st.id === setId ? { ...st, ...patch } : st,
                    ),
                  }
                : e,
            ),
          };
          persist(next);
          return next;
        }),

      replaceEntrySets: (entryId, rawSets) =>
        set((s) => {
          const newSets: IndivSet[] = rawSets.map((rs) => ({
            id: crypto.randomUUID(),
            reps: rs.reps,
            weightLbs: rs.weightLbs,
          }));
          const next: PersistedState = {
            ...s,
            entries: s.entries.map((e) =>
              e.id === entryId ? { ...e, sets: newSets } : e,
            ),
          };
          persist(next);
          return next;
        }),

      removeEntry: (entryId) =>
        set((s) => {
          const next: PersistedState = {
            ...s,
            entries: s.entries.filter((e) => e.id !== entryId),
          };
          persist(next);
          return next;
        }),

      addCustomDef: (name, area, muscleGroup) => {
        const id = syncMasterExerciseMetadata({
          id: crypto.randomUUID(),
          name,
          primaryArea: area,
          areas: [area],
          primaryMuscleGroup: muscleGroup,
          muscleGroups: [muscleGroup],
          source: 'custom',
        });
        const def: IndivExerciseDef = { id, name, area, muscleGroup, isCustom: true };
        set((s) => {
          const next: PersistedState = {
            ...s,
            customDefs: [...s.customDefs, def],
          };
          persist(next);
          return next;
        });
        return def;
      },

      removeCustomDef: (defId) =>
        set((s) => {
          const next: PersistedState = {
            ...s,
            customDefs: s.customDefs.filter((d) => d.id !== defId),
          };
          persist(next);
          return next;
        }),
    };
  }),
);
