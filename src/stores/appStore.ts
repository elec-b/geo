// Store global de GeoExpert (Zustand)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from './persistStorage';
import type { AppSettings, AppState, UserProfile, ProfileId, AvatarId, ProfileProgress, CountryAttempts, StampCountryAttempts } from './types';
import type { Continent, GameLevel, QuestionType } from '../data/types';
import { CONTINENTS } from '../data/continents';
import { LEVELS } from '../data/levels';

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
        stampAttempts: {},
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
  showSeaLabels: true,
  vibration: true,
  theme: 'dark',
  locale: 'es',
  lastPlayed: null,
  lastStampPlayed: null,
  lastActiveContinent: null,
  lastTableSort: null,
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
  /** Registra un intento en una prueba de sello (registro independiente de Jugar) */
  recordStampAttempt: (level: GameLevel, continent: Continent, cca2: string, stampType: 'A' | 'B', correct: boolean) => void;
  /** Devuelve los intentos de pruebas de sello del perfil activo para un nivel × continente */
  getStampAttempts: (level: GameLevel, continent: Continent) => Record<string, StampCountryAttempts>;
  /** Persiste el último continente y nivel jugado */
  setLastPlayed: (continent: Continent, level: GameLevel) => void;
  /** Persiste el último continente y nivel de prueba de sello */
  setLastStampPlayed: (continent: Continent, level: GameLevel) => void;
  /** Persiste el último continente activo (de cualquier fuente: Jugar, sello, tabla) */
  setLastActiveContinent: (continent: Continent | null) => void;
  /** Persiste el último sorting de la tabla de Explorar */
  setLastTableSort: (key: 'name' | 'capital' | 'population', dir: 'asc' | 'desc') => void;
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

  recordStampAttempt: (level, continent, cca2, stampType, correct) => {
    set((state) => {
      const { activeProfileId } = state;
      if (!activeProfileId) return state;

      const profileIdx = state.profiles.findIndex((p) => p.id === activeProfileId);
      if (profileIdx === -1) return state;

      const profile = state.profiles[profileIdx];
      const lcp = profile.progress[level][continent];
      const sa = lcp.stampAttempts ?? {};
      const countryStamp = sa[cca2] ?? {};
      const prev = countryStamp[stampType] ?? { correct: 0, incorrect: 0, lastCorrect: false };

      const updated = {
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
        lastCorrect: correct,
      };

      const newProfiles = [...state.profiles];
      newProfiles[profileIdx] = {
        ...profile,
        progress: {
          ...profile.progress,
          [level]: {
            ...profile.progress[level],
            [continent]: {
              ...lcp,
              stampAttempts: {
                ...sa,
                [cca2]: {
                  ...countryStamp,
                  [stampType]: updated,
                },
              },
            },
          },
        },
      };

      return { profiles: newProfiles };
    });
  },

  getStampAttempts: (level, continent) => {
    const profile = get().getActiveProfile();
    if (!profile) return {};
    return profile.progress[level][continent].stampAttempts ?? {};
  },

  setLastPlayed: (continent, level) => {
    set((state) => ({
      settings: { ...state.settings, lastPlayed: { continent, level }, lastActiveContinent: continent },
    }));
  },

  setLastStampPlayed: (continent, level) => {
    set((state) => ({
      settings: { ...state.settings, lastStampPlayed: { continent, level }, lastActiveContinent: continent },
    }));
  },

  setLastActiveContinent: (continent) => {
    set((state) => ({
      settings: { ...state.settings, lastActiveContinent: continent },
    }));
  },

  setLastTableSort: (key, dir) => {
    set((state) => ({
      settings: { ...state.settings, lastTableSort: { key, dir } },
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
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        if (version === 0) {
          // Migración v0→v1: claves de continente y nivel de español a neutras
          const CONTINENT_MAP: Record<string, Continent> = {
            'África': 'africa', 'América': 'america', 'Asia': 'asia',
            'Europa': 'europe', 'Oceanía': 'oceania',
          };
          const LEVEL_MAP: Record<string, GameLevel> = {
            'turista': 'tourist', 'mochilero': 'backpacker', 'guía': 'guide',
          };
          const s = persisted as Record<string, any>;

          // Migrar profiles[].progress (Record<GameLevel, Record<Continent, ...>>)
          if (Array.isArray(s.profiles)) {
            for (const profile of s.profiles) {
              if (!profile.progress) continue;
              const oldProgress = profile.progress;
              const newProgress: Record<string, Record<string, unknown>> = {};
              for (const [oldLevel, continents] of Object.entries(oldProgress)) {
                const newLevel = LEVEL_MAP[oldLevel] ?? oldLevel;
                newProgress[newLevel] = {};
                for (const [oldContinent, data] of Object.entries(continents as Record<string, unknown>)) {
                  const newContinent = CONTINENT_MAP[oldContinent] ?? oldContinent;
                  newProgress[newLevel][newContinent] = data;
                }
              }
              profile.progress = newProgress;
            }
          }

          // Migrar settings.lastPlayed, lastStampPlayed, lastActiveContinent
          if (s.settings) {
            if (s.settings.lastPlayed) {
              s.settings.lastPlayed.continent = CONTINENT_MAP[s.settings.lastPlayed.continent] ?? s.settings.lastPlayed.continent;
              s.settings.lastPlayed.level = LEVEL_MAP[s.settings.lastPlayed.level] ?? s.settings.lastPlayed.level;
            }
            if (s.settings.lastStampPlayed) {
              s.settings.lastStampPlayed.continent = CONTINENT_MAP[s.settings.lastStampPlayed.continent] ?? s.settings.lastStampPlayed.continent;
              s.settings.lastStampPlayed.level = LEVEL_MAP[s.settings.lastStampPlayed.level] ?? s.settings.lastStampPlayed.level;
            }
            if (s.settings.lastActiveContinent) {
              s.settings.lastActiveContinent = CONTINENT_MAP[s.settings.lastActiveContinent] ?? s.settings.lastActiveContinent;
            }
          }
        }
        return persisted as AppState;
      },
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        settings: state.settings,
      }),
    },
  ),
);
