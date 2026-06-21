import { useState, useMemo } from 'react';
import { useProteinStore, todayDateKey, computeDayTotal, computeDayCalories, computeMealProtein, computeMealCalories } from '../stores/proteinStore';
import { useFoodStore, getAllFoods, filterFoods } from '../stores/foodStore';
import { useMealStore } from '../stores/mealStore';
import { useProfileStore } from '../stores/profileStore';
import { PageHeader } from '../components/PageHeader';
import { CATEGORY_META, ALL_CATEGORIES, RECOMMENDATION_PRIORITY } from '../data/foods';
import type { FoodCategory, FoodItem, DailyServing, Meal, MealIngredient, LoggedMealEntry } from '../types';

// ─── Ring summary ─────────────────────────────────────────────────────────────

function Ring({
  value, goal, unit, label, color, dimColor,
}: {
  value: number; goal: number; unit: string; label: string; color: string; dimColor: string;
}) {
  const pct = Math.min(100, goal > 0 ? Math.round((value / goal) * 100) : 0);
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);
  const displayColor = pct >= 100 ? color : dimColor;
  const size = 120;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={center} cy={center} r={r} fill="none" stroke="#e5e2db" strokeWidth={10} />
          <circle
            cx={center} cy={center} r={r}
            fill="none"
            stroke={displayColor}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute flex flex-col items-center leading-tight">
          <span className="text-xl font-bold text-[var(--color-text)]">
            {value}{unit === 'g' ? 'g' : ''}
          </span>
          {unit === 'kcal' && <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">kcal</span>}
          <span className="text-[10px] text-[var(--color-text-muted)]">of {goal}{unit === 'g' ? 'g' : ' kcal'}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-[var(--color-text-muted)]">{label}</p>
        <p className="text-xs font-bold" style={{ color: displayColor }}>{pct}%</p>
      </div>
    </div>
  );
}

function RingSummary({
  proteinTotal, proteinGoal, calorieTotal, calorieGoal,
}: {
  proteinTotal: number; proteinGoal: number;
  calorieTotal: number; calorieGoal: number;
}) {
  return (
    <div className="flex gap-8 justify-center items-center py-6 bg-white">
      <Ring
        value={proteinTotal}
        goal={proteinGoal}
        unit="g"
        label="Protein"
        color="#22c55e"
        dimColor="#3a5c3a"
      />
      <Ring
        value={calorieTotal}
        goal={calorieGoal}
        unit="kcal"
        label="Calories"
        color="#f97316"
        dimColor="#c2410c"
      />
    </div>
  );
}

// ─── Today's log row ──────────────────────────────────────────────────────────

function ServingRow({
  serving,
  food,
  date: _date,
  onSetServings,
  onEdit,
  onRemove,
}: {
  serving: DailyServing;
  food: FoodItem;
  date: string;
  onSetServings: (count: number) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const totalG = Math.round(food.proteinPerServing * serving.servings);
  const totalKcal = Math.round(food.caloriesPerServing * serving.servings);
  const meta = CATEGORY_META[food.category];

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-[var(--color-border)] px-4 py-3">
      {/* Category dot */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${meta.bgClass}`}>
        {meta.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text)] truncate">{food.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {food.proteinPerServing}g × {serving.servings} = <span className="font-medium text-[var(--color-primary)]">{totalG}g protein</span>
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {food.caloriesPerServing} kcal × {serving.servings} = <span className="font-medium text-orange-600">{totalKcal} kcal</span>
        </p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">{food.servingSize}</p>
      </div>

      {/* Serving counter */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          aria-label="Edit ingredient"
          title="Edit ingredient"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={() => serving.servings <= 1 ? onRemove() : onSetServings(serving.servings - 1)}
          className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="w-6 text-center text-sm font-bold text-[var(--color-text)]">{serving.servings}</span>
        <button
          onClick={() => onSetServings(serving.servings + 1)}
          className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Edit Logged Ingredient Sheet ────────────────────────────────────────────

function EditLoggedIngredientSheet({
  food,
  onSave,
  onClose,
}: {
  food: FoodItem;
  onSave: (patch: { proteinPerServing: number; caloriesPerServing: number; servingSize: string }) => void;
  onClose: () => void;
}) {
  const [proteinStr, setProteinStr] = useState(String(food.proteinPerServing));
  const [caloriesStr, setCaloriesStr] = useState(String(food.caloriesPerServing));
  const [servingSize, setServingSize] = useState(food.servingSize);
  const [error, setError] = useState('');

  function handleSave() {
    const protein = parseFloat(proteinStr);
    const calories = parseFloat(caloriesStr);
    if (isNaN(protein) || protein < 0) { setError('Enter a valid protein amount.'); return; }
    if (isNaN(calories) || calories < 0) { setError('Enter a valid calorie amount.'); return; }
    if (!servingSize.trim()) { setError('Serving size is required.'); return; }
    onSave({ proteinPerServing: protein, caloriesPerServing: calories, servingSize: servingSize.trim() });
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl pt-5 px-5 pb-20 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 64px)' }}>
        <div className="flex justify-center">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Edit Ingredient</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{food.name}{food.isCustom ? '' : ' (built-in)'}</p>
          {!food.isCustom && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Saving will create a custom copy for this entry.</p>
          )}
        </div>

        {error && <p className="text-sm text-[var(--color-danger)] bg-red-50 rounded-xl px-3 py-2">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Serving size</label>
            <input
              autoFocus
              type="text"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              placeholder="e.g. 1 cup (240ml)"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Protein per serving (g)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={proteinStr}
                onChange={(e) => setProteinStr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Calories per serving (kcal)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={caloriesStr}
                onChange={(e) => setCaloriesStr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Recommendation card ──────────────────────────────────────────────────────

function RecommendationCard({ food, onAdd }: { food: FoodItem; onAdd: () => void }) {
  const meta = CATEGORY_META[food.category];
  return (
    <div className="flex items-center gap-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-3 py-2.5">
      <span className="text-xl">{meta.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text)] truncate">{food.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{food.proteinPerServing}g protein · {food.caloriesPerServing} kcal · {food.servingSize}</p>
      </div>
      <button
        onClick={onAdd}
        className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Add Food Sheet ───────────────────────────────────────────────────────────

function AddFoodSheet({
  allFoods,
  todayServings,
  onAdd,
  onAddCustom,
  onClose,
}: {
  allFoods: FoodItem[];
  todayServings: DailyServing[];
  onAdd: (food: FoodItem) => void;
  onAddCustom: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory | 'all'>('all');

  const filtered = useMemo(
    () => filterFoods(allFoods, query, category),
    [allFoods, query, category],
  );

  const servingMap = useMemo(() => {
    const m = new Map<string, number>();
    todayServings.forEach((s) => m.set(s.foodId, s.servings));
    return m;
  }, [todayServings]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute left-0 right-0 bg-white rounded-t-3xl flex flex-col" style={{ bottom: 64, maxHeight: 'calc(85dvh - 64px)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Add Food</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex items-center gap-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-3 py-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--color-text-muted)] shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              autoFocus
              type="search"
              autoComplete="off"
              placeholder="Search foods..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-[var(--color-text-muted)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-5 pb-3 shrink-0 overflow-x-auto">
          <div className="flex gap-2 w-max">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                category === 'all'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]'
              }`}
            >
              All
            </button>
            {ALL_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    category === cat
                      ? 'bg-[var(--color-primary)] text-white'
                      : `${meta.bgClass} ${meta.textClass}`
                  }`}
                >
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Food list */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[var(--color-text-muted)] text-sm">No foods found.</p>
              <button
                onClick={onAddCustom}
                className="mt-3 text-[var(--color-primary)] text-sm font-medium"
              >
                + Create "{query}"
              </button>
            </div>
          ) : (
            filtered.map((food) => {
              const servingCount = servingMap.get(food.id) ?? 0;
              const meta = CATEGORY_META[food.category];
              return (
                <div
                  key={food.id}
                  className="flex items-center gap-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-3 py-3"
                >
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${meta.bgClass}`}>
                    {meta.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{food.name}</p>
                      {food.isCustom && (
                        <span className="text-xs bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)] px-1.5 py-0.5 rounded">Custom</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{food.proteinPerServing}g protein · {food.caloriesPerServing} kcal · {food.servingSize}</p>
                  </div>
                  <button
                    onClick={() => onAdd(food)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold transition-colors ${
                      servingCount > 0
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'border-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                    }`}
                  >
                    {servingCount > 0 ? (
                      <span className="text-xs">{servingCount}</span>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })
          )}

        </div>

        {/* Pinned footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[var(--color-border)] bg-white">
          <button
            onClick={onAddCustom}
            className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            + Add Custom Food
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Custom Food Sheet ────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: FoodCategory; label: string; emoji: string }[] = ALL_CATEGORIES.map(
  (c) => ({ value: c, label: CATEGORY_META[c].label, emoji: CATEGORY_META[c].emoji }),
);

function AddCustomFoodSheet({
  initialName = '',
  onSave,
  onClose,
}: {
  initialName?: string;
  onSave: (food: FoodItem) => void;
  onClose: () => void;
}) {
  const addCustomFood = useFoodStore((s) => s.addCustomFood);
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<FoodCategory>('other');
  const [proteinStr, setProteinStr] = useState('');
  const [caloriesStr, setCaloriesStr] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [error, setError] = useState('');

  function handleSave() {
    const protein = parseFloat(proteinStr);
    const calories = parseFloat(caloriesStr);
    if (!name.trim()) { setError('Name is required.'); return; }
    if (isNaN(protein) || protein < 0) { setError('Enter a valid protein amount.'); return; }
    if (isNaN(calories) || calories < 0) { setError('Enter a valid calorie amount.'); return; }
    if (!servingSize.trim()) { setError('Serving size description is required.'); return; }
    const food = addCustomFood({ name: name.trim(), category, proteinPerServing: protein, caloriesPerServing: calories, servingSize: servingSize.trim() });
    onSave(food);
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl pt-5 px-5 pb-20 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 64px)' }}>
        <div className="flex justify-center">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Create Custom Food</h2>

        {error && <p className="text-sm text-[var(--color-danger)] bg-red-50 rounded-xl px-3 py-2">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Food Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Protein Shake"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCategory(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    category === opt.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Protein per serving (g)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={proteinStr}
                onChange={(e) => setProteinStr(e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Calories per serving (kcal)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={caloriesStr}
                onChange={(e) => setCaloriesStr(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Serving size</label>
            <input
              type="text"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              placeholder="e.g. 1 cup (240ml)"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
          >
            Save Food
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Meal Template Card ───────────────────────────────────────────────────────

function MealTemplateCard({
  meal, allFoods, onLoad, onEdit,
}: {
  meal: Meal; allFoods: FoodItem[];
  onLoad: () => void; onEdit: () => void;
}) {
  const protein = Math.round(computeMealProtein(meal, allFoods));
  const kcal = Math.round(computeMealCalories(meal, allFoods));
  return (
    <div className="flex flex-col bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-3 w-44 shrink-0 gap-1.5">
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-semibold text-[var(--color-text)] leading-tight line-clamp-2 flex-1">{meal.name}</p>
        <button
          onClick={onEdit}
          className="shrink-0 w-6 h-6 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">{meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? 's' : ''}</p>
      <p className="text-xs text-[var(--color-text-muted)]">
        <span className="text-[var(--color-primary)] font-medium">~{protein}g</span>
        {' · '}
        <span className="text-orange-600 font-medium">~{kcal} kcal</span>
      </p>
      <button
        onClick={onLoad}
        className="mt-1 w-full py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-semibold"
      >
        Load & Log
      </button>
    </div>
  );
}

// ─── Logged Meal Row ──────────────────────────────────────────────────────────

function LoggedMealRow({
  entry, allFoods, onEdit, onRemove,
}: {
  entry: LoggedMealEntry; allFoods: FoodItem[];
  onEdit: () => void; onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalProtein = Math.round(computeMealProtein(entry, allFoods));
  const totalCal = Math.round(computeMealCalories(entry, allFoods));

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-base shrink-0"
        >
          🍽️
        </button>
        <button onClick={() => setExpanded((v) => !v)} className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-[var(--color-text)] truncate">{entry.name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            <span className="text-[var(--color-primary)] font-medium">{totalProtein}g protein</span>
            {' · '}
            <span className="text-orange-600 font-medium">{totalCal} kcal</span>
            {' · '}
            {entry.ingredients.length} item{entry.ingredients.length !== 1 ? 's' : ''}
          </p>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-300 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable ingredient list */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          {entry.ingredients.map((ing) => {
            const food = allFoods.find((f) => f.id === ing.foodId);
            if (!food) return null;
            const meta = CATEGORY_META[food.category];
            return (
              <div key={ing.foodId} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-border)] last:border-b-0">
                <span className="text-base">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text)] truncate">{food.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{ing.servings} × {food.servingSize}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-[var(--color-primary)]">{Math.round(food.proteinPerServing * ing.servings)}g</p>
                  <p className="text-xs text-orange-600">{Math.round(food.caloriesPerServing * ing.servings)} kcal</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Inline food picker (reused inside meal sheets) ───────────────────────────

function InlineFoodPicker({
  allFoods,
  ingredientMap,
  onAdjust,
  onBack,
  onAddCustom,
}: {
  allFoods: FoodItem[];
  ingredientMap: Map<string, number>;
  onAdjust: (foodId: string, delta: number) => void;
  onBack: () => void;
  onAddCustom?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory | 'all'>('all');
  const filtered = useMemo(() => filterFoods(allFoods, query, category), [allFoods, query, category]);

  return (
    <>
      {/* Picker header */}
      <div className="flex items-center gap-3 px-5 py-3 shrink-0 border-b border-[var(--color-border)]">
        <button onClick={onBack} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] flex items-center gap-1.5 text-sm font-medium">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <span className="text-sm font-semibold text-[var(--color-text)]">Add Ingredient</span>
      </div>

      {/* Search */}
      <div className="px-5 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-3 py-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--color-text-muted)] shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            autoFocus
            type="search"
            autoComplete="off"
            placeholder="Search foods..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--color-text-muted)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-5 pb-2 shrink-0 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {(['all', ...ALL_CATEGORIES] as const).map((cat) => {
            const meta = cat !== 'all' ? CATEGORY_META[cat] : null;
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[var(--color-primary)] text-white'
                    : meta
                    ? `${meta.bgClass} ${meta.textClass}`
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                {meta ? `${meta.emoji} ${meta.label}` : 'All'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Food list */}
      <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2">
        {filtered.map((food) => {
          const count = ingredientMap.get(food.id) ?? 0;
          const meta = CATEGORY_META[food.category];
          return (
            <div
              key={food.id}
              className="flex items-center gap-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-3 py-3"
            >
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${meta.bgClass}`}>
                {meta.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text)] truncate">{food.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{food.proteinPerServing}g · {food.caloriesPerServing} kcal · {food.servingSize}</p>
              </div>
              {count > 0 ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onAdjust(food.id, -1)}
                    className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-red-400 hover:text-red-500 transition-colors"
                    aria-label={`Remove one serving of ${food.name}`}
                    title="Remove one"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-[var(--color-text)]">{count}</span>
                  <button
                    onClick={() => onAdjust(food.id, 1)}
                    className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                    aria-label={`Add one serving of ${food.name}`}
                    title="Add one"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onAdjust(food.id, 1)}
                  className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] text-[var(--color-primary)] flex items-center justify-center shrink-0 font-bold transition-colors"
                  aria-label={`Add ${food.name}`}
                  title="Add ingredient"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-[var(--color-text-muted)] mb-3">No foods found.</p>
            {onAddCustom && (
              <button onClick={onAddCustom} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                + Create custom food
              </button>
            )}
          </div>
        )}
        {onAddCustom && filtered.length > 0 && (
          <button
            onClick={onAddCustom}
            className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors mt-1"
          >
            + Create custom food
          </button>
        )}
      </div>
    </>
  );
}

// ─── Meal Editor Sheet (load/customize → log, or edit a logged entry) ─────────

function MealEditorSheet({
  mealName,
  initialIngredients,
  allFoods,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  mealName: string;
  initialIngredients: MealIngredient[];
  allFoods: FoodItem[];
  confirmLabel: string;
  onConfirm: (ingredients: MealIngredient[]) => void;
  onClose: () => void;
}) {
  const [ingredients, setIngredients] = useState<MealIngredient[]>(initialIngredients);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const ingredientMap = useMemo(() => {
    const m = new Map<string, number>();
    ingredients.forEach((i) => m.set(i.foodId, i.servings));
    return m;
  }, [ingredients]);

  const totalProtein = useMemo(() => Math.round(computeMealProtein({ ingredients }, allFoods)), [ingredients, allFoods]);
  const totalCal = useMemo(() => Math.round(computeMealCalories({ ingredients }, allFoods)), [ingredients, allFoods]);

  function addIngredient(foodId: string) {
    setIngredients((prev) => {
      const existing = prev.find((i) => i.foodId === foodId);
      if (existing) return prev.map((i) => i.foodId === foodId ? { ...i, servings: i.servings + 1 } : i);
      return [...prev, { foodId, servings: 1 }];
    });
  }

  function adjustServings(foodId: string, delta: number) {
    setIngredients((prev) => {
      const existing = prev.find((i) => i.foodId === foodId);
      if (!existing) {
        return delta > 0 ? [...prev, { foodId, servings: delta }] : prev;
      }
      return prev
        .map((i) => i.foodId === foodId ? { ...i, servings: i.servings + delta } : i)
        .filter((i) => i.servings > 0);
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute left-0 right-0 bg-white rounded-t-3xl flex flex-col" style={{ bottom: 64, maxHeight: 'calc(88dvh - 64px)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {pickerOpen ? (
          <InlineFoodPicker
            allFoods={allFoods}
            ingredientMap={ingredientMap}
            onAdjust={adjustServings}
            onBack={() => setPickerOpen(false)}
            onAddCustom={() => setCustomOpen(true)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">{mealName}</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  <span className="text-[var(--color-primary)] font-medium">{totalProtein}g protein</span>
                  {' · '}
                  <span className="text-orange-600 font-medium">{totalCal} kcal</span>
                </p>
              </div>
              <button onClick={onClose} className="text-[var(--color-text-muted)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Ingredient list */}
            <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2">
              {ingredients.length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No ingredients yet. Add some below.</p>
              )}
              {ingredients.map((ing) => {
                const food = allFoods.find((f) => f.id === ing.foodId);
                if (!food) return null;
                const meta = CATEGORY_META[food.category];
                return (
                  <div key={ing.foodId} className="flex items-center gap-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-3 py-3">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${meta.bgClass}`}>{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text)] truncate">{food.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {Math.round(food.proteinPerServing * ing.servings)}g · {Math.round(food.caloriesPerServing * ing.servings)} kcal
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => adjustServings(ing.foodId, -1)}
                        className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-red-400 hover:text-red-500 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-[var(--color-text)]">{ing.servings}</span>
                      <button
                        onClick={() => adjustServings(ing.foodId, 1)}
                        className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add ingredient button */}
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              >
                + Add Ingredient
              </button>
            </div>

            {/* Log / Save button */}
            <div className="shrink-0 px-5 py-3 border-t border-[var(--color-border)] bg-white">
              <button
                disabled={ingredients.length === 0}
                onClick={() => onConfirm(ingredients)}
                className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold disabled:opacity-40"
              >
                {confirmLabel}
              </button>
            </div>
          </>
        )}
        </div>
      </div>
      {customOpen && (
        <AddCustomFoodSheet
          onSave={(food) => { addIngredient(food.id); setCustomOpen(false); }}
          onClose={() => setCustomOpen(false)}
        />
      )}
    </>
  );
}

// ─── Create / Edit Meal Template Sheet ───────────────────────────────────────

function CreateMealSheet({
  meal,
  onSave,
  onDelete,
  onClose,
}: {
  meal?: Meal;
  onSave: (name: string, ingredients: MealIngredient[]) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(meal?.name ?? '');
  const [ingredients, setIngredients] = useState<MealIngredient[]>(meal?.ingredients ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [error, setError] = useState('');

  const customFoods = useFoodStore((s) => s.customFoods);
  const allFoods = useMemo(() => getAllFoods(customFoods), [customFoods]);

  const ingredientMap = useMemo(() => {
    const m = new Map<string, number>();
    ingredients.forEach((i) => m.set(i.foodId, i.servings));
    return m;
  }, [ingredients]);

  const totalProtein = useMemo(() => Math.round(computeMealProtein({ ingredients }, allFoods)), [ingredients, allFoods]);
  const totalCal = useMemo(() => Math.round(computeMealCalories({ ingredients }, allFoods)), [ingredients, allFoods]);

  function addIngredient(foodId: string) {
    setIngredients((prev) => {
      const existing = prev.find((i) => i.foodId === foodId);
      if (existing) return prev.map((i) => i.foodId === foodId ? { ...i, servings: i.servings + 1 } : i);
      return [...prev, { foodId, servings: 1 }];
    });
  }

  function adjustServings(foodId: string, delta: number) {
    setIngredients((prev) => {
      const existing = prev.find((i) => i.foodId === foodId);
      if (!existing) {
        return delta > 0 ? [...prev, { foodId, servings: delta }] : prev;
      }
      return prev
        .map((i) => i.foodId === foodId ? { ...i, servings: i.servings + delta } : i)
        .filter((i) => i.servings > 0);
    });
  }

  function handleSave() {
    if (!name.trim()) { setError('Meal name is required.'); return; }
    onSave(name.trim(), ingredients);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute left-0 right-0 bg-white rounded-t-3xl flex flex-col" style={{ bottom: 64, maxHeight: 'calc(92dvh - 64px)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {pickerOpen ? (
          <InlineFoodPicker
            allFoods={allFoods}
            ingredientMap={ingredientMap}
            onAdjust={adjustServings}
            onBack={() => setPickerOpen(false)}
            onAddCustom={() => setCustomOpen(true)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                {meal ? 'Edit Meal' : 'New Meal'}
              </h2>
              <button onClick={onClose} className="text-[var(--color-text-muted)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-4">
              {/* Name input */}
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Meal Name</label>
                <input
                  autoFocus={!meal}
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="e.g. Post-Workout Shake"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>

              {/* Nutrition summary */}
              {ingredients.length > 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  <span className="text-[var(--color-primary)] font-semibold">{totalProtein}g protein</span>
                  {' · '}
                  <span className="text-orange-600 font-semibold">{totalCal} kcal</span>
                  {' · '}
                  {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
                </p>
              )}

              {/* Ingredients */}
              <div className="space-y-2">
                {ingredients.length === 0 && (
                  <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No ingredients yet.</p>
                )}
                {ingredients.map((ing) => {
                  const food = allFoods.find((f) => f.id === ing.foodId);
                  if (!food) return null;
                  const meta = CATEGORY_META[food.category];
                  return (
                    <div key={ing.foodId} className="flex items-center gap-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-3 py-3">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${meta.bgClass}`}>{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text)] truncate">{food.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {Math.round(food.proteinPerServing * ing.servings)}g · {Math.round(food.caloriesPerServing * ing.servings)} kcal
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => adjustServings(ing.foodId, -1)}
                          className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-red-400 hover:text-red-500 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-[var(--color-text)]">{ing.servings}</span>
                        <button
                          onClick={() => adjustServings(ing.foodId, 1)}
                          className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  + Add Ingredient
                </button>
              </div>

              {/* Delete button (edit mode) */}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete Meal
                </button>
              )}
            </div>

            {/* Save button */}
            <div className="shrink-0 px-5 py-3 border-t border-[var(--color-border)] bg-white">
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
              >
                {meal ? 'Update Meal' : 'Save Meal'}
              </button>
            </div>
          </>
        )}
        </div>
      </div>
      {customOpen && (
        <AddCustomFoodSheet
          onSave={(food) => { addIngredient(food.id); setCustomOpen(false); }}
          onClose={() => setCustomOpen(false)}
        />
      )}
    </>
  );
}

// ─── Browse Meals Sheet ───────────────────────────────────────────────────────

function BrowseMealsSheet({
  savedMeals,
  allFoods,
  onSelect,
  onCreate,
  onClose,
}: {
  savedMeals: Meal[];
  allFoods: FoodItem[];
  onSelect: (meal: Meal) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 right-0 bg-white rounded-t-3xl flex flex-col" style={{ bottom: 64, maxHeight: 'calc(80dvh - 64px)' }}>
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Saved Meals</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2">
          {savedMeals.length === 0 && (
            <div className="py-10 text-center">
              <span className="text-4xl">🍽️</span>
              <p className="text-sm text-[var(--color-text-muted)] mt-3">No saved meals yet.</p>
            </div>
          )}
          {savedMeals.map((meal) => {
            const protein = Math.round(computeMealProtein(meal, allFoods));
            const kcal = Math.round(computeMealCalories(meal, allFoods));
            return (
              <div
                key={meal.id}
                className="flex items-center gap-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg shrink-0">🍽️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text)] truncate">{meal.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {meal.ingredients.length} ingredients ·{' '}
                    <span className="text-[var(--color-primary)] font-medium">~{protein}g</span>
                    {' · '}
                    <span className="text-orange-600 font-medium">~{kcal} kcal</span>
                  </p>
                </div>
                <button
                  onClick={() => onSelect(meal)}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-semibold"
                >
                  Load
                </button>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 px-5 py-3 border-t border-[var(--color-border)] bg-white">
          <button
            onClick={onCreate}
            className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            + Create New Meal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRecommendations(
  servings: DailyServing[],
  meals: LoggedMealEntry[],
  allFoods: FoodItem[],
  proteinTotal: number,
  proteinGoal: number,
  calorieTotal: number,
  calorieGoal: number,
): FoodItem[] {
  const proteinGap = proteinGoal - proteinTotal;
  const calorieGap = calorieGoal - calorieTotal;
  const proteinRemaining = Math.max(0, proteinGap);
  const calorieRemaining = Math.max(0, calorieGap);
  const proteinOver = Math.max(0, proteinTotal - proteinGoal);
  const calorieOver = Math.max(0, calorieTotal - calorieGoal);
  const proteinOverRatio = proteinOver / Math.max(1, proteinGoal);
  const calorieOverRatio = calorieOver / Math.max(1, calorieGoal);
  const MAX_RECOMMENDATIONS = 12;

  function rankByScore(
    score: (f: FoodItem) => number,
    filter?: (f: FoodItem) => boolean,
  ): FoodItem[] {
    const scored = allFoods
      .filter((f) => (filter ? filter(f) : true))
      .map((f) => ({ f, score: score(f) }))
      .sort((a, b) => a.score - b.score)
      .map((x) => x.f);
    if (scored.length >= MAX_RECOMMENDATIONS) return scored.slice(0, MAX_RECOMMENDATIONS);
    return [...new Set([...scored, ...allFoods])].slice(0, MAX_RECOMMENDATIONS);
  }

  // Need protein, but calories are already at/over goal: minimize calorie cost and protein overshoot.
  if (proteinRemaining > 0 && calorieGap <= 0) {
    const proteinOvershootCap = proteinRemaining + Math.max(4, proteinRemaining * 0.75);
    const caloriePenalty = 0.25 + calorieOverRatio * 7;
    return rankByScore(
      (f) => {
        const p = f.proteinPerServing;
        const c = f.caloriesPerServing;
        const proteinUnder = Math.max(0, proteinRemaining - p);
        const proteinOver = Math.max(0, p - proteinRemaining);
        return proteinUnder * 3 + proteinOver * 8 + c * caloriePenalty;
      },
      (f) => f.proteinPerServing > 0 && f.proteinPerServing <= proteinOvershootCap,
    );
  }

  // Need calories, but protein is already at/over goal: minimize extra protein and calorie overshoot.
  if (calorieRemaining > 0 && proteinGap <= 0) {
    const calorieOvershootCap = calorieRemaining + Math.max(120, calorieRemaining * 0.5);
    const proteinPenalty = 6 + proteinOverRatio * 35;
    return rankByScore(
      (f) => {
        const p = f.proteinPerServing;
        const c = f.caloriesPerServing;
        const calorieUnder = Math.max(0, calorieRemaining - c);
        const calorieOver = Math.max(0, c - calorieRemaining);
        return calorieUnder * 0.8 + calorieOver * 2.2 + p * proteinPenalty;
      },
      (f) => f.caloriesPerServing <= calorieOvershootCap,
    );
  }

  // Need both: fit both remaining targets and penalize overshooting either one.
  if (proteinRemaining > 0 && calorieRemaining > 0) {
    const proteinOvershootCap = proteinRemaining + Math.max(6, proteinRemaining * 0.75);
    const calorieOvershootCap = calorieRemaining + Math.max(120, calorieRemaining * 0.4);
    return rankByScore(
      (f) => {
        const p = f.proteinPerServing;
        const c = f.caloriesPerServing;
        const proteinUnder = Math.max(0, proteinRemaining - p);
        const proteinOver = Math.max(0, p - proteinRemaining);
        const calorieUnder = Math.max(0, calorieRemaining - c);
        const calorieOver = Math.max(0, c - calorieRemaining);
        return proteinUnder * 2 + proteinOver * 4 + calorieUnder * 0.5 + calorieOver * 1.8;
      },
      (f) => f.proteinPerServing <= proteinOvershootCap && f.caloriesPerServing <= calorieOvershootCap,
    );
  }

  const covered = new Set<FoodCategory>();
  servings.forEach((s) => {
    const food = allFoods.find((f) => f.id === s.foodId);
    if (food) covered.add(food.category);
  });
  meals.forEach((meal) => {
    meal.ingredients.forEach((ing) => {
      const food = allFoods.find((f) => f.id === ing.foodId);
      if (food) covered.add(food.category);
    });
  });

  const results: FoodItem[] = [];
  for (const cat of RECOMMENDATION_PRIORITY) {
    if (!covered.has(cat)) {
      // Highest-protein food from this category (built-in or custom)
      const best = allFoods
        .filter((f) => f.category === cat)
        .sort((a, b) => b.proteinPerServing - a.proteinPerServing)[0];
      if (best) results.push(best);
    }
    if (results.length >= MAX_RECOMMENDATIONS) break;
  }
  return results;
}

function selectShuffledRecommendations(pool: FoodItem[], seed: number, take = 3): FoodItem[] {
  if (pool.length <= take) return pool;

  const scoreFor = (id: string) => {
    let hash = (2166136261 ^ seed) >>> 0;
    for (let i = 0; i < id.length; i += 1) {
      hash ^= id.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash;
  };

  return [...pool]
    .sort((a, b) => scoreFor(a.id) - scoreFor(b.id))
    .slice(0, take);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DietPage() {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [showBrowseMeals, setShowBrowseMeals] = useState(false);
  const [customInitialName, setCustomInitialName] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const [editingCalorieGoal, setEditingCalorieGoal] = useState(false);
  const [calorieGoalDraft, setCalorieGoalDraft] = useState('');
  const [editingIngredient, setEditingIngredient] = useState<{ servingId: string; food: FoodItem } | null>(null);
  const [recommendationSeed, setRecommendationSeed] = useState(0);

  // Meal state
  const [mealEditorData, setMealEditorData] = useState<{
    mealName: string;
    mealId?: string;
    initialIngredients: MealIngredient[];
    loggedEntryId?: string;
  } | null>(null);
  const [createMealData, setCreateMealData] = useState<{ meal?: Meal } | null>(null);

  // Stores
  const customFoods = useFoodStore((s) => s.customFoods);
  const addCustomFood = useFoodStore((s) => s.addCustomFood);
  const updateCustomFood = useFoodStore((s) => s.updateCustomFood);
  const allFoods = useMemo(() => getAllFoods(customFoods), [customFoods]);

  const { days, addServing, setServings, replaceServingFood, removeServing, setGoal, setCalorieGoal, logMeal, updateLoggedMeal, removeLoggedMeal } = useProteinStore();
  const { settings, updateSettings } = useProfileStore();
  const { meals: savedMeals, addMeal, updateMeal, deleteMeal } = useMealStore();

  const today = todayDateKey();
  const todayDay = days[today];
  const todayServings = todayDay?.servings ?? [];
  const todayMeals = todayDay?.meals ?? [];
  const goalG = todayDay?.goalG ?? settings.dailyProteinGoalG;
  const caloriesGoal = todayDay?.caloriesGoal ?? settings.dailyCalorieGoal ?? 2000;

  // Yesterday
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = yesterdayDate.toISOString().slice(0, 10);
  const yesterdayServings = days[yesterdayKey]?.servings ?? [];

  // Totals include both individual servings and meals
  const total = Math.round(
    computeDayTotal(todayServings, allFoods) +
    todayMeals.reduce((sum, m) => sum + computeMealProtein(m, allFoods), 0),
  );
  const totalCalories = Math.round(
    computeDayCalories(todayServings, allFoods) +
    todayMeals.reduce((sum, m) => sum + computeMealCalories(m, allFoods), 0),
  );

  // Interleaved log sorted by timestamp
  type AnyEntry = { kind: 'serving'; sv: DailyServing } | { kind: 'meal'; entry: LoggedMealEntry };
  const allLogEntries = useMemo((): AnyEntry[] => {
    const entries: AnyEntry[] = [
      ...todayServings.map((sv) => ({ kind: 'serving' as const, sv })),
      ...todayMeals.map((entry) => ({ kind: 'meal' as const, entry })),
    ];
    return entries.sort((a, b) => {
      const ta = a.kind === 'serving' ? a.sv.timestamp : a.entry.timestamp;
      const tb = b.kind === 'serving' ? b.sv.timestamp : b.entry.timestamp;
      return new Date(ta).getTime() - new Date(tb).getTime();
    });
  }, [todayServings, todayMeals]);

  const recommendationPool = useMemo(
    () => getRecommendations(todayServings, todayMeals, allFoods, total, goalG, totalCalories, caloriesGoal),
    [todayServings, todayMeals, allFoods, total, goalG, totalCalories, caloriesGoal],
  );

  const recommendations = useMemo(
    () => selectShuffledRecommendations(recommendationPool, recommendationSeed, 3),
    [recommendationPool, recommendationSeed],
  );

  function handleAddFood(food: FoodItem) {
    addServing(food.id, goalG, caloriesGoal);
  }

  function handleCustomSaved(food: FoodItem) {
    addServing(food.id, goalG, caloriesGoal);
    setShowCustomSheet(false);
    // Keep AddFoodSheet open so user can see their new food
  }

  function openGoalEdit() {
    setGoalDraft(String(goalG));
    setEditingGoal(true);
  }

  function commitGoalEdit() {
    const n = parseInt(goalDraft, 10);
    if (!isNaN(n) && n > 0) {
      updateSettings({ dailyProteinGoalG: n });
      setGoal(today, n);
    }
    setEditingGoal(false);
  }

  function handleGoalKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitGoalEdit();
    if (e.key === 'Escape') setEditingGoal(false);
  }

  function openCalorieGoalEdit() {
    setCalorieGoalDraft(String(caloriesGoal));
    setEditingCalorieGoal(true);
  }

  function commitCalorieGoalEdit() {
    const n = parseInt(calorieGoalDraft, 10);
    if (!isNaN(n) && n > 0) {
      updateSettings({ dailyCalorieGoal: n });
      setCalorieGoal(today, n);
    }
    setEditingCalorieGoal(false);
  }

  function handleCalorieGoalKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitCalorieGoalEdit();
    if (e.key === 'Escape') setEditingCalorieGoal(false);
  }

  function handleSaveIngredientPatch(servingId: string, food: FoodItem, patch: { proteinPerServing: number; caloriesPerServing: number; servingSize: string }) {
    if (food.isCustom) {
      updateCustomFood(food.id, patch);
      return;
    }

    const customCopy = addCustomFood({
      name: food.name,
      category: food.category,
      proteinPerServing: patch.proteinPerServing,
      caloriesPerServing: patch.caloriesPerServing,
      servingSize: patch.servingSize,
    });
    replaceServingFood(today, servingId, customCopy.id);
  }

  return (
    <div className="flex flex-col flex-1 relative">
      <PageHeader
        title="Diet"
        showBack
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowBrowseMeals(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-medium"
            >
              🍽️ Meals
            </button>
            <button
              onClick={() => setShowAddSheet(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Dual rings */}
        <RingSummary
          proteinTotal={total}
          proteinGoal={goalG}
          calorieTotal={totalCalories}
          calorieGoal={caloriesGoal}
        />

        {/* Protein goal row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
          <span className="text-sm text-[var(--color-text-muted)]">Protein Goal</span>
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-primary)] rounded-lg px-2 py-1">
                <input
                  autoFocus
                  type="number"
                  min="1"
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  onKeyDown={handleGoalKeyDown}
                  className="w-14 bg-transparent text-sm font-semibold text-[var(--color-text)] focus:outline-none text-right"
                />
                <span className="text-sm text-[var(--color-text-muted)]">g</span>
              </div>
              <button
                onClick={commitGoalEdit}
                className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                onClick={() => setEditingGoal(false)}
                className="w-7 h-7 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text)]">{goalG}g</span>
              <button
                onClick={openGoalEdit}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Calorie goal row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
          <span className="text-sm text-[var(--color-text-muted)]">Calorie Goal</span>
          {editingCalorieGoal ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-orange-400 rounded-lg px-2 py-1">
                <input
                  autoFocus
                  type="number"
                  min="1"
                  value={calorieGoalDraft}
                  onChange={(e) => setCalorieGoalDraft(e.target.value)}
                  onKeyDown={handleCalorieGoalKeyDown}
                  className="w-16 bg-transparent text-sm font-semibold text-[var(--color-text)] focus:outline-none text-right"
                />
                <span className="text-sm text-[var(--color-text-muted)]">kcal</span>
              </div>
              <button
                onClick={commitCalorieGoalEdit}
                className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                onClick={() => setEditingCalorieGoal(false)}
                className="w-7 h-7 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text)]">{caloriesGoal} kcal</span>
              <button
                onClick={openCalorieGoalEdit}
                className="text-[var(--color-text-muted)] hover:text-orange-500 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Saved Meals section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Saved Meals</h2>
              <button
                onClick={() => setCreateMealData({})}
                className="text-xs font-medium text-[var(--color-primary)]"
              >
                + Create
              </button>
            </div>
            {savedMeals.length === 0 ? (
              <button
                onClick={() => setCreateMealData({})}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              >
                + Create your first meal
              </button>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <div className="flex gap-3 w-max pb-1">
                  {savedMeals.map((meal) => (
                    <MealTemplateCard
                      key={meal.id}
                      meal={meal}
                      allFoods={allFoods}
                      onLoad={() => setMealEditorData({ mealName: meal.name, mealId: meal.id, initialIngredients: meal.ingredients.map((i) => ({ ...i })) })}
                      onEdit={() => setCreateMealData({ meal })}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Today's log */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Today's Log</h2>
              {allLogEntries.length > 0 && (
                <span className="text-xs text-[var(--color-text-muted)]">{allLogEntries.length} item{allLogEntries.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {allLogEntries.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center">
                <span className="text-4xl mb-3">🍽️</span>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">Nothing logged yet. Start by adding a food or meal!</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBrowseMeals(true)}
                    className="px-4 py-2 rounded-xl border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-semibold"
                  >
                    Log Meal
                  </button>
                  <button
                    onClick={() => setShowAddSheet(true)}
                    className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
                  >
                    Add Food
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {allLogEntries.map((entry) =>
                  entry.kind === 'serving' ? (() => {
                    const food = allFoods.find((f) => f.id === entry.sv.foodId);
                    if (!food) return null;
                    return (
                      <ServingRow
                        key={entry.sv.id}
                        serving={entry.sv}
                        food={food}
                        date={today}
                        onSetServings={(count) => setServings(today, entry.sv.id, count)}
                        onEdit={() => setEditingIngredient({ servingId: entry.sv.id, food })}
                        onRemove={() => removeServing(today, entry.sv.id)}
                      />
                    );
                  })() : (
                    <LoggedMealRow
                      key={entry.entry.id}
                      entry={entry.entry}
                      allFoods={allFoods}
                      onEdit={() =>
                        setMealEditorData({
                          mealName: entry.entry.name,
                          mealId: entry.entry.mealId,
                          initialIngredients: entry.entry.ingredients.map((i) => ({ ...i })),
                          loggedEntryId: entry.entry.id,
                        })
                      }
                      onRemove={() => removeLoggedMeal(today, entry.entry.id)}
                    />
                  )
                )}
              </div>
            )}
          </section>

          {/* Yesterday's meals — quick repeat */}
          {yesterdayServings.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">Yesterday's Meals</h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Tap + to add the same to today</p>
                </div>
                <button
                  onClick={() => {
                    yesterdayServings.forEach((sv) => {
                      const food = allFoods.find((f) => f.id === sv.foodId);
                      if (!food) return;
                      const already = todayServings.find((t) => t.foodId === sv.foodId);
                      if (already) {
                        setServings(today, already.id, already.servings + sv.servings);
                      } else {
                        addServing(food.id, goalG, caloriesGoal);
                        // set correct serving count after adding
                        if (sv.servings > 1) {
                          // find the newly created serving and update it
                          const updated = useProteinStore.getState().days[today]?.servings ?? [];
                          const newSv = updated.find((t) => t.foodId === sv.foodId);
                          if (newSv) setServings(today, newSv.id, sv.servings);
                        }
                      }
                    });
                  }}
                  className="text-xs font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/40 px-2.5 py-1.5 rounded-lg"
                >
                  Add all
                </button>
              </div>
              <div className="space-y-2">
                {yesterdayServings.map((sv) => {
                  const food = allFoods.find((f) => f.id === sv.foodId);
                  if (!food) return null;
                  const meta = CATEGORY_META[food.category];
                  const alreadyAdded = todayServings.some((t) => t.foodId === sv.foodId);
                  return (
                    <div
                      key={sv.id}
                      className="flex items-center gap-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] px-4 py-3"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${meta.bgClass}`}>
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text)] truncate">{food.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {food.proteinPerServing}g × {sv.servings} ={' '}
                          <span className="font-medium text-[var(--color-primary)]">
                            {Math.round(food.proteinPerServing * sv.servings)}g
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const already = todayServings.find((t) => t.foodId === sv.foodId);
                          if (already) {
                            setServings(today, already.id, already.servings + sv.servings);
                          } else {
                            addServing(food.id, goalG, caloriesGoal);
                            if (sv.servings > 1) {
                              const updated = useProteinStore.getState().days[today]?.servings ?? [];
                              const newSv = updated.find((t) => t.foodId === sv.foodId);
                              if (newSv) setServings(today, newSv.id, sv.servings);
                            }
                          }
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          alreadyAdded
                            ? 'bg-[var(--color-success)] text-white'
                            : 'border-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                        }`}
                      >
                        {alreadyAdded ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">Suggested to Balance</h2>
                  <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                    Not yet logged
                  </span>
                </div>
                {recommendationPool.length > 3 && (
                  <button
                    onClick={() => setRecommendationSeed((s) => s + 1)}
                    className="text-xs font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/40 px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-primary)]/10"
                  >
                    Reshuffle
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {recommendations.map((food) => (
                  <RecommendationCard
                    key={food.id}
                    food={food}
                    onAdd={() => handleAddFood(food)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Category breakdown */}
          {(todayServings.length > 0 || todayMeals.length > 0) && (
            <section className="pb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Breakdown by Category</h2>
              <div className="space-y-2">
                {ALL_CATEGORIES.map((cat) => {
                  let catTotal = 0;
                  todayServings.forEach((sv) => {
                    const f = allFoods.find((food) => food.id === sv.foodId);
                    if (f?.category === cat) catTotal += f.proteinPerServing * sv.servings;
                  });
                  todayMeals.forEach((meal) => {
                    meal.ingredients.forEach((ing) => {
                      const f = allFoods.find((food) => food.id === ing.foodId);
                      if (f?.category === cat) catTotal += f.proteinPerServing * ing.servings;
                    });
                  });
                  catTotal = Math.round(catTotal);
                  if (catTotal === 0) return null;
                  const pct = total > 0 ? Math.round((catTotal / total) * 100) : 0;
                  const meta = CATEGORY_META[cat];
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="w-6 text-base">{meta.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--color-text-muted)]">{meta.label}</span>
                          <span className="font-medium text-[var(--color-text)]">{catTotal}g</span>
                        </div>
                        <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${meta.bgClass.replace('bg-', 'bg-')} transition-all`}
                            style={{ width: `${pct}%`, backgroundColor: undefined }}
                          >
                            <div className={`h-full rounded-full ${meta.textClass.replace('text-', 'bg-')}`} style={{ width: '100%' }} />
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)] w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Sheets */}
      {showAddSheet && (
        <AddFoodSheet
          allFoods={allFoods}
          todayServings={todayServings}
          onAdd={handleAddFood}
          onAddCustom={() => { setCustomInitialName(''); setShowCustomSheet(true); }}
          onClose={() => setShowAddSheet(false)}
        />
      )}
      {showCustomSheet && (
        <AddCustomFoodSheet
          initialName={customInitialName}
          onSave={handleCustomSaved}
          onClose={() => setShowCustomSheet(false)}
        />
      )}
      {showBrowseMeals && (
        <BrowseMealsSheet
          savedMeals={savedMeals}
          allFoods={allFoods}
          onSelect={(meal) => {
            setMealEditorData({ mealName: meal.name, mealId: meal.id, initialIngredients: meal.ingredients.map((i) => ({ ...i })) });
            setShowBrowseMeals(false);
          }}
          onCreate={() => {
            setCreateMealData({});
            setShowBrowseMeals(false);
          }}
          onClose={() => setShowBrowseMeals(false)}
        />
      )}
      {mealEditorData && (
        <MealEditorSheet
          mealName={mealEditorData.mealName}
          initialIngredients={mealEditorData.initialIngredients}
          allFoods={allFoods}
          confirmLabel={mealEditorData.loggedEntryId ? 'Save Changes' : 'Log Meal'}
          onConfirm={(ingredients) => {
            if (mealEditorData.loggedEntryId) {
              updateLoggedMeal(today, mealEditorData.loggedEntryId, ingredients);
            } else {
              logMeal(mealEditorData.mealName, ingredients, mealEditorData.mealId, goalG, caloriesGoal);
            }
            setMealEditorData(null);
          }}
          onClose={() => setMealEditorData(null)}
        />
      )}
      {createMealData !== null && (
        <CreateMealSheet
          meal={createMealData.meal}
          onSave={(name, ingredients) => {
            if (createMealData.meal) {
              updateMeal(createMealData.meal.id, { name, ingredients });
            } else {
              addMeal(name, ingredients);
            }
            setCreateMealData(null);
          }}
          onDelete={createMealData.meal ? () => { deleteMeal(createMealData.meal!.id); setCreateMealData(null); } : undefined}
          onClose={() => setCreateMealData(null)}
        />
      )}
      {editingIngredient && (
        <EditLoggedIngredientSheet
          food={editingIngredient.food}
          onSave={(patch) => {
            handleSaveIngredientPatch(editingIngredient.servingId, editingIngredient.food, patch);
            setEditingIngredient(null);
          }}
          onClose={() => setEditingIngredient(null)}
        />
      )}
    </div>
  );
}
