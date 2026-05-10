import type { FoodCategory, FoodItem } from '../types';

// ─── Category metadata ────────────────────────────────────────────────────────

export const CATEGORY_META: Record<
  FoodCategory,
  { label: string; emoji: string; bgClass: string; textClass: string }
> = {
  meat:        { label: 'Meat',          emoji: '🥩', bgClass: 'bg-orange-100', textClass: 'text-orange-700' },
  fish:        { label: 'Fish & Seafood',emoji: '🐟', bgClass: 'bg-blue-100',   textClass: 'text-blue-700'   },
  dairy:       { label: 'Dairy',         emoji: '🧀', bgClass: 'bg-yellow-100', textClass: 'text-yellow-700' },
  eggs:        { label: 'Eggs',          emoji: '🥚', bgClass: 'bg-amber-100',  textClass: 'text-amber-700'  },
  nuts:        { label: 'Nuts & Seeds',  emoji: '🥜', bgClass: 'bg-amber-100',  textClass: 'text-amber-800'  },
  legumes:     { label: 'Legumes & Soy', emoji: '🫘', bgClass: 'bg-green-100',  textClass: 'text-green-700'  },
  grains:      { label: 'Grains',        emoji: '🌾', bgClass: 'bg-lime-100',   textClass: 'text-lime-700'   },
  vegetables:  { label: 'Vegetables',    emoji: '🥦', bgClass: 'bg-emerald-100',textClass: 'text-emerald-700'},
  fruit:       { label: 'Fruit',         emoji: '🍓', bgClass: 'bg-rose-100',   textClass: 'text-rose-600'   },
  supplements: { label: 'Supplements',   emoji: '💊', bgClass: 'bg-purple-100', textClass: 'text-purple-700' },
  other:       { label: 'Other',         emoji: '🍽️', bgClass: 'bg-gray-100',   textClass: 'text-gray-600'   },
};

export const ALL_CATEGORIES: FoodCategory[] = [
  'meat', 'fish', 'dairy', 'eggs', 'nuts', 'legumes', 'grains', 'vegetables', 'fruit', 'supplements', 'other',
];

// ─── Built-in food library ────────────────────────────────────────────────────

function food(
  id: string,
  name: string,
  category: FoodCategory,
  proteinPerServing: number,
  servingSize: string,
): FoodItem {
  return { id, name, category, proteinPerServing, servingSize, isCustom: false };
}

export const BUILT_IN_FOODS: FoodItem[] = [
  // ── Meat ──────────────────────────────────────────────────────────────────
  food('m01', 'Chicken Breast',              'meat', 26, '3 oz / 85g cooked, skinless'),
  food('m02', 'Turkey Breast',               'meat', 25, '3 oz / 85g cooked'),
  food('m03', 'Pork Tenderloin',             'meat', 25, '3 oz / 85g roasted'),
  food('m04', 'Lean Ground Beef (90%)',      'meat', 24, '3 oz / 85g cooked'),
  food('m05', 'Lean Steak / Sirloin',        'meat', 25, '3 oz / 85g cooked'),
  food('m06', 'Ham',                         'meat', 19, '3 oz / 85g roasted'),
  food('m07', 'Bacon',                       'meat',  9, '3 slices'),

  // ── Fish & Seafood ────────────────────────────────────────────────────────
  food('f01', 'Tuna',                        'fish', 23, '3 oz / 85g cooked or canned'),
  food('f02', 'Salmon',                      'fish', 22, '3 oz / 85g cooked'),
  food('f03', 'Shrimp',                      'fish', 20, '3 oz / 85g cooked'),
  food('f04', 'Sardines',                    'fish', 21, '1 small can / 3.75 oz, canned'),
  food('f05', 'Cod',                         'fish', 19, '3 oz / 85g cooked'),

  // ── Eggs ──────────────────────────────────────────────────────────────────
  food('e01', 'Egg (whole)',                 'eggs',  6, '1 large egg / 50g'),
  food('e02', 'Egg Whites',                  'eggs', 11, '3 large egg whites'),

  // ── Dairy ─────────────────────────────────────────────────────────────────
  food('d01', 'Greek Yogurt (plain nonfat)', 'dairy', 17, '170g / about ¾ cup'),
  food('d02', 'Cottage Cheese (low-fat)',    'dairy', 24, '1 cup'),
  food('d03', 'Milk',                        'dairy',  8, '1 cup'),
  food('d04', 'Cheddar Cheese',              'dairy',  7, '1 oz / 28g'),
  food('d05', 'Mozzarella Cheese',           'dairy',  6, '1 oz / 28g'),

  // ── Legumes & Soy ─────────────────────────────────────────────────────────
  food('l01', 'Lentils',                     'legumes', 18, '1 cup cooked'),
  food('l02', 'Black Beans',                 'legumes', 15, '1 cup cooked'),
  food('l03', 'Chickpeas',                   'legumes', 15, '1 cup cooked'),
  food('l04', 'Navy Beans',                  'legumes', 15, '1 cup cooked'),
  food('l05', 'Pinto Beans',                 'legumes', 15, '1 cup cooked'),
  food('l06', 'Edamame',                     'legumes', 17, '1 cup cooked'),
  food('l07', 'Tofu (firm)',                 'legumes', 10, '½ cup'),
  food('l08', 'Tempeh',                      'legumes', 17, '3 oz / 85g'),
  food('l09', 'Green Peas',                  'legumes',  8, '1 cup cooked'),

  // ── Nuts & Seeds ──────────────────────────────────────────────────────────
  food('n01', 'Pumpkin Seeds',               'nuts',  8, '1 oz / 28g'),
  food('n02', 'Peanuts',                     'nuts',  7, '1 oz / 28g'),
  food('n03', 'Peanut Butter',               'nuts',  7, '2 tbsp / 32g'),
  food('n04', 'Almonds',                     'nuts',  6, '1 oz / 28g'),
  food('n05', 'Pistachios',                  'nuts',  6, '1 oz / 28g'),
  food('n06', 'Cashews',                     'nuts',  5, '1 oz / 28g'),
  food('n07', 'Sunflower Seeds',             'nuts',  5, '1 oz / 28g'),
  food('n08', 'Hemp Hearts',                 'nuts',  9, '3 tbsp'),
  food('n09', 'Chia Seeds',                  'nuts',  4, '2 tbsp'),
  food('n10', 'Walnuts',                     'nuts',  4, '1 oz / 28g'),

  // ── Grains & Starches ─────────────────────────────────────────────────────
  food('g01', 'Oatmeal',                     'grains', 6, '1 cup cooked'),
  food('g02', 'Quinoa',                      'grains', 8, '1 cup cooked'),
  food('g03', 'Whole-Wheat Pasta',           'grains', 8, '1 cup cooked'),
  food('g04', 'Pasta (regular)',             'grains', 7, '1 cup cooked'),
  food('g05', 'Brown Rice',                  'grains', 5, '1 cup cooked'),
  food('g06', 'Whole-Wheat Bread',           'grains', 4, '1 slice'),
  food('g07', 'Potato (baked)',              'grains', 4, '1 medium potato'),

  // ── Vegetables ────────────────────────────────────────────────────────────
  food('v01', 'Spinach',                     'vegetables', 5, '1 cup cooked'),
  food('v02', 'Broccoli',                    'vegetables', 4, '1 cup cooked'),
  food('v03', 'Brussels Sprouts',            'vegetables', 4, '1 cup cooked'),
  food('v04', 'Asparagus',                   'vegetables', 4, '1 cup cooked'),
  food('v05', 'Corn',                        'vegetables', 5, '1 cup cooked'),
  food('v06', 'Kale',                        'vegetables', 4, '1 cup cooked'),
  food('v07', 'Collard Greens',              'vegetables', 5, '1 cup cooked'),

  // ── Fruit ─────────────────────────────────────────────────────────────────
  food('fr01', 'Guava',                      'fruit', 4, '1 cup'),
  food('fr02', 'Avocado',                    'fruit', 3, '1 whole avocado'),
  food('fr03', 'Blackberries',               'fruit', 2, '1 cup'),
  food('fr04', 'Raspberries',                'fruit', 1, '1 cup'),
  food('fr05', 'Banana',                     'fruit', 1, '1 medium'),
  food('fr06', 'Strawberries',               'fruit', 1, '1 cup'),
  food('fr07', 'Blueberries',                'fruit', 1, '1 cup'),
  food('fr08', 'Apple',                      'fruit', 1, '1 medium'),

  // ── Supplements ───────────────────────────────────────────────────────────
  food('s01', 'Whey Protein',                'supplements', 25, '1 scoop (30g)'),
  food('s02', 'Casein Protein',              'supplements', 24, '1 scoop (33g)'),
  food('s03', 'Plant Protein Powder',        'supplements', 20, '1 scoop (30g)'),
  food('s04', 'Protein Bar',                 'supplements', 20, '1 bar (~60g)'),
];

// ─── Recommendation priority (categories most important for muscle building) ──
export const RECOMMENDATION_PRIORITY: FoodCategory[] = [
  'meat', 'fish', 'dairy', 'eggs', 'supplements', 'legumes', 'nuts', 'grains', 'vegetables', 'fruit', 'other',
];
