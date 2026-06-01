import { create } from 'zustand';
import type { Meal, MealIngredient } from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';

const MEALS_KEY = 'ww_meals';

interface MealStore {
  meals: Meal[];
  addMeal: (name: string, ingredients: MealIngredient[]) => Meal;
  updateMeal: (id: string, patch: { name?: string; ingredients?: MealIngredient[] }) => void;
  deleteMeal: (id: string) => void;
}

export const useMealStore = create<MealStore>()((set) => ({
  meals: loadFromStorage<Meal[]>(MEALS_KEY, []),

  addMeal: (name, ingredients) => {
    const meal: Meal = { id: crypto.randomUUID(), name, ingredients };
    set((s) => {
      const next = [...s.meals, meal];
      saveToStorage(MEALS_KEY, next);
      return { meals: next };
    });
    return meal;
  },

  updateMeal: (id, patch) =>
    set((s) => {
      const next = s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m));
      saveToStorage(MEALS_KEY, next);
      return { meals: next };
    }),

  deleteMeal: (id) =>
    set((s) => {
      const next = s.meals.filter((m) => m.id !== id);
      saveToStorage(MEALS_KEY, next);
      return { meals: next };
    }),
}));
