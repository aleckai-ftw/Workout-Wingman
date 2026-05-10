import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DailyServing, FoodItem, ProteinDay } from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';

const PROTEIN_KEY = 'ww_protein';

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ─── Total computation (exported so any component can use it) ─────────────────

export function computeDayTotal(servings: DailyServing[], allFoods: FoodItem[]): number {
  return servings.reduce((sum, s) => {
    const food = allFoods.find((f) => f.id === s.foodId);
    return sum + (food ? food.proteinPerServing * s.servings : 0);
  }, 0);
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ProteinStore {
  days: Record<string, ProteinDay>;
  /** Add 1 serving of a food. If already logged today, increments existing entry. */
  addServing: (foodId: string, defaultGoalG?: number) => void;
  /** Set exact serving count. Pass 0 to remove. */
  setServings: (date: string, servingId: string, count: number) => void;
  removeServing: (date: string, servingId: string) => void;
  setGoal: (date: string, goalG: number) => void;
  todayServings: () => DailyServing[];
}

function persist(days: Record<string, ProteinDay>) {
  saveToStorage(PROTEIN_KEY, days);
}

function ensureDay(
  days: Record<string, ProteinDay>,
  date: string,
  goalG: number,
): ProteinDay {
  return days[date] ?? { date, servings: [], goalG };
}

export const useProteinStore = create<ProteinStore>()(
  subscribeWithSelector((set, get) => ({
    days: loadFromStorage(PROTEIN_KEY, {}),

    addServing: (foodId, defaultGoalG = 180) =>
      set((s) => {
        const date = todayDateKey();
        const day = ensureDay(s.days, date, defaultGoalG);
        const existing = day.servings.find((sv) => sv.foodId === foodId);

        let updatedServings: DailyServing[];
        if (existing) {
          // Increment serving count
          updatedServings = day.servings.map((sv) =>
            sv.foodId === foodId ? { ...sv, servings: sv.servings + 1 } : sv,
          );
        } else {
          // Add new entry
          const newEntry: DailyServing = {
            id: crypto.randomUUID(),
            foodId,
            servings: 1,
            timestamp: new Date().toISOString(),
          };
          updatedServings = [...day.servings, newEntry];
        }

        const next = {
          ...s.days,
          [date]: { ...day, servings: updatedServings },
        };
        persist(next);
        return { days: next };
      }),

    setServings: (date, servingId, count) =>
      set((s) => {
        const day = s.days[date];
        if (!day) return {};

        const updatedServings =
          count <= 0
            ? day.servings.filter((sv) => sv.id !== servingId)
            : day.servings.map((sv) => (sv.id === servingId ? { ...sv, servings: count } : sv));

        const next = { ...s.days, [date]: { ...day, servings: updatedServings } };
        persist(next);
        return { days: next };
      }),

    removeServing: (date, servingId) =>
      set((s) => {
        const day = s.days[date];
        if (!day) return {};
        const next = {
          ...s.days,
          [date]: { ...day, servings: day.servings.filter((sv) => sv.id !== servingId) },
        };
        persist(next);
        return { days: next };
      }),

    setGoal: (date, goalG) =>
      set((s) => {
        const day = ensureDay(s.days, date, goalG);
        const next = { ...s.days, [date]: { ...day, goalG } };
        persist(next);
        return { days: next };
      }),

    todayServings: () => {
      const day = get().days[todayDateKey()];
      return day?.servings ?? [];
    },
  })),
);
