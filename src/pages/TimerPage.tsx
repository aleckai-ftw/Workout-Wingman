import { PageHeader } from '../components/PageHeader';
import { useTimerStore } from '../stores/timerStore';
import { useProfileStore } from '../stores/profileStore';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

const PRESETS = [30, 60, 90, 120, 180];

export function TimerPage() {
  const timer = useTimerStore();
  const defaultRest = useProfileStore((s) => s.settings.defaultRestSeconds);

  const pct = timer.durationSeconds > 0
    ? timer.remainingSeconds / timer.durationSeconds
    : 0;

  const circumference = 2 * Math.PI * 80; // r=80
  const strokeDashoffset = circumference * (1 - pct);

  const isDone = timer.remainingSeconds === 0 && timer.durationSeconds > 0;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Timer" />

      <div className="flex-1 flex flex-col items-center justify-between px-5 py-8">
        {/* Ring */}
        <div className="relative flex items-center justify-center">
          <svg width={200} height={200} className="-rotate-90">
            <circle cx={100} cy={100} r={80} fill="none" stroke="var(--color-border)" strokeWidth={12} />
            <circle
              cx={100}
              cy={100}
              r={80}
              fill="none"
              stroke={isDone ? 'var(--color-success)' : 'var(--color-primary)'}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-bold text-[var(--color-text)] tabular-nums">
              {formatTime(timer.remainingSeconds)}
            </span>
            <span className="text-sm text-[var(--color-text-muted)] mt-1">{timer.label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={timer.reset}
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] transition-colors"
          >
            Reset
          </button>

          {timer.isRunning ? (
            <button
              onClick={timer.pause}
              className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() =>
                timer.remainingSeconds === timer.durationSeconds
                  ? timer.start(timer.durationSeconds, timer.label)
                  : timer.resume()
              }
              className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
          )}

          <button
            onClick={() => timer.start(defaultRest, 'Rest Timer')}
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] transition-colors"
          >
            {formatTime(defaultRest)}
          </button>
        </div>

        {/* Presets */}
        <div className="w-full mt-8">
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Quick Presets</p>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => timer.start(s, 'Rest Timer')}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              >
                {formatTime(s)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom input */}
        <div className="w-full mt-6">
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Custom (seconds)</p>
          <div className="flex gap-3">
            <input
              type="number"
              min={1}
              defaultValue={timer.durationSeconds}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              onBlur={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v > 0) timer.setDuration(v);
              }}
            />
            <button
              onClick={() => timer.start(timer.durationSeconds, 'Custom Timer')}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
