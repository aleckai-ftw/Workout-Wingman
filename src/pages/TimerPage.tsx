import { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useTimerStore } from '../stores/timerStore';
import { useCountdownStore } from '../stores/countdownStore';
import { useProfileStore } from '../stores/profileStore';
import { acquireWakeLock, releaseWakeLock } from '../lib/wakeLock';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ─── Shared ring component ────────────────────────────────────────────────────

function TimerRing({
  remaining,
  duration,
  label,
  isDone,
}: {
  remaining: number;
  duration: number;
  label: string;
  isDone: boolean;
}) {
  const pct = duration > 0 ? remaining / duration : 0;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (1 - pct);

  return (
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
          {formatTime(remaining)}
        </span>
        <span className="text-sm text-[var(--color-text-muted)] mt-1">{label}</span>
      </div>
    </div>
  );
}

// ─── Play / Pause / Reset controls ───────────────────────────────────────────

function PlayPauseReset({
  isRunning,
  onPlay,
  onPause,
  onReset,
}: {
  isRunning: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-4 mt-6">
      <button
        onClick={onReset}
        className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] transition-colors"
      >
        Reset
      </button>

      {isRunning ? (
        <button
          onClick={onPause}
          className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </button>
      ) : (
        <button
          onClick={onPlay}
          className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Minutes + seconds dual input ────────────────────────────────────────────

function MinSecInput({
  totalSeconds,
  onChange,
  label,
  allowZero = false,
}: {
  totalSeconds: number;
  onChange: (seconds: number) => void;
  label: string;
  allowZero?: boolean;
}) {
  const [mins, setMins] = useState(String(Math.floor(totalSeconds / 60)));
  const [secs, setSecs] = useState(String(totalSeconds % 60));

  const commit = (m: string, s: string) => {
    const total = (parseInt(m, 10) || 0) * 60 + (parseInt(s, 10) || 0);
    if (total > 0 || allowZero) onChange(total);
  };

  return (
    <div>
      <p className="text-sm font-medium text-[var(--color-text-muted)] mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={mins}
          onChange={(e) => setMins(e.target.value)}
          onBlur={() => commit(mins, secs)}
          className="w-16 px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm text-center focus:outline-none focus:border-[var(--color-primary)]"
          placeholder="mm"
        />
        <span className="text-[var(--color-text-muted)] font-bold">:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={secs}
          onChange={(e) => setSecs(e.target.value)}
          onBlur={() => commit(mins, secs)}
          className="w-16 px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm text-center focus:outline-none focus:border-[var(--color-primary)]"
          placeholder="ss"
        />
      </div>
    </div>
  );
}

// ─── Rest Tab ─────────────────────────────────────────────────────────────────

const REST_PRESETS = [30, 60, 90, 120, 180];

function RestTab() {
  const timer = useTimerStore();
  const defaultRest = useProfileStore((s) => s.settings.defaultRestSeconds);
  const [customRestInput, setCustomRestInput] = useState(String(timer.baseRestSeconds));

  const isDone = timer.remainingSeconds === 0 && timer.durationSeconds > 0;
  const allSetsDone = isDone && timer.currentSet >= timer.totalSets;
  const showNextSet = isDone && timer.currentSet < timer.totalSets;
  const usingProgressiveSets = timer.totalSets > 1;

  return (
    <div className="flex flex-col items-center gap-6 pb-6">
      {/* Ring */}
      <TimerRing
        remaining={timer.remainingSeconds}
        duration={timer.durationSeconds}
        label={usingProgressiveSets ? `Set ${timer.currentSet} of ${timer.totalSets}` : timer.label}
        isDone={isDone}
      />

      {/* Done states */}
      {allSetsDone && (
        <div className="text-sm font-semibold text-[var(--color-success)]">All sets done! 🎉</div>
      )}

      {/* Controls */}
      {!allSetsDone && (
        <PlayPauseReset
          isRunning={timer.isRunning}
          onPlay={() =>
            timer.remainingSeconds === timer.durationSeconds
              ? timer.start(timer.durationSeconds, timer.label, timer.currentSet === 1)
              : timer.resume()
          }
          onPause={timer.pause}
          onReset={timer.reset}
        />
      )}

      {/* Next set button */}
      {showNextSet && (
        <button
          onClick={timer.startNextSet}
          className="w-full max-w-xs py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          Start Set {timer.currentSet + 1} — {formatTime(timer.baseRestSeconds + timer.currentSet * timer.incrementSeconds)}
        </button>
      )}

      {/* Reset sets link */}
      {usingProgressiveSets && timer.currentSet > 1 && (
        <button
          onClick={timer.resetSets}
          className="text-xs text-[var(--color-text-muted)] underline underline-offset-2"
        >
          Reset to Set 1
        </button>
      )}

      {/* Presets */}
      <div className="w-full">
        <p className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Quick Presets</p>
        <div className="flex gap-2 flex-wrap">
          {REST_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => timer.start(s, 'Rest Timer', true)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {formatTime(s)}
            </button>
          ))}
          <button
            onClick={() => timer.start(defaultRest, 'Rest Timer', true)}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            {formatTime(defaultRest)} (default)
          </button>
        </div>
      </div>

      {/* Progressive rest settings */}
      <div className="w-full border border-[var(--color-border)] rounded-2xl p-4 flex flex-col gap-4">
        <p className="text-sm font-semibold text-[var(--color-text)]">Progressive Rest</p>

        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Starting rest (seconds)</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={customRestInput}
              onChange={(e) => setCustomRestInput(e.target.value)}
              onBlur={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v > 0) timer.setDuration(v);
              }}
              className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
            <button
              onClick={() => {
                const v = parseInt(customRestInput, 10);
                const dur = !isNaN(v) && v > 0 ? v : timer.baseRestSeconds;
                timer.start(dur, 'Rest Timer', true);
              }}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Start
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">+Seconds per set</p>
            <input
              type="number"
              min={0}
              value={timer.incrementSeconds}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 0) timer.setIncrement(v);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Total sets</p>
            <input
              type="number"
              min={1}
              max={20}
              value={timer.totalSets}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1) timer.setTotalSets(v);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        {/* Preview of set durations */}
        {timer.totalSets > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: timer.totalSets }, (_, i) => {
              const dur = timer.baseRestSeconds + i * timer.incrementSeconds;
              const isCurrent = i + 1 === timer.currentSet;
              return (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                    isCurrent
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                  }`}
                >
                  {formatTime(dur)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Countdown Tab ────────────────────────────────────────────────────────────

function CountdownTab() {
  const cd = useCountdownStore();
  const isDone = cd.remainingSeconds === 0 && cd.phase === 'idle' && cd.durationSeconds > 0;
  const isWarmup = cd.phase === 'warmup';
  const isMain = cd.phase === 'main';

  // During warmup, show warmup ring; otherwise show main ring
  const mainLabel = isWarmup ? 'Starting soon…' : 'Countdown';

  return (
    <div className="flex flex-col items-center gap-6 pb-6">
      {/* Warm-up ring — shown only during warmup phase */}
      {isWarmup && (
        <div className="flex flex-col items-center gap-2">
          <TimerRing
            remaining={cd.remainingSeconds}
            duration={cd.warmupSeconds}
            label="Warm Up"
            isDone={false}
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Main timer starts after warm-up
          </p>
        </div>
      )}

      {/* Main ring — hidden during warmup */}
      {!isWarmup && (
        <TimerRing
          remaining={isMain ? cd.remainingSeconds : cd.durationSeconds}
          duration={cd.durationSeconds}
          label={mainLabel}
          isDone={isDone}
        />
      )}

      {/* Controls */}
      <PlayPauseReset
        isRunning={cd.isRunning}
        onPlay={() => (cd.phase === 'idle' ? cd.start() : cd.resume())}
        onPause={cd.pause}
        onReset={cd.reset}
      />

      {/* Duration setting — disabled while running */}
      <div className="w-full">
        <MinSecInput
          totalSeconds={cd.durationSeconds}
          onChange={(s) => cd.setDuration(s)}
          label="Duration"
        />
      </div>

      {/* Warm-up setting */}
      <div className="w-full border border-[var(--color-border)] rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Warm-Up</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Optional countdown before the main timer starts. Set to 0:00 to skip.
          </p>
        </div>
        <MinSecInput
          totalSeconds={cd.warmupSeconds}
          onChange={(s) => cd.setWarmup(s)}
          label="Warm-up duration"
          allowZero
        />
      </div>

      {/* Interval alert setting */}
      <div className="w-full border border-[var(--color-border)] rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Interval Alert</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Blips play at every interval — 1st alert = 1 blip, 2nd = 2, and so on. Set to 0:00 to disable.
          </p>
        </div>
        <MinSecInput
          totalSeconds={cd.intervalAlertSeconds}
          onChange={(s) => cd.setIntervalAlert(s)}
          label="Alert every"
        />

        {/* Show schedule preview */}
        {cd.intervalAlertSeconds > 0 && cd.durationSeconds > cd.intervalAlertSeconds && (
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1.5">Alert schedule</p>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from(
                { length: Math.floor(cd.durationSeconds / cd.intervalAlertSeconds) },
                (_, i) => {
                  const atRemaining = cd.durationSeconds - (i + 1) * cd.intervalAlertSeconds;
                  if (atRemaining <= 0) return null;
                  return (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                    >
                      {formatTime(atRemaining)} left — {i + 1} blip{i + 1 !== 1 ? 's' : ''}
                    </span>
                  );
                },
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'rest' | 'countdown';

export function TimerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('rest');
  const restRunning = useTimerStore((s) => s.isRunning);
  const cdRunning = useCountdownStore((s) => s.isRunning);

  useEffect(() => {
    if (restRunning || cdRunning) {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [restRunning, cdRunning]);

  // Always release on unmount
  useEffect(() => () => releaseWakeLock(), []);

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Timer" />

      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border)] px-5">
        {(['rest', 'countdown'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            {tab === 'rest' ? 'Rest' : 'Countdown'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6">
        {activeTab === 'rest' ? <RestTab /> : <CountdownTab />}
      </div>
    </div>
  );
}

