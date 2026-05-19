import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useProfileStore } from '../stores/profileStore';
import { useProteinStore, computeDayTotal, todayDateKey } from '../stores/proteinStore';
import { useFoodStore, getAllFoods } from '../stores/foodStore';
import { useFiveByFiveStore } from '../stores/fiveByFiveStore';
import { useSupersetStore } from '../stores/supersetStore';
import { useIndivExerciseStore, todayDateKey as indivTodayKey } from '../stores/individualExerciseStore';
import { AREA_META } from '../data/exercises';
import type { IndivExerciseEntry } from '../types';

export function HomePage() {
  const profile = useProfileStore((s) => s.profile);
  const settings = useProfileStore((s) => s.settings);
  const unit = settings.weightUnit;
  const customFoods = useFoodStore((s) => s.customFoods);
  const allFoods = useMemo(() => getAllFoods(customFoods), [customFoods]);
  const days = useProteinStore((s) => s.days);
  const todayDay = days[todayDateKey()];
  const todayServings = todayDay?.servings ?? [];
  const todayTotal = Math.round(computeDayTotal(todayServings, allFoods));
  const goalG = todayDay?.goalG ?? settings.dailyProteinGoalG;
  const proteinPct = Math.min(100, Math.round((todayTotal / goalG) * 100));

  const activeSuperset = useSupersetStore((s) =>
    s.sessions.find((w) => w.id === s.activeSessionId && !w.completed),
  );
  const activeFive = useFiveByFiveStore((s) =>
    s.sessions.find((w) => w.id === s.activeSessionId && !w.completed),
  );

  const allIndivEntries = useIndivExerciseStore((s) => s.entries);
  const todayExercises = useMemo(
    () => allIndivEntries.filter((e) => e.date === indivTodayKey()),
    [allIndivEntries],
  );

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Workout Wingman</h1>
          <p className="text-xs text-[var(--color-text-muted)]">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <SettingsIcon />
          </Link>
          <Link
            to="/settings"
            className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-semibold"
          >
            {profile.avatarInitials}
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
        {/* ── Compact quick links ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <QuickLink to="/timer" icon={<TimerIcon />} label="Timer" />
          <QuickLink to="/history" icon={<HistoryIcon />} label="History" />
        </div>

        {/* ── Today's summary strip ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
          {/* Protein */}
          <Link to="/protein" className="flex-1 flex flex-col items-center border-r border-[var(--color-border)] pr-3">
            <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold">Protein</span>
            <span className="text-sm font-bold text-[var(--color-text)] leading-tight">{todayTotal}g</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">of {goalG}g · {proteinPct}%</span>
          </Link>
          {/* Exercises */}
          <Link to="/exercises" className="flex-1 flex flex-col items-center border-r border-[var(--color-border)] pr-3">
            <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold">Exercises</span>
            <span className="text-sm font-bold text-[var(--color-text)] leading-tight">{todayExercises.length}</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">logged today</span>
          </Link>
          {/* Active workout */}
          {activeSuperset ? (
            <Link to="/superset" className="flex-1 flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold">Workout</span>
              <span className="text-sm font-bold text-[var(--color-primary)] leading-tight">Active</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">Supersets</span>
            </Link>
          ) : activeFive ? (
            <Link to="/5x5" className="flex-1 flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold">Workout</span>
              <span className="text-sm font-bold text-[var(--color-primary)] leading-tight">Active</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">5×5</span>
            </Link>
          ) : (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold">Workout</span>
              <span className="text-sm font-bold text-[var(--color-text-muted)] leading-tight">—</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">none active</span>
            </div>
          )}
        </div>

        {/* ── Exercises section ───────────────────────────────────────────── */}
        <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <ExercisesIcon />
              <span className="font-semibold text-sm text-[var(--color-text)]">Today's Exercises</span>
              {todayExercises.length > 0 && (
                <span className="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold px-2 py-0.5 rounded-full">
                  {todayExercises.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/exercises"
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                View all
              </Link>
              <Link
                to="/exercises"
                className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Entries */}
          {todayExercises.length === 0 ? (
            <div className="flex flex-col items-center py-8 px-4 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">Nothing logged yet today.</p>
              <Link
                to="/exercises"
                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Log an exercise
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {todayExercises.map((entry) => (
                <ExerciseEntryRow key={entry.id} entry={entry} unit={unit} />
              ))}
            </div>
          )}
        </section>

        {/* ── Motivational footer ─────────────────────────────────────────── */}
        <div className="bg-[var(--color-primary)] rounded-2xl p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Consistency builds results.</p>
            <p className="text-green-200 text-xs mt-0.5">You've got this.</p>
          </div>
          <span className="text-3xl">💪</span>
        </div>
      </div>
    </div>
  );
}

// ─── Exercise entry row (inline on home) ──────────────────────────────────────

function ExerciseEntryRow({ entry, unit }: { entry: IndivExerciseEntry; unit: 'lbs' | 'kg' }) {
  const meta = AREA_META[entry.area as keyof typeof AREA_META];

  function fmtWeight(lbs: number) {
    if (unit === 'kg') return `${Math.round(lbs * 0.4536 * 4) / 4}kg`;
    return `${lbs}lbs`;
  }

  const setsSummary = entry.sets
    .map((s) => `${s.reps}×${fmtWeight(s.weightLbs)}`)
    .join(' · ');

  return (
    <Link to="/exercises" className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-border)]/30 transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${meta?.bgClass ?? 'bg-gray-50'}`}>
        {meta?.emoji ?? '💪'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text)] truncate">{entry.name}</p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">{entry.sets.length} set{entry.sets.length !== 1 ? 's' : ''} · {setsSummary}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--color-text-muted)] shrink-0">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

// ─── Compact quick link ───────────────────────────────────────────────────────

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-4 py-2.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
    >
      <div className="text-[var(--color-primary)] shrink-0">{icon}</div>
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-[var(--color-text-muted)] ml-auto">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function TimerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="13" r="8" />
      <polyline points="12 9 12 13 14.5 13" />
      <path d="M5 3 2 6M22 6l-3-3M16 3h-4" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ExercisesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[var(--color-primary)]">
      <path d="M6 4h12M6 9h8M6 14h5" />
      <circle cx="19" cy="16" r="3" />
      <line x1="19" y1="14.5" x2="19" y2="17.5" />
      <line x1="17.5" y1="16" x2="20.5" y2="16" />
    </svg>
  );
}
