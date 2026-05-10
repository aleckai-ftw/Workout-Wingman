import { create } from 'zustand';
import type { FoodCategory, FoodItem } from '../types';
import { BUILT_IN_FOODS } from '../data/foods';
import { loadFromStorage, saveToStorage } from '../lib/storage';

const CUSTOM_FOODS_KEY = 'ww_custom_foods';

interface FoodStore {
  customFoods: FoodItem[];
  addCustomFood: (food: Omit<FoodItem, 'id' | 'isCustom'>) => FoodItem;
  updateCustomFood: (id: string, patch: Partial<Omit<FoodItem, 'id' | 'isCustom'>>) => void;
  deleteCustomFood: (id: string) => void;
}

export const useFoodStore = create<FoodStore>()((set) => ({
  customFoods: loadFromStorage<FoodItem[]>(CUSTOM_FOODS_KEY, []),

  addCustomFood: (food) => {
    const newFood: FoodItem = { ...food, id: crypto.randomUUID(), isCustom: true };
    set((s) => {
      const next = [...s.customFoods, newFood];
      saveToStorage(CUSTOM_FOODS_KEY, next);
      return { customFoods: next };
    });
    return newFood;
  },

  updateCustomFood: (id, patch) =>
    set((s) => {
      const next = s.customFoods.map((f) => (f.id === id ? { ...f, ...patch } : f));
      saveToStorage(CUSTOM_FOODS_KEY, next);
      return { customFoods: next };
    }),

  deleteCustomFood: (id) =>
    set((s) => {
      const next = s.customFoods.filter((f) => f.id !== id);
      saveToStorage(CUSTOM_FOODS_KEY, next);
      return { customFoods: next };
    }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** All foods: built-in first, then custom */
export function getAllFoods(customFoods: FoodItem[]): FoodItem[] {
  return [...BUILT_IN_FOODS, ...customFoods];
}

/** Filter + search foods */
export function filterFoods(
  allFoods: FoodItem[],
  query: string,
  category: FoodCategory | 'all',
): FoodItem[] {
  const q = query.trim().toLowerCase();
  return allFoods.filter((f) => {
    const matchesCat = category === 'all' || f.category === category;
    const matchesQuery = !q || f.name.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });
}
