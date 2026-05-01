import { Capacitor } from '@capacitor/core';

interface AndroidThemeBridge {
  setAppearance: (mode: 'light' | 'dark') => void;
}

declare global {
  interface Window {
    AndroidTheme?: AndroidThemeBridge;
  }
}

export function syncAndroidSystemBars(theme: 'light' | 'dark'): void {
  if (Capacitor.getPlatform() !== 'android') return;
  if (typeof window === 'undefined' || !window.AndroidTheme) return;
  try {
    window.AndroidTheme.setAppearance(theme);
  } catch {
    // bridge no disponible (build sin actualizar) — fallar silenciosamente
  }
}
