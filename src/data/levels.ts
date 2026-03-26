// Generación de definiciones de niveles por continente
import type { CountryData, Continent, GameLevel, LevelDefinition } from './types';
import { CONTINENTS } from './continents';

/** Array canónico de niveles (orden de progresión) */
export const LEVELS: GameLevel[] = ['tourist', 'backpacker', 'guide'];

/** Emoji asociado a cada nivel */
export const LEVEL_EMOJI: Record<GameLevel, string> = {
  tourist: '🧳',
  backpacker: '🎒',
  guide: '🗺️',
};

/** Número de países en nivel Turista por continente */
const TOURIST_COUNT: Record<Continent, number> = {
  'africa': 10,
  'america': 10,
  'asia': 10,
  'europe': 10,
  'oceania': 5,
};

/**
 * Genera las 15 definiciones de nivel (3 niveles × 5 continentes)
 * a partir de los datos de países.
 *
 * - Turista: top N por población (N=10 en general, 5 en Oceanía)
 * - Mochilero: 60% de países del continente (incluye los de Turista)
 * - Guía: 100% de países del continente
 */
export function buildLevelDefinitions(
  countries: Map<string, CountryData>,
): Map<string, LevelDefinition> {
  const result = new Map<string, LevelDefinition>();

  for (const continent of CONTINENTS) {
    // Filtrar países del continente y ordenar por población descendente
    const byContinent = [...countries.values()]
      .filter((c) => c.continent === continent && c.unMember !== false)
      .sort((a, b) => b.population - a.population);

    const allCodes = byContinent.map((c) => c.cca2);
    const total = allCodes.length;

    // Turista: top N por población
    const touristCount = Math.min(TOURIST_COUNT[continent], total);
    const touristCodes = allCodes.slice(0, touristCount);

    // Mochilero: 60% (redondeado hacia arriba), mínimo los de Turista
    const backpackerCount = Math.max(touristCount, Math.ceil(total * 0.6));
    const backpackerCodes = allCodes.slice(0, backpackerCount);

    // Guía: todos
    const guideCodes = allCodes;

    const levels: [GameLevel, string[]][] = [
      ['tourist', touristCodes],
      ['backpacker', backpackerCodes],
      ['guide', guideCodes],
    ];

    for (const [level, codes] of levels) {
      const key = `${level}-${continent}`;
      result.set(key, { level, continent, countries: codes });
    }
  }

  return result;
}
