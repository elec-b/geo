// Componente principal del globo 3D
import { useRef, useEffect, useState, useCallback } from 'react';
import GlobeGL from 'react-globe.gl';
import { getCountriesGeoJson, getCountryColor, getCountryHoverColor } from '../../data/countries';
import type { CountryFeature } from '../../data/countries';

// Props del componente (vacío por ahora, añadiremos callbacks después)
interface GlobeProps {
  onCountryClick?: (country: CountryFeature) => void;
}

export function Globe({ onCountryClick }: GlobeProps) {
  // Referencia al componente del globo para controlar la cámara
  const globeRef = useRef<any>(null);

  // Estado para los datos de países
  const [countriesData, setCountriesData] = useState<any>(null);

  // Estado para el país en hover
  const [hoverCountry, setHoverCountry] = useState<CountryFeature | null>(null);

  // Cargar datos de países al montar
  useEffect(() => {
    const geojson = getCountriesGeoJson();
    setCountriesData(geojson);
  }, []);

  // Configurar el globo después de cargar
  useEffect(() => {
    if (globeRef.current) {
      // Configurar controles de cámara
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5; // Rotación lenta
        controls.enableZoom = true;
        controls.minDistance = 150; // Zoom mínimo (más cerca)
        controls.maxDistance = 500; // Zoom máximo (más lejos)
      }

      // Posición inicial de la cámara (vista de Europa/África)
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, [countriesData]);

  // Handler para click en país
  const handlePolygonClick = useCallback((polygon: any) => {
    if (polygon) {
      console.log('País seleccionado:', polygon.properties?.name || 'Desconocido');

      // Detener rotación automática al hacer click
      if (globeRef.current) {
        const controls = globeRef.current.controls();
        if (controls) {
          controls.autoRotate = false;
        }
      }

      // Callback externo si existe
      if (onCountryClick) {
        onCountryClick(polygon as CountryFeature);
      }
    }
  }, [onCountryClick]);

  // Handler para hover
  const handlePolygonHover = useCallback((polygon: any) => {
    setHoverCountry(polygon as CountryFeature | null);

    // Cambiar cursor
    document.body.style.cursor = polygon ? 'pointer' : 'grab';
  }, []);

  // Función para obtener el color del polígono
  const polygonCapColor = useCallback((d: any) => {
    const isHovered = hoverCountry && d.properties?.name === hoverCountry.properties?.name;
    const countryId = d.id || d.properties?.id || '0';

    if (isHovered) {
      return getCountryHoverColor(countryId);
    }
    return getCountryColor(countryId);
  }, [hoverCountry]);

  // Función para el color del borde
  const polygonSideColor = useCallback(() => {
    return 'rgba(255, 255, 255, 0.1)';
  }, []);

  // Altitud mínima para evitar z-fighting (manchas) sin crear efecto "cubito"
  const polygonAltitude = useCallback(() => 0.01, []);

  if (!countriesData) {
    return (
      <div className="globe-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-secondary)'
      }}>
        Cargando globo...
      </div>
    );
  }

  return (
    <div className="globe-container">
      <GlobeGL
        ref={globeRef}
        // Configuración del globo
        globeImageUrl=""
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#00f0ff"
        atmosphereAltitude={0.15}

        // Datos de polígonos (países)
        polygonsData={countriesData.features}
        polygonCapColor={polygonCapColor}
        polygonSideColor={polygonSideColor}
        polygonStrokeColor={() => 'rgba(255, 255, 255, 0.2)'}
        polygonAltitude={polygonAltitude}

        // Interacciones
        onPolygonClick={handlePolygonClick}
        onPolygonHover={handlePolygonHover}

        // Rendimiento
        animateIn={true}
        polygonCapCurvatureResolution={5}  // Mayor resolución (número menor) evita z-fighting en áreas grandes
      />
    </div>
  );
}

export default Globe;
