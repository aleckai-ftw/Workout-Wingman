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

const SS_MG_LABELS: Record<string, string> = {
  chest_back: 'Chest / Back',
  biceps_triceps: 'Biceps / Triceps',
  quads_hamstrings: 'Quads / Hamstrings',
  shoulders_traps: 'Shoulders / Traps',
  core_glutes: 'Core / Glutes',
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

function normalizeLookupName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function singularizeToken(token: string): string {
  if (token.endsWith('ies') && token.length > 3) return `${token.slice(0, -3)}y`;
  if (token.endsWith('ses') && token.length > 3) return token.slice(0, -2);
  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) return token.slice(0, -1);
  return token;
}

function singularizePhrase(phrase: string): string {
  return phrase
    .split(' ')
    .map(singularizeToken)
    .join(' ')
    .trim();
}

const BUILT_IN_EXERCISE_BY_NORMALIZED_NAME: Record<string, (typeof BUILT_IN_EXERCISES)[number]> =
  Object.fromEntries(
    BUILT_IN_EXERCISES.flatMap((e) => {
      const normalized = normalizeLookupName(e.name);
      const singular = singularizePhrase(normalized);
      return [
        [normalized, e],
        [singular, e],
      ];
    }),
  );

function normalizeMuscleGroupKey(muscleGroup: string): string {
  const trimmed = muscleGroup.trim();
  if (!trimmed) return '';
  if (SS_MG_LABELS[trimmed]) return trimmed;
  if (trimmed in SS_MG_LABELS) return trimmed;

  const normalized = normalizeLookupName(trimmed);
  const singular = singularizePhrase(normalized);

  for (const [key, label] of Object.entries(SS_MG_LABELS)) {
    const labelNorm = normalizeLookupName(label);
    if (normalized === labelNorm || singular === singularizePhrase(labelNorm)) return key;
  }

  return singular;
}

const AREA_TO_MUSCLE_INDICATORS: Record<ExerciseArea, string[]> = Object.fromEntries(
  ALL_EXERCISE_AREAS.map((area) => {
    const indicators = BUILT_IN_EXERCISES
      .filter((e) => e.areas.includes(area))
      .map((e) => normalizeMuscleGroupKey(e.muscleGroup))
      .filter((v) => v.length > 0);
    return [area, Array.from(new Set(indicators))];
  }),
) as Record<ExerciseArea, string[]>;

/** Resolve the areas worked by a named exercise. Looks up by name in built-ins,
 *  falls back to the provided fallbackAreas (e.g. from the superset group map). */
function areasForExerciseName(name: string, fallbackAreas: ExerciseArea[]): ExerciseArea[] {
  const direct = BUILT_IN_EXERCISE_BY_NAME[name.toLowerCase()];
  const normalized = normalizeLookupName(name);
  const singular = singularizePhrase(normalized);
  const match = direct ?? BUILT_IN_EXERCISE_BY_NORMALIZED_NAME[normalized] ?? BUILT_IN_EXERCISE_BY_NORMALIZED_NAME[singular];
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

    const lastWorkedByMuscleIndicator = new Map<string, string>(); // muscle indicator → YYYY-MM-DD
    const fallbackLastWorkedByArea = new Map<string, string>(); // area → YYYY-MM-DD

    function updateMap(map: Map<string, string>, key: string, date: string) {
      if (!key) return;
      const d = date.slice(0, 10);
      const prev = map.get(key);
      if (!prev || d > prev) map.set(key, d);
    }

    function updateAreasFallback(areas: ExerciseArea[], date: string) {
      for (const area of areas) updateMap(fallbackLastWorkedByArea, area, date);
    }

    function updateMuscleIndicator(muscleGroup: string | undefined, date: string) {
      if (!muscleGroup) return;
      const key = normalizeMuscleGroupKey(muscleGroup);
      if (!key) return;
      updateMap(lastWorkedByMuscleIndicator, key, date);
    }

    // 1. Individual entries — use muscleGroup first, area fallback second
    for (const entry of indivEntries) {
      const builtIn = entry.defId ? BUILT_IN_EXERCISE_BY_ID[entry.defId] : null;
      if (builtIn) {
        updateMuscleIndicator(builtIn.muscleGroup, entry.date);
        updateAreasFallback(builtIn.areas as ExerciseArea[], entry.date);
      } else {
        updateMuscleIndicator(entry.muscleGroup, entry.date);
        if (entry.area) updateMap(fallbackLastWorkedByArea, entry.area, entry.date);
      }
    }

    // 2. Completed 5x5 sessions — muscleGroup first, then area fallback
    for (const session of fxfSessions) {
      if (!session.completed) continue;
      const date = session.date.slice(0, 10);
      for (const ex of session.exercises) {
        const fallbackDef = FXF_DEFAULT_DB[ex.defId];
        updateMuscleIndicator(ex.muscleGroup ?? fallbackDef?.muscleGroup, date);

        const areas =
          (ex.areas as ExerciseArea[] | undefined) ??
          (fallbackDef?.areas as ExerciseArea[] | undefined);
        if (areas?.length) {
          updateAreasFallback(areas, date);
        } else {
          const fallbackArea = ex.area ?? fallbackDef?.area;
          if (fallbackArea) updateMap(fallbackLastWorkedByArea, fallbackArea, date);
        }
      }
    }

    // 3. Completed superset sessions — per-exercise muscleGroup first, then area fallback
    for (const session of ssSessions) {
      if (!session.completed) continue;
      const date = session.date.slice(0, 10);
      for (const entry of session.entries) {
        const fallback = SS_MG_FALLBACK_AREAS[entry.muscleGroup] ?? [];

        const aBuiltIn = (() => {
          const normalized = normalizeLookupName(entry.exerciseAName);
          const singular = singularizePhrase(normalized);
          return (
            BUILT_IN_EXERCISE_BY_NAME[entry.exerciseAName.toLowerCase()] ??
            BUILT_IN_EXERCISE_BY_NORMALIZED_NAME[normalized] ??
            BUILT_IN_EXERCISE_BY_NORMALIZED_NAME[singular]
          );
        })();
        const bBuiltIn = (() => {
          const normalized = normalizeLookupName(entry.exerciseBName);
          const singular = singularizePhrase(normalized);
          return (
            BUILT_IN_EXERCISE_BY_NAME[entry.exerciseBName.toLowerCase()] ??
            BUILT_IN_EXERCISE_BY_NORMALIZED_NAME[normalized] ??
            BUILT_IN_EXERCISE_BY_NORMALIZED_NAME[singular]
          );
        })();

        updateMuscleIndicator(aBuiltIn?.muscleGroup ?? entry.muscleGroup, date);
        updateMuscleIndicator(bBuiltIn?.muscleGroup ?? entry.muscleGroup, date);

        updateAreasFallback(areasForExerciseName(entry.exerciseAName, fallback), date);
        updateAreasFallback(areasForExerciseName(entry.exerciseBName, fallback), date);
      }
    }

    const today = todayKey();
    const stale: StaleArea[] = [];

    for (const area of ALL_EXERCISE_AREAS) {
      if (area === 'Full-Body') continue;

      const indicatorDates = AREA_TO_MUSCLE_INDICATORS[area]
        .map((indicator) => lastWorkedByMuscleIndicator.get(indicator))
        .filter((d): d is string => Boolean(d));

      const muscleDrivenLastDate = indicatorDates.length
        ? indicatorDates.reduce((latest, current) => (current > latest ? current : latest), indicatorDates[0])
        : null;

      const lastDate = muscleDrivenLastDate ?? fallbackLastWorkedByArea.get(area);
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
