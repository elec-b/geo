// Centros geográficos de continentes para flyTo del globo
import type { Continent } from './types';

/** Coordenadas [lon, lat] centrales de cada continente */
export const CONTINENT_CENTERS: Record<Continent, [number, number]> = {
  'África': [20, 0],
  'América': [-80, 10],
  'Asia': [90, 35],
  'Europa': [15, 50],
  'Oceanía': [148, -22],
};

/** Escala de zoom por continente para que llene la pantalla al empezar */
export const CONTINENT_ZOOM: Record<Continent, number> = {
  'África': 2.2,
  'América': 1.6,
  'Asia': 1.8,
  'Europa': 3.5,
  'Oceanía': 2.0,
};
