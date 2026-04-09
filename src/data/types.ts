// Tipos centrales de datos de Exploris

/** Continentes (5 regiones del mundo) — claves neutras para i18n */
export type Continent = 'africa' | 'america' | 'asia' | 'europe' | 'oceania';

/** Continente extendido para incluir Antártida (no es un continente habitado) */
export type ContinentOrSpecial = Continent | 'antarctica';

/** Niveles de dificultad del juego — claves neutras para i18n */
export type GameLevel = 'tourist' | 'backpacker' | 'guide';

/** Datos de un país (provenientes de countries.json) */
export interface CountryData {
  cca2: string;
  ccn3: string;
  name: string;
  capital: string;
  continent: ContinentOrSpecial;
  population: number;
  area: number;
  flagSvg: string;
  currencies: { name: string; symbol: string }[];
  languages: string[];
  demonym: string;
  hdi: number | null;
  ihdi: number | null;
  /** Slug de Wikipedia (ej: "España"). Prefijo "en:" si el artículo es en inglés */
  wikipediaSlug: string | null;
  /** true = miembro o estado observador ONU (195). false = territorio no reconocido */
  unMember: boolean;
  /** cca2 del país soberano, para territorios dependientes no-ONU */
  sovereignCountry?: string;
}

/** Coordenadas de una capital (provenientes de capitals.json) */
export interface CapitalCoords {
  name: string;
  latlng: [number, number];
}

/** Los 6 tipos de juego reales (sin 'mixed') */
export type QuestionType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** Definición de un nivel de juego (nivel × continente) */
export interface LevelDefinition {
  level: GameLevel;
  continent: Continent;
  countries: string[]; // Array de cca2
}
