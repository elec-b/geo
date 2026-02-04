// Componente principal del globo 3D
import { useRef, useEffect, useState, useCallback } from 'react';
import GlobeGL from 'react-globe.gl';
import { loadCountriesGeoJson, getCountryColor, getCountryHoverColor } from '../../data/countries';
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

  // Estado para el país seleccionado (click)
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null);

  // Cargar datos de países al montar (asíncrono)
  useEffect(() => {
    loadCountriesGeoJson().then(setCountriesData);
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

      // Eliminar luces direccionales/puntuales del polo norte (añadidas por three-globe).
      // Se usa un delay porque three-globe puede añadirlas tras la inicialización.
      const removeExtraLights = () => {
        const scene = globeRef.current?.scene();
        if (!scene) return;
        scene.traverse((obj: any) => {
          if (obj.type === 'PointLight' || obj.type === 'DirectionalLight') {
            obj.intensity = 0;
          }
        });
      };
      removeExtraLights();
      const timer = setTimeout(removeExtraLights, 500);
      return () => clearTimeout(timer);
    }
  }, [countriesData]);

  // Handler para click en país
  const handlePolygonClick = useCallback((polygon: any) => {
    if (polygon) {
      console.log('País seleccionado:', polygon.properties?.name || 'Desconocido');
      setSelectedCountry(polygon as CountryFeature);

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

  // Handler para hover (solo cambia cursor, sin resaltar)
  const handlePolygonHover = useCallback((polygon: any) => {
    document.body.style.cursor = polygon ? 'pointer' : 'grab';
  }, []);

  // Función para obtener el color del polígono (resalta solo el seleccionado)
  const polygonCapColor = useCallback((d: any) => {
    const isSelected = selectedCountry && d.properties?.name === selectedCountry.properties?.name;
    const countryId = d.id || d.properties?.id || '0';

    if (isSelected) {
      return getCountryHoverColor(countryId);
    }
    return getCountryColor(countryId);
  }, [selectedCountry]);

  // Altitud mínima para evitar z-fighting, sin extrusión visible
  const polygonAltitude = useCallback(() => 0.008, []);

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
