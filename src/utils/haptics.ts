// Helpers de háptica — encapsulan Capacitor Haptics respetando el setting de vibración
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useAppStore } from '../stores/appStore';

const isNative = Capacitor.isNativePlatform();

/** Háptica de acierto (patrón nativo de éxito) */
export function hapticSuccess(): void {
  if (!isNative || !useAppStore.getState().settings.vibration) return;
  Haptics.notification({ type: NotificationType.Success });
}

/** Háptica de error (patrón nativo de error) */
export function hapticError(): void {
  if (!isNative || !useAppStore.getState().settings.vibration) return;
  Haptics.notification({ type: NotificationType.Error });
}

/** Háptica de selección (impact ligero, para toggles) */
export function hapticSelection(): void {
  if (!isNative || !useAppStore.getState().settings.vibration) return;
  Haptics.impact({ style: ImpactStyle.Light });
}
