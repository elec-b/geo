// Cálculo de rankings globales de países (población y superficie)
import type { CountryData } from './types';

/** Rankings de un país */
export interface CountryRankings {
  populationRank: number; // 1 = más poblado
  areaRank: number;       // 1 = más grande
  densityRank: number;    // 1 = más denso (hab/km²)
  hdiRank: number;        // 1 = mayor HDI (0 = sin datos)
  ihdiRank: number;       // 1 = mayor IHDI (0 = sin datos)
  totalCountries: number; // 195
}

/**
 * Calcula rankings globales de población y superficie.
 * Se ejecuta una sola vez al cargar los datos.
 */
export function buildRankings(countries: Map<string, CountryData>): Map<string, CountryRankings> {
  // Solo países ONU participan en rankings
  const entries = Array.from(countries.values()).filter(c => c.unMember !== false);
  const total = entries.length;

  // Ordenar por población descendente
  const byPopulation = [...entries].sort((a, b) => b.population - a.population);
  const popRankMap = new Map<string, number>();
  byPopulation.forEach((c, i) => popRankMap.set(c.cca2, i + 1));

  // Ordenar por superficie descendente
  const byArea = [...entries].sort((a, b) => b.area - a.area);
  const areaRankMap = new Map<string, number>();
  byArea.forEach((c, i) => areaRankMap.set(c.cca2, i + 1));

  // Ordenar por densidad de población descendente (hab/km²)
  const byDensity = [...entries]
    .filter(c => c.area > 0)
    .sort((a, b) => (b.population / b.area) - (a.population / a.area));
  const densityRankMap = new Map<string, number>();
  byDensity.forEach((c, i) => densityRankMap.set(c.cca2, i + 1));

  // Ordenar por HDI descendente (solo países con datos)
  const withHdi = entries.filter(c => c.hdi !== null);
  const byHdi = [...withHdi].sort((a, b) => b.hdi! - a.hdi!);
  const hdiRankMap = new Map<string, number>();
  byHdi.forEach((c, i) => hdiRankMap.set(c.cca2, i + 1));

  // Ordenar por IHDI descendente (solo países con datos)
  const withIhdi = entries.filter(c => c.ihdi !== null);
  const byIhdi = [...withIhdi].sort((a, b) => b.ihdi! - a.ihdi!);
  const ihdiRankMap = new Map<string, number>();
  byIhdi.forEach((c, i) => ihdiRankMap.set(c.cca2, i + 1));

  // Construir Map de rankings
  const rankings = new Map<string, CountryRankings>();
  for (const country of entries) {
    rankings.set(country.cca2, {
      populationRank: popRankMap.get(country.cca2)!,
      areaRank: areaRankMap.get(country.cca2)!,
      densityRank: densityRankMap.get(country.cca2) ?? total,
      hdiRank: hdiRankMap.get(country.cca2) ?? 0,
      ihdiRank: ihdiRankMap.get(country.cca2) ?? 0,
      totalCountries: total,
    });
  }

  return rankings;
}
