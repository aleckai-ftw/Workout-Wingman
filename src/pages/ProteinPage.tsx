import { useState, useMemo } from 'react';
import { useProteinStore, todayDateKey, computeDayTotal } from '../stores/proteinStore';
import { useFoodStore, getAllFoods, filterFoods } from '../stores/foodStore';
import { useProfileStore } from '../stores/profileStore';
import { PageHeader } from '../components/PageHeader';
import { CATEGORY_META, ALL_CATEGORIES, RECOMMENDATION_PRIORITY } from '../data/foods';
import type { FoodCategory, FoodItem, DailyServing } from '../types';

// ─── Ring summary ─────────────────────────────────────────────────────────────

function RingSummary({ total, goal }: { total: number; goal: number }) {
  const pct = Math.min(100, goal > 0 ? Math.round((total / goal) * 100) : 0);
  const r = 76;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);
  const color = pct >= 100 ? '#22c55e' : '#3a5c3a';

  return (
    <div className="flex flex-col items-center py-6 bg-white">
      <div className="relative flex items-center justify-center">
        <svg width={196} height={196} className="-rotate-90">
          <circle cx={98} cy={98} r={r} fill="none" stroke="#e5e2db" strokeWidth={12} />
          <circle
            cx={98} cy={98} r={r}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xs text-[var(--color-text-muted)]">Today</span>
          <span className="text-4xl font-bold text-[var(--color-text)] leading-tight">{total}g</span>
          <span className="text-sm text-[var(--color-text-muted)]">of {goal}g</span>
          <span className="text-xs font-semibold mt-0.5" style={{ color }}>{pct}% of goal</span>
        </div>
      </div>
    </div>
  );
}

// ─── Today's log row ──────────────────────────────────────────────────────────

function ServingRow({
  serving,
  food,
  date: _date,
  onSetServings,
  onRemove,
}: {
  serving: DailyServing;
  food: FoodItem;
  date: string;
  onSetServings: (count: number) => void;
  onRemove: () => void;
}) {
  const totalG = Math.round(food.proteinPerServing * serving.servings);
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
          {food.proteinPerServing}g × {serving.servings} = <span className="font-medium text-[var(--color-primary)]">{totalG}g</span>
        </p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">{food.servingSize}</p>
      </div>

      {/* Serving counter */}
      <div className="flex items-center gap-1 shrink-0">
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

// ─── Recommendation card ──────────────────────────────────────────────────────

function RecommendationCard({ food, onAdd }: { food: FoodItem; onAdd: () => void }) {
  const meta = CATEGORY_META[food.category];
  return (
    <div className="flex items-center gap-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-3 py-2.5">
      <span className="text-xl">{meta.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text)] truncate">{food.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{food.proteinPerServing}g protein · {food.servingSize}</p>
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
              type="text"
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
                    <p className="text-xs text-[var(--color-text-muted)]">{food.proteinPerServing}g protein · {food.servingSize}</p>
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
  const [servingSize, setServingSize] = useState('');
  const [error, setError] = useState('');

  function handleSave() {
    const protein = parseFloat(proteinStr);
    if (!name.trim()) { setError('Name is required.'); return; }
    if (isNaN(protein) || protein <= 0) { setError('Enter a valid protein amount.'); return; }
    if (!servingSize.trim()) { setError('Serving size description is required.'); return; }
    const food = addCustomFood({ name: name.trim(), category, proteinPerServing: protein, servingSize: servingSize.trim() });
    onSave(food);
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 right-0 bg-white rounded-t-3xl p-5 space-y-4" style={{ bottom: 64 }}>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRecommendations(servings: DailyServing[], allFoods: FoodItem[]): FoodItem[] {
  const covered = new Set<FoodCategory>();
  servings.forEach((s) => {
    const food = allFoods.find((f) => f.id === s.foodId);
    if (food) covered.add(food.category);
  });

  const results: FoodItem[] = [];
  for (const cat of RECOMMENDATION_PRIORITY) {
    if (!covered.has(cat)) {
      // Highest-protein built-in food from this category
      const best = allFoods
        .filter((f) => f.category === cat && !f.isCustom)
        .sort((a, b) => b.proteinPerServing - a.proteinPerServing)[0];
      if (best) results.push(best);
    }
    if (results.length >= 3) break;
  }
  return results;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ProteinPage() {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [customInitialName, setCustomInitialName] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');

  // Stores
  const customFoods = useFoodStore((s) => s.customFoods);
  const allFoods = useMemo(() => getAllFoods(customFoods), [customFoods]);

  const { days, addServing, setServings, removeServing, setGoal } = useProteinStore();
  const { settings, updateSettings } = useProfileStore();

  const today = todayDateKey();
  const todayDay = days[today];
  const todayServings = todayDay?.servings ?? [];
  const goalG = todayDay?.goalG ?? settings.dailyProteinGoalG;

  // Yesterday
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = yesterdayDate.toISOString().slice(0, 10);
  const yesterdayServings = days[yesterdayKey]?.servings ?? [];
  const total = Math.round(computeDayTotal(todayServings, allFoods));

  const recommendations = useMemo(
    () => getRecommendations(todayServings, allFoods),
    [todayServings, allFoods],
  );

  function handleAddFood(food: FoodItem) {
    addServing(food.id, goalG);
  }

  function handleCustomSaved(food: FoodItem) {
    addServing(food.id, goalG);
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

  return (
    <div className="flex flex-col flex-1 relative">
      <PageHeader
        title="Protein Tracker"
        showBack
        actions={
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Ring */}
        <RingSummary total={total} goal={goalG} />

        {/* Goal row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
          <span className="text-sm text-[var(--color-text-muted)]">Daily Goal</span>
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

        <div className="px-5 py-5 space-y-6">
          {/* Today's log */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Today's Log</h2>
              {todayServings.length > 0 && (
                <span className="text-xs text-[var(--color-text-muted)]">{todayServings.length} item{todayServings.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {todayServings.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center">
                <span className="text-4xl mb-3">🍽️</span>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">Nothing logged yet. Start by adding a food!</p>
                <button
                  onClick={() => setShowAddSheet(true)}
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
                >
                  Add Food
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todayServings.map((sv) => {
                  const food = allFoods.find((f) => f.id === sv.foodId);
                  if (!food) return null;
                  return (
                    <ServingRow
                      key={sv.id}
                      serving={sv}
                      food={food}
                      date={today}
                      onSetServings={(count) => setServings(today, sv.id, count)}
                      onRemove={() => removeServing(today, sv.id)}
                    />
                  );
                })}
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
                        addServing(food.id, goalG);
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
                            addServing(food.id, goalG);
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
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-[var(--color-text)]">Suggested to Balance</h2>
                <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                  Not yet logged
                </span>
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
          {todayServings.length > 0 && (
            <section className="pb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Breakdown by Category</h2>
              <div className="space-y-2">
                {ALL_CATEGORIES.map((cat) => {
                  const catServings = todayServings.filter((sv) => {
                    const f = allFoods.find((food) => food.id === sv.foodId);
                    return f?.category === cat;
                  });
                  if (catServings.length === 0) return null;
                  const catTotal = Math.round(
                    catServings.reduce((sum, sv) => {
                      const f = allFoods.find((food) => food.id === sv.foodId);
                      return sum + (f ? f.proteinPerServing * sv.servings : 0);
                    }, 0),
                  );
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
    </div>
  );
}
