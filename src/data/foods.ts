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
  caloriesPerServing: number,
): FoodItem {
  return { id, name, category, proteinPerServing, servingSize, caloriesPerServing, isCustom: false };
}

export const BUILT_IN_FOODS: FoodItem[] = [
  // ── Meat ──────────────────────────────────────────────────────────────────
  food('m01', 'Chicken Breast',              'meat', 26, '3 oz / 85g cooked, skinless',  140),
  food('m02', 'Turkey Breast',               'meat', 25, '3 oz / 85g cooked',             135),
  food('m03', 'Pork Tenderloin',             'meat', 25, '3 oz / 85g roasted',            125),
  food('m04', 'Lean Ground Beef (90%)',      'meat', 24, '3 oz / 85g cooked',             155),
  food('m05', 'Lean Steak / Sirloin',        'meat', 25, '3 oz / 85g cooked',             160),
  food('m06', 'Ham',                         'meat', 19, '3 oz / 85g roasted',            110),
  food('m07', 'Bacon',                       'meat',  9, '3 slices',                      130),

  // ── Fish & Seafood ────────────────────────────────────────────────────────
  food('f01', 'Tuna',                        'fish', 23, '3 oz / 85g cooked or canned',  100),
  food('f02', 'Salmon',                      'fish', 22, '3 oz / 85g cooked',             175),
  food('f03', 'Shrimp',                      'fish', 20, '3 oz / 85g cooked',              90),
  food('f04', 'Sardines',                    'fish', 21, '1 small can / 3.75 oz, canned', 190),
  food('f05', 'Cod',                         'fish', 19, '3 oz / 85g cooked',              90),

  // ── Eggs ──────────────────────────────────────────────────────────────────
  food('e01', 'Egg (whole)',                 'eggs',  6, '1 large egg / 50g',              70),
  food('e02', 'Egg Whites',                  'eggs', 11, '3 large egg whites',              50),

  // ── Dairy ─────────────────────────────────────────────────────────────────
  food('d01', 'Greek Yogurt (plain nonfat)', 'dairy', 17, '170g / about ¾ cup',           100),
  food('d02', 'Cottage Cheese (low-fat)',    'dairy', 24, '1 cup',                         165),
  food('d03', 'Milk',                        'dairy',  8, '1 cup',                         150),
  food('d04', 'Cheddar Cheese',              'dairy',  7, '1 oz / 28g',                    115),
  food('d05', 'Mozzarella Cheese',           'dairy',  6, '1 oz / 28g',                     85),

  // ── Legumes & Soy ─────────────────────────────────────────────────────────
  food('l01', 'Lentils',                     'legumes', 18, '1 cup cooked',               230),
  food('l02', 'Black Beans',                 'legumes', 15, '1 cup cooked',               225),
  food('l03', 'Chickpeas',                   'legumes', 15, '1 cup cooked',               270),
  food('l04', 'Navy Beans',                  'legumes', 15, '1 cup cooked',               255),
  food('l05', 'Pinto Beans',                 'legumes', 15, '1 cup cooked',               245),
  food('l06', 'Edamame',                     'legumes', 17, '1 cup cooked',               190),
  food('l07', 'Tofu (firm)',                 'legumes', 10, '½ cup',                        90),
  food('l08', 'Tempeh',                      'legumes', 17, '3 oz / 85g',                 160),
  food('l09', 'Green Peas',                  'legumes',  8, '1 cup cooked',               125),

  // ── Nuts & Seeds ──────────────────────────────────────────────────────────
  food('n01', 'Pumpkin Seeds',               'nuts',  8, '1 oz / 28g',                   155),
  food('n02', 'Peanuts',                     'nuts',  7, '1 oz / 28g',                   165),
  food('n03', 'Peanut Butter',               'nuts',  7, '2 tbsp / 32g',                 190),
  food('n04', 'Almonds',                     'nuts',  6, '1 oz / 28g',                   165),
  food('n05', 'Pistachios',                  'nuts',  6, '1 oz / 28g',                   160),
  food('n06', 'Cashews',                     'nuts',  5, '1 oz / 28g',                   160),
  food('n07', 'Sunflower Seeds',             'nuts',  5, '1 oz / 28g',                   165),
  food('n08', 'Hemp Hearts',                 'nuts',  9, '3 tbsp',                       170),
  food('n09', 'Chia Seeds',                  'nuts',  4, '2 tbsp',                       140),
  food('n10', 'Walnuts',                     'nuts',  4, '1 oz / 28g',                   185),

  // ── Grains & Starches ─────────────────────────────────────────────────────
  food('g01', 'Oatmeal',                     'grains', 6, '1 cup cooked',                165),
  food('g02', 'Quinoa',                      'grains', 8, '1 cup cooked',                220),
  food('g03', 'Whole-Wheat Pasta',           'grains', 8, '1 cup cooked',                175),
  food('g04', 'Pasta (regular)',             'grains', 7, '1 cup cooked',                200),
  food('g05', 'Brown Rice',                  'grains', 5, '1 cup cooked',                215),
  food('g06', 'Whole-Wheat Bread',           'grains', 4, '1 slice',                      70),
  food('g07', 'Potato (baked)',              'grains', 4, '1 medium potato',              160),

  // ── Vegetables ────────────────────────────────────────────────────────────
  food('v01', 'Spinach',                     'vegetables', 5, '1 cup cooked',             40),
  food('v02', 'Broccoli',                    'vegetables', 4, '1 cup cooked',             55),
  food('v03', 'Brussels Sprouts',            'vegetables', 4, '1 cup cooked',             55),
  food('v04', 'Asparagus',                   'vegetables', 4, '1 cup cooked',             40),
  food('v05', 'Corn',                        'vegetables', 5, '1 cup cooked',            135),
  food('v06', 'Kale',                        'vegetables', 4, '1 cup cooked',             35),
  food('v07', 'Collard Greens',              'vegetables', 5, '1 cup cooked',             50),

  // ── Fruit ─────────────────────────────────────────────────────────────────
  food('fr01', 'Guava',                      'fruit', 4, '1 cup',                        110),
  food('fr02', 'Avocado',                    'fruit', 3, '1 whole avocado',              320),
  food('fr03', 'Blackberries',               'fruit', 2, '1 cup',                         65),
  food('fr04', 'Raspberries',                'fruit', 1, '1 cup',                         65),
  food('fr05', 'Banana',                     'fruit', 1, '1 medium',                     105),
  food('fr06', 'Strawberries',               'fruit', 1, '1 cup',                         50),
  food('fr07', 'Blueberries',                'fruit', 1, '1 cup',                         85),
  food('fr08', 'Apple',                      'fruit', 1, '1 medium',                      95),

  // ── Supplements ───────────────────────────────────────────────────────────
  food('s01', 'Whey Protein',                'supplements', 25, '1 scoop (30g)',          120),
  food('s02', 'Casein Protein',              'supplements', 24, '1 scoop (33g)',          120),
  food('s03', 'Plant Protein Powder',        'supplements', 20, '1 scoop (30g)',          110),
  food('s04', 'Protein Bar',                 'supplements', 20, '1 bar (~60g)',           200),
];

// ─── Recommendation priority (categories most important for muscle building) ──
export const RECOMMENDATION_PRIORITY: FoodCategory[] = [
  'meat', 'fish', 'dairy', 'eggs', 'supplements', 'legumes', 'nuts', 'grains', 'vegetables', 'fruit', 'other',
];
