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
  { id: 'lion', label: 'avatar.lion', path: '/assets/avatars/lion.svg' },
  { id: 'elephant', label: 'avatar.elephant', path: '/assets/avatars/elephant.svg' },
  { id: 'eagle', label: 'avatar.eagle', path: '/assets/avatars/eagle.svg' },
  { id: 'bear', label: 'avatar.bear', path: '/assets/avatars/bear.svg' },
  { id: 'dolphin', label: 'avatar.dolphin', path: '/assets/avatars/dolphin.svg' },
  { id: 'turtle', label: 'avatar.turtle', path: '/assets/avatars/turtle.svg' },
  { id: 'panda', label: 'avatar.panda', path: '/assets/avatars/panda.svg' },
  { id: 'tiger', label: 'avatar.tiger', path: '/assets/avatars/tiger.svg' },
  { id: 'owl', label: 'avatar.owl', path: '/assets/avatars/owl.svg' },
  { id: 'wolf', label: 'avatar.wolf', path: '/assets/avatars/wolf.svg' },
  { id: 'koala', label: 'avatar.koala', path: '/assets/avatars/koala.svg' },
  { id: 'kangaroo', label: 'avatar.kangaroo', path: '/assets/avatars/kangaroo.svg' },
];

export const COLOR_AVATARS: ColorAvatarDef[] = [
  { id: 'color-red', label: 'color.red', color: '#ef4444' },
  { id: 'color-orange', label: 'color.orange', color: '#f97316' },
  { id: 'color-amber', label: 'color.amber', color: '#f59e0b' },
  { id: 'color-lime', label: 'color.lime', color: '#84cc16' },
  { id: 'color-green', label: 'color.green', color: '#22c55e' },
  { id: 'color-teal', label: 'color.teal', color: '#14b8a6' },
  { id: 'color-cyan', label: 'color.cyan', color: '#06b6d4' },
  { id: 'color-blue', label: 'color.blue', color: '#3b82f6' },
  { id: 'color-purple', label: 'color.purple', color: '#a855f7' },
  { id: 'color-pink', label: 'color.pink', color: '#ec4899' },
];

/** Alias de retrocompatibilidad — código existente que importe AVATARS sigue funcionando */
export const AVATARS = ANIMAL_AVATARS;

export const ALL_AVATARS: AnyAvatarDef[] = [...ANIMAL_AVATARS, ...COLOR_AVATARS];

export const AVATAR_MAP = new Map<AvatarId, AnyAvatarDef>(ALL_AVATARS.map(a => [a.id, a]));

export const DEFAULT_AVATAR: AvatarId = 'lion';
