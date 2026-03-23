// Hook reutilizable para drag-to-dismiss en bottom sheets
import { useRef, useState, useEffect, useCallback } from 'react';

interface UseBottomSheetDragOptions {
  /** Ref al elemento del sheet */
  sheetRef: React.RefObject<HTMLDivElement | null>;
  /** Callback de cierre (se invoca tras completar la animación) */
  onClose: () => void;
  /** Ref al contenedor scrollable (si el sheet tiene scroll) */
  scrollRef?: React.RefObject<HTMLElement | null>;
  /** Fracción de altura para activar cierre (default: 0.3) */
  threshold?: number;
}

interface UseBottomSheetDragReturn {
  dragHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
  /** true mientras se anima el cierre (evita desmontaje prematuro) */
  isClosing: boolean;
  /** Cierre con animación (para botón X / overlay) */
  closeAnimated: () => void;
}

/** Distancia mínima en px para decidir la dirección del gesto */
const SLOP = 5;
/** Duración de la animación de entrada (ms) — ignorar drag mientras dura */
const ENTRY_ANIM_MS = 300;

export function useBottomSheetDrag({
  sheetRef,
  onClose,
  scrollRef,
  threshold = 0.3,
}: UseBottomSheetDragOptions): UseBottomSheetDragReturn {
  const [isClosing, setIsClosing] = useState(false);

  // Refs para el estado del gesto (sin re-renders por cada píxel)
  const startY = useRef(0);
  const isDragging = useRef(false);
  // null = indeterminado, true = drag vertical abajo, false = scroll/otro
  const directionLocked = useRef<boolean | null>(null);
  const isReady = useRef(false);

  // Guard: no permitir drag durante la animación de entrada
  useEffect(() => {
    const timer = setTimeout(() => { isReady.current = true; }, ENTRY_ANIM_MS);
    return () => clearTimeout(timer);
  }, []);

  const animateClose = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet || isClosing) return;
    setIsClosing(true);

    // Quitar inline transform para que la clase --closing tome el control
    sheet.style.transform = '';
    sheet.style.transition = 'transform 300ms ease-out';

    // Forzar reflow para que el browser note el cambio de transform antes de aplicar la clase
    sheet.offsetHeight; // eslint-disable-line @typescript-eslint/no-unused-expressions

    sheet.style.transform = 'translateY(100%)';

    const onEnd = () => {
      sheet.removeEventListener('transitionend', onEnd);
      onClose();
    };
    sheet.addEventListener('transitionend', onEnd);
  }, [sheetRef, onClose, isClosing]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isReady.current || isClosing) return;
    // Si hay scroll y el contenido no está arriba del todo, dejar pasar
    if (scrollRef?.current && scrollRef.current.scrollTop > 0) return;

    startY.current = e.clientY;
    isDragging.current = true;
    directionLocked.current = null;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scrollRef, isClosing]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || isClosing) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const deltaY = e.clientY - startY.current;

    // Directional lock: decidir si es drag-to-dismiss o scroll
    if (directionLocked.current === null) {
      if (Math.abs(deltaY) < SLOP) return; // Zona muerta
      if (deltaY < 0) {
        // Movimiento hacia arriba → no es drag, es scroll
        directionLocked.current = false;
        isDragging.current = false;
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ok */ }
        return;
      }
      directionLocked.current = true;
    }

    if (!directionLocked.current) return;

    // Solo permitir arrastrar hacia abajo
    const clampedDelta = Math.max(0, deltaY);
    sheet.style.transition = 'none';
    sheet.style.transform = `translateY(${clampedDelta}px)`;
  }, [sheetRef, isClosing]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || isClosing) return;
    isDragging.current = false;
    const sheet = sheetRef.current;
    if (!sheet) return;

    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ok */ }

    const deltaY = Math.max(0, e.clientY - startY.current);
    const sheetHeight = sheet.offsetHeight;

    if (directionLocked.current && deltaY > sheetHeight * threshold) {
      // Supera el umbral → cerrar con animación
      animateClose();
    } else {
      // Snap-back
      sheet.style.transition = 'transform 300ms ease-out';
      sheet.style.transform = '';
    }

    directionLocked.current = null;
  }, [sheetRef, threshold, animateClose, isClosing]);

  return {
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp },
    isClosing,
    closeAnimated: animateClose,
  };
}
