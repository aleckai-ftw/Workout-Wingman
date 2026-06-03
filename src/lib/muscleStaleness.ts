import { useMemo } from 'react';
import { useIndivExerciseStore } from '../stores/individualExerciseStore';
import { useFiveByFiveStore, DEFAULT_EXERCISE_DB as FXF_DEFAULT_DB } from '../stores/fiveByFiveStore';
import { useSupersetStore } from '../stores/supersetStore';
import { BUILT_IN_EXERCISES, BUILT_IN_EXERCISE_BY_ID, BUILT_IN_EXERCISE_BY_NAME, ALL_EXERCISE_AREAS } from '../data/exercises';
import { BUILT_IN_SS_DEFS } from '../data/supersets';
import type { ExerciseArea } from '../data/exercises';

// ─── Superset muscleGroup key → fallback areas (used only for custom exercises
//     whose name isn't in BUILT_IN_EXERCISE_BY_NAME) ─────────────────────────

const SS_MG_FALLBACK_AREAS: Record<string, ExerciseArea[]> = {
  chest_back:       ['Chest', 'Back'],
  biceps_triceps:   ['Biceps', 'Triceps'],
  quads_hamstrings: ['Quads', 'Hamstrings'],
  shoulders_traps:  ['Shoulders'],
  core_glutes:      ['Core', 'Glutes'],
};

// Area → best matching superset muscleGroup key (for recommendations)
const AREA_TO_SS_MG: Partial<Record<ExerciseArea, string>> = {
  Chest:      'chest_back',
  Back:       'chest_back',
  Biceps:     'biceps_triceps',
  Triceps:    'biceps_triceps',
  Quads:      'quads_hamstrings',
  Hamstrings: 'quads_hamstrings',
  Shoulders:  'shoulders_traps',
  Core:       'core_glutes',
  Glutes:     'core_glutes',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StaleArea {
  area: ExerciseArea;
  lastWorkedDate: string;  // YYYY-MM-DD
  daysAgo: number;
  recommendedExercise: string;
  recommendedSuperset: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function getRecommendation(area: ExerciseArea): {
  recommendedExercise: string;
  recommendedSuperset: string | null;
} {
  const exercise = BUILT_IN_EXERCISES.find((e) => e.area === area);
  const mgKey = AREA_TO_SS_MG[area];
  const superset = mgKey ? BUILT_IN_SS_DEFS.find((d) => d.muscleGroup === mgKey) : null;
  return {
    recommendedExercise: exercise?.name ?? `${area} exercise`,
    recommendedSuperset: superset?.name ?? null,
  };
}

/** Resolve the areas worked by a named exercise. Looks up by name in built-ins,
 *  falls back to the provided fallbackAreas (e.g. from the superset group map). */
function areasForExerciseName(name: string, fallbackAreas: ExerciseArea[]): ExerciseArea[] {
  const match = BUILT_IN_EXERCISE_BY_NAME[name.toLowerCase()];
  return match ? (match.areas as ExerciseArea[]) : fallbackAreas;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Scans all three workout stores and returns areas that haven't been worked in
 * `thresholdDays` or more. Uses per-exercise multi-muscle area data so that e.g.
 * Overhead Press marks both Shoulders and Triceps, Back Extensions marks Lower
 * Back, Glutes, and Hamstrings, etc.
 */
export function useMuscleStaleness(thresholdDays = 5): StaleArea[] {
  const indivEntries = useIndivExerciseStore((s) => s.entries);
  const fxfSessions  = useFiveByFiveStore((s) => s.sessions);
  const ssSessions   = useSupersetStore((s) => s.sessions);

  return useMemo(() => {
    // Don't warn if the user has never logged anything
    const hasAnyHistory =
      indivEntries.length > 0 ||
      fxfSessions.some((s) => s.completed) ||
      ssSessions.some((s) => s.completed);

    if (!hasAnyHistory) return [];

    const lastWorked = new Map<string, string>(); // area → YYYY-MM-DD

    function update(area: string, date: string) {
      const d = date.slice(0, 10);
      const prev = lastWorked.get(area);
      if (!prev || d > prev) lastWorked.set(area, d);
    }

    function updateAreas(areas: ExerciseArea[], date: string) {
      for (const area of areas) update(area, date);
    }

    // 1. Individual exercise entries — look up full areas[] by defId, fall back to entry.area
    for (const entry of indivEntries) {
      const builtIn = entry.defId ? BUILT_IN_EXERCISE_BY_ID[entry.defId] : null;
      if (builtIn) {
        updateAreas(builtIn.areas as ExerciseArea[], entry.date);
      } else if (entry.area) {
        update(entry.area, entry.date);
      }
    }

    // 2. Completed 5×5 sessions — use areas[] snapshot, fall back to DEFAULT_EXERCISE_DB,
    //    then to single area (covers old localStorage data and custom exercises)
    for (const session of fxfSessions) {
      if (!session.completed) continue;
      const date = session.date.slice(0, 10);
      for (const ex of session.exercises) {
        const areas =
          (ex.areas as ExerciseArea[] | undefined) ??
          (FXF_DEFAULT_DB[ex.defId]?.areas as ExerciseArea[] | undefined);
        if (areas?.length) {
          updateAreas(areas, date);
        } else {
          const fallbackArea = ex.area ?? FXF_DEFAULT_DB[ex.defId]?.area;
          if (fallbackArea) update(fallbackArea, date);
        }
      }
    }

    // 3. Completed superset sessions — look up each individual exercise by name
    //    to get its specific areas[]; fall back to group-level map for custom exercises
    for (const session of ssSessions) {
      if (!session.completed) continue;
      const date = session.date.slice(0, 10);
      for (const entry of session.entries) {
        const fallback = SS_MG_FALLBACK_AREAS[entry.muscleGroup] ?? [];
        updateAreas(areasForExerciseName(entry.exerciseAName, fallback), date);
        updateAreas(areasForExerciseName(entry.exerciseBName, fallback), date);
      }
    }

    const today = todayKey();
    const stale: StaleArea[] = [];

    for (const area of ALL_EXERCISE_AREAS) {
      if (area === 'Full-Body') continue;

      const lastDate = lastWorked.get(area);
      if (!lastDate) continue; // never worked — no warning yet

      const daysAgo = daysBetween(lastDate, today);
      if (daysAgo >= thresholdDays) {
        stale.push({ area, lastWorkedDate: lastDate, daysAgo, ...getRecommendation(area) });
      }
    }

    // Most overdue first
    stale.sort((a, b) => b.daysAgo - a.daysAgo);

    return stale;
  }, [indivEntries, fxfSessions, ssSessions, thresholdDays]);
}
