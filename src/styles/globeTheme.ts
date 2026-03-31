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
}

const DARK_GLOBE: GlobeThemeColors = {
  ocean: '#060a12',
  countryFill: '#222630',
  countryHover: '#1a1e26',
  border: 'rgba(255, 255, 255, 0.25)',
  atmosphere: 'rgba(100, 150, 220, 0.06)',
  capitalPin: 'rgba(224, 224, 224, 0.5)',
  capitalPinNonUn: 'rgba(255, 180, 50, 0.5)',
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
  capitalPinHighlight: 'rgba(255, 255, 255, 0.85)',
};

const LIGHT_GLOBE: GlobeThemeColors = {
  ocean: '#6b9fd4',
  countryFill: '#d4ccb4',
  countryHover: '#c8c0a8',
  border: 'rgba(90, 70, 40, 0.25)',
  atmosphere: 'rgba(100, 150, 220, 0.10)',
  capitalPin: 'rgba(80, 60, 30, 0.5)',
  capitalPinNonUn: 'rgba(180, 110, 20, 0.5)',
  label: 'rgba(40, 35, 25, 0.85)',
  labelNonUn: 'rgba(160, 100, 20, 0.7)',
  labelCapital: 'rgba(70, 60, 40, 0.7)',
  labelCapitalNonUn: 'rgba(160, 100, 20, 0.6)',
  labelShadow: 'rgba(245, 240, 230, 0.7)',
  seaLabelRgb: '30, 60, 120',
  markerRgb: '80, 65, 35',
  selected: '#c49a4c',
  correct: '#3a9a5c',
  incorrect: '#c44040',
  correction: '#b8922e',
  capitalPinHighlight: 'rgba(60, 45, 20, 0.85)',
};

export function getGlobeTheme(theme: 'dark' | 'light'): GlobeThemeColors {
  return theme === 'light' ? LIGHT_GLOBE : DARK_GLOBE;
}
