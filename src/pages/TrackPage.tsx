import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useFiveByFiveStore } from '../stores/fiveByFiveStore';
import { useSupersetStore } from '../stores/supersetStore';

export function ProgramsPage() {
  const navigate = useNavigate();

  const fxfSessions  = useFiveByFiveStore((s) => s.sessions);
  const fxfActiveId  = useFiveByFiveStore((s) => s.activeSessionId);
  const activeFxf    = fxfSessions.find((s) => s.id === fxfActiveId && !s.completed);
  const fxfCompleted = fxfSessions.filter((s) => s.completed).length;

  const ssSessions  = useSupersetStore((s) => s.sessions);
  const ssActiveId  = useSupersetStore((s) => s.activeSessionId);
  const activeSs    = ssSessions.find((s) => s.id === ssActiveId && !s.completed);

  // Skip the hub and go straight to the active workout
  useEffect(() => {
    if (activeFxf) navigate('/5x5', { replace: true });
    else if (activeSs) navigate('/superset', { replace: true });
  }, [activeFxf, activeSs, navigate]);
  const ssCompleted = ssSessions.filter((s) => s.completed).length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader title="Programs" />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

        {/* 5×5 Card */}
        <button
          onClick={() => navigate('/5x5')}
          className="w-full text-left bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-2xl shrink-0">
              📊
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-[var(--color-text)]">5×5 Program</h2>
                {activeFxf && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    ● Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Classic strength builder. 5 sets of 5 reps with progressive overload every session.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-2 font-medium">
                {fxfCompleted === 0
                  ? 'No sessions yet'
                  : `${fxfCompleted} session${fxfCompleted !== 1 ? 's' : ''} completed`}
              </p>
            </div>
            <ChevronRight />
          </div>
        </button>

        {/* Supersets Card */}
        <button
          onClick={() => navigate('/superset')}
          className="w-full text-left bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl shrink-0">
              ⚡
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-[var(--color-text)]">Supersets</h2>
                {activeSs && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    ● Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Pair opposing muscle groups back-to-back for efficiency and muscle balance.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-2 font-medium">
                {ssCompleted === 0
                  ? 'No sessions yet'
                  : `${ssCompleted} session${ssCompleted !== 1 ? 's' : ''} completed`}
              </p>
            </div>
            <ChevronRight />
          </div>
        </button>

      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[var(--color-text-muted)] shrink-0 mt-0.5">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
