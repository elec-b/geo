// Tipos centrales de datos de GeoExpert

/** Continentes (5 regiones del mundo) */
export type Continent = 'África' | 'América' | 'Asia' | 'Europa' | 'Oceanía';

/** Continente extendido para incluir Antártida (no es un continente habitado) */
export type ContinentOrSpecial = Continent | 'Antártida';

/** Niveles de dificultad del juego */
export type GameLevel = 'turista' | 'mochilero' | 'guía';

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
  currencies: string[];
  languages: string[];
  demonym: string;
  /** true = miembro o estado observador ONU (195). false = territorio no reconocido */
  unMember: boolean;
}

/** Coordenadas de una capital (provenientes de capitals.json) */
export interface CapitalCoords {
  name: string;
  latlng: [number, number];
}

/** Definición de un nivel de juego (nivel × continente) */
export interface LevelDefinition {
  level: GameLevel;
  continent: Continent;
  countries: string[]; // Array de cca2
}
