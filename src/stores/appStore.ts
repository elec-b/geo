// Store global de GeoExpert (Zustand)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from './persistStorage';
import type { AppSettings, AppState, UserProfile, ProfileId, AvatarId, ProfileProgress, CountryAttempts } from './types';
import type { Continent, GameLevel, QuestionType } from '../data/types';

const LEVELS: GameLevel[] = ['turista', 'mochilero', 'guía'];
const CONTINENTS: Continent[] = ['África', 'América', 'Asia', 'Europa', 'Oceanía'];

/** Genera un progreso vacío para un nuevo perfil */
function emptyProgress(): ProfileProgress {
  const progress = {} as ProfileProgress;
  for (const level of LEVELS) {
    progress[level] = {} as Record<Continent, any>;
    for (const continent of CONTINENTS) {
      progress[level][continent] = {
        stampCountries: { earned: false, earnedDate: null },
        stampCapitals: { earned: false, earnedDate: null },
        attempts: {},
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
  lastPlayed: null,
};

// Perfil por defecto — sin él, recordAttempt y getAttempts no funcionan
const defaultProfileId = uuid();
const defaultProfile: UserProfile = {
  id: defaultProfileId,
  name: 'Explorador',
  avatar: 'lion',
  createdAt: new Date().toISOString(),
  progress: emptyProgress(),
};

/** Tipo de sello: países (tipo A) o capitales (tipo B) */
export type StampType = 'countries' | 'capitals';

interface AppStoreActions {
  /** Crea un nuevo perfil y lo devuelve como activo */
  createProfile: (name: string, avatar: AvatarId) => ProfileId;
  /** Establece el perfil activo */
  setActiveProfile: (id: ProfileId) => void;
  /** Elimina un perfil */
  deleteProfile: (id: ProfileId) => void;
  /** Actualiza nombre y/o avatar de un perfil existente */
  updateProfile: (id: ProfileId, updates: { name?: string; avatar?: AvatarId }) => void;
  /** Actualiza settings (merge parcial) */
  updateSettings: (partial: Partial<AppSettings>) => void;
  /** Devuelve el perfil activo (o null) */
  getActiveProfile: () => UserProfile | null;
  /** Registra un intento (acierto o fallo) para un país en un tipo de juego */
  recordAttempt: (level: GameLevel, continent: Continent, cca2: string, questionType: QuestionType, correct: boolean) => void;
  /** Devuelve los intentos del perfil activo para un nivel × continente */
  getAttempts: (level: GameLevel, continent: Continent) => Record<string, CountryAttempts>;
  /** Resetea los intentos (attempts) del perfil activo para un nivel × continente */
  resetAttempts: (level: GameLevel, continent: Continent) => void;
  /** Registra un sello ganado */
  earnStamp: (level: GameLevel, continent: Continent, stampType: StampType) => void;
  /** Consulta si los sellos de un nivel×continente están ganados */
  getStamps: (level: GameLevel, continent: Continent) => { countries: boolean; capitals: boolean };
  /** Persiste el último continente y nivel jugado */
  setLastPlayed: (continent: Continent, level: GameLevel) => void;
}

type AppStore = AppState & AppStoreActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
  // Estado inicial — perfil por defecto para que recordAttempt/getAttempts funcionen
  profiles: [defaultProfile],
  activeProfileId: defaultProfileId,
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

  updateProfile: (id: ProfileId, updates: { name?: string; avatar?: AvatarId }) => {
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
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

  recordAttempt: (level, continent, cca2, questionType, correct) => {
    set((state) => {
      const { activeProfileId } = state;
      if (!activeProfileId) return state;

      const profileIdx = state.profiles.findIndex((p) => p.id === activeProfileId);
      if (profileIdx === -1) return state;

      const profile = state.profiles[profileIdx];
      const lcp = profile.progress[level][continent];
      const countryAttempts = lcp.attempts[cca2] ?? {};
      const prev = countryAttempts[questionType] ?? { correct: 0, incorrect: 0, streak: 0 };

      const updated = correct
        ? { correct: prev.correct + 1, incorrect: prev.incorrect, streak: Math.max(1, prev.streak + 1) }
        : { correct: prev.correct, incorrect: prev.incorrect + 1, streak: prev.streak > 0 ? 0 : prev.streak - 1 };

      // Clonado inmutable del path completo
      const newProfiles = [...state.profiles];
      newProfiles[profileIdx] = {
        ...profile,
        progress: {
          ...profile.progress,
          [level]: {
            ...profile.progress[level],
            [continent]: {
              ...lcp,
              attempts: {
                ...lcp.attempts,
                [cca2]: {
                  ...countryAttempts,
                  [questionType]: updated,
                },
              },
            },
          },
        },
      };

      return { profiles: newProfiles };
    });
  },

  getAttempts: (level, continent) => {
    const profile = get().getActiveProfile();
    if (!profile) return {};
    return profile.progress[level][continent].attempts;
  },

  earnStamp: (level, continent, stampType) => {
    set((state) => {
      const { activeProfileId } = state;
      if (!activeProfileId) return state;

      const profileIdx = state.profiles.findIndex((p) => p.id === activeProfileId);
      if (profileIdx === -1) return state;

      const profile = state.profiles[profileIdx];
      const lcp = profile.progress[level][continent];
      const field = stampType === 'countries' ? 'stampCountries' : 'stampCapitals';
      const today = new Date().toISOString().slice(0, 10);

      const newProfiles = [...state.profiles];
      newProfiles[profileIdx] = {
        ...profile,
        progress: {
          ...profile.progress,
          [level]: {
            ...profile.progress[level],
            [continent]: {
              ...lcp,
              [field]: { earned: true, earnedDate: today },
            },
          },
        },
      };

      return { profiles: newProfiles };
    });
  },

  getStamps: (level, continent) => {
    const profile = get().getActiveProfile();
    if (!profile) return { countries: false, capitals: false };
    const lcp = profile.progress[level][continent];
    return {
      countries: lcp.stampCountries.earned,
      capitals: lcp.stampCapitals.earned,
    };
  },

  setLastPlayed: (continent, level) => {
    set((state) => ({
      settings: { ...state.settings, lastPlayed: { continent, level } },
    }));
  },

  resetAttempts: (level, continent) => {
    set((state) => {
      const { activeProfileId } = state;
      if (!activeProfileId) return state;

      const profileIdx = state.profiles.findIndex((p) => p.id === activeProfileId);
      if (profileIdx === -1) return state;

      const profile = state.profiles[profileIdx];
      const newProfiles = [...state.profiles];
      newProfiles[profileIdx] = {
        ...profile,
        progress: {
          ...profile.progress,
          [level]: {
            ...profile.progress[level],
            [continent]: {
              ...profile.progress[level][continent],
              attempts: {},
            },
          },
        },
      };

      return { profiles: newProfiles };
    });
  },
    }),
    {
      name: 'geoexpert-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        settings: state.settings,
      }),
    },
  ),
);
