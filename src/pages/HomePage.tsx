import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useProfileStore } from '../stores/profileStore';
import { useProteinStore, computeDayTotal, todayDateKey } from '../stores/proteinStore';
import { useFoodStore, getAllFoods } from '../stores/foodStore';
import { useFiveByFiveStore } from '../stores/fiveByFiveStore';
import { useSupersetStore } from '../stores/supersetStore';

function FeatureCard({
  to,
  icon,
  title,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-2 p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
    >
      <div className="text-[var(--color-primary)]">{icon}</div>
      <span className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1">
        {title}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-[var(--color-text-muted)]">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    </Link>
  );
}

export function HomePage() {
  const profile = useProfileStore((s) => s.profile);
  const settings = useProfileStore((s) => s.settings);
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

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col flex-1">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Workout Wingman</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Your workout wingman</p>
        </div>
        <Link
          to="/settings"
          className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-semibold"
        >
          {profile.avatarInitials}
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5 mt-4">
        {/* Quick actions: Timer + Settings */}
        <div className="grid grid-cols-2 gap-3">
          <FeatureCard to="/timer" icon={<TimerIcon />} title="Timer" />
          <FeatureCard to="/history" icon={<HistoryIcon />} title="History" />
        </div>

        {/* Settings row */}
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-3.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
        >
          <div className="text-[var(--color-primary)]">
            <SettingsIcon />
          </div>
          <span className="flex-1 text-sm font-medium text-[var(--color-text)]">Settings</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--color-text-muted)]">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        {/* Today's Summary */}
        <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--color-text-muted)]">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Today's Summary
            </div>
            <span className="text-sm text-[var(--color-text-muted)]">{today}</span>
          </div>

          {/* Protein row */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--color-text-muted)]">Protein</span>
              <span className="font-semibold text-[var(--color-text)]">
                {todayTotal}g / {goalG}g
              </span>
            </div>
            <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                style={{ width: `${proteinPct}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{proteinPct}%</p>
          </div>

          {/* Active workout row */}
          {(activeSuperset || activeFive) && (
            <div className="border-t border-[var(--color-border)] pt-3">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">Workout</p>
              {activeSuperset && (
                <Link
                  to="/superset"
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-[var(--color-primary)] text-sm">Supersets</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{activeSuperset.entries.length} pairs • In Progress</p>
                  </div>
                  <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">In Progress</span>
                </Link>
              )}
              {activeFive && !activeSuperset && (
                <Link
                  to="/5x5"
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-[var(--color-primary)] text-sm">Workout {activeFive.workout}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">5x5 • In Progress</p>
                  </div>
                  <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">In Progress</span>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Motivational card */}
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

// ─── Icons ───────────────────────────────────────────────────────────────────

function TimerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <circle cx="12" cy="13" r="8" />
      <polyline points="12 9 12 13 14.5 13" />
      <path d="M5 3 2 6M22 6l-3-3M16 3h-4" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
