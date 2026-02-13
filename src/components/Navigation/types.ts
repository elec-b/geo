// Tipos para la navegación por tabs

export type TabId = 'play' | 'explore' | 'passport';

export interface TabDefinition {
  id: TabId;
  label: string;
  iconId: string;
}

export const TABS: TabDefinition[] = [
  { id: 'play', label: 'Jugar', iconId: 'play' },
  { id: 'explore', label: 'Explorar', iconId: 'explore' },
  { id: 'passport', label: 'Mi Pasaporte', iconId: 'passport' },
];
