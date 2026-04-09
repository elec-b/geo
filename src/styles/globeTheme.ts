// Colores del globo Canvas 2D — separados porque el canvas no lee CSS variables
export interface GlobeThemeColors {
  ocean: string;
  countryFill: string;
  countryHover: string;
  border: string;
  atmosphere: string;
  capitalPin: string;
  capitalPinNonUn: string;
  label: string;
  labelNonUn: string;
  labelCapital: string;
  labelCapitalNonUn: string;
  labelShadow: string;
  /** RGB sin alpha, para componer rgba() dinámicamente */
  seaLabelRgb: string;
  /** RGB sin alpha, para componer rgba() dinámicamente */
  markerRgb: string;
  // Highlights de países
  selected: string;
  correct: string;
  incorrect: string;
  correction: string;
  /** Pin de capital destacado en juego (sobre país coloreado) */
  capitalPinHighlight: string;
  /** País dimmed (filtro continente activo) — color sólido, no alpha */
  countryDimmed: string;
  /** Hull de archipiélago seleccionado — dorado destacado */
  selectedHull: string;
}

const DARK_GLOBE: GlobeThemeColors = {
  ocean: '#060a12',
  countryFill: '#222630',
  countryHover: '#1a1e26',
  border: 'rgba(255, 255, 255, 0.25)',
  atmosphere: 'rgba(100, 150, 220, 0.06)',
  capitalPin: 'rgba(200, 200, 200, 0.7)',
  capitalPinNonUn: 'rgba(255, 180, 50, 0.7)',
  label: 'rgba(255, 255, 255, 0.8)',
  labelNonUn: 'rgba(255, 180, 50, 0.6)',
  labelCapital: 'rgba(170, 170, 180, 0.75)',
  labelCapitalNonUn: 'rgba(255, 180, 50, 0.5)',
  labelShadow: 'rgba(0, 0, 0, 0.7)',
  seaLabelRgb: '120, 160, 210',
  markerRgb: '255, 255, 255',
  selected: '#909098',
  correct: '#3d8a6a',
  incorrect: '#a05050',
  correction: '#a08850',
  capitalPinHighlight: 'rgba(210, 210, 210, 0.85)',
  countryDimmed: '#131620',
  selectedHull: 'rgba(210, 180, 100, 0.7)',
};

const LIGHT_GLOBE: GlobeThemeColors = {
  ocean: '#6b9fd4',
  countryFill: '#d4ccb4',
  countryHover: '#c8c0a8',
  border: 'rgba(90, 70, 40, 0.4)',
  atmosphere: 'rgba(100, 150, 220, 0.10)',
  capitalPin: 'rgba(90, 90, 90, 0.75)',
  capitalPinNonUn: 'rgba(160, 100, 10, 0.75)',
  label: 'rgba(40, 35, 25, 0.85)',
  labelNonUn: 'rgba(160, 100, 20, 0.7)',
  labelCapital: 'rgba(70, 60, 40, 0.7)',
  labelCapitalNonUn: 'rgba(160, 100, 20, 0.6)',
  labelShadow: 'rgba(245, 240, 230, 0.7)',
  seaLabelRgb: '15, 35, 80',
  markerRgb: '60, 45, 20',
  selected: '#c49a4c',
  correct: '#3a9a5c',
  incorrect: '#c44040',
  correction: '#b8922e',
  capitalPinHighlight: 'rgba(80, 80, 80, 0.85)',
  countryDimmed: '#9ab4c8',
  selectedHull: 'rgba(160, 120, 30, 0.7)',
};

export function getGlobeTheme(theme: 'dark' | 'light'): GlobeThemeColors {
  return theme === 'light' ? LIGHT_GLOBE : DARK_GLOBE;
}
