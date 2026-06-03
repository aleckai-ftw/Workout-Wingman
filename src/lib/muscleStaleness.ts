import { useMemo } from 'react';
import { useIndivExerciseStore } from '../stores/individualExerciseStore';
import { useFiveByFiveStore } from '../stores/fiveByFiveStore';
import { useSupersetStore } from '../stores/supersetStore';
import { BUILT_IN_EXERCISES, ALL_EXERCISE_AREAS } from '../data/exercises';
import { BUILT_IN_SS_DEFS } from '../data/supersets';
import type { ExerciseArea } from '../data/exercises';

// ─── Superset muscleGroup key → canonical exercise areas ──────────────────────

const SS_MG_TO_AREAS: Record<string, ExerciseArea[]> = {
  chest_back:       ['Chest', 'Back'],
  biceps_triceps:   ['Biceps', 'Triceps'],
  quads_hamstrings: ['Quads', 'Hamstrings'],
  shoulders_traps:  ['Shoulders'],
  core_glutes:      ['Core', 'Glutes', 'Lower Back', 'Hamstrings'],
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Scans all three workout stores and returns areas that haven't been worked in
 * `thresholdDays` or more. Only surfaces areas that have been worked at least
 * once (new users with no history see no warnings).
 */
export function useMuscleStaleness(thresholdDays = 5): StaleArea[] {
  const indivEntries  = useIndivExerciseStore((s) => s.entries);
  const fxfSessions   = useFiveByFiveStore((s) => s.sessions);
  const fxfExerciseDb = useFiveByFiveStore((s) => s.exerciseDb);
  const ssSessions    = useSupersetStore((s) => s.sessions);

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

    // 1. Individual exercise entries — each has area + date
    for (const entry of indivEntries) {
      if (entry.area) update(entry.area, entry.date);
    }

    // 2. Completed 5×5 sessions — use snapshotted area or fall back to exerciseDb
    for (const session of fxfSessions) {
      if (!session.completed) continue;
      const date = session.date.slice(0, 10);
      for (const ex of session.exercises) {
        const area = ex.area ?? fxfExerciseDb[ex.defId]?.area;
        if (area) update(area, date);
      }
    }

    // 3. Completed superset sessions — map muscleGroup key to canonical areas
    for (const session of ssSessions) {
      if (!session.completed) continue;
      const date = session.date.slice(0, 10);
      for (const entry of session.entries) {
        const areas = SS_MG_TO_AREAS[entry.muscleGroup] ?? [];
        for (const area of areas) update(area, date);
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
  }, [indivEntries, fxfSessions, fxfExerciseDb, ssSessions, thresholdDays]);
}
