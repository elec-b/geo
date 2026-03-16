// Helpers de háptica — encapsulan Capacitor Haptics respetando el setting de vibración
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useAppStore } from '../stores/appStore';

const isNative = Capacitor.isNativePlatform();

/** Háptica de acierto (tap ligero) */
export function hapticSuccess(): void {
  if (!isNative || !useAppStore.getState().settings.vibration) return;
  Haptics.impact({ style: ImpactStyle.Light });
}

/** Háptica de error (doble tap ligero) */
export function hapticError(): void {
  if (!isNative || !useAppStore.getState().settings.vibration) return;
  Haptics.impact({ style: ImpactStyle.Light });
  setTimeout(() => {
    if (!useAppStore.getState().settings.vibration) return;
    Haptics.impact({ style: ImpactStyle.Light });
  }, 80);
}

/** Háptica de selección (impact ligero, para toggles) */
export function hapticSelection(): void {
  if (!isNative || !useAppStore.getState().settings.vibration) return;
  Haptics.impact({ style: ImpactStyle.Light });
}
