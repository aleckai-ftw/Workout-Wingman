import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AppSettings, UserProfile } from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';

const PROFILE_KEY = 'ww_profile';
const SETTINGS_KEY = 'ww_settings';

const defaultProfile: UserProfile = {
  name: 'Athlete',
  avatarInitials: 'A',
};

const defaultSettings: AppSettings = {
  defaultRestSeconds: 90,
  weightUnit: 'lbs',
  dailyProteinGoalG: 180,
};

interface ProfileStore {
  profile: UserProfile;
  settings: AppSettings;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

export const useProfileStore = create<ProfileStore>()(
  subscribeWithSelector((set) => ({
    profile: loadFromStorage(PROFILE_KEY, defaultProfile),
    settings: loadFromStorage(SETTINGS_KEY, defaultSettings),

    updateProfile: (patch) =>
      set((s) => {
        const next = { ...s.profile, ...patch };
        saveToStorage(PROFILE_KEY, next);
        return { profile: next };
      }),

    updateSettings: (patch) =>
      set((s) => {
        const next = { ...s.settings, ...patch };
        saveToStorage(SETTINGS_KEY, next);
        return { settings: next };
      }),
  })),
);
