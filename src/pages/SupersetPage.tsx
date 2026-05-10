import { useState, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useSupersetStore } from '../stores/supersetStore';
import { BUILT_IN_SS_DEFS, SS_MUSCLE_GROUPS, MUSCLE_GROUP_META } from '../data/supersets';
import type { SsDef, SsMuscleGroup, SsSetState, CustomMuscleGroup } from '../types';

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

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3.5 h-3.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3.5 h-3.5">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

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

// ─── Set circle ───────────────────────────────────────────────────────────────

function SetCircle({ state, onToggle }: { state: SsSetState; onToggle: () => void }) {
  const base =
    'w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all active:scale-95';
  if (state === 'done')
    return (
      <button onClick={onToggle} className={`${base} bg-[var(--color-success)] border-[var(--color-success)]`}>
        <CheckIcon />
      </button>
    );
  if (state === 'failed')
    return (
      <button onClick={onToggle} className={`${base} bg-[var(--color-danger)] border-[var(--color-danger)]`}>
        <XIcon />
      </button>
    );
  return <button onClick={onToggle} className={`${base} border-[var(--color-border)] bg-white`} />;
}

// ─── Suggestion algorithm ────────────────────────────────────────────────────
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

// ─── Create custom superset sheet ────────────────────────────────────────────

interface CreateCustomSheetProps {
  onSaved: (def: SsDef) => void;
  onClose: () => void;
}

function CreateCustomSheet({ onSaved, onClose }: CreateCustomSheetProps) {
  const store = useSupersetStore();
  const [exerciseA, setExerciseA] = useState('');
  const [exerciseB, setExerciseB] = useState('');
  const [nameManual, setNameManual] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<string>('chest_back');

  // New category inline form
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('💪');

  const autoName =
    exerciseA.trim() && exerciseB.trim()
      ? `${exerciseA.trim()} + ${exerciseB.trim()}`
      : '';

  const canSave = exerciseA.trim().length > 0 && exerciseB.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    const name = nameManual.trim() || autoName;
    const def = store.addCustomDef({
      name,
      muscleGroup,
      exerciseA: exerciseA.trim(),
      exerciseB: exerciseB.trim(),
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
          {/* Exercise A */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Exercise A
            </label>
            <input
              autoFocus
              value={exerciseA}
              onChange={(e) => setExerciseA(e.target.value)}
              placeholder="e.g. Bench Press"
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Exercise B */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Exercise B
            </label>
            <input
              value={exerciseB}
              onChange={(e) => setExerciseB(e.target.value)}
              placeholder="e.g. Bent-Over Row"
              className="w-full px-3.5 py-3 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
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
      </div>
    </>
  );
}

// ─── Search sheet (bottom drawer) ────────────────────────────────────────────

interface SheetProps {
  allDefs: SsDef[];
  usedDefIds: Set<string>;
  lastSessionDefIds: Set<string>;
  defStates: Record<string, { weightA: number; weightB: number }>;
  customMuscleGroups: CustomMuscleGroup[];
  onSelect: (def: SsDef) => void;
  onClose: () => void;
  onCreateCustom: () => void;
}

function SearchSheet({
  allDefs,
  usedDefIds,
  lastSessionDefIds,
  defStates,
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
      const matchQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.exerciseA.toLowerCase().includes(q) ||
        d.exerciseB.toLowerCase().includes(q);
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
            const state = defStates[def.id];
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
                      A: {def.exerciseA}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">B: {def.exerciseB}</p>
                  </div>
                  {state && (
                    <div className="text-right shrink-0 mt-0.5">
                      <p className="text-xs text-[var(--color-text-muted)]">Planned</p>
                      <p className="text-xs font-bold text-[var(--color-primary)]">
                        A {state.weightA}lbs
                      </p>
                      <p className="text-xs font-bold text-[var(--color-primary)]">
                        B {state.weightB}lbs
                      </p>
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

// ─── Main page ────────────────────────────────────────────────────────────────

export function SupersetPage() {
  const store = useSupersetStore();

  // Planning state
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null]);
  const [numSetsMap, setNumSetsMap] = useState<Record<string, 1 | 3 | 5>>({});
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [suggestedDismissed, setSuggestedDismissed] = useState(false);

  // Active session accordion
  const [expandedIdx, setExpandedIdx] = useState<number>(0);

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
        exerciseA: def.exerciseA,
        exerciseB: def.exerciseB,
        muscleGroup: def.muscleGroup,
        numSets: numSetsMap[defId!] as 1 | 3 | 5,
      };
    });
    store.startSession(entries);
    setSlots([null, null, null, null, null]);
    setNumSetsMap({});
    setExpandedIdx(0);
  }

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
                {/* Accordion header */}
                <button
                  onClick={() => setExpandedIdx(isOpen ? -1 : ei)}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
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
                  <ChevronDown flipped={isOpen} />
                </button>

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
                          {entry.exerciseA}
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
                        <div className="flex-1 text-center">
                          <span className="text-3xl font-bold text-[var(--color-text)]">
                            {entry.weightA}
                          </span>
                          <span className="text-sm text-[var(--color-text-muted)] ml-1">lbs</span>
                        </div>
                        <button
                          onClick={() => store.adjustWeight(activeSession.id, ei, 'A', 5)}
                          className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white text-xl font-bold flex items-center justify-center"
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
                          {entry.exerciseB}
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
                        <div className="flex-1 text-center">
                          <span className="text-3xl font-bold text-[var(--color-text)]">
                            {entry.weightB}
                          </span>
                          <span className="text-sm text-[var(--color-text-muted)] ml-1">lbs</span>
                        </div>
                        <button
                          onClick={() => store.adjustWeight(activeSession.id, ei, 'B', 5)}
                          className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white text-xl font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Set circles — A and B side by side per row */}
                    <div className="px-4 py-4 space-y-3">
                      <div className="grid grid-cols-[28px_1fr_1fr] items-center gap-2 text-center">
                        <div />
                        <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                          A
                        </p>
                        <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                          B
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
                              onToggle={() =>
                                store.toggleSetState(activeSession.id, ei, si, 'A')
                              }
                            />
                          </div>
                          <div className="flex justify-center">
                            <SetCircle
                              state={st.stateB}
                              onToggle={() =>
                                store.toggleSetState(activeSession.id, ei, si, 'B')
                              }
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
      </div>
    );
  }

  // ─── Planning view ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Supersets" showBack />

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
                        {def.exerciseA} / {def.exerciseB}
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
                      <p className="text-xs text-[var(--color-text-muted)]">{entry.exerciseA} / {entry.exerciseB}</p>
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

          {/* 5 slot rows */}
          {slots.map((defId, i) => {
            const def = defId ? allDefs.find((d) => d.id === defId) : null;
            const state = defId ? store.defStates[defId] : null;

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
                        {state
                          ? ` · A ${state.weightA}lbs / B ${state.weightB}lbs`
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

      {/* Search / browse sheet */}
      {openSlot !== null && (
        <SearchSheet
          allDefs={allDefs}
          usedDefIds={usedDefIds}
          lastSessionDefIds={lastSessionDefIds}
          defStates={store.defStates}
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
    </div>
  );
}
