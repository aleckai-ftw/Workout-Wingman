import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useSupersetStore } from '../stores/supersetStore';
import { useTimerStore } from '../stores/timerStore';
import { BUILT_IN_SS_DEFS, SS_MUSCLE_GROUPS, MUSCLE_GROUP_META } from '../data/supersets';
import type { SsDef, SsExercise, SsMuscleGroup, SsSetState, CustomMuscleGroup, SsWorkoutTemplateEntry } from '../types';

// ─── Meta helper (handles both built-in and custom groups) ───────────────────

function getMeta(
  mg: string,
  customGroups: CustomMuscleGroup[],
): { label: string; emoji: string; description: string } {
  if (mg in MUSCLE_GROUP_META) return MUSCLE_GROUP_META[mg as SsMuscleGroup];
  const custom = customGroups.find((g) => g.id === mg);
  if (custom) return { label: custom.label, emoji: custom.emoji, description: '' };
  return { label: mg, emoji: '💪', description: '' };
}

// ─── Set toggle circle ───────────────────────────────────────────────────────────────
// Cycles: pending (empty) → done (✅ green) → failed (❌ red) → pending

function SetCircle({ state, onToggle }: { state: SsSetState; onToggle: () => void }) {
  const base = 'w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all active:scale-95';
  if (state === 'done')
    return (
      <button onClick={onToggle} className={`${base} bg-[var(--color-success)] border-[var(--color-success)]`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-4 h-4">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    );
  if (state === 'failed')
    return (
      <button onClick={onToggle} className={`${base} bg-[var(--color-danger)] border-[var(--color-danger)]`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-4 h-4">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    );
  return <button onClick={onToggle} className={`${base} border-[var(--color-border)] bg-white`} />;
}

// ─── Tap-to-type numeric input ────────────────────────────────────────────────
// Shows as a text input styled to match surrounding content.
// Selects-all on focus for easy retyping; syncs from parent while unfocused.

function NumericInput({
  value,
  onCommit,
  min = 0,
  className = '',
}: {
  value: number;
  onCommit: (v: number) => void;
  min?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  function commit() {
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed) && parsed >= min) onCommit(parsed);
    else setDraft(String(value));
    setFocused(false);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
      onFocus={(e) => { setFocused(true); e.target.select(); }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
        if (e.key === 'Escape') { setDraft(String(value)); (e.target as HTMLInputElement).blur(); }
      }}
      className={className}
    />
  );
}

// ─── Chevron ──────────────────────────────────────────────────────────────────

function ChevronDown({ flipped }: { flipped: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200 ${flipped ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Suggestion algorithm ─────────────────────────────────────────────────────
// Picks one def per muscle group, preferring exercises not used in the last two
// sessions. Uses the current date as a seed so the suggestion changes day-to-day.

function generateSuggestion(
  allDefs: SsDef[],
  lastDefIds: Set<string>,
  prevDefIds: Set<string>,
  dateStr: string,
): string[] {
  const seed = dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return SS_MUSCLE_GROUPS.map((mg, gi) => {
    const pool = allDefs.filter((d) => d.muscleGroup === mg);
    if (pool.length === 0) return '';
    const notLast = pool.filter((d) => !lastDefIds.has(d.id));
    const notPrev = notLast.filter((d) => !prevDefIds.has(d.id));
    const candidates = notPrev.length > 0 ? notPrev : notLast.length > 0 ? notLast : pool;
    return candidates[(seed + gi * 7) % candidates.length].id;
  });
}

// ─── Add exercise sheet ───────────────────────────────────────────────────────

interface AddExerciseSheetProps {
  onSaved: (ex: SsExercise) => void;
  onClose: () => void;
}

function AddExerciseSheet({ onSaved, onClose }: AddExerciseSheetProps) {
  const store = useSupersetStore();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState(45);
  const [targetReps, setTargetReps] = useState(10);
  const [muscleGroup, setMuscleGroup] = useState<string>('chest_back');

  const canSave = name.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    const ex = store.addExercise(name.trim(), weight, muscleGroup, targetReps);
    onSaved(ex);
  }

  const allGroups = [
    ...SS_MUSCLE_GROUPS.map((mg) => ({ id: mg, ...MUSCLE_GROUP_META[mg] })),
    ...store.customMuscleGroups.map((g) => ({ id: g.id, label: g.label, emoji: g.emoji, description: '' })),
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[65]" onClick={onClose} />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[70] bg-white rounded-t-3xl flex flex-col w-full"
        style={{ bottom: 64, maxHeight: '80vh', maxWidth: 480, boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="px-4 pt-1 pb-3 border-b border-[var(--color-border)] shrink-0 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-[var(--color-text-muted)]">Cancel</button>
          <h3 className="font-bold text-[var(--color-text)] text-lg">New Exercise</h3>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="text-sm font-semibold text-[var(--color-primary)] disabled:opacity-40"
          >
            Save
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-6">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Exercise Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Dumbbell Curls"
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Muscle group */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
              Muscle Group
            </label>
            <div className="flex flex-wrap gap-2">
              {allGroups.map((g) => {
                const selected = muscleGroup === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setMuscleGroup(g.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-colors ${
                      selected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    <span>{g.emoji}</span>
                    <span>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Starting Weight
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWeight((w) => Math.max(0, w - 5))}
                className="w-11 h-11 rounded-full border-2 border-[var(--color-border)] text-xl font-bold flex items-center justify-center text-[var(--color-text-muted)]"
              >
                −
              </button>
              <div className="flex-1 flex items-center justify-center gap-1">
                <NumericInput
                  value={weight}
                  onCommit={(v) => setWeight(v)}
                  min={0}
                  className="w-16 text-center text-3xl font-bold text-[var(--color-text)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                />
                <span className="text-sm text-[var(--color-text-muted)]">lbs</span>
              </div>
              <button
                onClick={() => setWeight((w) => w + 5)}
                className="w-11 h-11 rounded-full bg-[var(--color-primary)] text-white text-xl font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Target Reps
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTargetReps((r) => Math.max(1, r - 1))}
                className="w-11 h-11 rounded-full border-2 border-[var(--color-border)] text-xl font-bold flex items-center justify-center text-[var(--color-text-muted)]"
              >
                −
              </button>
              <div className="flex-1 flex items-center justify-center gap-1">
                <NumericInput
                  value={targetReps}
                  onCommit={(v) => setTargetReps(Math.max(1, v))}
                  min={1}
                  className="w-16 text-center text-3xl font-bold text-[var(--color-text)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                />
                <span className="text-sm text-[var(--color-text-muted)]">reps</span>
              </div>
              <button
                onClick={() => setTargetReps((r) => r + 1)}
                className="w-11 h-11 rounded-full bg-[var(--color-primary)] text-white text-xl font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Exercise picker (inside CreateCustomSheet) ───────────────────────────────

interface ExercisePickerProps {
  label: string;
  exerciseDb: Record<string, SsExercise>;
  onSelect: (ex: SsExercise) => void;
  onBack: () => void;
  addExercise: (name: string, weight?: number, muscleGroup?: string) => SsExercise;
  /** If provided, newly created exercises inherit this muscle group */
  muscleGroupContext?: string;
}

function ExercisePicker({ label, exerciseDb, onSelect, onBack, addExercise, muscleGroupContext }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [creatingWeight, setCreatingWeight] = useState(45);

  const all = Object.values(exerciseDb).sort((a, b) => a.name.localeCompare(b.name));
  const filtered = query
    ? all.filter((ex) => ex.name.toLowerCase().includes(query.toLowerCase()))
    : all;

  const exactMatch = all.find((ex) => ex.name.toLowerCase() === query.toLowerCase().trim());

  function handleCreate() {
    const trimmed = query.trim();
    if (!trimmed) return;
    const ex = addExercise(trimmed, creatingWeight, muscleGroupContext ?? '');
    onSelect(ex);
  }

  // Group exercises by muscle group when not searching
  const groupedRows: Array<{ type: 'header'; id: string } | { type: 'exercise'; ex: SsExercise }> = [];
  if (!query) {
    const byGroup = new Map<string, SsExercise[]>();
    for (const ex of all) {
      const g = ex.muscleGroup || '__none__';
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(ex);
    }
    // Show known groups first, then uncategorised
    const orderedGroups = [...SS_MUSCLE_GROUPS.filter((g) => byGroup.has(g)), ...(byGroup.has('__none__') ? ['__none__'] : [])];
    for (const g of orderedGroups) {
      groupedRows.push({ type: 'header', id: g });
      for (const ex of byGroup.get(g)!) groupedRows.push({ type: 'exercise', ex });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-2 pb-3 border-b border-[var(--color-border)] shrink-0 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[var(--color-primary)] text-sm font-semibold"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h3 className="font-bold text-[var(--color-text)] text-base flex-1 text-center pr-10">
          {label}
        </h3>
      </div>
      {/* Search */}
      <div className="px-4 py-3 shrink-0">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-surface)]"
          />
        </div>
      </div>
      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {query ? (
          <div className="space-y-2 pt-1">
            {filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-left active:border-[var(--color-primary)]"
              >
                <span className="text-sm font-semibold text-[var(--color-text)]">{ex.name}</span>
                <span className="text-sm font-bold text-[var(--color-primary)] shrink-0">{ex.weightLbs} lbs</span>
              </button>
            ))}
            {/* Create new if no exact match */}
            {query.trim() && !exactMatch && (
              <div className="border-2 border-dashed border-[var(--color-primary)]/40 rounded-xl p-3 space-y-3">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Create "<span className="text-[var(--color-primary)]">{query.trim()}</span>"
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCreatingWeight((w) => Math.max(0, w - 5))}
                    className="w-9 h-9 rounded-full border-2 border-[var(--color-border)] text-lg font-bold flex items-center justify-center text-[var(--color-text-muted)]"
                  >
                    −
                  </button>
                  <div className="flex-1 flex items-center justify-center gap-1">
                    <NumericInput
                      value={creatingWeight}
                      onCommit={(v) => setCreatingWeight(v)}
                      min={0}
                      className="w-14 text-center text-xl font-bold text-[var(--color-text)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                    />
                    <span className="text-xs text-[var(--color-text-muted)]">lbs</span>
                  </div>
                  <button
                    onClick={() => setCreatingWeight((w) => w + 5)}
                    className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white text-lg font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleCreate}
                  className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold"
                >
                  Add &amp; Select
                </button>
              </div>
            )}
            {filtered.length === 0 && !query.trim() && (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
                No exercises yet. Type a name to create one.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1 pt-1">
            {groupedRows.map((row, i) =>
              row.type === 'header' ? (
                <div key={`h-${row.id}`} className={`text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-1 pt-3 pb-1 ${i === 0 ? 'pt-1' : ''}`}>
                  {row.id === '__none__' ? 'Uncategorised' : `${MUSCLE_GROUP_META[row.id as SsMuscleGroup]?.emoji ?? ''} ${MUSCLE_GROUP_META[row.id as SsMuscleGroup]?.label ?? row.id}`}
                </div>
              ) : (
                <button
                  key={row.ex.id}
                  onClick={() => onSelect(row.ex)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-left active:border-[var(--color-primary)]"
                >
                  <span className="text-sm font-semibold text-[var(--color-text)]">{row.ex.name}</span>
                  <span className="text-sm font-bold text-[var(--color-primary)] shrink-0">{row.ex.weightLbs} lbs</span>
                </button>
              )
            )}
            {groupedRows.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
                No exercises yet. Type a name above to create one.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create custom superset sheet ────────────────────────────────────────────

interface CreateCustomSheetProps {
  onSaved: (def: SsDef) => void;
  onClose: () => void;
}

function CreateCustomSheet({ onSaved, onClose }: CreateCustomSheetProps) {
  const store = useSupersetStore();
  const [selectedExA, setSelectedExA] = useState<SsExercise | null>(null);
  const [selectedExB, setSelectedExB] = useState<SsExercise | null>(null);
  const [nameManual, setNameManual] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<string>('chest_back');
  const [pickerFor, setPickerFor] = useState<'A' | 'B' | null>(null);

  // New category inline form
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('💪');

  const autoName =
    selectedExA && selectedExB ? `${selectedExA.name} + ${selectedExB.name}` : '';
  const canSave = !!selectedExA && !!selectedExB;

  function handleSave() {
    if (!canSave) return;
    const name = nameManual.trim() || autoName;
    const def = store.addCustomDef({
      name,
      muscleGroup,
      exerciseAId: selectedExA!.id,
      exerciseBId: selectedExB!.id,
    });
    onSaved(def);
  }

  function handleSaveCategory() {
    if (!newCatLabel.trim()) return;
    const group = store.addCustomMuscleGroup({
      label: newCatLabel.trim(),
      emoji: newCatEmoji.trim() || '💪',
    });
    setMuscleGroup(group.id);
    setAddingCategory(false);
    setNewCatLabel('');
    setNewCatEmoji('💪');
  }

  const allGroups: Array<{ id: string; label: string; emoji: string; description: string }> = [
    ...SS_MUSCLE_GROUPS.map((mg) => ({ id: mg, ...MUSCLE_GROUP_META[mg] })),
    ...store.customMuscleGroups.map((g) => ({ id: g.id, label: g.label, emoji: g.emoji, description: '' })),
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-60" onClick={onClose} />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[70] bg-white rounded-t-3xl flex flex-col w-full"
        style={{ bottom: 64, height: '78vh', maxWidth: 480, boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {pickerFor ? (
          /* ── Exercise picker mode ── */
          <ExercisePicker
            label={`Select Exercise ${pickerFor}`}
            exerciseDb={store.exerciseDb}
            onSelect={(ex) => {
              pickerFor === 'A' ? setSelectedExA(ex) : setSelectedExB(ex);
              setPickerFor(null);
            }}
            onBack={() => setPickerFor(null)}
            addExercise={store.addExercise}
            muscleGroupContext={muscleGroup}
          />
        ) : (
          /* ── Normal form mode ── */
          <>
            {/* Header */}
            <div className="px-4 pt-1 pb-3 border-b border-[var(--color-border)] shrink-0 flex items-center justify-between">
              <button onClick={onClose} className="text-sm text-[var(--color-text-muted)]">
                Cancel
              </button>
              <h3 className="font-bold text-[var(--color-text)] text-lg">New Superset</h3>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="text-sm font-semibold text-[var(--color-primary)] disabled:opacity-40"
              >
                Save
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-6">
              {/* Exercise A picker */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
                  Exercise A
                </label>
                <button
                  onClick={() => setPickerFor('A')}
                  className={`w-full px-3.5 py-3 rounded-xl border text-left text-sm transition-colors ${
                    selectedExA
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {selectedExA ? (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--color-text)]">{selectedExA.name}</span>
                      <span className="font-bold text-[var(--color-primary)]">{selectedExA.weightLbs} lbs</span>
                    </div>
                  ) : (
                    <span>Tap to select exercise A…</span>
                  )}
                </button>
              </div>

              {/* Exercise B picker */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
                  Exercise B
                </label>
                <button
                  onClick={() => setPickerFor('B')}
                  className={`w-full px-3.5 py-3 rounded-xl border text-left text-sm transition-colors ${
                    selectedExB
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {selectedExB ? (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--color-text)]">{selectedExB.name}</span>
                      <span className="font-bold text-[var(--color-primary)]">{selectedExB.weightLbs} lbs</span>
                    </div>
                  ) : (
                    <span>Tap to select exercise B…</span>
                  )}
                </button>
              </div>

              {/* Name override */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
                  Name <span className="font-normal normal-case">(optional — auto-filled)</span>
                </label>
                <input
                  value={nameManual}
                  onChange={(e) => setNameManual(e.target.value)}
                  placeholder={autoName || 'Auto-generated from exercises'}
                  className="w-full px-3.5 py-3 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--color-text-muted)]/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                  Category
                </label>
                <div className="space-y-2">
                  {allGroups.map((g) => {
                    const selected = muscleGroup === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setMuscleGroup(g.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                          selected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                            : 'border-[var(--color-border)] bg-white'
                        }`}
                      >
                        <span className="text-xl shrink-0">{g.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                            {g.label}
                          </p>
                          {g.description && (
                            <p className="text-xs text-[var(--color-text-muted)]">{g.description}</p>
                          )}
                        </div>
                        {selected && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-[var(--color-primary)] shrink-0">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}

                  {/* Inline new category form */}
                  {addingCategory ? (
                    <div className="border-2 border-[var(--color-primary)] rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide">New Category</p>
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={newCatEmoji}
                          onChange={(e) => setNewCatEmoji(e.target.value)}
                          maxLength={2}
                          placeholder="🏋️"
                          className="w-14 px-2 py-2.5 rounded-lg border border-[var(--color-border)] text-center text-lg focus:outline-none focus:border-[var(--color-primary)]"
                        />
                        <input
                          value={newCatLabel}
                          onChange={(e) => setNewCatLabel(e.target.value)}
                          placeholder="e.g. Forearms"
                          className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setAddingCategory(false); setNewCatLabel(''); setNewCatEmoji('💪'); }}
                          className="flex-1 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveCategory}
                          disabled={!newCatLabel.trim()}
                          className="flex-1 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold disabled:opacity-40"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingCategory(true)}
                      className="w-full py-3.5 border-2 border-dashed border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-muted)] font-medium flex items-center justify-center gap-2 active:border-[var(--color-primary)] active:text-[var(--color-primary)]"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      New category
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Search sheet (bottom drawer) ────────────────────────────────────────────

interface SheetProps {
  allDefs: SsDef[];
  exerciseDb: Record<string, { name: string; weightLbs: number }>;
  usedDefIds: Set<string>;
  lastSessionDefIds: Set<string>;
  customMuscleGroups: CustomMuscleGroup[];
  onSelect: (def: SsDef) => void;
  onClose: () => void;
  onCreateCustom: () => void;
}

function SearchSheet({
  allDefs,
  exerciseDb,
  usedDefIds,
  lastSessionDefIds,
  customMuscleGroups,
  onSelect,
  onClose,
  onCreateCustom,
}: SheetProps) {
  const [query, setQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allDefs.filter((d) => {
      const matchGroup = filterGroup === 'all' || d.muscleGroup === filterGroup;
      const nameA = exerciseDb[d.exerciseAId]?.name ?? '';
      const nameB = exerciseDb[d.exerciseBId]?.name ?? '';
      const matchQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        nameA.toLowerCase().includes(q) ||
        nameB.toLowerCase().includes(q);
      return matchGroup && matchQuery;
    });
  }, [allDefs, query, filterGroup]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[60] bg-white rounded-t-3xl flex flex-col w-full"
        style={{ bottom: 64, height: '72vh', maxWidth: 480, boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header + search + filters */}
        <div className="px-4 pt-1 pb-3 border-b border-[var(--color-border)] shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-text)] text-lg">Choose a Superset</h3>
            <button
              onClick={onClose}
              className="text-[var(--color-primary)] text-sm font-semibold"
            >
              Done
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or exercise..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-surface)]"
            />
          </div>

          {/* Muscle group filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 no-scrollbar">
            <button
              onClick={() => setFilterGroup('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 whitespace-nowrap transition-colors shrink-0 ${
                filterGroup === 'all'
                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
              }`}
            >
              All
            </button>
            {SS_MUSCLE_GROUPS.map((mg) => {
              const meta = MUSCLE_GROUP_META[mg];
              return (
                <button
                  key={mg}
                  onClick={() => setFilterGroup(mg)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 whitespace-nowrap transition-colors shrink-0 ${
                    filterGroup === mg
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
            {customMuscleGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => setFilterGroup(g.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 whitespace-nowrap transition-colors shrink-0 ${
                  filterGroup === g.id
                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                {g.emoji} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
              No matching supersets.
            </p>
          )}
          {filtered.map((def) => {
            const isUsed = usedDefIds.has(def.id);
            const wasLast = lastSessionDefIds.has(def.id);
            const exA = exerciseDb[def.exerciseAId];
            const exB = exerciseDb[def.exerciseBId];
            const meta = getMeta(def.muscleGroup, customMuscleGroups);

            return (
              <button
                key={def.id}
                onClick={() => !isUsed && onSelect(def)}
                disabled={isUsed}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                  isUsed
                    ? 'opacity-35 bg-[var(--color-surface)] border-[var(--color-border)]'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] active:border-[var(--color-primary)] active:bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="text-xs">{meta.emoji}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{meta.label}</span>
                      {wasLast && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          ⚠ Last session
                        </span>
                      )}
                      {isUsed && (
                        <span className="text-xs bg-[var(--color-border)] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded-full font-medium">
                          Added
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{def.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      A: {exA?.name ?? def.exerciseAId}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      B: {exB?.name ?? def.exerciseBId}
                    </p>
                  </div>
                  {(exA || exB) && (
                    <div className="text-right shrink-0 mt-0.5">
                      <p className="text-xs text-[var(--color-text-muted)]">Planned</p>
                      {exA && <p className="text-xs font-bold text-[var(--color-primary)]">A {exA.weightLbs}lbs</p>}
                      {exB && <p className="text-xs font-bold text-[var(--color-primary)]">B {exB.weightLbs}lbs</p>}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Create custom button */}
          <button
            onClick={onCreateCustom}
            className="w-full py-4 border-2 border-dashed border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-muted)] font-medium flex items-center justify-center gap-2 active:border-[var(--color-primary)] active:text-[var(--color-primary)]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="w-4 h-4"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create custom superset
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Template rename row ─────────────────────────────────────────────────────

function TemplateRenameRow({
  template,
  onSave,
  onCancel,
}: {
  template: { id: string; title: string };
  onSave: (title: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(template.title);
  return (
    <div className="px-4 py-3 flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(value);
          if (e.key === 'Escape') onCancel();
        }}
        className="flex-1 px-3 py-1.5 rounded-xl border border-[var(--color-primary)] text-sm focus:outline-none"
      />
      <button
        onClick={() => onSave(value)}
        disabled={!value.trim()}
        className="px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold disabled:opacity-40"
      >
        Save
      </button>
      <button onClick={onCancel} className="text-xs text-[var(--color-text-muted)]">
        Cancel
      </button>
    </div>
  );
}

// ─── Save Workout Template sheet ─────────────────────────────────────────────

function SaveTemplateSheet({
  onSave,
  onClose,
}: {
  onSave: (title: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[65]" onClick={onClose} />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[70] bg-white rounded-t-3xl flex flex-col w-full"
        style={{ bottom: 64, maxHeight: '60vh', maxWidth: 480, boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="px-4 pt-1 pb-3 border-b border-[var(--color-border)] shrink-0 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-[var(--color-text-muted)]">Cancel</button>
          <h3 className="font-bold text-[var(--color-text)] text-lg">Save Workout</h3>
          <button
            onClick={() => onSave(title)}
            disabled={!title.trim()}
            className="text-sm font-semibold text-[var(--color-primary)] disabled:opacity-40"
          >
            Save
          </button>
        </div>
        <div className="px-4 py-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Workout Name
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && title.trim() && onSave(title)}
              placeholder="e.g. Push Day, Monday Routine…"
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Saves the current superset selection and set counts so you can load this exact workout anytime.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function SupersetPage() {
  const store = useSupersetStore();
  const timer = useTimerStore();

  // Tab
  const [tab, setTab] = useState<'supersets' | 'saved' | 'exercises' | 'categories'>('supersets');

  // Categories state
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('💪');
  const [showAddExercise, setShowAddExercise] = useState(false);

  // Planning state
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null]);
  const [numSetsMap, setNumSetsMap] = useState<Record<string, 1 | 3 | 5>>({});
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [suggestedDismissed, setSuggestedDismissed] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Active session accordion
  const [expandedIdx, setExpandedIdx] = useState<number>(0);
  const [swappingEntryIdx, setSwappingEntryIdx] = useState<number | null>(null);

  const activeSession = store.sessions.find(
    (s) => s.id === store.activeSessionId && !s.completed,
  );
  const completedSessions = store.sessions.filter((s) => s.completed);
  const lastSession = completedSessions[completedSessions.length - 1];
  const prevSession = completedSessions[completedSessions.length - 2];
  const lastSessionDefIds = new Set(lastSession?.entries.map((e) => e.defId) ?? []);
  const prevSessionDefIds = new Set(prevSession?.entries.map((e) => e.defId) ?? []);

  const allDefs = [...BUILT_IN_SS_DEFS, ...store.customDefs];
  const usedDefIds = new Set(slots.filter(Boolean) as string[]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const suggestion = useMemo(
    () => generateSuggestion(allDefs, lastSessionDefIds, prevSessionDefIds, todayStr),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.customDefs, store.sessions, todayStr],
  );
  const showSuggestion = !suggestedDismissed && slots.every((s) => !s) && suggestion.every(Boolean);

  const allFilled = slots.every(Boolean);
  const allHaveSets = slots.every((id) => id && numSetsMap[id]);
  const canStart = allFilled && allHaveSets;

  function handleSlotSelect(def: SsDef) {
    if (openSlot === null) return;
    setSlots((prev) => {
      const next = [...prev];
      next[openSlot] = def.id;
      return next;
    });
    if (!numSetsMap[def.id]) {
      setNumSetsMap((prev) => ({ ...prev, [def.id]: 3 }));
    }
    setOpenSlot(null);
  }

  function handleClearSlot(i: number, e: React.MouseEvent) {
    e.stopPropagation();
    setSlots((prev) => {
      const next = [...prev];
      next[i] = null;
      return next;
    });
  }

  function handleStartSession() {
    const entries = slots.map((defId) => {
      const def = allDefs.find((d) => d.id === defId)!;
      return {
        defId: def.id,
        defName: def.name,
        exerciseAId: def.exerciseAId,
        exerciseBId: def.exerciseBId,
        muscleGroup: def.muscleGroup,
        numSets: numSetsMap[defId!] as 1 | 3 | 5,
      };
    });
    store.startSession(entries);
    setSlots([null, null, null, null, null]);
    setNumSetsMap({});
    setExpandedIdx(0);
  }

  // ─── Memos needed by both views (must be above early return to obey Rules of Hooks) ──────────

  const sortedExercises = useMemo(
    () => Object.values(store.exerciseDb).sort((a, b) => a.name.localeCompare(b.name)),
    [store.exerciseDb],
  );

  const exercisesByGroup = useMemo(() => {
    const byGroup = new Map<string, SsExercise[]>();
    for (const ex of sortedExercises) {
      const g = ex.muscleGroup || '__none__';
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(ex);
    }
    const orderedGroups = [
      ...SS_MUSCLE_GROUPS.filter((g) => byGroup.has(g)),
      ...(byGroup.has('__none__') ? ['__none__'] : []),
    ];
    return orderedGroups.map((g) => ({
      groupId: g,
      label: g === '__none__' ? 'Uncategorised' : `${MUSCLE_GROUP_META[g as SsMuscleGroup]?.emoji ?? ''} ${MUSCLE_GROUP_META[g as SsMuscleGroup]?.label ?? g}`,
      exercises: byGroup.get(g)!,
    }));
  }, [sortedExercises]);

  // ─── Active session view ──────────────────────────────────────────────────

  if (activeSession) {
    return (
      <div className="flex flex-col flex-1">
        <PageHeader title="Today's Supersets" showBack />
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {activeSession.entries.map((entry, ei) => {
            const isOpen = expandedIdx === ei;
            const meta = getMeta(entry.muscleGroup, store.customMuscleGroups);

            const dots = entry.sets.map((s) => {
              if (s.stateA === 'done' && s.stateB === 'done') return 'done';
              if (s.stateA === 'failed' || s.stateB === 'failed') return 'failed';
              if (s.stateA !== 'pending' || s.stateB !== 'pending') return 'partial';
              return 'pending';
            });
            const isFullyDone = dots.every((d) => d === 'done');

            return (
              <div
                key={entry.defId}
                className={`bg-white border-2 rounded-2xl overflow-hidden transition-colors ${
                  isFullyDone
                    ? 'border-[var(--color-success)]'
                    : isOpen
                    ? 'border-[var(--color-primary)]'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {/* Accordion header — split into two divs to avoid nested <button> */}
                <div className="w-full flex items-center gap-3 text-left">
                  <button
                    onClick={() => setExpandedIdx(isOpen ? -1 : ei)}
                    className="flex-1 flex items-center gap-3 px-4 py-3.5 text-left min-w-0"
                  >
                    <span className="text-xl shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--color-text)] truncate">
                      {entry.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {meta.label} · {entry.numSets} sets × 5 reps
                    </p>
                  </div>
                  {/* Mini progress dots */}
                  <div className="flex gap-1 shrink-0">
                    {dots.map((dot, di) => (
                      <div
                        key={di}
                        className={`w-2.5 h-2.5 rounded-full ${
                          dot === 'done'
                            ? 'bg-[var(--color-success)]'
                            : dot === 'failed'
                            ? 'bg-[var(--color-danger)]'
                            : dot === 'partial'
                            ? 'bg-[var(--color-primary)]'
                            : 'bg-[var(--color-border)]'
                        }`}
                      />
                    ))}
                  </div>
                  </button>
                  {/* Swap button */}
                  <button
                    onClick={() => setSwappingEntryIdx(ei)}
                    className="w-8 h-8 mx-1 shrink-0 flex items-center justify-center rounded-full border-2 border-[var(--color-border)] text-[var(--color-text-muted)] active:border-[var(--color-primary)] active:text-[var(--color-primary)]"
                    title="Swap superset"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setExpandedIdx(isOpen ? -1 : ei)}
                    className="pr-4 py-3.5 flex items-center shrink-0"
                  >
                    <ChevronDown flipped={isOpen} />
                  </button>
                </div>

                {/* Expanded body */}
                {isOpen && (
                  <div className="border-t border-[var(--color-border)]">
                    {/* Exercise A */}
                    <div className="px-4 py-3 border-b border-[var(--color-border)]/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          A
                        </span>
                        <span className="text-sm font-semibold text-[var(--color-text)] flex-1 truncate">
                          {entry.exerciseAName}
                        </span>
                        {entry.lastWeightA !== null && (
                          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 rounded-lg shrink-0">
                            Last: {entry.lastWeightA}lbs
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 pl-8">
                        <button
                          onClick={() => store.adjustWeight(activeSession.id, ei, 'A', -5)}
                          className="w-10 h-10 rounded-full border-2 border-[var(--color-border)] text-xl font-bold flex items-center justify-center text-[var(--color-text-muted)]"
                        >
                          −
                        </button>
                        <div className="flex-1 flex items-center justify-center gap-1">
                          <NumericInput
                            value={entry.weightA}
                            onCommit={(v) => store.adjustWeight(activeSession.id, ei, 'A', v - entry.weightA)}
                            min={0}
                            className="w-16 text-center text-3xl font-bold text-[var(--color-text)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                          />
                          <span className="text-sm text-[var(--color-text-muted)]">lbs</span>
                        </div>
                        <button
                          onClick={() => store.adjustWeight(activeSession.id, ei, 'A', 5)}
                          className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white text-xl font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-2 pl-8 mt-2.5">
                        <span className="text-xs text-[var(--color-text-muted)] flex-1">Target reps</span>
                        <button
                          onClick={() => store.adjustTargetReps(activeSession.id, ei, 'A', -1)}
                          className="w-7 h-7 rounded-full border-2 border-[var(--color-border)] text-sm font-bold flex items-center justify-center text-[var(--color-text-muted)]"
                        >
                          −
                        </button>
                        <NumericInput
                          value={entry.targetRepsA}
                          onCommit={(v) => store.adjustTargetReps(activeSession.id, ei, 'A', v - entry.targetRepsA)}
                          min={1}
                          className="w-8 text-center text-sm font-bold text-[var(--color-text)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                        />
                        <span className="text-xs text-[var(--color-text-muted)]">reps</span>
                        <button
                          onClick={() => store.adjustTargetReps(activeSession.id, ei, 'A', 1)}
                          className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-sm font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Exercise B */}
                    <div className="px-4 py-3 border-b border-[var(--color-border)]/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--color-primary-dark)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          B
                        </span>
                        <span className="text-sm font-semibold text-[var(--color-text)] flex-1 truncate">
                          {entry.exerciseBName}
                        </span>
                        {entry.lastWeightB !== null && (
                          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 rounded-lg shrink-0">
                            Last: {entry.lastWeightB}lbs
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 pl-8">
                        <button
                          onClick={() => store.adjustWeight(activeSession.id, ei, 'B', -5)}
                          className="w-10 h-10 rounded-full border-2 border-[var(--color-border)] text-xl font-bold flex items-center justify-center text-[var(--color-text-muted)]"
                        >
                          −
                        </button>
                        <div className="flex-1 flex items-center justify-center gap-1">
                          <NumericInput
                            value={entry.weightB}
                            onCommit={(v) => store.adjustWeight(activeSession.id, ei, 'B', v - entry.weightB)}
                            min={0}
                            className="w-16 text-center text-3xl font-bold text-[var(--color-text)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                          />
                          <span className="text-sm text-[var(--color-text-muted)]">lbs</span>
                        </div>
                        <button
                          onClick={() => store.adjustWeight(activeSession.id, ei, 'B', 5)}
                          className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white text-xl font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-2 pl-8 mt-2.5">
                        <span className="text-xs text-[var(--color-text-muted)] flex-1">Target reps</span>
                        <button
                          onClick={() => store.adjustTargetReps(activeSession.id, ei, 'B', -1)}
                          className="w-7 h-7 rounded-full border-2 border-[var(--color-border)] text-sm font-bold flex items-center justify-center text-[var(--color-text-muted)]"
                        >
                          −
                        </button>
                        <NumericInput
                          value={entry.targetRepsB}
                          onCommit={(v) => store.adjustTargetReps(activeSession.id, ei, 'B', v - entry.targetRepsB)}
                          min={1}
                          className="w-8 text-center text-sm font-bold text-[var(--color-text)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                        />
                        <span className="text-xs text-[var(--color-text-muted)]">reps</span>
                        <button
                          onClick={() => store.adjustTargetReps(activeSession.id, ei, 'B', 1)}
                          className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-sm font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Set toggle circles — A and B side by side per row */}
                    <div className="px-4 py-4 space-y-3">
                      <div className="grid grid-cols-[28px_1fr_1fr] items-center gap-2 text-center">
                        <div />
                        <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                          A · {entry.targetRepsA} reps
                        </p>
                        <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                          B · {entry.targetRepsB} reps
                        </p>
                      </div>
                      {entry.sets.map((st, si) => (
                        <div key={si} className="grid grid-cols-[28px_1fr_1fr] items-center gap-2">
                          <span className="text-xs text-[var(--color-text-muted)] text-center">
                            {si + 1}
                          </span>
                          <div className="flex justify-center">
                            <SetCircle
                              state={st.stateA}
                              onToggle={() => {
                                const wasA = st.stateA;
                                store.toggleSetState(activeSession.id, ei, si, 'A');
                                // Fire timer if this completes the pair (A was pending, B already done/failed)
                                if (wasA === 'pending' && st.stateB !== 'pending') {
                                  const isBetween = !timer.isRunning && timer.remainingSeconds === 0 && timer.currentSet < timer.totalSets;
                                  if (timer.isRunning) { /* let it run */ }
                                  else if (isBetween) { timer.startNextSet(); }
                                  else { timer.start(timer.baseRestSeconds, 'Superset Rest', true); }
                                }
                              }}
                            />
                          </div>
                          <div className="flex justify-center">
                            <SetCircle
                              state={st.stateB}
                              onToggle={() => {
                                const wasB = st.stateB;
                                store.toggleSetState(activeSession.id, ei, si, 'B');
                                // Fire timer if this completes the pair (B was pending, A already done/failed)
                                if (wasB === 'pending' && st.stateA !== 'pending') {
                                  const isBetween = !timer.isRunning && timer.remainingSeconds === 0 && timer.currentSet < timer.totalSets;
                                  if (timer.isRunning) { /* let it run */ }
                                  else if (isBetween) { timer.startNextSet(); }
                                  else { timer.start(timer.baseRestSeconds, 'Superset Rest', true); }
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Complete / Cancel */}
          <div className="flex gap-3 pt-2 pb-6">
            <button
              onClick={() => store.cancelSession(activeSession.id)}
              className="flex-1 py-3.5 rounded-2xl border-2 border-[var(--color-border)] text-[var(--color-text-muted)] font-bold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => store.completeSession(activeSession.id)}
              className="flex-1 py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm"
            >
              Complete ✓
            </button>
          </div>
        </div>

        {/* Swap sheet */}
        {swappingEntryIdx !== null && (() => {
          const swappingEntry = activeSession.entries[swappingEntryIdx];
          // All currently used defIds except the one being swapped
          const otherDefIds = new Set(
            activeSession.entries
              .filter((_, i) => i !== swappingEntryIdx)
              .map((e) => e.defId),
          );
          return (
            <SearchSheet
              allDefs={allDefs}
              exerciseDb={store.exerciseDb}
              usedDefIds={otherDefIds}
              lastSessionDefIds={lastSessionDefIds}
              customMuscleGroups={store.customMuscleGroups}
              onSelect={(def) => {
                store.swapSessionEntry(activeSession.id, swappingEntryIdx, {
                  defId: def.id,
                  defName: def.name,
                  exerciseAId: def.exerciseAId,
                  exerciseBId: def.exerciseBId,
                  muscleGroup: def.muscleGroup,
                  numSets: swappingEntry.numSets,
                });
                setSwappingEntryIdx(null);
              }}
              onClose={() => setSwappingEntryIdx(null)}
              onCreateCustom={() => setSwappingEntryIdx(null)}
            />
          );
        })()}
      </div>
    );
  }

  // ─── Planning view ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Supersets" showBack />

      {/* Tab toggle */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <div className="flex bg-[var(--color-surface)] rounded-xl p-1 gap-1">
          {([
            { id: 'supersets', label: 'Workout' },
            { id: 'saved', label: 'Saved' },
            { id: 'exercises', label: 'Exercises' },
            { id: 'categories', label: 'Categories' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-white text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Categories tab ── */}
      {tab === 'categories' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-8 space-y-3">
          {/* Built-in groups (read-only) */}
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-0.5 mb-1">
            Built-in
          </p>
          {SS_MUSCLE_GROUPS.map((mg) => {
            const meta = MUSCLE_GROUP_META[mg];
            return (
              <div
                key={mg}
                className="bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <span className="text-xl shrink-0">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{meta.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{meta.description}</p>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-lg px-2 py-1">
                  Built-in
                </span>
              </div>
            );
          })}

          {/* Custom groups */}
          {store.customMuscleGroups.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-0.5 pt-2">
                Custom
              </p>
              {store.customMuscleGroups.map((g) => (
                <div
                  key={g.id}
                  className="bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <span className="text-xl shrink-0">{g.emoji}</span>
                  <p className="text-sm font-semibold text-[var(--color-text)] flex-1 min-w-0 truncate">
                    {g.label}
                  </p>
                  <button
                    onClick={() => store.removeCustomMuscleGroup(g.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-danger)] border border-[var(--color-danger)]/30 shrink-0 active:bg-[var(--color-danger)]/10"
                    aria-label="Delete category"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}

          {/* Add new category */}
          {addingCategory ? (
            <div className="border-2 border-[var(--color-primary)] rounded-xl p-4 space-y-3 mt-2">
              <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide">
                New Category
              </p>
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  maxLength={2}
                  placeholder="🏋️"
                  className="w-14 px-2 py-2.5 rounded-lg border border-[var(--color-border)] text-center text-lg focus:outline-none focus:border-[var(--color-primary)]"
                />
                <input
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCatLabel.trim()) {
                      store.addCustomMuscleGroup({ label: newCatLabel.trim(), emoji: newCatEmoji.trim() || '💪' });
                      setAddingCategory(false);
                      setNewCatLabel('');
                      setNewCatEmoji('💪');
                    }
                  }}
                  placeholder="e.g. Forearms"
                  className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setAddingCategory(false); setNewCatLabel(''); setNewCatEmoji('💪'); }}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] font-medium"
                >
                  Cancel
                </button>
                <button
                  disabled={!newCatLabel.trim()}
                  onClick={() => {
                    if (!newCatLabel.trim()) return;
                    store.addCustomMuscleGroup({ label: newCatLabel.trim(), emoji: newCatEmoji.trim() || '💪' });
                    setAddingCategory(false);
                    setNewCatLabel('');
                    setNewCatEmoji('💪');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingCategory(true)}
              className="w-full py-3.5 border-2 border-dashed border-[var(--color-primary)]/50 rounded-xl text-sm text-[var(--color-primary)] font-semibold flex items-center justify-center gap-2 mt-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Category
            </button>
          )}
        </div>
      )}

      {/* ── Exercises tab ── */}
      {tab === 'exercises' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
          <button
            onClick={() => setShowAddExercise(true)}
            className="w-full py-3.5 border-2 border-dashed border-[var(--color-primary)]/50 rounded-xl text-sm text-[var(--color-primary)] font-semibold flex items-center justify-center gap-2 mb-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Exercise
          </button>

          {sortedExercises.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
              No exercises yet. Add one above.
            </p>
          )}

          {exercisesByGroup.map(({ groupId, label, exercises }) => (
            <div key={groupId} className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-0.5">
                {label}
              </p>
              <div className="space-y-2">
                {exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 space-y-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text)] truncate">{ex.name}</p>
                        {ex.lastWeightLbs !== null && (
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Last: {ex.lastWeightLbs} lbs
                            {ex.lastOutcome && (
                              <span className={`ml-1 ${ex.lastOutcome === 'success' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                                {ex.lastOutcome === 'success' ? '↑' : '↓'}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => store.updateExerciseWeight(ex.id, -5)}
                          className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] text-lg font-bold flex items-center justify-center text-[var(--color-text-muted)]"
                        >
                          −
                        </button>
                        <div className="flex items-center gap-0.5">
                          <NumericInput
                            value={ex.weightLbs}
                            onCommit={(v) => store.updateExerciseWeight(ex.id, v - ex.weightLbs)}
                            min={0}
                            className="w-14 text-center text-lg font-black text-[var(--color-text)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                          />
                          <span className="text-xs text-[var(--color-text-muted)]">lbs</span>
                        </div>
                        <button
                          onClick={() => store.updateExerciseWeight(ex.id, 5)}
                          className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white text-lg font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-muted)] flex-1">Target reps</span>
                      <button
                        onClick={() => store.updateExerciseTargetReps(ex.id, -1)}
                        className="w-7 h-7 rounded-full border-2 border-[var(--color-border)] text-sm font-bold flex items-center justify-center text-[var(--color-text-muted)]"
                      >
                        −
                      </button>
                      <div className="flex items-center gap-0.5">
                        <NumericInput
                          value={ex.targetReps ?? 10}
                          onCommit={(v) => store.updateExerciseTargetReps(ex.id, v - (ex.targetReps ?? 10))}
                          min={1}
                          className="w-10 text-center text-sm font-bold text-[var(--color-text)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                        />
                        <span className="text-xs text-[var(--color-text-muted)]">reps</span>
                      </div>
                      <button
                        onClick={() => store.updateExerciseTargetReps(ex.id, 1)}
                        className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-sm font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Saved Workouts tab ── */}
      {tab === 'saved' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-8 space-y-4">
          {store.workoutTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <span className="text-5xl">📋</span>
              <div>
                <p className="font-bold text-[var(--color-text)] text-base">No saved workouts yet</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Build a workout on the Workout tab, then tap Save to store it here.
                </p>
              </div>
              <button
                onClick={() => setTab('supersets')}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold"
              >
                Go to Workout Builder
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                  {store.workoutTemplates.length} saved workout{store.workoutTemplates.length !== 1 ? 's' : ''}
                </h2>
              </div>
              <div className="space-y-3">
                {store.workoutTemplates.map((tmpl) => {
                  const isEditing = editingTemplateId === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm"
                    >
                      {isEditing ? (
                        <TemplateRenameRow
                          template={tmpl}
                          onSave={(title) => {
                            store.renameWorkoutTemplate(tmpl.id, title);
                            setEditingTemplateId(null);
                          }}
                          onCancel={() => setEditingTemplateId(null)}
                        />
                      ) : (
                        <>
                          {/* Header row */}
                          <div className="px-4 pt-3.5 pb-2 flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-base text-[var(--color-text)] leading-tight">
                                {tmpl.title}
                              </p>
                              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                {tmpl.entries.map((e) => getMeta(e.muscleGroup, store.customMuscleGroups).emoji).join(' ')}{' '}
                                · {tmpl.entries.length} superset{tmpl.entries.length !== 1 ? 's' : ''}
                                {' · '}saved {new Date(tmpl.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <button
                              onClick={() => setEditingTemplateId(tmpl.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] shrink-0 mt-0.5"
                              title="Rename"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          </div>

                          {/* Exercise list */}
                          <div className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                            {tmpl.entries.map((e) => {
                              const def = allDefs.find((d) => d.id === e.defId);
                              const meta = getMeta(e.muscleGroup, store.customMuscleGroups);
                              const exA = store.exerciseDb[e.exerciseAId];
                              const exB = store.exerciseDb[e.exerciseBId];
                              return (
                                <div key={e.defId} className="px-4 py-2.5 flex items-center gap-3">
                                  <span className="text-base shrink-0">{meta.emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                                      {def?.name ?? e.defName}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                                      {exA?.name ?? e.exerciseAId} / {exB?.name ?? e.exerciseBId}
                                    </p>
                                  </div>
                                  <span className="text-xs text-[var(--color-text-muted)] shrink-0 font-medium">{e.numSets} sets</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Action row */}
                          <div className="px-4 py-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center gap-2">
                            <button
                              onClick={() => {
                                const paddedIds: (string | null)[] = [
                                  ...tmpl.entries.map((e) => e.defId),
                                  null, null, null, null, null,
                                ].slice(0, 5);
                                setSlots(paddedIds);
                                const newSets: Record<string, 1 | 3 | 5> = {};
                                tmpl.entries.forEach((e) => { newSets[e.defId] = e.numSets; });
                                setNumSetsMap(newSets);
                                setSuggestedDismissed(true);
                                setTab('supersets');
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold"
                            >
                              Load Workout 💪
                            </button>
                            <button
                              onClick={() => store.deleteWorkoutTemplate(tmpl.id)}
                              className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] transition-colors"
                              title="Delete"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Supersets tab ── */}
      {tab === 'supersets' && (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Suggested workout card */}
        {showSuggestion && (
          <div className="bg-white border border-[var(--color-primary)]/40 rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 bg-[var(--color-primary)]/6 border-b border-[var(--color-primary)]/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <p className="font-bold text-sm text-[var(--color-text)]">Suggested Workout</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Balanced · avoids last session
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuggestedDismissed(true)}
                className="text-xs text-[var(--color-text-muted)] border border-[var(--color-border)] px-2.5 py-1.5 rounded-lg font-medium"
              >
                Dismiss
              </button>
            </div>

            {/* Preview rows — one per muscle group */}
            <div>
              {suggestion.map((defId) => {
                const def = allDefs.find((d) => d.id === defId)!;
                const meta = getMeta(def.muscleGroup, store.customMuscleGroups);
                return (
                  <div
                    key={defId}
                    className="px-4 py-2.5 border-b border-[var(--color-border)] last:border-0 flex items-center gap-3"
                  >
                    <span className="text-base shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                        {def.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {store.exerciseDb[def.exerciseAId]?.name ?? def.exerciseAId} / {store.exerciseDb[def.exerciseBId]?.name ?? def.exerciseBId}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] space-y-2">
              <button
                onClick={() => {
                  setSlots([...suggestion] as (string | null)[]);
                  const newSets: Record<string, 1 | 3 | 5> = {};
                  suggestion.forEach((id) => {
                    newSets[id] = 3;
                  });
                  setNumSetsMap(newSets);
                }}
                className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold"
              >
                Use this workout ✓
              </button>
              <button
                onClick={() => setSuggestedDismissed(true)}
                className="w-full py-2.5 text-sm text-[var(--color-text-muted)] font-medium"
              >
                Build my own
              </button>
            </div>
          </div>
        )}

        {/* Repeat last session card */}
        {lastSession && slots.every((s) => !s) && (
          <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center gap-2">
              <span className="text-lg">🔁</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[var(--color-text)]">Repeat Last Session</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {new Date(lastSession.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  · {lastSession.entries.map((e) => getMeta(e.muscleGroup, store.customMuscleGroups).emoji).join(' ')}
                </p>
              </div>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {lastSession.entries.map((entry) => {
                const meta = getMeta(entry.muscleGroup, store.customMuscleGroups);
                return (
                  <div key={entry.defId} className="px-4 py-2.5 flex items-center gap-3">
                    <span className="text-base shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text)] truncate">{entry.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{entry.exerciseAName} / {entry.exerciseBName}</p>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)] shrink-0">{entry.numSets} sets</span>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-[var(--color-border)]">
              <button
                onClick={() => {
                  const ids = lastSession.entries.map((e) => e.defId);
                  const paddedIds: (string | null)[] = [...ids, null, null, null, null, null].slice(0, 5);
                  setSlots(paddedIds);
                  const newSets: Record<string, 1 | 3 | 5> = {};
                  lastSession.entries.forEach((e) => {
                    newSets[e.defId] = e.numSets;
                  });
                  setNumSetsMap(newSets);
                }}
                className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold"
              >
                Repeat this workout 🔁
              </button>
            </div>
          </div>
        )}

        {/* Workout builder card with 5 numbered slots */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
          {/* Card header */}
          <div className="px-4 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[var(--color-text)]">Today's Workout</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {slots.filter(Boolean).length} of 5 supersets selected
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Save as template button — visible when at least 1 slot is filled */}
              {slots.some(Boolean) && (
                <button
                  onClick={() => setShowSaveTemplate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save
                </button>
              )}
              {/* Progress pips */}
              <div className="flex gap-1.5">
                {slots.map((s, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      s ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 5 slot rows */}
          {slots.map((defId, i) => {
            const def = defId ? allDefs.find((d) => d.id === defId) : null;
            const exA = def ? store.exerciseDb[def.exerciseAId] : null;
            const exB = def ? store.exerciseDb[def.exerciseBId] : null;

            return (
              <div
                key={i}
                className="border-b border-[var(--color-border)] last:border-0"
              >
                <button
                  onClick={() => setOpenSlot(i)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left"
                >
                  <span
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      def
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {i + 1}
                  </span>

                  {def ? (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                        {def.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {getMeta(def.muscleGroup, store.customMuscleGroups).emoji}{' '}
                        {getMeta(def.muscleGroup, store.customMuscleGroups).label}
                        {(exA || exB)
                          ? ` · A ${exA?.weightLbs ?? '?'}lbs / B ${exB?.weightLbs ?? '?'}lbs`
                          : ''}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--color-text-muted)] flex-1">
                      + Tap to choose a superset
                    </span>
                  )}

                  {def ? (
                    <button
                      onClick={(e) => handleClearSlot(i, e)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-text-muted)] border border-[var(--color-border)] shrink-0"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        className="w-3 h-3"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="w-4 h-4 text-[var(--color-text-muted)] shrink-0"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </button>

                {/* Sets picker — inline below filled slot */}
                {def && (
                  <div className="px-4 pb-3 pt-1 border-t border-[var(--color-border)]/40 flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)] mr-1">Sets:</span>
                    {([1, 3, 5] as const).map((n) => (
                      <button
                        key={n}
                        onClick={() =>
                          setNumSetsMap((prev) => ({ ...prev, [def.id]: n }))
                        }
                        className={`w-10 h-8 rounded-lg text-sm font-semibold border-2 transition-colors ${
                          numSetsMap[def.id] === n
                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                            : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="text-xs text-[var(--color-text-muted)] ml-0.5">× 5 reps</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Start button */}
        <button
          onClick={handleStartSession}
          disabled={!canStart}
          className="w-full py-4 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-base disabled:opacity-30 shadow-sm transition-opacity"
        >
          {canStart
            ? 'Start Workout 💪'
            : allFilled && !allHaveSets
            ? 'Choose sets for each superset'
            : `${slots.filter(Boolean).length} of 5 selected — tap a slot to choose`}
        </button>

        {/* Recent sessions */}
        {completedSessions.length > 0 && (
          <section className="pb-6">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
              Recent Sessions
            </h2>
            <ul className="space-y-2">
              {completedSessions
                .slice()
                .reverse()
                .slice(0, 5)
                .map((session) => (
                  <li
                    key={session.id}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3"
                  >
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {session.entries.map((e) => getMeta(e.muscleGroup, store.customMuscleGroups).emoji).join(' ')}{' '}
                      · {session.entries.length} supersets
                    </p>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>
      )} {/* end tab === 'supersets' */}

      {/* Save workout template sheet */}
      {showSaveTemplate && (
        <SaveTemplateSheet
          onSave={(title) => {
            const entries: SsWorkoutTemplateEntry[] = slots
              .filter((id): id is string => !!id)
              .map((defId) => {
                const def = allDefs.find((d) => d.id === defId)!;
                return {
                  defId: def.id,
                  defName: def.name,
                  exerciseAId: def.exerciseAId,
                  exerciseBId: def.exerciseBId,
                  muscleGroup: def.muscleGroup,
                  numSets: numSetsMap[defId] ?? 3,
                };
              });
            store.saveWorkoutTemplate(title, entries);
            setShowSaveTemplate(false);
          }}
          onClose={() => setShowSaveTemplate(false)}
        />
      )}

      {/* Search / browse sheet */}
      {openSlot !== null && (
        <SearchSheet
          allDefs={allDefs}
          exerciseDb={store.exerciseDb}
          usedDefIds={usedDefIds}
          lastSessionDefIds={lastSessionDefIds}
          customMuscleGroups={store.customMuscleGroups}
          onSelect={handleSlotSelect}
          onClose={() => setOpenSlot(null)}
          onCreateCustom={() => setShowCreate(true)}
        />
      )}

      {/* Create custom superset sheet */}
      {showCreate && (
        <CreateCustomSheet
          onSaved={(def) => {
            setShowCreate(false);
            handleSlotSelect(def);
          }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Add exercise sheet */}
      {showAddExercise && (
        <AddExerciseSheet
          onSaved={() => setShowAddExercise(false)}
          onClose={() => setShowAddExercise(false)}
        />
      )}
    </div>
  );
}
