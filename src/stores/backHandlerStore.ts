// Stack LIFO de handlers del botón atrás (Android).
// Cada overlay que se abre registra su close via push(fn) y lo retira al cerrarse.
import { create } from 'zustand';

interface BackHandlerEntry {
  id: number;
  handler: () => void;
}

interface BackHandlerStore {
  stack: BackHandlerEntry[];
  nextId: number;
  push: (handler: () => void) => () => void;
  pop: () => boolean;
}

export const useBackHandlerStore = create<BackHandlerStore>((set, get) => ({
  stack: [],
  nextId: 1,
  push: (handler) => {
    const id = get().nextId;
    set((state) => ({
      stack: [...state.stack, { id, handler }],
      nextId: state.nextId + 1,
    }));
    return () => {
      set((state) => ({ stack: state.stack.filter((e) => e.id !== id) }));
    };
  },
  pop: () => {
    const { stack } = get();
    const top = stack[stack.length - 1];
    if (!top) return false;
    top.handler();
    return true;
  },
}));
