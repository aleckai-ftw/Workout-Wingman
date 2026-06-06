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
  notes?: string,
): FoodItem {
  return { id, name, category, proteinPerServing, servingSize, caloriesPerServing, notes, isCustom: false };
}

export const BUILT_IN_FOODS: FoodItem[] = [
  // ── Meat ──────────────────────────────────────────────────────────────────
  food('m01', 'Chicken Breast',         'meat', 26.4, '3 oz / 85g cooked, skinless', 140, 'Cooked, skinless breast; rounded from ~100g cooked values.'),
  food('m02', 'Turkey Breast',          'meat', 25.0, '3 oz / 85g cooked',           125, 'Cooked/roasted turkey breast; lean meat.'),
  food('m03', 'Pork Tenderloin',        'meat', 22.3, '3 oz / 85g roasted',          122, 'Lean roasted pork tenderloin.'),
  food('m04', 'Lean Ground Beef (90%)', 'meat', 22.0, '3 oz / 85g cooked',           184, '90% lean ground beef, cooked/pan-broiled; calories vary with drained fat.'),
  food('m05', 'Lean Steak / Sirloin',   'meat', 25.8, '3 oz / 85g cooked',           180, 'Lean cooked sirloin/top sirloin estimate.'),
  food('m06', 'Ham',                    'meat', 18.0, '3 oz / 85g roasted',          123, 'Roasted/cured ham; sodium and calories vary a lot by cut/brand.'),
  food('m07', 'Bacon',                  'meat',  9.0, '3 slices cooked',             130, 'Typical cooked pork bacon; brand/slice thickness varies.'),

  // ── Fish & Seafood ────────────────────────────────────────────────────────
  food('f01', 'Tuna',     'fish', 22.0, '3 oz / 85g cooked or canned', 100, 'Canned in water/drained or cooked lean tuna estimate.'),
  food('f02', 'Salmon',   'fish', 22.0, '3 oz / 85g cooked',           177, 'Cooked salmon; wild vs Atlantic/farmed varies.'),
  food('f03', 'Shrimp',   'fish', 20.0, '3 oz / 85g cooked',            84, 'Cooked shrimp, plain.'),
  food('f04', 'Sardines', 'fish', 22.0, '1 small can / 3.75 oz, canned', 190, 'Canned sardines; oil vs water/sauce changes calories.'),
  food('f05', 'Cod',      'fish', 19.7, '3 oz / 85g cooked',            90, 'Cooked cod, plain.'),

  // ── Eggs ──────────────────────────────────────────────────────────────────
  food('e01', 'Egg (whole)', 'eggs',  6.3, '1 large egg / 50g', 72, 'Large whole egg.'),
  food('e02', 'Egg Whites',  'eggs', 10.8, '3 large egg whites', 51, 'Three large egg whites.'),

  // ── Dairy ─────────────────────────────────────────────────────────────────
  food('d01', 'Greek Yogurt (plain nonfat)', 'dairy', 17.0, '170g / about ¾ cup', 100, 'Plain nonfat Greek yogurt; brand varies.'),
  food('d02', 'Cottage Cheese (low-fat)',    'dairy', 28.0, '1 cup',               163, 'Low-fat cottage cheese, about 1 cup/226g; brand varies.'),
  food('d03', 'Milk',                        'dairy',  8.0, '1 cup',               149, 'Assumed whole milk because original calories matched whole milk.'),
  food('d04', 'Cheddar Cheese',              'dairy',  6.5, '1 oz / 28g',          113, 'Cheddar, 1 ounce.'),
  food('d05', 'Mozzarella Cheese',           'dairy',  6.0, '1 oz / 28g',           85, 'Assumed whole-milk mozzarella; part-skim is usually lower calorie.'),

  // ── Legumes & Soy ─────────────────────────────────────────────────────────
  food('l01', 'Lentils',      'legumes', 17.9, '1 cup cooked', 230, 'Cooked lentils.'),
  food('l02', 'Black Beans',  'legumes', 15.2, '1 cup cooked', 227, 'Cooked black beans.'),
  food('l03', 'Chickpeas',    'legumes', 14.5, '1 cup cooked', 269, 'Cooked chickpeas/garbanzo beans.'),
  food('l04', 'Navy Beans',   'legumes', 15.0, '1 cup cooked', 255, 'Cooked navy beans.'),
  food('l05', 'Pinto Beans',  'legumes', 15.4, '1 cup cooked', 245, 'Cooked pinto beans.'),
  food('l06', 'Edamame',      'legumes', 18.5, '1 cup cooked', 188, 'Cooked shelled edamame.'),
  food('l07', 'Tofu (firm)',  'legumes', 10.0, '½ cup',         94, 'Firm tofu; calcium-set products vary.'),
  food('l08', 'Tempeh',       'legumes', 17.0, '3 oz / 85g',   162, 'Tempeh, 3 ounces.'),
  food('l09', 'Green Peas',   'legumes',  8.6, '1 cup cooked', 134, 'Cooked green peas.'),

  // ── Nuts & Seeds ──────────────────────────────────────────────────────────
  food('n01', 'Pumpkin Seeds',   'nuts',  8.6, '1 oz / 28g',   158, 'Pumpkin/squash seed kernels.'),
  food('n02', 'Peanuts',         'nuts',  7.0, '1 oz / 28g',   166, 'Dry-roasted or raw peanuts; small variation by preparation.'),
  food('n03', 'Peanut Butter',   'nuts',  7.2, '2 tbsp / 32g', 188, 'Standard smooth peanut butter.'),
  food('n04', 'Almonds',         'nuts',  6.0, '1 oz / 28g',   164, 'Whole almonds.'),
  food('n05', 'Pistachios',      'nuts',  5.7, '1 oz / 28g',   159, 'Pistachio kernels.'),
  food('n06', 'Cashews',         'nuts',  5.2, '1 oz / 28g',   157, 'Cashew nuts.'),
  food('n07', 'Sunflower Seeds', 'nuts',  5.5, '1 oz / 28g',   164, 'Sunflower seed kernels.'),
  food('n08', 'Hemp Hearts',     'nuts', 10.0, '3 tbsp / 30g', 166, 'Hulled hemp seeds/hemp hearts; brand labels vary.'),
  food('n09', 'Chia Seeds',      'nuts',  4.7, '2 tbsp / 28g', 138, 'Chia seeds.'),
  food('n10', 'Walnuts',         'nuts',  4.3, '1 oz / 28g',   185, 'English walnuts.'),

  // ── Grains & Starches ─────────────────────────────────────────────────────
  food('g01', 'Oatmeal',            'grains', 5.9, '1 cup cooked',   166, 'Cooked oats/oatmeal prepared with water.'),
  food('g02', 'Quinoa',             'grains', 8.1, '1 cup cooked',   222, 'Cooked quinoa.'),
  food('g03', 'Whole-Wheat Pasta',  'grains', 7.5, '1 cup cooked',   174, 'Cooked whole-wheat pasta.'),
  food('g04', 'Pasta (regular)',    'grains', 8.1, '1 cup cooked',   221, 'Cooked enriched pasta/spaghetti; shape affects cup weight.'),
  food('g05', 'Brown Rice',         'grains', 5.0, '1 cup cooked',   216, 'Cooked long-grain brown rice.'),
  food('g06', 'Whole-Wheat Bread',  'grains', 4.0, '1 slice',         81, 'One average slice; bread brands/slice weights vary.'),
  food('g07', 'Potato (baked)',     'grains', 4.3, '1 medium potato', 161, 'Medium baked potato with skin.'),

  // ── Vegetables ────────────────────────────────────────────────────────────
  food('v01', 'Spinach',          'vegetables', 5.3, '1 cup cooked',  41, 'Cooked spinach, drained.'),
  food('v02', 'Broccoli',         'vegetables', 3.7, '1 cup cooked',  55, 'Cooked broccoli, chopped.'),
  food('v03', 'Brussels Sprouts', 'vegetables', 4.0, '1 cup cooked',  56, 'Cooked Brussels sprouts.'),
  food('v04', 'Asparagus',        'vegetables', 4.3, '1 cup cooked',  40, 'Cooked asparagus.'),
  food('v05', 'Corn',             'vegetables', 5.1, '1 cup cooked', 143, 'Cooked sweet corn kernels.'),
  food('v06', 'Kale',             'vegetables', 2.5, '1 cup cooked',  36, 'Cooked kale; raw vs cooked cup values differ a lot.'),
  food('v07', 'Collard Greens',   'vegetables', 5.2, '1 cup cooked',  63, 'Cooked collard greens.'),

  // ── Fruit ─────────────────────────────────────────────────────────────────
  food('fr01', 'Guava',        'fruit', 4.2, '1 cup',           112, 'Raw guava, about 1 cup.'),
  food('fr02', 'Avocado',      'fruit', 4.0, '1 whole avocado', 322, 'Assumed one whole medium-large avocado; size varies widely.'),
  food('fr03', 'Blackberries', 'fruit', 2.0, '1 cup',            62, 'Raw blackberries.'),
  food('fr04', 'Raspberries',  'fruit', 1.5, '1 cup',            64, 'Raw raspberries.'),
  food('fr05', 'Banana',       'fruit', 1.3, '1 medium',        105, 'Medium raw banana.'),
  food('fr06', 'Strawberries', 'fruit', 1.0, '1 cup',            49, 'Raw strawberry halves/slices.'),
  food('fr07', 'Blueberries',  'fruit', 1.1, '1 cup',            84, 'Raw blueberries.'),
  food('fr08', 'Apple',        'fruit', 0.5, '1 medium',         95, 'Medium raw apple.'),

  // ── Supplements ───────────────────────────────────────────────────────────
  food('s01', 'Whey Protein',         'supplements', 24.0, '1 scoop / 30g', 120, 'Generic whey protein label estimate; use your brand label if known.'),
  food('s02', 'Casein Protein',       'supplements', 24.0, '1 scoop / 33g', 120, 'Generic casein protein label estimate; use your brand label if known.'),
  food('s03', 'Plant Protein Powder', 'supplements', 20.0, '1 scoop / 30g', 120, 'Generic plant protein powder; brand formulas vary substantially.'),
  food('s04', 'Protein Bar',          'supplements', 20.0, '1 bar / ~60g',  200, 'Generic protein bar estimate; check exact bar label.'),

  // ── Other ─────────────────────────────────────────────────────────────────
  food('o01', 'Chobani Protein Yogurt', 'other', 20.0, '1 cup / 6.7 oz',      140, 'Assumed Chobani 20g High Protein Greek Yogurt cup; drinks are often 170 kcal.'),
  food('o02', 'Pomegranate Seeds',      'other',  1.5, '½ cup arils / 87g',    73, 'Common serving of pomegranate arils/seeds.'),
  food('o03', 'Cacao Powder',           'other',  1.1, '1 tbsp / ~5g',          12, 'Unsweetened cocoa/cacao powder; brand and alkalization vary.'),
  food('o04', 'Sweet Potato',           'other',  2.0, '1 medium / ~130g',     100, 'Medium skin-on sweet potato; baked/boiled prep varies slightly.'),
  food('o05', 'Golden Potato',          'other',  3.0, '1 medium / ~148g',     110, 'Assumed medium yellow/Yukon Gold-style potato with skin.'),
];

// ─── Recommendation priority (categories most important for muscle building) ──
export const RECOMMENDATION_PRIORITY: FoodCategory[] = [
  'meat', 'fish', 'dairy', 'eggs', 'supplements', 'legumes', 'nuts', 'grains', 'vegetables', 'fruit', 'other',
];
