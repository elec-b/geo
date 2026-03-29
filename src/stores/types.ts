// Tipos del estado global de GeoExpert
import type { Continent, GameLevel, QuestionType } from '../data/types';

/** Identificador de perfil (UUID) */
export type ProfileId = string;

/** Identificador de avatar (nombre del icono) */
export type AvatarId = string;

/** Estado de un sello (por nivel×continente) */
export interface StampStatus {
  earned: boolean;
  earnedDate: string | null; // ISO date (YYYY-MM-DD) de cuándo se ganó
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

/** Registro de intentos de un país en pruebas de sello */
export interface StampAttemptRecord {
  correct: number;
  incorrect: number;
  /** Resultado del último intento (para indicador ✓/✗ en estadísticas) */
  lastCorrect: boolean;
}

/** Intentos de prueba de sello por tipo (A = países, B = capitales) */
export type StampCountryAttempts = Partial<Record<'A' | 'B', StampAttemptRecord>>;

/** Progreso en un nivel × continente */
export interface LevelContinentProgress {
  stampCountries: StampStatus;  // sello de países (prueba tipo A)
  stampCapitals: StampStatus;   // sello de capitales (prueba tipo B)
  attempts: Record<string, CountryAttempts>;          // cca2 → intentos de Jugar
  stampAttempts: Record<string, StampCountryAttempts>; // cca2 → intentos de pruebas de sello
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
  showSeaLabels: boolean;
  vibration: boolean;
  theme: 'dark';        // por ahora solo dark
  locale: string;       // código de idioma (ej. 'es', 'en')
  lastPlayed?: { continent: Continent; level: GameLevel } | null;
  lastStampPlayed?: { continent: Continent; level: GameLevel } | null;
  lastActiveContinent?: Continent | null;
  lastTableSort?: { key: 'name' | 'capital' | 'population'; dir: 'asc' | 'desc' } | null;
  lastExploreMode?: 'countries' | 'capitals';
}

/** Estado completo de la aplicación */
export interface AppState {
  profiles: UserProfile[];
  activeProfileId: ProfileId | null;
  settings: AppSettings;
}
