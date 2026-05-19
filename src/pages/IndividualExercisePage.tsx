import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useIndivExerciseStore, todayDateKey } from '../stores/individualExerciseStore';
import { useProfileStore } from '../stores/profileStore';
import { ALL_EXERCISE_AREAS, AREA_META } from '../data/exercises';
import type { IndivExerciseDef, IndivExerciseEntry, IndivSet } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lbsToKg(lbs: number) {
  return Math.round(lbs * 0.4536 * 4) / 4; // nearest 0.25 kg
}
function kgToLbs(kg: number) {
  return Math.round(kg / 0.4536);
}
function displayWeight(lbs: number, unit: 'lbs' | 'kg') {
  if (unit === 'kg') return `${lbsToKg(lbs)} kg`;
  return `${lbs} lbs`;
}

// ─── Numeric input ─────────────────────────────────────────────────────────────

function NumericInput({
  value,
  onCommit,
  min = 0,
  className = '',
  placeholder = '',
}: {
  value: number;
  onCommit: (v: number) => void;
  min?: number;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value === 0 ? '' : String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(value === 0 ? '' : String(value));
  }, [value, focused]);

  function commit() {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed >= min) onCommit(parsed);
    else setDraft(value === 0 ? '' : String(value));
    setFocused(false);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ''))}
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

// ─── Set row (inside log sheet) ────────────────────────────────────────────────

interface SetRowData {
  reps: number;
  weightDisplay: number; // value shown to user (lbs or kg depending on unit)
}

function SetRow({
  index,
  data,
  unit,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  data: SetRowData;
  unit: 'lbs' | 'kg';
  onChange: (patch: Partial<SetRowData>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-[var(--color-text-muted)] w-6 shrink-0 text-center">
        {index + 1}
      </span>

      {/* Reps */}
      <div className="flex-1 flex flex-col items-center">
        <NumericInput
          value={data.reps}
          onCommit={(v) => onChange({ reps: Math.round(v) })}
          min={1}
          placeholder="0"
          className="w-full text-center text-base font-bold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-2 py-2.5 focus:outline-none focus:border-[var(--color-primary)]"
        />
        <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5">reps</span>
      </div>

      <span className="text-[var(--color-text-muted)] text-sm font-bold">×</span>

      {/* Weight */}
      <div className="flex-1 flex flex-col items-center">
        <NumericInput
          value={data.weightDisplay}
          onCommit={(v) => onChange({ weightDisplay: v })}
          min={0}
          placeholder="0"
          className="w-full text-center text-base font-bold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-2 py-2.5 focus:outline-none focus:border-[var(--color-primary)]"
        />
        <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{unit}</span>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] disabled:opacity-20 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ─── Set Logger Sheet ─────────────────────────────────────────────────────────

function SetLoggerSheet({
  exercise,
  unit,
  onLog,
  onBack,
  onClose,
}: {
  exercise: IndivExerciseDef;
  unit: 'lbs' | 'kg';
  onLog: (sets: Omit<IndivSet, 'id'>[]) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [sets, setSets] = useState<SetRowData[]>([{ reps: 0, weightDisplay: 0 }]);

  function handleChange(i: number, patch: Partial<SetRowData>) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addSet() {
    // Pre-fill from last set
    const last = sets[sets.length - 1];
    setSets((prev) => [...prev, { ...last }]);
  }

  function removeSet(i: number) {
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleLog() {
    const validSets = sets.filter((s) => s.reps > 0);
    if (validSets.length === 0) return;
    const converted = validSets.map((s) => ({
      reps: s.reps,
      weightLbs: unit === 'kg' ? kgToLbs(s.weightDisplay) : s.weightDisplay,
    }));
    onLog(converted);
  }

  const canLog = sets.some((s) => s.reps > 0);

  return (
    <>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute left-0 right-0 bg-white rounded-t-3xl flex flex-col"
        style={{ bottom: 64, maxHeight: 'calc(90dvh - 64px)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center px-5 py-3 shrink-0 border-b border-[var(--color-border)]">
          <button onClick={onBack} className="mr-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[var(--color-text)] truncate">{exercise.name}</h2>
            <p className="text-xs text-[var(--color-text-muted)]">{exercise.area} · {exercise.muscleGroup}</p>
          </div>
          <button onClick={onClose} className="ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Column labels */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-2 shrink-0">
          <span className="w-6" />
          <span className="flex-1 text-center text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Reps</span>
          <span className="w-4" />
          <span className="flex-1 text-center text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Weight ({unit})</span>
          <span className="w-8" />
        </div>

        {/* Sets */}
        <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-4">
          {sets.map((s, i) => (
            <SetRow
              key={i}
              index={i}
              data={s}
              unit={unit}
              onChange={(patch) => handleChange(i, patch)}
              onRemove={() => removeSet(i)}
              canRemove={sets.length > 1}
            />
          ))}

          {/* Add set */}
          <button
            onClick={addSet}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add another set
          </button>
        </div>

        {/* Log button */}
        <div className="px-5 pb-6 pt-3 shrink-0 border-t border-[var(--color-border)]">
          <button
            onClick={handleLog}
            disabled={!canLog}
            className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-semibold text-sm disabled:opacity-40 transition-opacity"
          >
            Log {sets.filter((s) => s.reps > 0).length} Set{sets.filter((s) => s.reps > 0).length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Custom Exercise Sheet ────────────────────────────────────────────────────

function CustomExerciseSheet({
  onSaved,
  onBack,
  onClose,
}: {
  onSaved: (def: IndivExerciseDef) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const addCustomDef = useIndivExerciseStore((s) => s.addCustomDef);
  const [name, setName] = useState('');
  const [area, setArea] = useState<string>('Chest');
  const [muscleGroup, setMuscleGroup] = useState('');

  const canSave = name.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    const def = addCustomDef(name.trim(), area, muscleGroup.trim() || area);
    onSaved(def);
  }

  return (
    <>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute left-0 right-0 bg-white rounded-t-3xl flex flex-col"
        style={{ bottom: 64, maxHeight: 'calc(90dvh - 64px)' }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        <div className="flex items-center px-5 py-3 shrink-0 border-b border-[var(--color-border)]">
          <button onClick={onBack} className="mr-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="flex-1 text-base font-bold text-[var(--color-text)]">New Exercise</h2>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="text-sm font-semibold text-[var(--color-primary)] disabled:opacity-40"
          >
            Save
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 pb-8">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Exercise Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Cable Lateral Raises"
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Area */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
              Body Area
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_EXERCISE_AREAS.map((a) => {
                const meta = AREA_META[a];
                const selected = area === a;
                return (
                  <button
                    key={a}
                    onClick={() => setArea(a)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    <span>{meta.emoji}</span>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Muscle group (optional) */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Muscle Group <span className="font-normal normal-case">(optional)</span>
            </label>
            <input
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              placeholder={`e.g. ${area}`}
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Exercise Picker Sheet ────────────────────────────────────────────────────

type PickerView = 'list' | 'custom';

function ExercisePickerSheet({
  allDefs,
  onSelect,
  onClose,
}: {
  allDefs: IndivExerciseDef[];
  onSelect: (def: IndivExerciseDef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState<string>('All');
  const [view, setView] = useState<PickerView>('list');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allDefs.filter((d) => {
      const matchArea = area === 'All' || d.area === area;
      const matchQuery = !q || d.name.toLowerCase().includes(q) || d.area.toLowerCase().includes(q) || d.muscleGroup.toLowerCase().includes(q);
      return matchArea && matchQuery;
    });
  }, [allDefs, query, area]);

  if (view === 'custom') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
        <CustomExerciseSheet
          onSaved={(def) => onSelect(def)}
          onBack={() => setView('list')}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="absolute left-0 right-0 bg-white rounded-t-3xl flex flex-col"
        style={{ bottom: 64, maxHeight: 'calc(90dvh - 64px)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Select Exercise</h2>
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
              placeholder="Search exercises..."
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

        {/* Area filter pills */}
        <div className="shrink-0 overflow-x-auto pb-3">
          <div className="flex gap-2 px-5" style={{ width: 'max-content' }}>
            {['All', ...ALL_EXERCISE_AREAS].map((a) => {
              const selected = area === a;
              const meta = a !== 'All' ? AREA_META[a as keyof typeof AREA_META] : null;
              return (
                <button
                  key={a}
                  onClick={() => setArea(a)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                    selected
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  {meta && <span>{meta.emoji}</span>}
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-1.5">
          {/* Create custom */}
          <button
            onClick={() => setView('custom')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors mb-2"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[var(--color-primary)]">Create custom exercise</span>
          </button>

          {filtered.length === 0 ? (
            <div className="text-center py-10 text-[var(--color-text-muted)] text-sm">
              No exercises found
            </div>
          ) : (
            filtered.map((def) => {
              const meta = AREA_META[def.area as keyof typeof AREA_META];
              return (
                <button
                  key={def.id}
                  onClick={() => onSelect(def)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-left"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${meta?.bgClass ?? 'bg-gray-50'}`}>
                    {meta?.emoji ?? '💪'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)] truncate">{def.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{def.area} · {def.muscleGroup}</p>
                  </div>
                  {def.isCustom && (
                    <span className="text-[10px] font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-full shrink-0">
                      Custom
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit entry sheet ─────────────────────────────────────────────────────────
// Pre-populated version of SetLoggerSheet for editing an existing entry.

// ─── Entry card (inline expandable editor) ───────────────────────────────────
// Collapsed: shows set summary pills. Tapping opens inline editing within the
// card — similar to the 5x5 SessionExCard pattern.

function EntryCard({
  entry,
  unit,
  onSave,
  onDelete,
}: {
  entry: IndivExerciseEntry;
  unit: 'lbs' | 'kg';
  onSave: (sets: Omit<IndivSet, 'id'>[]) => void;
  onDelete: () => void;
}) {
  const meta = AREA_META[entry.area as keyof typeof AREA_META];
  const [isExpanded, setIsExpanded] = useState(false);
  const [editSets, setEditSets] = useState<SetRowData[]>([]);

  function openEdit() {
    setEditSets(
      entry.sets.map((s) => ({
        reps: s.reps,
        weightDisplay: unit === 'kg' ? lbsToKg(s.weightLbs) : s.weightLbs,
      })),
    );
    setIsExpanded(true);
  }

  function cancel() {
    setIsExpanded(false);
  }

  function handleChange(i: number, patch: Partial<SetRowData>) {
    setEditSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addSet() {
    const last = editSets[editSets.length - 1];
    setEditSets((prev) => [...prev, { ...last }]);
  }

  function removeSet(i: number) {
    if (editSets.length <= 1) return;
    setEditSets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function save() {
    const validSets = editSets.filter((s) => s.reps > 0);
    if (validSets.length === 0) return;
    onSave(
      validSets.map((s) => ({
        reps: s.reps,
        weightLbs: unit === 'kg' ? kgToLbs(s.weightDisplay) : s.weightDisplay,
      })),
    );
    setIsExpanded(false);
  }

  const canSave = editSets.some((s) => s.reps > 0);

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-colors ${
      isExpanded ? 'border-[var(--color-primary)]/40' : 'border-[var(--color-border)]'
    }`}>

      {/* ── Collapsed header (always visible) ── */}
      <button
        onClick={isExpanded ? cancel : openEdit}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${meta?.bgClass ?? 'bg-gray-50'}`}>
          {meta?.emoji ?? '💪'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text)]">{entry.name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{entry.area} · {entry.muscleGroup}</p>
          {!isExpanded && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {entry.sets.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[10px] font-semibold text-[var(--color-text-muted)]"
                >
                  {s.reps}×{displayWeight(s.weightLbs, unit)}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Chevron rotates when expanded */}
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
          className={`w-4 h-4 text-[var(--color-text-muted)] shrink-0 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Expanded editor ── */}
      {isExpanded && (
        <>
          <div className="mx-4 border-t border-[var(--color-border)]" />

          {/* Column labels */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <span className="w-6" />
            <span className="flex-1 text-center text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Reps</span>
            <span className="w-4" />
            <span className="flex-1 text-center text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Weight ({unit})</span>
            <span className="w-8" />
          </div>

          {/* Set rows */}
          <div className="px-4 pb-2 space-y-2.5">
            {editSets.map((s, i) => (
              <SetRow
                key={i}
                index={i}
                data={s}
                unit={unit}
                onChange={(patch) => handleChange(i, patch)}
                onRemove={() => removeSet(i)}
                canRemove={editSets.length > 1}
              />
            ))}
          </div>

          {/* Add set */}
          <div className="px-4 pb-3">
            <button
              onClick={addSet}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-[var(--color-border)] text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add set
            </button>
          </div>

          {/* Actions bar */}
          <div className="flex items-center gap-2 px-4 pb-4 border-t border-[var(--color-border)] pt-3">
            <button
              onClick={onDelete}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-red-50 transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
            <button
              onClick={cancel}
              className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!canSave}
              className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
            >
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onLog }: { onLog: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[var(--color-text-muted)]">
          <path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h6" strokeLinecap="round" />
          <circle cx="19" cy="19" r="3" />
          <line x1="19" y1="17.5" x2="19" y2="20.5" strokeLinecap="round" />
          <line x1="17.5" y1="19" x2="20.5" y2="19" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-base font-semibold text-[var(--color-text)] mb-1">No exercises logged today</p>
      <p className="text-sm text-[var(--color-text-muted)] mb-5">Tap the button below to log a one-off exercise.</p>
      <button
        onClick={onLog}
        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-2xl font-semibold text-sm"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Log Exercise
      </button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type SheetState =
  | { type: 'none' }
  | { type: 'picker' }
  | { type: 'logger'; def: IndivExerciseDef };

export function IndividualExercisePage() {
  const store = useIndivExerciseStore();
  const settings = useProfileStore((s) => s.settings);
  const unit = settings.weightUnit;

  const allDefs = useMemo(() => store.allDefs(), [store.customDefs]);
  const todayEntries = useMemo(
    () => store.entries.filter((e) => e.date === todayDateKey()),
    [store.entries],
  );

  const [sheet, setSheet] = useState<SheetState>({ type: 'none' });

  function openPicker() { setSheet({ type: 'picker' }); }
  function closeSheet() { setSheet({ type: 'none' }); }

  function handleSelectDef(def: IndivExerciseDef) {
    setSheet({ type: 'logger', def });
  }

  function handleLog(sets: Omit<IndivSet, 'id'>[]) {
    if (sheet.type !== 'logger') return;
    store.logExercise(
      sheet.def.id,
      sheet.def.name,
      sheet.def.area,
      sheet.def.muscleGroup,
      sets,
    );
    closeSheet();
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Exercises"
        showBack
        actions={
          <button
            onClick={openPicker}
            className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Date header */}
        <div className="flex items-center justify-between py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Today's Exercises
          </h2>
          {todayEntries.length > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">
              {todayEntries.length} logged
            </span>
          )}
        </div>

        {todayEntries.length === 0 ? (
          <EmptyState onLog={openPicker} />
        ) : (
          <div className="space-y-3">
            {todayEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                unit={unit}
                onSave={(sets) => store.replaceEntrySets(entry.id, sets)}
                onDelete={() => store.removeEntry(entry.id)}
              />
            ))}

            {/* Log another button */}
            <button
              onClick={openPicker}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Log another exercise
            </button>
          </div>
        )}
      </div>

      {/* Picker sheet */}
      {sheet.type === 'picker' && (
        <ExercisePickerSheet
          allDefs={allDefs}
          onSelect={handleSelectDef}
          onClose={closeSheet}
        />
      )}

      {/* Set logger sheet */}
      {sheet.type === 'logger' && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
          <SetLoggerSheet
            exercise={sheet.def}
            unit={unit}
            onLog={handleLog}
            onBack={openPicker}
            onClose={closeSheet}
          />
        </div>
      )}

    </div>
  );
}
