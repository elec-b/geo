// Adapter de storage para zustand/persist con Capacitor Preferences
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { StateStorage } from 'zustand/middleware';

/** En plataforma nativa usa Capacitor Preferences; en web usa localStorage */
const isNative = Capacitor.isNativePlatform();

export const capacitorStorage: StateStorage = {
  getItem: async (key: string) => {
    if (!isNative) return localStorage.getItem(key);
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string) => {
    if (!isNative) {
      localStorage.setItem(key, value);
      return;
    }
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    if (!isNative) {
      localStorage.removeItem(key);
      return;
    }
    await Preferences.remove({ key });
  },
};
