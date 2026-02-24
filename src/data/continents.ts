// Centros geográficos de continentes para flyTo del globo
import type { Continent } from './types';

/** Coordenadas [lon, lat] centrales de cada continente */
export const CONTINENT_CENTERS: Record<Continent, [number, number]> = {
  'África': [20, 0],
  'América': [-80, 10],
  'Asia': [90, 35],
  'Europa': [15, 50],
  'Oceanía': [140, -25],
};
