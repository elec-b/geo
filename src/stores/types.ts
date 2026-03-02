// Tipos del estado global de GeoExpert
import type { Continent, GameLevel, QuestionType } from '../data/types';

/** Identificador de perfil (UUID) */
export type ProfileId = string;

/** Identificador de avatar (nombre del icono) */
export type AvatarId = string;

/** Estado de un sello de país */
export interface StampStatus {
  earned: boolean;
  attemptsToday: number;
  lastAttemptDate: string; // ISO date (YYYY-MM-DD)
}

/** Registro de intentos para un país en un tipo de juego */
export interface AttemptRecord {
  correct: number;
  incorrect: number;
  /** Aciertos consecutivos recientes (se resetea al fallar) */
  streak: number;
}

/** Intentos por tipo de juego para un país dado */
export type CountryAttempts = Partial<Record<QuestionType, AttemptRecord>>;

/** Progreso en un nivel × continente */
export interface LevelContinentProgress {
  stampCountries: Record<string, StampStatus>;  // cca2 → estado del sello del país
  stampCapitals: Record<string, StampStatus>;   // cca2 → estado del sello de la capital
  attempts: Record<string, CountryAttempts>;    // cca2 → intentos por tipo
}

/** Progreso completo de un perfil */
export type ProfileProgress = Record<GameLevel, Record<Continent, LevelContinentProgress>>;

/** Perfil de usuario */
export interface UserProfile {
  id: ProfileId;
  name: string;
  avatar: AvatarId;
  createdAt: string; // ISO date
  progress: ProfileProgress;
}

/** Configuración global de la app */
export interface AppSettings {
  showMarkers: boolean;
  vibration: boolean;
  theme: 'dark';        // por ahora solo dark
  locale: 'es';         // por ahora solo español
}

/** Estado completo de la aplicación */
export interface AppState {
  profiles: UserProfile[];
  activeProfileId: ProfileId | null;
  settings: AppSettings;
}
