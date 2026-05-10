import { create } from 'zustand';
import { playIntervalAlert, playCompletionAlarm } from '../lib/sounds';

interface CountdownStore {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  intervalAlertSeconds: number; // 0 = disabled
  intervalId: ReturnType<typeof setInterval> | null;

  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setDuration: (seconds: number) => void;
  setIntervalAlert: (seconds: number) => void;
  tick: () => void;
}

export const useCountdownStore = create<CountdownStore>()((set, get) => ({
  durationSeconds: 20 * 60, // 20 minutes default
  remainingSeconds: 20 * 60,
  isRunning: false,
  intervalAlertSeconds: 5 * 60, // 5 minutes default
  intervalId: null,

  start: () => {
    const prev = get().intervalId;
    if (prev !== null) clearInterval(prev);

    const id = setInterval(() => get().tick(), 1000);
    set((s) => ({
      remainingSeconds: s.durationSeconds,
      isRunning: true,
      intervalId: id,
    }));
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
    }));
  },

  setDuration: (seconds) => {
    const id = get().intervalId;
    if (id !== null) clearInterval(id);
    set({ durationSeconds: seconds, remainingSeconds: seconds, isRunning: false, intervalId: null });
  },

  setIntervalAlert: (seconds) => {
    set({ intervalAlertSeconds: seconds });
  },

  tick: () =>
    set((s) => {
      const next = s.remainingSeconds - 1;

      if (next <= 0) {
        if (s.intervalId !== null) clearInterval(s.intervalId);
        playCompletionAlarm();
        return { remainingSeconds: 0, isRunning: false, intervalId: null };
      }

      // Fire interval alert when remaining is exactly a multiple of the interval
      if (s.intervalAlertSeconds > 0 && next % s.intervalAlertSeconds === 0) {
        playIntervalAlert();
      }

      return { remainingSeconds: next };
    }),
}));
