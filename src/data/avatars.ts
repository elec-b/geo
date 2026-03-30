// Catálogo de avatares disponibles (animales + colores)
import type { AvatarId } from '../stores/types';

/** Avatar con icono SVG de animal */
export interface AvatarDef {
  id: AvatarId;
  label: string;
  path: string;
}

/** Avatar de color sólido */
export interface ColorAvatarDef {
  id: AvatarId;
  label: string;
  color: string;
}

/** Cualquier tipo de avatar */
export type AnyAvatarDef = AvatarDef | ColorAvatarDef;

/** Type guard: ¿es un avatar de color? */
export function isColorAvatar(def: AnyAvatarDef): def is ColorAvatarDef {
  return 'color' in def;
}

export const ANIMAL_AVATARS: AvatarDef[] = [
  { id: 'lion', label: 'León', path: '/assets/avatars/lion.svg' },
  { id: 'elephant', label: 'Elefante', path: '/assets/avatars/elephant.svg' },
  { id: 'eagle', label: 'Águila', path: '/assets/avatars/eagle.svg' },
  { id: 'bear', label: 'Oso', path: '/assets/avatars/bear.svg' },
  { id: 'dolphin', label: 'Delfín', path: '/assets/avatars/dolphin.svg' },
  { id: 'turtle', label: 'Tortuga', path: '/assets/avatars/turtle.svg' },
  { id: 'panda', label: 'Panda', path: '/assets/avatars/panda.svg' },
  { id: 'tiger', label: 'Tigre', path: '/assets/avatars/tiger.svg' },
  { id: 'owl', label: 'Búho', path: '/assets/avatars/owl.svg' },
  { id: 'wolf', label: 'Lobo', path: '/assets/avatars/wolf.svg' },
  { id: 'koala', label: 'Koala', path: '/assets/avatars/koala.svg' },
  { id: 'kangaroo', label: 'Canguro', path: '/assets/avatars/kangaroo.svg' },
];

export const COLOR_AVATARS: ColorAvatarDef[] = [
  { id: 'color-red', label: 'Rojo', color: '#ef4444' },
  { id: 'color-orange', label: 'Naranja', color: '#f97316' },
  { id: 'color-amber', label: 'Ámbar', color: '#f59e0b' },
  { id: 'color-lime', label: 'Lima', color: '#84cc16' },
  { id: 'color-green', label: 'Verde', color: '#22c55e' },
  { id: 'color-teal', label: 'Turquesa', color: '#14b8a6' },
  { id: 'color-cyan', label: 'Cian', color: '#06b6d4' },
  { id: 'color-blue', label: 'Azul', color: '#3b82f6' },
  { id: 'color-purple', label: 'Púrpura', color: '#a855f7' },
  { id: 'color-pink', label: 'Rosa', color: '#ec4899' },
];

/** Alias de retrocompatibilidad — código existente que importe AVATARS sigue funcionando */
export const AVATARS = ANIMAL_AVATARS;

export const ALL_AVATARS: AnyAvatarDef[] = [...ANIMAL_AVATARS, ...COLOR_AVATARS];

export const AVATAR_MAP = new Map<AvatarId, AnyAvatarDef>(ALL_AVATARS.map(a => [a.id, a]));

export const DEFAULT_AVATAR: AvatarId = 'lion';
