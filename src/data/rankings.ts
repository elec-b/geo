// Cálculo de rankings globales de países (población y superficie)
import type { CountryData } from './types';

/** Rankings de un país */
export interface CountryRankings {
  populationRank: number; // 1 = más poblado
  areaRank: number;       // 1 = más grande
  totalCountries: number; // 195
}

/**
 * Calcula rankings globales de población y superficie.
 * Se ejecuta una sola vez al cargar los datos.
 */
export function buildRankings(countries: Map<string, CountryData>): Map<string, CountryRankings> {
  const entries = Array.from(countries.values());
  const total = entries.length;

  // Ordenar por población descendente
  const byPopulation = [...entries].sort((a, b) => b.population - a.population);
  const popRankMap = new Map<string, number>();
  byPopulation.forEach((c, i) => popRankMap.set(c.cca2, i + 1));

  // Ordenar por superficie descendente
  const byArea = [...entries].sort((a, b) => b.area - a.area);
  const areaRankMap = new Map<string, number>();
  byArea.forEach((c, i) => areaRankMap.set(c.cca2, i + 1));

  // Construir Map de rankings
  const rankings = new Map<string, CountryRankings>();
  for (const country of entries) {
    rankings.set(country.cca2, {
      populationRank: popRankMap.get(country.cca2)!,
      areaRank: areaRankMap.get(country.cca2)!,
      totalCountries: total,
    });
  }

  return rankings;
}
