import { create } from 'zustand';
import { playIntervalAlert, playCompletionAlarm, playWarmupComplete } from '../lib/sounds';

interface CountdownStore {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  intervalAlertSeconds: number; // 0 = disabled
  intervalCount: number;        // increments with each interval alert
  warmupSeconds: number;        // 0 = no warm-up
  phase: 'idle' | 'warmup' | 'main';
  intervalId: ReturnType<typeof setInterval> | null;
  endTime: number | null;       // absolute ms timestamp when current phase ends

  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setDuration: (seconds: number) => void;
  setIntervalAlert: (seconds: number) => void;
  setWarmup: (seconds: number) => void;
  tick: () => void;
}

export const useCountdownStore = create<CountdownStore>()((set, get) => ({
  durationSeconds: 20 * 60,
  remainingSeconds: 20 * 60,
  isRunning: false,
  intervalAlertSeconds: 5 * 60,
  intervalCount: 0,
  warmupSeconds: 0,
  phase: 'idle',
  intervalId: null,
  endTime: null,

  start: () => {
    const prev = get().intervalId;
    if (prev !== null) clearInterval(prev);

    const { warmupSeconds, durationSeconds } = get();
    const id = setInterval(() => get().tick(), 1000);

    if (warmupSeconds > 0) {
      const endTime = Date.now() + warmupSeconds * 1000;
      set({ remainingSeconds: warmupSeconds, isRunning: true, intervalId: id, phase: 'warmup', intervalCount: 0, endTime });
    } else {
      const endTime = Date.now() + durationSeconds * 1000;
      set({ remainingSeconds: durationSeconds, isRunning: true, intervalId: id, phase: 'main', intervalCount: 0, endTime });
    }
  },

  pause: () => {
    const id = get().intervalId;
    if (id !== null) clearInterval(id);
    set({ isRunning: false, intervalId: null, endTime: null });
  },

  resume: () => {
    if (get().isRunning) return;
    const endTime = Date.now() + get().remainingSeconds * 1000;
    const id = setInterval(() => get().tick(), 1000);
    set({ isRunning: true, intervalId: id, endTime });
  },

  reset: () => {
    const id = get().intervalId;
    if (id !== null) clearInterval(id);
    set((s) => ({
      remainingSeconds: s.durationSeconds,
      isRunning: false,
      intervalId: null,
      phase: 'idle',
      intervalCount: 0,
      endTime: null,
    }));
  },

  setDuration: (seconds) => {
    const id = get().intervalId;
    if (id !== null) clearInterval(id);
    set({ durationSeconds: seconds, remainingSeconds: seconds, isRunning: false, intervalId: null, phase: 'idle', intervalCount: 0, endTime: null });
  },

  setIntervalAlert: (seconds) => {
    set({ intervalAlertSeconds: seconds });
  },

  setWarmup: (seconds) => {
    set({ warmupSeconds: seconds });
  },

  tick: () =>
    set((s) => {
      // Deadline-based: derive remaining from the absolute end timestamp so that
      // throttled/suspended intervals (screen covered, app backgrounded) self-correct
      // on the very next tick that does fire.
      const next = s.endTime !== null
        ? Math.round((s.endTime - Date.now()) / 1000)
        : s.remainingSeconds - 1;

      // ── Warm-up phase ────────────────────────────────────────────────────
      if (s.phase === 'warmup') {
        if (next <= 0) {
          // Warm-up done — transition to main countdown
          playWarmupComplete();
          const newEndTime = Date.now() + s.durationSeconds * 1000;
          return {
            remainingSeconds: s.durationSeconds,
            phase: 'main' as const,
            intervalCount: 0,
            endTime: newEndTime,
          };
        }
        return { remainingSeconds: next };
      }

      // ── Main phase ───────────────────────────────────────────────────────
      if (next <= 0) {
        if (s.intervalId !== null) clearInterval(s.intervalId);
        playCompletionAlarm();
        return { remainingSeconds: 0, isRunning: false, intervalId: null, phase: 'idle' as const, endTime: null };
      }

      // Fire interval alert at each interval boundary.
      // For normal 1-second ticks use exact modulo. For coarse ticks (page was
      // hidden and multiple seconds were skipped) use a boundary-crossing check so
      // the alert isn't silently missed.
      if (s.intervalAlertSeconds > 0 && next > 0) {
        const skipped = s.remainingSeconds - next;
        const hitBoundary =
          skipped === 1
            ? next % s.intervalAlertSeconds === 0               // normal tick
            : Math.floor(next / s.intervalAlertSeconds) <       // coarse tick
              Math.floor(s.remainingSeconds / s.intervalAlertSeconds);

        if (hitBoundary) {
          const BLIP_GAP = 0.25;
          const maxBlips = Math.min(8, Math.max(1, Math.floor(s.intervalAlertSeconds / (BLIP_GAP + 0.05))));
          const newCount = Math.min(s.intervalCount + 1, maxBlips);
          playIntervalAlert(newCount);
          return { remainingSeconds: next, intervalCount: newCount };
        }
      }

      return { remainingSeconds: next };
    }),
}));

// When the page becomes visible again after being hidden (phone uncovered, app
// foregrounded) immediately fire a tick so the display snaps to the correct time
// and completion fires promptly if the timer expired while hidden.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const state = useCountdownStore.getState();
      if (state.isRunning) state.tick();
    }
  });
}
