// Exploris - Aplicación principal
import { lazy, Suspense, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { TabBar } from './components/Navigation/TabBar';
import { AppHeader } from './components/Layout/AppHeader';
import { StatsView } from './components/Stats/StatsView';
import { ExploreView, type GlobeControlProps } from './components/Explore/ExploreView';
import { JugarView, type StampTestRequest } from './components/Game/JugarView';
import { PassportView } from './components/Passport/PassportView';
import { ProfileSelector, getNextDefaultName } from './components/Profile/ProfileSelector';
import { ProfileEditor } from './components/Profile/ProfileEditor';
import { AboutSheet } from './components/About/AboutSheet';
import { SettingsSheet } from './components/Settings/SettingsSheet';
import { LanguageSheet } from './components/Settings/LanguageSheet';
import { loadCountryData, loadCapitals, invalidateCache } from './data/countryData';
import { checkAndUpdate } from './data/cdnUpdate';
import { maybeRequestReview } from './utils/reviewPrompt';
import { changeAppLanguage } from './i18n';
import { buildRankings, type CountryRankings } from './data/rankings';
import { buildLevelDefinitions, buildCountryLevelMap } from './data/levels';
import { useAppStore } from './stores/appStore';
import { useBackHandlerStore } from './stores/backHandlerStore';
import { useBackHandler } from './hooks/useBackHandler';
import type { GlobeD3Ref } from './components/Globe';
import type { CountryFeature } from './data/countries';
import type { CountryData, CapitalCoords, GameLevel, LevelDefinition } from './data/types';
import type { TabId } from './components/Navigation/types';
import './components/Layout/AppShell.css';

const GlobeD3 = lazy(() => import('./components/Globe/GlobeD3'));

/** Estado inicial de las props controladas del globo */
const DEFAULT_GLOBE_CONTROL: GlobeControlProps = {
  selectedCountryCca2: null,
  capitalPins: [],
  highlightedCountries: null,
  showCountryLabels: false,
  showCapitalLabels: false,
  capitalLabelsData: null,
  feedbackLabels: null,
};

function App() {
  const { t } = useTranslation('profile');
  const [globeReady, setGlobeReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('explore');
  const [jugarResetSignal, setJugarResetSignal] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [statsMinimized, setStatsMinimized] = useState(false);
  const [exploreCountryRequest, setExploreCountryRequest] = useState<string | null>(null);
  const showMarkers = useAppStore((s) => s.settings.showMarkers);
  const showSeaLabels = useAppStore((s) => s.settings.showSeaLabels);
  const theme = useAppStore((s) => s.settings.theme);

  // Sincronizar data-theme en <html> con el store
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Reset de estado de sesión al abrir la app (Globo + Todos) + contador de sesiones
  useEffect(() => {
    useAppStore.getState().setLastExploreMode('countries');
    useAppStore.getState().setLastActiveContinent(null);
    const current = useAppStore.getState().settings.sessionCount ?? 0;
    useAppStore.getState().updateSettings({ sessionCount: current + 1 });
  }, []);

  // Fix nombre de perfil por defecto hardcodeado en español
  useEffect(() => {
    const translatedDefault = t('defaultName');
    if (translatedDefault === 'Explorador') return;
    const { profiles, updateProfile } = useAppStore.getState();
    for (const profile of profiles) {
      if (profile.name === 'Explorador') {
        updateProfile(profile.id, { name: translatedDefault });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Datos cargados
  const [countries, setCountries] = useState<Map<string, CountryData> | null>(null);
  const [capitals, setCapitals] = useState<Map<string, CapitalCoords> | null>(null);
  const [rankings, setRankings] = useState<Map<string, CountryRankings> | null>(null);
  const [levels, setLevels] = useState<Map<string, LevelDefinition> | null>(null);

  // Ref del globo (para flyTo)
  const globeRef = useRef<GlobeD3Ref>(null);

  // Props controladas del globo (gestionadas por el tab activo)
  const [globeControl, setGlobeControl] = useState<GlobeControlProps>(DEFAULT_GLOBE_CONTROL);

  // Ref del tab activo (para evitar re-render del globo al cambiar de tab)
  const activeTabRef = useRef<TabId>(activeTab);
  activeTabRef.current = activeTab;

  // Modales
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);

  // Modales de gestión de perfiles
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [editingProfile, setEditingProfile] = useState<import('./stores/types').UserProfile | null>(null);

  // Prueba de sello lanzada desde Pasaporte
  const [stampTestRequest, setStampTestRequest] = useState<StampTestRequest | null>(null);
  // Indica que hay una prueba de sello activa (desde cualquier origen)
  const [stampTestActive, setStampTestActive] = useState(false);
  // Sello recién ganado (para animación stampDrop en Pasaporte)
  const [recentlyEarnedStamp, setRecentlyEarnedStamp] = useState<StampTestRequest | null>(null);

  // Cambio de tab — con limpieza de prueba de sello si está activa
  const handleTabChange = useCallback((tab: TabId) => {
    if (stampTestActive) {
      setStampTestActive(false);
      if (stampTestRequest) setStampTestRequest(null);
      if (tab === 'play') {
        setJugarResetSignal((s) => s + 1);
        return;
      }
      setActiveTab(tab);
      return;
    }
    if (tab === 'play' && activeTab === 'play') {
      setJugarResetSignal((s) => s + 1);
    }
    setActiveTab(tab);
  }, [activeTab, stampTestActive, stampTestRequest]);

  // Callback para navegar a un país desde Estadísticas → oculta Stats, cambia a Explorar
  const handleStatsCountryClick = useCallback((cca2: string) => {
    setStatsMinimized(true);
    if (stampTestActive) {
      setStampTestActive(false);
      setStampTestRequest(null);
    }
    setExploreCountryRequest(cca2);
    setActiveTab('explore');
  }, [stampTestActive]);

  // Abrir/restaurar Estadísticas
  const handleOpenStats = useCallback(() => {
    if (showStats && statsMinimized) {
      setStatsMinimized(false);
    } else {
      setShowStats(true);
    }
  }, [showStats, statsMinimized]);

  // Cerrar Estadísticas completamente (desmonta)
  const handleCloseStats = useCallback(() => {
    setShowStats(false);
    setStatsMinimized(false);
  }, []);

  // Callback para lanzar prueba de sello desde Pasaporte → cambia a tab Jugar
  const handleStartStampTest = useCallback(
    (level: import('./data/types').GameLevel, continent: import('./data/types').Continent, stampType: import('./hooks/useGameSession').StampTestType) => {
      setStampTestRequest({ level, continent, stampType });
      setStampTestActive(true);
      setActiveTab('play');
    },
    [],
  );

  // Callback cuando JugarView inicia una prueba de sello internamente
  const handleStampTestStarted = useCallback(() => {
    setStampTestActive(true);
  }, []);

  // Callback cuando la prueba de sello termina → limpiar request
  const handleStampTestDone = useCallback(
    (earned?: { level: import('./data/types').GameLevel; continent: import('./data/types').Continent; stampType: import('./hooks/useGameSession').StampTestType }) => {
      if (earned) setRecentlyEarnedStamp(earned);
      setStampTestRequest(null);
      setStampTestActive(false);
      setActiveTab('passport');
    },
    [],
  );

  // Cambio de perfil: limpiar sesión activa, reiniciar globo y navegar a Explorar
  const handleProfileChange = useCallback((id: string) => {
    const currentId = useAppStore.getState().activeProfileId;
    if (id !== currentId) {
      useAppStore.getState().setActiveProfile(id);
      setStampTestRequest(null);
      setStampTestActive(false);
      setActiveTab('explore');
      globeRef.current?.resetToIdle();
    }
    setShowProfileSelector(false);
  }, []);

  // Bridge de handlers: cada tab registra sus callbacks aquí
  const exploreClickRef = useRef<((f: CountryFeature) => void) | undefined>(undefined);
  const exploreDeselectRef = useRef<(() => void) | undefined>(undefined);
  const jugarClickRef = useRef<((f: CountryFeature) => void) | undefined>(undefined);
  const jugarDeselectRef = useRef<(() => void) | undefined>(undefined);

  // Callback estable para el globo (delega al tab activo via refs)
  const handleCountryClick = useCallback((feature: CountryFeature) => {
    if (activeTabRef.current === 'explore') {
      exploreClickRef.current?.(feature);
    } else if (activeTabRef.current === 'play') {
      jugarClickRef.current?.(feature);
    }
  }, []);

  const handleCountryDeselect = useCallback(() => {
    if (activeTabRef.current === 'explore') {
      exploreDeselectRef.current?.();
    } else if (activeTabRef.current === 'play') {
      jugarDeselectRef.current?.();
    }
  }, []);

  const handleGlobeReady = useCallback(() => setGlobeReady(true), []);
  const handleStampAnimationDone = useCallback(() => {
    setRecentlyEarnedStamp(null);
    maybeRequestReview();
  }, []);

  // Precargar datos estáticos en paralelo con el globo
  const locale = useAppStore((s) => s.settings.locale);
  const { i18n } = useTranslation();

  // Sincronizar idioma de i18n con el store (ej: store hidratado con locale persistido)
  useEffect(() => {
    if (i18n.language !== locale) {
      changeAppLanguage(locale);
    }
  }, [locale, i18n]);

  // Sincronizar <html lang> con el idioma activo — necesario para hyphens: auto
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Cargar datos de países en el idioma activo
  useEffect(() => {
    invalidateCache();
    loadCountryData(locale).then((countriesData) => {
      loadCapitals().then((capitalsData) => {
        const ranksData = buildRankings(countriesData);
        const levelsData = buildLevelDefinitions(countriesData);
        setCountries(countriesData);
        setCapitals(capitalsData);
        setRankings(ranksData);
        setLevels(levelsData);

        // Verificar actualizaciones CDN en background (se aplican al siguiente inicio)
        checkAndUpdate().catch(() => {});
      });
    });
  }, [locale]);

  // Mapa de poblaciones para prioridad de etiquetas en el globo
  const countryPopulations = useMemo(() => {
    if (!countries) return null;
    const map = new Map<string, number>();
    for (const [cca2, data] of countries) {
      map.set(cca2, data.population);
    }
    return map;
  }, [countries]);

  // Mapa de nombres (en el idioma activo) para etiquetas del globo
  const countryNames = useMemo(() => {
    if (!countries) return null;
    const map = new Map<string, string>();
    for (const [cca2, data] of countries) {
      map.set(cca2, data.name);
    }
    return map;
  }, [countries]);

  // Mapa cca2 → nivel más bajo (para columna de nivel en tabla de Explorar)
  const countryLevelMap = useMemo(
    () => levels ? buildCountryLevelMap(levels) : new Map<string, GameLevel>(),
    [levels],
  );

  const dataReady = countries && capitals && rankings && levels;

  // Botón atrás físico/gestual de Android: pop del stack LIFO; si vacío, salir de la app
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    let sub: { remove: () => void } | undefined;
    CapacitorApp.addListener('backButton', () => {
      const popped = useBackHandlerStore.getState().pop();
      if (!popped) CapacitorApp.exitApp();
    }).then((s) => { sub = s; });
    return () => { sub?.remove(); };
  }, []);

  // Handlers de overlays gestionados desde App.tsx
  useBackHandler(showLanguage, () => { setShowLanguage(false); setShowSettings(true); });
  useBackHandler(showSettings, () => setShowSettings(false));
  useBackHandler(showAbout, () => setShowAbout(false));
  useBackHandler(showProfileEditor, () => { setShowProfileEditor(false); setEditingProfile(null); });
  useBackHandler(showProfileSelector, () => setShowProfileSelector(false));
  useBackHandler(showStats, handleCloseStats);

  return (
    <>
      <LoadingScreen visible={!globeReady} />

      <AppHeader
        onStatsClick={handleOpenStats}
        onAvatarClick={() => setShowProfileSelector(true)}
        onSettingsClick={() => setShowSettings(true)}
        onAboutClick={() => setShowAbout(true)}
      />

      {/* Globo: siempre montado, sin wrapper — iOS rompe touch tras re-render si se envuelve */}
      <Suspense fallback={null}>
        <GlobeD3
          ref={globeRef}
          onCountryClick={(activeTab === 'explore' || activeTab === 'play') ? handleCountryClick : undefined}
          onCountryDeselect={(activeTab === 'explore' || activeTab === 'play') ? handleCountryDeselect : undefined}
          onReady={handleGlobeReady}
          showMarkers={globeControl.showMarkers ?? showMarkers}
          showSeaLabels={globeControl.showSeaLabels ?? showSeaLabels}
          selectedCountryCca2={globeControl.selectedCountryCca2}
          selectedCountryColor={globeControl.selectedCountryColor}
          capitalPins={globeControl.capitalPins}
          capitalPinHighlight={globeControl.capitalPinHighlight}
          highlightedCountries={globeControl.highlightedCountries}
          showCountryLabels={globeControl.showCountryLabels}
          showCapitalLabels={globeControl.showCapitalLabels}
          capitalLabelsData={globeControl.capitalLabelsData}
          countryPopulations={countryPopulations}
          countryNames={countryNames}
          feedbackLabels={globeControl.feedbackLabels}
        />
      </Suspense>

      {/* Experiencia Explorar */}
      {activeTab === 'explore' && dataReady && (
        <ExploreView
          globeRef={globeRef}
          countries={countries}
          capitals={capitals}
          rankings={rankings}
          countryLevelMap={countryLevelMap}
          onGlobePropsChange={setGlobeControl}
          onCountryClickRef={exploreClickRef}
          onCountryDeselectRef={exploreDeselectRef}
          pendingCountry={exploreCountryRequest}
          onPendingCountryConsumed={() => setExploreCountryRequest(null)}
        />
      )}

      {/* Experiencia Jugar */}
      {activeTab === 'play' && dataReady && (
        <JugarView
          globeRef={globeRef}
          countries={countries}
          capitals={capitals}
          levels={levels}
          onGlobePropsChange={setGlobeControl}
          onCountryClickRef={jugarClickRef}
          onCountryDeselectRef={jugarDeselectRef}
          stampTestRequest={stampTestRequest}
          onStampTestDone={handleStampTestDone}
          onStampTestStarted={handleStampTestStarted}
          onNavigateStats={handleOpenStats}
          resetSignal={jugarResetSignal}
        />
      )}

      {activeTab === 'passport' && dataReady && (
        <PassportView
          levels={levels}
          onStartStampTest={handleStartStampTest}
          recentlyEarnedStamp={recentlyEarnedStamp}
          onStampAnimationDone={handleStampAnimationDone}
        />
      )}

      {showStats && dataReady && (
        <StatsView
          countries={countries}
          levels={levels}
          onClose={handleCloseStats}
          onCountryClick={handleStatsCountryClick}
          context={
            (stampTestRequest || stampTestActive)
              ? { tab: 'sellos', ...(stampTestRequest && { continent: stampTestRequest.continent, level: stampTestRequest.level }) }
              : activeTab === 'passport'
                ? { tab: 'sellos' }
                : undefined
          }
          style={statsMinimized ? { display: 'none' } : undefined}
        />
      )}

      {showProfileSelector && (
        <ProfileSelector
          onClose={() => setShowProfileSelector(false)}
          onProfileChange={handleProfileChange}
          onCreateNew={() => {
            setEditingProfile(null);
            setShowProfileEditor(true);
          }}
          onEdit={(profile) => {
            setEditingProfile(profile);
            setShowProfileEditor(true);
          }}
        />
      )}

      {showProfileEditor && (
        <ProfileEditor
          editProfile={editingProfile ?? undefined}
          defaultName={editingProfile ? undefined : getNextDefaultName(useAppStore.getState().profiles, t('defaultName'))}
          onClose={() => {
            setShowProfileEditor(false);
            setEditingProfile(null);
          }}
          onSave={(created) => {
            setShowProfileEditor(false);
            setShowProfileSelector(false);
            setEditingProfile(null);
            if (created) {
              setStampTestRequest(null);
              setStampTestActive(false);
              setActiveTab('explore');
              globeRef.current?.resetToIdle();
            }
          }}
        />
      )}

      {showAbout && (
        <AboutSheet onClose={() => setShowAbout(false)} />
      )}

      {showSettings && (
        <SettingsSheet
          onClose={() => setShowSettings(false)}
          onOpenLanguage={() => { setShowSettings(false); setShowLanguage(true); }}
        />
      )}

      {showLanguage && (
        <LanguageSheet
          onClose={() => { setShowLanguage(false); setShowSettings(true); }}
        />
      )}

      <TabBar activeTab={stampTestActive ? 'passport' : activeTab} onTabChange={handleTabChange} />
    </>
  );
}

export default App;
