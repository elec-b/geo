// Hook para registrar un handler del botón atrás (Android) mientras un overlay esté activo.
// Usa un ref para el handler → permite inline sin memoizar y evita re-registros.
import { useEffect, useRef } from 'react';
import { useBackHandlerStore } from '../stores/backHandlerStore';

export function useBackHandler(enabled: boolean, handler: () => void): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    return useBackHandlerStore.getState().push(() => handlerRef.current());
  }, [enabled]);
}
