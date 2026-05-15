import { useLocation, useNavigate } from 'react-router-dom';
import { useCountdownStore } from '../stores/countdownStore';
import { useTimerStore } from '../stores/timerStore';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

export function FloatingTimer() {
  const location = useLocation();
  const navigate = useNavigate();

  const cd = useCountdownStore();
  const rest = useTimerStore();

  // Hide entirely when on the timer page
  if (location.pathname === '/timer') return null;

  // Determine which timer to show — prefer countdown if active, then rest
  const cdActive = cd.isRunning || (cd.phase !== 'idle' && cd.remainingSeconds > 0);
  // "between sets": set just finished but more sets remain — keep widget alive
  const restBetweenSets = !rest.isRunning && rest.remainingSeconds === 0 && rest.currentSet < rest.totalSets;
  // "all sets done": last set finished — keep widget alive so user can start over
  const restAllDone = !rest.isRunning && rest.remainingSeconds === 0 && rest.currentSet >= rest.totalSets && rest.durationSeconds > 0;
  const restActive = rest.isRunning || rest.readyToStart || restBetweenSets || restAllDone || (rest.remainingSeconds > 0 && rest.remainingSeconds < rest.durationSeconds);

  if (!cdActive && !restActive) return null;

  const showCountdown = cdActive;
  const remaining = showCountdown ? cd.remainingSeconds : rest.remainingSeconds;
  const isRunning = showCountdown ? cd.isRunning : rest.isRunning;

  let label: string;
  if (showCountdown) {
    label = cd.phase === 'warmup' ? 'Warm Up' : 'Countdown';
  } else if (restAllDone) {
    label = 'All sets done';
  } else if (rest.readyToStart) {
    label = 'Ready · tap to start';
  } else if (restBetweenSets) {
    label = `Set ${rest.currentSet} done`;
  } else {
    label = rest.label;
  }

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showCountdown) {
      isRunning ? cd.pause() : cd.resume();
    } else if (restAllDone) {
      rest.resetSets(); // sets readyToStart=true, widget stays alive showing play
    } else if (rest.readyToStart) {
      rest.start(rest.baseRestSeconds, 'Rest Timer', true);
    } else if (restBetweenSets) {
      rest.startNextSet();
    } else {
      isRunning ? rest.pause() : rest.resume();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate('/timer')}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/timer')}
      className="fixed bottom-[76px] left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-white border border-[var(--color-border)] shadow-lg rounded-full px-4 py-2.5 cursor-pointer hover:shadow-xl transition-shadow"
      aria-label="Open timer"
    >
      {/* Play / Pause / Restart */}
      <button
        onClick={handlePlayPause}
        aria-label={restAllDone ? 'Start over' : isRunning ? 'Pause' : 'Resume'}
        className={`w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 ${restAllDone ? 'bg-[var(--color-success)]' : 'bg-[var(--color-primary)]'}`}
      >
        {restAllDone ? (
          /* Restart / repeat icon */
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-4" />
          </svg>
        ) : isRunning ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      {/* Time + label */}
      <div className="flex flex-col leading-none">
        <span className="text-lg font-black tabular-nums text-[var(--color-text)]">
          {restAllDone ? 'Done ✓' : formatTime(remaining)}
        </span>
        <span className="text-[10px] font-medium text-[var(--color-text-muted)] mt-0.5">
          {label}
        </span>
      </div>

      {/* Tap-to-open caret */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-[var(--color-text-muted)] shrink-0">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}
