// Store global de GeoExpert (Zustand)
import { create } from 'zustand';
import type { AppSettings, AppState, UserProfile, ProfileId, AvatarId, ProfileProgress } from './types';
import type { Continent, GameLevel } from '../data/types';

const LEVELS: GameLevel[] = ['turista', 'mochilero', 'guía'];
const CONTINENTS: Continent[] = ['África', 'América', 'Asia', 'Europa', 'Oceanía'];

/** Genera un progreso vacío para un nuevo perfil */
function emptyProgress(): ProfileProgress {
  const progress = {} as ProfileProgress;
  for (const level of LEVELS) {
    progress[level] = {} as Record<Continent, any>;
    for (const continent of CONTINENTS) {
      progress[level][continent] = {
        stampCountries: {},
        stampCapitals: {},
        failures: 0,
      };
    }
  }
  return progress;
}

/** Genera un UUID simple (v4-like) */
function uuid(): string {
  return crypto.randomUUID();
}

const DEFAULT_SETTINGS: AppSettings = {
  showMarkers: true,
  vibration: true,
  theme: 'dark',
  locale: 'es',
};

interface AppStoreActions {
  /** Crea un nuevo perfil y lo devuelve como activo */
  createProfile: (name: string, avatar: AvatarId) => ProfileId;
  /** Establece el perfil activo */
  setActiveProfile: (id: ProfileId) => void;
  /** Elimina un perfil */
  deleteProfile: (id: ProfileId) => void;
  /** Actualiza settings (merge parcial) */
  updateSettings: (partial: Partial<AppSettings>) => void;
  /** Devuelve el perfil activo (o null) */
  getActiveProfile: () => UserProfile | null;
}

type AppStore = AppState & AppStoreActions;

export const useAppStore = create<AppStore>((set, get) => ({
  // Estado inicial
  profiles: [],
  activeProfileId: null,
  settings: { ...DEFAULT_SETTINGS },

  createProfile: (name: string, avatar: AvatarId): ProfileId => {
    const id = uuid();
    const profile: UserProfile = {
      id,
      name,
      avatar,
      createdAt: new Date().toISOString(),
      progress: emptyProgress(),
    };
    set((state) => ({
      profiles: [...state.profiles, profile],
      activeProfileId: id,
    }));
    return id;
  },

  setActiveProfile: (id: ProfileId) => {
    set({ activeProfileId: id });
  },

  deleteProfile: (id: ProfileId) => {
    set((state) => ({
      profiles: state.profiles.filter((p) => p.id !== id),
      activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
    }));
  },

  updateSettings: (partial: Partial<AppSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...partial },
    }));
  },

  getActiveProfile: (): UserProfile | null => {
    const { profiles, activeProfileId } = get();
    return profiles.find((p) => p.id === activeProfileId) ?? null;
  },
}));
