// Centros geográficos de continentes para flyTo del globo
import type { Continent, ContinentOrSpecial } from './types';

/** Array canónico de continentes (orden olímpico) */
export const CONTINENTS: Continent[] = ['europe', 'africa', 'america', 'asia', 'oceania'];

/** Coordenadas [lon, lat] centrales de cada continente */
export const CONTINENT_CENTERS: Record<Continent, [number, number]> = {
  'africa': [20, 0],
  'america': [-80, 10],
  'asia': [80, 30],
  'europe': [15, 50],
  'oceania': [160, -15],
};

/** Escala de zoom por continente para que llene la pantalla al empezar */
export const CONTINENT_ZOOM: Record<Continent, number> = {
  'africa': 2.2,
  'america': 1.6,
  'asia': 1.5,
  'europe': 3.5,
  'oceania': 1.5,
};

/** Variable CSS de color olímpico por continente */
export const CONTINENT_CSS_VAR: Record<Continent, string> = {
  africa: '--color-africa',
  america: '--color-america',
  asia: '--color-asia',
  europe: '--color-europe',
  oceania: '--color-oceania',
};

/** Variable CSS de color incluyendo Antártida */
export const CONTINENT_CSS_VAR_SPECIAL: Record<ContinentOrSpecial, string> = {
  ...CONTINENT_CSS_VAR,
  antarctica: '--color-accent-amber',
};

/** Infiere el continente del usuario a partir de su zona horaria */
export function inferContinentFromTimezone(): Continent {
  try {
    const region = Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[0];
    const map: Record<string, Continent> = {
      Africa: 'africa', America: 'america', Asia: 'asia',
      Europe: 'europe', Australia: 'oceania', Pacific: 'oceania',
    };
    return map[region] ?? 'europe';
  } catch { return 'europe'; }
}
