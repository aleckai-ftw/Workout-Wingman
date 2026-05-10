import { create } from 'zustand';

interface TimerStore {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  label: string;
  intervalId: ReturnType<typeof setInterval> | null;

  start: (seconds?: number, label?: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setDuration: (seconds: number) => void;
  tick: () => void;
}

export const useTimerStore = create<TimerStore>()((set, get) => ({
  durationSeconds: 90,
  remainingSeconds: 90,
  isRunning: false,
  label: 'Rest Timer',
  intervalId: null,

  start: (seconds, label) => {
    const dur = seconds ?? get().durationSeconds;
    const prev = get().intervalId;
    if (prev !== null) clearInterval(prev);

    const id = setInterval(() => get().tick(), 1000);
    set({
      durationSeconds: dur,
      remainingSeconds: dur,
      isRunning: true,
      label: label ?? 'Rest Timer',
      intervalId: id,
    });
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
}));
