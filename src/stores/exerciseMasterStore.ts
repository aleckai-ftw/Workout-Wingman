import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BUILT_IN_EXERCISES } from '../data/exercises';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import type {
  ExerciseLastPerformance,
  ExerciseMaster,
  ExercisePerformanceMode,
  ExercisePerformanceOutcome,
} from '../types';

const KEY = 'ww_exercise_master_v1';

interface PersistedState {
  exercises: Record<string, ExerciseMaster>;
}

interface UpsertExerciseInput {
  id?: string;
  name: string;
  primaryArea?: string;
  areas?: string[];
  primaryMuscleGroup?: string;
  muscleGroups?: string[];
  source?: ExerciseMaster['source'];
  aliases?: string[];
}

interface RecordPerformanceInput {
  exerciseId: string;
  mode: ExercisePerformanceMode;
  weightLbs: number | null;
  reps: number | null;
  outcome: ExercisePerformanceOutcome;
  at?: string;
}

interface ExerciseMasterStore extends PersistedState {
  getById: (id: string) => ExerciseMaster | undefined;
  findByName: (name: string) => ExerciseMaster | undefined;
  upsertExercise: (input: UpsertExerciseInput) => string;
  recordPerformance: (input: RecordPerformanceInput) => void;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeEmptyPerformance(): Record<ExercisePerformanceMode, ExerciseLastPerformance | null> {
  return {
    individual: null,
    '5x5': null,
    superset: null,
  };
}

function makeExerciseId(name: string): string {
  return 'mx-' + normalizeName(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toUnique(values: string[]): string[] {
  return Array.from(new Set(values.filter((v) => v.trim().length > 0)));
}

function ensurePrimary(first: string | undefined, all: string[]): string {
  if (first && first.trim().length > 0) return first;
  if (all.length > 0) return all[0];
  return '';
}

function mergePerformance(
  existing: ExerciseMaster | undefined,
  partial?: Partial<ExerciseMaster>,
): ExerciseMaster['lastPerformance'] {
  const baseGlobal = existing?.lastPerformance.global ?? null;
  const baseByMode = existing?.lastPerformance.byMode ?? makeEmptyPerformance();
  return {
    global: partial?.lastPerformance?.global ?? baseGlobal,
    byMode: {
      individual: partial?.lastPerformance?.byMode?.individual ?? baseByMode.individual ?? null,
      '5x5': partial?.lastPerformance?.byMode?.['5x5'] ?? baseByMode['5x5'] ?? null,
      superset: partial?.lastPerformance?.byMode?.superset ?? baseByMode.superset ?? null,
    },
  };
}

function seedBuiltIns(existing: Record<string, ExerciseMaster>): Record<string, ExerciseMaster> {
  const next = { ...existing };
  for (const ex of BUILT_IN_EXERCISES) {
    const prev = next[ex.id];
    next[ex.id] = {
      id: ex.id,
      name: ex.name,
      primaryArea: ex.area,
      areas: toUnique([ex.area, ...ex.areas]),
      primaryMuscleGroup: ex.muscleGroup,
      muscleGroups: toUnique([ex.muscleGroup]),
      source: 'built-in',
      aliases: toUnique([normalizeName(ex.name), ...(prev?.aliases ?? [])]),
      lastPerformance: mergePerformance(prev),
      updatedAt: prev?.updatedAt ?? nowIso(),
    };
  }
  return next;
}

function persist(state: PersistedState) {
  saveToStorage(KEY, state);
}

function loadState(): PersistedState {
  const loaded = loadFromStorage<PersistedState>(KEY, { exercises: {} });
  return { exercises: seedBuiltIns(loaded.exercises ?? {}) };
}

export const useExerciseMasterStore = create<ExerciseMasterStore>()(
  subscribeWithSelector((set, get) => {
    const initial = loadState();

    return {
      ...initial,

      getById: (id) => get().exercises[id],

      findByName: (name) => {
        const normalized = normalizeName(name);
        return Object.values(get().exercises).find(
          (ex) => normalizeName(ex.name) === normalized || ex.aliases.includes(normalized),
        );
      },

      upsertExercise: (input) => {
        const existingByName = get().findByName(input.name);
        const id = input.id ?? existingByName?.id ?? makeExerciseId(input.name);

        const inputAreas = toUnique([...(input.areas ?? []), input.primaryArea ?? '']);
        const inputMuscles = toUnique([...(input.muscleGroups ?? []), input.primaryMuscleGroup ?? '']);

        set((s) => {
          const prev = s.exercises[id] ?? existingByName;
          const mergedAreas = toUnique([...(prev?.areas ?? []), ...inputAreas]);
          const mergedMuscles = toUnique([...(prev?.muscleGroups ?? []), ...inputMuscles]);
          const mergedAliases = toUnique([
            ...(prev?.aliases ?? []),
            normalizeName(input.name),
            ...(input.aliases ?? []).map(normalizeName),
          ]);

          const nextExercise: ExerciseMaster = {
            id,
            name: input.name,
            primaryArea: ensurePrimary(input.primaryArea ?? prev?.primaryArea, mergedAreas),
            areas: mergedAreas,
            primaryMuscleGroup: ensurePrimary(input.primaryMuscleGroup ?? prev?.primaryMuscleGroup, mergedMuscles),
            muscleGroups: mergedMuscles,
            source:
              prev?.source === 'built-in'
                ? 'built-in'
                : input.source ?? prev?.source ?? 'custom',
            aliases: mergedAliases,
            lastPerformance: mergePerformance(prev),
            updatedAt: nowIso(),
          };

          const next: PersistedState = {
            exercises: {
              ...s.exercises,
              [id]: nextExercise,
            },
          };
          persist(next);
          return next;
        });

        return id;
      },

      recordPerformance: ({ exerciseId, mode, weightLbs, reps, outcome, at }) => {
        set((s) => {
          const prev = s.exercises[exerciseId];
          if (!prev) return s;

          const perf: ExerciseLastPerformance = {
            weightLbs,
            reps,
            outcome,
            at: at ?? nowIso(),
          };

          const nextExercise: ExerciseMaster = {
            ...prev,
            lastPerformance: {
              global: perf,
              byMode: {
                ...prev.lastPerformance.byMode,
                [mode]: perf,
              },
            },
            updatedAt: nowIso(),
          };

          const next: PersistedState = {
            exercises: {
              ...s.exercises,
              [exerciseId]: nextExercise,
            },
          };
          persist(next);
          return next;
        });
      },
    };
  }),
);

export function syncMasterExerciseMetadata(input: UpsertExerciseInput): string {
  return useExerciseMasterStore.getState().upsertExercise(input);
}

export function recordMasterPerformance(input: RecordPerformanceInput): void {
  useExerciseMasterStore.getState().recordPerformance(input);
}
