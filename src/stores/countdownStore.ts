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

  start: () => {
    const prev = get().intervalId;
    if (prev !== null) clearInterval(prev);

    const { warmupSeconds, durationSeconds } = get();
    const id = setInterval(() => get().tick(), 1000);

    if (warmupSeconds > 0) {
      set({ remainingSeconds: warmupSeconds, isRunning: true, intervalId: id, phase: 'warmup', intervalCount: 0 });
    } else {
      set({ remainingSeconds: durationSeconds, isRunning: true, intervalId: id, phase: 'main', intervalCount: 0 });
    }
  },

  pause: () => {
    const id = get().intervalId;
    if (id !== null) clearInterval(id);
    set({ isRunning: false, intervalId: null });
  },

  resume: () => {
    if (get().isRunning) return;
    const id = setInterval(() => get().tick(), 1000);
    set({ isRunning: true, intervalId: id });
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
    }));
  },

  setDuration: (seconds) => {
    const id = get().intervalId;
    if (id !== null) clearInterval(id);
    set({ durationSeconds: seconds, remainingSeconds: seconds, isRunning: false, intervalId: null, phase: 'idle', intervalCount: 0 });
  },

  setIntervalAlert: (seconds) => {
    set({ intervalAlertSeconds: seconds });
  },

  setWarmup: (seconds) => {
    set({ warmupSeconds: seconds });
  },

  tick: () =>
    set((s) => {
      const next = s.remainingSeconds - 1;

      // ── Warm-up phase ────────────────────────────────────────────────────
      if (s.phase === 'warmup') {
        if (next <= 0) {
          // Warm-up done — transition to main countdown
          playWarmupComplete();
          return {
            remainingSeconds: s.durationSeconds,
            phase: 'main' as const,
            intervalCount: 0,
          };
        }
        return { remainingSeconds: next };
      }

      // ── Main phase ───────────────────────────────────────────────────────
      if (next <= 0) {
        if (s.intervalId !== null) clearInterval(s.intervalId);
        playCompletionAlarm();
        return { remainingSeconds: 0, isRunning: false, intervalId: null, phase: 'idle' as const };
      }

      // Fire interval alert when remaining is exactly a multiple of the interval
      if (s.intervalAlertSeconds > 0 && next % s.intervalAlertSeconds === 0) {
        // Cap blips so total audio duration (blips × 250 ms gap) never exceeds the interval period.
        // Hard cap of 8 also keeps it sane for very long intervals.
        const BLIP_GAP = 0.25; // seconds — must match sounds.ts
        const maxBlips = Math.min(8, Math.max(1, Math.floor(s.intervalAlertSeconds / (BLIP_GAP + 0.05))));
        const newCount = Math.min(s.intervalCount + 1, maxBlips);
        playIntervalAlert(newCount);
        return { remainingSeconds: next, intervalCount: newCount };
      }

      return { remainingSeconds: next };
    }),
}));
