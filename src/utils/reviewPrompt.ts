// Solicitud de valoración in-app — invoca el diálogo nativo del OS tras experiencias positivas
import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';
import { useAppStore } from '../stores/appStore';

const isNative = Capacitor.isNativePlatform();

/** Umbral mínimo de sesiones antes de solicitar review */
const MIN_SESSIONS = 5;

/** Umbral mínimo de días desde la creación del perfil */
const MIN_DAYS = 7;

/** Evita invocar más de una vez por ejecución de la app */
let triggeredThisSession = false;

/**
 * Intenta mostrar el diálogo nativo de valoración si se cumplen las condiciones.
 * Llamar después de una experiencia positiva (ganar un sello).
 * Es seguro llamar múltiples veces — se auto-limita.
 */
export function maybeRequestReview(): void {
  if (!isNative) return;
  if (triggeredThisSession) return;

  const state = useAppStore.getState();
  const profile = state.getActiveProfile();
  if (!profile) return;

  const sessions = state.settings.sessionCount ?? 0;
  if (sessions < MIN_SESSIONS) return;

  const createdAt = new Date(profile.createdAt);
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < MIN_DAYS) return;

  triggeredThisSession = true;
  InAppReview.requestReview().catch(() => {
    // El OS puede rechazar la solicitud — es normal
  });
}
