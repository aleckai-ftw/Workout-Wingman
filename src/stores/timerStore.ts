import { create } from 'zustand';

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
        return { remainingSeconds: 0, isRunning: false, intervalId: null };
      }
      return { remainingSeconds: s.remainingSeconds - 1 };
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
    }));
  },

  setIncrement: (seconds) => set({ incrementSeconds: seconds }),
  setTotalSets: (n) => set({ totalSets: n }),
}));
