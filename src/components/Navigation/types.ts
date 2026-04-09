// Tipos para la navegación por tabs

export type TabId = 'play' | 'explore' | 'passport';

export interface TabDefinition {
  id: TabId;
  label: string;
  iconId: string;
}

export const TABS: TabDefinition[] = [
  { id: 'explore', label: 'tabs.explore', iconId: 'explore' },
  { id: 'play', label: 'tabs.play', iconId: 'play' },
  { id: 'passport', label: 'tabs.passport', iconId: 'passport' },
];
