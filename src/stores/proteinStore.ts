import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DailyServing, FoodItem, LoggedMealEntry, MealIngredient, ProteinDay } from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';

const PROTEIN_KEY = 'ww_protein';

export function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // YYYY-MM-DD local date
}

// ─── Total computation (exported so any component can use it) ─────────────────

export function computeDayTotal(servings: DailyServing[], allFoods: FoodItem[]): number {
  return servings.reduce((sum, s) => {
    const food = allFoods.find((f) => f.id === s.foodId);
    return sum + (food ? food.proteinPerServing * s.servings : 0);
  }, 0);
}

export function computeDayCalories(servings: DailyServing[], allFoods: FoodItem[]): number {
  return servings.reduce((sum, s) => {
    const food = allFoods.find((f) => f.id === s.foodId);
    return sum + (food ? food.caloriesPerServing * s.servings : 0);
  }, 0);
}

export function computeMealProtein(meal: { ingredients: MealIngredient[] }, allFoods: FoodItem[]): number {
  return meal.ingredients.reduce((sum, ing) => {
    const food = allFoods.find((f) => f.id === ing.foodId);
    return sum + (food ? food.proteinPerServing * ing.servings : 0);
  }, 0);
}

export function computeMealCalories(meal: { ingredients: MealIngredient[] }, allFoods: FoodItem[]): number {
  return meal.ingredients.reduce((sum, ing) => {
    const food = allFoods.find((f) => f.id === ing.foodId);
    return sum + (food ? food.caloriesPerServing * ing.servings : 0);
  }, 0);
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ProteinStore {
  days: Record<string, ProteinDay>;
  /** Add 1 serving of a food. If already logged today, increments existing entry. */
  addServing: (foodId: string, defaultGoalG?: number, defaultCalorieGoal?: number) => void;
  /** Set exact serving count. Pass 0 to remove. */
  setServings: (date: string, servingId: string, count: number) => void;
  removeServing: (date: string, servingId: string) => void;
  setGoal: (date: string, goalG: number) => void;
  setCalorieGoal: (date: string, caloriesGoal: number) => void;
  logMeal: (name: string, ingredients: MealIngredient[], mealId?: string, defaultGoalG?: number, defaultCalorieGoal?: number) => void;
  updateLoggedMeal: (date: string, entryId: string, ingredients: MealIngredient[]) => void;
  removeLoggedMeal: (date: string, entryId: string) => void;
  todayServings: () => DailyServing[];
}

function persist(days: Record<string, ProteinDay>) {
  saveToStorage(PROTEIN_KEY, days);
}

function ensureDay(
  days: Record<string, ProteinDay>,
  date: string,
  goalG: number,
  caloriesGoal: number,
): ProteinDay {
  return days[date] ?? { date, servings: [], meals: [], goalG, caloriesGoal };
}

export const useProteinStore = create<ProteinStore>()(
  subscribeWithSelector((set, get) => ({
    days: loadFromStorage(PROTEIN_KEY, {}),

    addServing: (foodId, defaultGoalG = 180, defaultCalorieGoal = 2000) =>
      set((s) => {
        const date = todayDateKey();
        const day = ensureDay(s.days, date, defaultGoalG, defaultCalorieGoal);
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
        const day = ensureDay(s.days, date, goalG, 2000);
        const next = { ...s.days, [date]: { ...day, goalG } };
        persist(next);
        return { days: next };
      }),

    setCalorieGoal: (date, caloriesGoal) =>
      set((s) => {
        const existing = s.days[date];
        if (!existing) return {};
        const next = { ...s.days, [date]: { ...existing, caloriesGoal } };
        persist(next);
        return { days: next };
      }),

    logMeal: (name, ingredients, mealId, defaultGoalG = 180, defaultCalorieGoal = 2000) =>
      set((s) => {
        const date = todayDateKey();
        const day = ensureDay(s.days, date, defaultGoalG, defaultCalorieGoal);
        const entry: LoggedMealEntry = {
          id: crypto.randomUUID(),
          mealId,
          name,
          ingredients,
          timestamp: new Date().toISOString(),
        };
        const next = {
          ...s.days,
          [date]: { ...day, meals: [...(day.meals ?? []), entry] },
        };
        persist(next);
        return { days: next };
      }),

    updateLoggedMeal: (date, entryId, ingredients) =>
      set((s) => {
        const day = s.days[date];
        if (!day) return {};
        const next = {
          ...s.days,
          [date]: {
            ...day,
            meals: (day.meals ?? []).map((m) =>
              m.id === entryId ? { ...m, ingredients } : m
            ),
          },
        };
        persist(next);
        return { days: next };
      }),

    removeLoggedMeal: (date, entryId) =>
      set((s) => {
        const day = s.days[date];
        if (!day) return {};
        const next = {
          ...s.days,
          [date]: {
            ...day,
            meals: (day.meals ?? []).filter((m) => m.id !== entryId),
          },
        };
        persist(next);
        return { days: next };
      }),

    todayServings: () => {
      const day = get().days[todayDateKey()];
      return day?.servings ?? [];
    },
  })),
);
