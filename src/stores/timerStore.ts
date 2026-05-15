import { create } from 'zustand';
import { playHalfwayBlip, playCountdownBlip, playRestComplete } from '../lib/sounds';

interface TimerStore {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  label: string;
  intervalId: ReturnType<typeof setInterval> | null;

  // Progressive rest
  baseRestSeconds: number;
  incrementSeconds: number;
  totalSets: number;
  currentSet: number;

  readyToStart: boolean; // reset to set 1, waiting for user to press play

  start: (seconds?: number, label?: string, isFirstSet?: boolean) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setDuration: (seconds: number) => void;
  tick: () => void;
  startNextSet: () => void;
  resetSets: () => void;
  setIncrement: (seconds: number) => void;
  setTotalSets: (n: number) => void;
}

export const useTimerStore = create<TimerStore>()((set, get) => ({
  durationSeconds: 90,
  remainingSeconds: 90,
  isRunning: false,
  label: 'Rest Timer',
  intervalId: null,
  readyToStart: false,

  // Progressive rest defaults
  baseRestSeconds: 90,
  incrementSeconds: 15,
  totalSets: 5,
  currentSet: 1,

  start: (seconds, label, isFirstSet = false) => {
    const dur = seconds ?? get().durationSeconds;
    const prev = get().intervalId;
    if (prev !== null) clearInterval(prev);

    const id = setInterval(() => get().tick(), 1000);
    set((s) => ({
      durationSeconds: dur,
      remainingSeconds: dur,
      isRunning: true,
      label: label ?? 'Rest Timer',
      intervalId: id,
      readyToStart: false,
      baseRestSeconds: isFirstSet ? dur : s.baseRestSeconds,
      currentSet: isFirstSet ? 1 : s.currentSet,
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

  tick: () =>
    set((s) => {
      if (s.remainingSeconds <= 1) {
        if (s.intervalId !== null) clearInterval(s.intervalId);
        playRestComplete();
        return { remainingSeconds: 0, isRunning: false, intervalId: null };
      }
      const next = s.remainingSeconds - 1;
      const half = Math.floor(s.durationSeconds / 2);

      // Halfway blip — fire once when we cross the midpoint
      if (next === half && s.durationSeconds > 10) {
        playHalfwayBlip();
      }

      // Last 4 seconds — one blip per second at 4, 3, 2, 1 remaining
      if (next >= 1 && next <= 4) {
        playCountdownBlip();
      }

      return { remainingSeconds: next };
    }),

  startNextSet: () => {
    const { baseRestSeconds, incrementSeconds, currentSet, totalSets } = get();
    const nextSet = currentSet + 1;
    if (nextSet > totalSets) return;
    const nextDuration = baseRestSeconds + (nextSet - 1) * incrementSeconds;
    const prev = get().intervalId;
    if (prev !== null) clearInterval(prev);
    const id = setInterval(() => get().tick(), 1000);
    set({
      currentSet: nextSet,
      durationSeconds: nextDuration,
      remainingSeconds: nextDuration,
      isRunning: true,
      label: 'Rest Timer',
      intervalId: id,
    });
  },

  resetSets: () => {
    const id = get().intervalId;
    if (id !== null) clearInterval(id);
    set((s) => ({
      currentSet: 1,
      durationSeconds: s.baseRestSeconds,
      remainingSeconds: s.baseRestSeconds,
      isRunning: false,
      intervalId: null,
      readyToStart: true,
    }));
  },

  setIncrement: (seconds) => set({ incrementSeconds: seconds }),
  setTotalSets: (n) => set({ totalSets: n }),
}));
