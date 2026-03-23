// Catálogo de avatares disponibles (Fluent Emoji Flat, Microsoft, MIT)
import type { AvatarId } from '../stores/types';

export interface AvatarDef {
  id: AvatarId;
  label: string;
  path: string;
}

export const AVATARS: AvatarDef[] = [
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

export const AVATAR_MAP = new Map<AvatarId, AvatarDef>(AVATARS.map(a => [a.id, a]));

export const DEFAULT_AVATAR: AvatarId = 'lion';
