import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useFiveByFiveStore } from '../stores/fiveByFiveStore';
import { useSupersetStore } from '../stores/supersetStore';
import { useTimerStore } from '../stores/timerStore';

function pad(n: number) { return String(n).padStart(2, '0'); }
function formatTime(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

export function TrackPage() {
  const activeSuperset = useSupersetStore((s) => s.sessions.find((w) => w.id === s.activeSessionId && !w.completed));
  const activeFive = useFiveByFiveStore((s) => s.sessions.find((w) => w.id === s.activeSessionId && !w.completed));
  const timer = useTimerStore();

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Track" />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Active workout banner */}
        {(activeSuperset || activeFive) && (
          <div className="bg-[var(--color-primary)] rounded-2xl p-4 text-white">
            <p className="text-xs font-medium text-green-200 mb-1">Active Workout</p>
            <p className="font-semibold">{activeSuperset ? (activeSuperset.entries[0]?.name ?? 'Superset Workout') : `Workout ${activeFive?.workout}`}</p>
            <p className="text-xs text-green-200 mt-0.5">{activeSuperset ? 'Superset' : '5x5'} • In Progress</p>
            <Link
              to={activeSuperset ? '/superset' : '/5x5'}
              className="inline-block mt-3 px-4 py-1.5 bg-white text-[var(--color-primary)] rounded-full text-xs font-semibold"
            >
              Continue →
            </Link>
          </div>
        )}

        {/* Timer mini card */}
        <Link to="/timer" className="flex items-center justify-between bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Rest Timer</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {timer.isRunning ? `${formatTime(timer.remainingSeconds)} remaining` : 'Tap to open'}
            </p>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${timer.isRunning ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
            {formatTime(timer.remainingSeconds)}
          </div>
        </Link>

        {/* Tracker cards */}
        <div className="grid grid-cols-1 gap-3">
          <TrackCard
            to="/superset"
            title="Superset Tracker"
            subtitle="Paired exercise circuits"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <rect x="2" y="10" width="4" height="4" rx="1" /><rect x="18" y="10" width="4" height="4" rx="1" />
                <line x1="6" y1="12" x2="18" y2="12" /><rect x="7" y="8" width="3" height="8" rx="1" />
                <rect x="14" y="8" width="3" height="8" rx="1" />
              </svg>
            }
          />
          <TrackCard
            to="/5x5"
            title="5x5 Tracker"
            subtitle="Strength program tracker"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            }
          />
          <TrackCard
            to="/protein"
            title="Protein Tracker"
            subtitle="Daily nutrition log"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

function TrackCard({ to, title, subtitle, icon }: { to: string; title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-4 hover:border-[var(--color-primary)] transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center text-[var(--color-primary)]">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm text-[var(--color-text)]">{title}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--color-text-muted)]">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
