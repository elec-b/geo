// Registro del protocolo pmtiles:// para MapLibre GL JS.
// Se llama una sola vez al inicio de la app, antes de montar cualquier Map.
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

let initialized = false;

export function initPmtilesProtocol(): void {
  if (initialized) return;
  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
  initialized = true;
}
