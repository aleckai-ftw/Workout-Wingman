import { useState, useMemo, useEffect, useRef } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useIndivExerciseStore, todayDateKey } from '../stores/individualExerciseStore';
import { useProfileStore } from '../stores/profileStore';
import { useTimerStore } from '../stores/timerStore';
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
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
        setTimeout(() => e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 300);
      }}
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
  outcome: 'success' | 'failure' | null;
}

function SetRow({
  index,
  data,
  unit,
  onChange,
  onRemove,
  canRemove,
  onOutcomeSet,
}: {
  index: number;
  data: SetRowData;
  unit: 'lbs' | 'kg';
  onChange: (patch: Partial<SetRowData>) => void;
  onRemove: () => void;
  canRemove: boolean;
  onOutcomeSet?: () => void;
}) {
  const weightDelta = unit === 'kg' ? 2.5 : 5;

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-3 space-y-2.5">
      {/* Set header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wide select-none">
          Set {index + 1}
        </span>
        <button
          onClick={onRemove}
          disabled={!canRemove}
          className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--color-text-muted)] active:text-[var(--color-danger)] disabled:opacity-20 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Reps stepper */}
      <div className="flex items-center gap-2">
        <span className="w-14 text-xs font-semibold text-[var(--color-text-muted)] shrink-0 select-none">Reps</span>
        <div className="flex-1 flex items-center rounded-xl overflow-hidden border border-[var(--color-border)] bg-white">
          <button
            onClick={() => onChange({ reps: Math.max(1, data.reps - 1) })}
            className="w-11 h-11 shrink-0 flex items-center justify-center bg-[var(--color-surface)] text-xl font-bold text-[var(--color-text)] active:bg-[var(--color-border)] select-none border-r border-[var(--color-border)]"
          >−</button>
          <NumericInput
            value={data.reps}
            onCommit={(v) => onChange({ reps: Math.max(1, Math.round(v)) })}
            min={1}
            placeholder="0"
            className="flex-1 h-11 text-center text-base font-bold text-[var(--color-text)] bg-white focus:outline-none"
          />
          <button
            onClick={() => onChange({ reps: data.reps + 1 })}
            className="w-11 h-11 shrink-0 flex items-center justify-center bg-[var(--color-surface)] text-xl font-bold text-[var(--color-text)] active:bg-[var(--color-border)] select-none border-l border-[var(--color-border)]"
          >+</button>
        </div>
      </div>

      {/* Weight stepper */}
      <div className="flex items-center gap-2">
        <span className="w-14 text-xs font-semibold text-[var(--color-text-muted)] shrink-0 select-none">Weight</span>
        <div className="flex-1 flex items-center rounded-xl overflow-hidden border border-[var(--color-border)] bg-white">
          <button
            onClick={() => onChange({ weightDisplay: Math.max(0, +((data.weightDisplay - weightDelta).toFixed(2))) })}
            className="w-11 h-11 shrink-0 flex items-center justify-center bg-[var(--color-surface)] text-xl font-bold text-[var(--color-text)] active:bg-[var(--color-border)] select-none border-r border-[var(--color-border)]"
          >−</button>
          <NumericInput
            value={data.weightDisplay}
            onCommit={(v) => onChange({ weightDisplay: Math.max(0, v) })}
            min={0}
            placeholder="0"
            className="flex-1 h-11 text-center text-base font-bold text-[var(--color-text)] bg-white focus:outline-none"
          />
          <button
            onClick={() => onChange({ weightDisplay: +((data.weightDisplay + weightDelta).toFixed(2)) })}
            className="w-11 h-11 shrink-0 flex items-center justify-center bg-[var(--color-surface)] text-xl font-bold text-[var(--color-text)] active:bg-[var(--color-border)] select-none border-l border-[var(--color-border)]"
          >+</button>
        </div>
      </div>

      {/* Result toggle */}
      <div className="flex items-center gap-2">
        <span className="w-14 text-xs font-semibold text-[var(--color-text-muted)] shrink-0 select-none">Result</span>
        <div className="flex flex-1 gap-2">
          <button
            onClick={() => {
              const next = data.outcome === 'success' ? null : 'success';
              onChange({ outcome: next });
              if (next !== null && data.outcome === null) onOutcomeSet?.();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-semibold transition-colors ${
              data.outcome === 'success'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] bg-white'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3 h-3 shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Success
          </button>
          <button
            onClick={() => {
              const next = data.outcome === 'failure' ? null : 'failure';
              onChange({ outcome: next });
              if (next !== null && data.outcome === null) onOutcomeSet?.();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-semibold transition-colors ${
              data.outcome === 'failure'
                ? 'border-red-500 bg-red-50 text-red-600'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] bg-white'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3 h-3 shrink-0">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Fail
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Set Logger Sheet ─────────────────────────────────────────────────────────

function SetLoggerSheet({
  exercise,
  unit,
  lastEntry,
  onLog,
  onBack,
  onClose,
}: {
  exercise: IndivExerciseDef;
  unit: 'lbs' | 'kg';
  lastEntry?: IndivExerciseEntry;
  onLog: (sets: Omit<IndivSet, 'id'>[]) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [sets, setSets] = useState<SetRowData[]>(() => {
    if (lastEntry && lastEntry.sets.length > 0) {
      return lastEntry.sets.map((s) => ({
        reps: s.reps,
        weightDisplay: unit === 'kg' ? lbsToKg(s.weightLbs) : s.weightLbs,
        outcome: null, // don't carry last session's outcome into a new log
      }));
    }
    return [{ reps: 0, weightDisplay: 0, outcome: null }];
  });

  const timer = useTimerStore();

  function fireTimer() {
    const isBetween = !timer.isRunning && timer.remainingSeconds === 0 && timer.currentSet < timer.totalSets;
    if (timer.isRunning) {
      // already counting down — leave it
    } else if (isBetween) {
      timer.startNextSet();
    } else {
      timer.start(timer.baseRestSeconds, 'Exercise Rest', true);
    }
  }

  // Drag-to-close
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  function handleDragStart(e: React.PointerEvent) {
    dragStartY.current = e.clientY;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleDragMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const delta = e.clientY - dragStartY.current;
    setDragY(Math.max(0, delta));
  }

  function handleDragEnd() {
    setIsDragging(false);
    if (dragY > 120) {
      onClose();
    } else {
      setDragY(0);
    }
  }

  function handleChange(i: number, patch: Partial<SetRowData>) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addSet() {
    // Pre-fill reps/weight from last set, but start with no outcome
    const last = sets[sets.length - 1];
    setSets((prev) => [...prev, { ...last, outcome: null }]);
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
      outcome: s.outcome ?? null,
    }));
    onLog(converted);
  }

  const canLog = sets.some((s) => s.reps > 0);

  return (
    <>
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ opacity: Math.max(0, 1 - dragY / 300) }}
        onClick={onClose}
      />
      <div
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl flex flex-col"
        style={{
          maxHeight: '92dvh',
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle — drag this to dismiss */}
        <div
          className="flex justify-center pt-3 pb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing select-none"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
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

        {/* Last time banner — compact single line */}
        {lastEntry && (
          <div className="mx-5 mb-1 px-3 py-1.5 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] shrink-0 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide shrink-0">
              Last &middot; {new Date(lastEntry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] truncate">
              {lastEntry.sets.map((s) => `${s.reps}×${unit === 'kg' ? lbsToKg(s.weightLbs) + 'kg' : s.weightLbs + 'lbs'}`).join(' · ')}
            </span>
          </div>
        )}

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
              onOutcomeSet={fireTimer}
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
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl flex flex-col"
        style={{ maxHeight: '92dvh' }}
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
              autoComplete="off"
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
              onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 300)}
              autoComplete="off"
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
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
        <CustomExerciseSheet
          onSaved={(def) => onSelect(def)}
          onBack={() => setView('list')}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="absolute inset-0 bg-white flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-[var(--color-border)]">
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
              type="search"
              autoComplete="off"
              placeholder="Search exercises..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 300)}
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

// ─── Entry card ──────────────────────────────────────────────────────────────
// Collapsed: always shows interactive set rows (pass/fail, add, remove).
// Expanded (edit mode): shows full reps/weight editors.

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
  const timer = useTimerStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editSets, setEditSets] = useState<SetRowData[]>([]);

  function fireTimer() {
    const isBetween = !timer.isRunning && timer.remainingSeconds === 0 && timer.currentSet < timer.totalSets;
    if (timer.isRunning) {
      // already running — leave it
    } else if (isBetween) {
      timer.startNextSet();
    } else {
      timer.start(timer.baseRestSeconds, 'Exercise Rest', true);
    }
  }

  // ── Inline actions (save immediately without opening editor) ──

  function toggleOutcome(setIdx: number, outcome: 'success' | 'failure') {
    const wasNull = entry.sets[setIdx].outcome === null;
    const next = entry.sets[setIdx].outcome === outcome ? null : outcome;
    onSave(
      entry.sets.map((s, i) =>
        i === setIdx
          ? { reps: s.reps, weightLbs: s.weightLbs, outcome: next }
          : { reps: s.reps, weightLbs: s.weightLbs, outcome: s.outcome ?? null },
      ),
    );
    if (wasNull && next !== null) fireTimer();
  }

  function removeSetInline(setIdx: number) {
    if (entry.sets.length <= 1) return;
    onSave(
      entry.sets
        .filter((_, i) => i !== setIdx)
        .map((s) => ({ reps: s.reps, weightLbs: s.weightLbs, outcome: s.outcome ?? null })),
    );
  }

  function addSetInline() {
    const last = entry.sets[entry.sets.length - 1];
    onSave([
      ...entry.sets.map((s) => ({ reps: s.reps, weightLbs: s.weightLbs, outcome: s.outcome ?? null })),
      { reps: last.reps, weightLbs: last.weightLbs, outcome: null },
    ]);
  }

  // ── Full editor ──

  function openEdit() {
    setEditSets(
      entry.sets.map((s) => ({
        reps: s.reps,
        weightDisplay: unit === 'kg' ? lbsToKg(s.weightLbs) : s.weightLbs,
        outcome: s.outcome ?? null,
      })),
    );
    setIsEditing(true);
  }

  function handleEditChange(i: number, patch: Partial<SetRowData>) {
    setEditSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addEditSet() {
    const last = editSets[editSets.length - 1];
    setEditSets((prev) => [...prev, { ...last, outcome: null }]);
  }

  function removeEditSet(i: number) {
    if (editSets.length <= 1) return;
    setEditSets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function saveEdit() {
    const valid = editSets.filter((s) => s.reps > 0);
    if (valid.length === 0) return;
    onSave(
      valid.map((s) => ({
        reps: s.reps,
        weightLbs: unit === 'kg' ? kgToLbs(s.weightDisplay) : s.weightDisplay,
        outcome: s.outcome ?? null,
      })),
    );
    setIsEditing(false);
  }

  const allSucceeded = entry.sets.length > 0 && entry.sets.every((s) => s.outcome === 'success');
  const anyFailed = entry.sets.some((s) => s.outcome === 'failure');

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-colors ${
      isEditing
        ? 'border-[var(--color-primary)]/40'
        : allSucceeded
        ? 'border-green-400'
        : anyFailed
        ? 'border-red-400'
        : 'border-[var(--color-border)]'
    }`}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${meta?.bgClass ?? 'bg-gray-50'}`}>
          {meta?.emoji ?? '💪'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text)] truncate">{entry.name}</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">{entry.area} · {entry.muscleGroup}</p>
        </div>
        {/* Edit / Done toggle */}
        <button
          onClick={isEditing ? () => setIsEditing(false) : openEdit}
          className={`shrink-0 flex items-center gap-1 text-xs font-semibold border-2 rounded-full px-2.5 py-1 transition-colors ${
            isEditing
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
          }`}
        >
          {isEditing ? 'Cancel' : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Inline set rows (default view) ── */}
      {!isEditing && (
        <>
          <div className="px-4 pb-2 space-y-1.5">
            {entry.sets.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                s.outcome === 'success' ? 'bg-green-50' : s.outcome === 'failure' ? 'bg-red-50' : 'bg-[var(--color-surface)]'
              }`}>
                <span className="text-[11px] font-bold text-[var(--color-text-muted)] w-8 shrink-0 select-none">
                  S{i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-[var(--color-text)]">
                  {s.reps}<span className="text-[var(--color-text-muted)] font-normal">×</span>{displayWeight(s.weightLbs, unit)}
                </span>
                {/* Pass */}
                <button
                  onClick={() => toggleOutcome(i, 'success')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    s.outcome === 'success'
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] bg-white'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3.5 h-3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                {/* Fail */}
                <button
                  onClick={() => toggleOutcome(i, 'failure')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    s.outcome === 'failure'
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] bg-white'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3.5 h-3.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                {/* Remove set */}
                <button
                  onClick={() => removeSetInline(i)}
                  disabled={entry.sets.length <= 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] disabled:opacity-20 active:text-[var(--color-danger)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Footer: add set + delete */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <button
              onClick={addSetInline}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add set
            </button>
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
          </div>
        </>
      )}

      {/* ── Full edit mode (reps / weight) ── */}
      {isEditing && (
        <>
          <div className="mx-4 border-t border-[var(--color-border)]" />
          <div className="px-4 pb-2 pt-2 space-y-2.5">
            {editSets.map((s, i) => (
              <SetRow
                key={i}
                index={i}
                data={s}
                unit={unit}
                onChange={(patch) => handleEditChange(i, patch)}
                onRemove={() => removeEditSet(i)}
                canRemove={editSets.length > 1}
              />
            ))}
          </div>
          <div className="px-4 pb-3">
            <button
              onClick={addEditSet}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-[var(--color-border)] text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add set
            </button>
          </div>
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
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={!editSets.some((s) => s.reps > 0)}
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

  const lastEntry = useMemo(() => {
    if (sheet.type !== 'logger') return undefined;
    const today = todayDateKey();
    return store.entries
      .filter((e) => e.defId === sheet.def.id && e.date !== today)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  }, [sheet, store.entries]);

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
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
          <SetLoggerSheet
            exercise={sheet.def}
            unit={unit}
            lastEntry={lastEntry}
            onLog={handleLog}
            onBack={openPicker}
            onClose={closeSheet}
          />
        </div>
      )}

    </div>
  );
}
