import { useProteinStore, computeDayTotal } from '../stores/proteinStore';
import { useFoodStore, getAllFoods } from '../stores/foodStore';
import { useMemo } from 'react';
import { useFiveByFiveStore } from '../stores/fiveByFiveStore';
import { useSupersetStore } from '../stores/supersetStore';
import { PageHeader } from '../components/PageHeader';

export function HistoryPage() {
  const proteinDays = useProteinStore((s) => s.days);
  const customFoods = useFoodStore((s) => s.customFoods);
  const allFoods = useMemo(() => getAllFoods(customFoods), [customFoods]);
  const fiveWorkouts = useFiveByFiveStore((s) => s.sessions.filter((w) => w.completed));
  const supersetWorkouts = useSupersetStore((s) => s.sessions.filter((w) => w.completed));

  const sortedDays = Object.values(proteinDays)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="History" />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Protein history */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Protein (Last 7 Days)</h2>
          {sortedDays.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No protein data yet.</p>
          ) : (
            <ul className="space-y-2">
              {sortedDays.map((day) => {
                const total = Math.round(computeDayTotal(day.servings, allFoods));
                const pct = Math.min(100, Math.round((total / day.goalG) * 100));
                return (
                  <li key={day.date} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-[var(--color-text)]">{day.date}</span>
                      <span className="text-sm font-semibold text-[var(--color-text)]">{total}g / {day.goalG}g</span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{pct}% of goal</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 5x5 history */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">5x5 Workouts</h2>
          {fiveWorkouts.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No completed 5x5 workouts yet.</p>
          ) : (
            <ul className="space-y-2">
              {fiveWorkouts.slice().reverse().map((w) => (
                <li key={w.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3">
                  <p className="text-sm font-medium text-[var(--color-text)]">Workout {w.workout}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{new Date(w.date).toLocaleDateString()} &bull; {w.exercises.length} exercises</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Superset history */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Superset Workouts</h2>
          {supersetWorkouts.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No completed superset workouts yet.</p>
          ) : (
            <ul className="space-y-2">
              {supersetWorkouts.slice().reverse().map((w) => (
                <li key={w.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {new Date(w.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{w.entries.length} supersets</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
