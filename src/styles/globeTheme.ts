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
  ocean: '#b8d4f0',
  countryFill: '#e8eaee',
  countryHover: '#d8dce4',
  border: 'rgba(0, 0, 0, 0.18)',
  atmosphere: 'rgba(100, 150, 220, 0.08)',
  capitalPin: 'rgba(60, 60, 70, 0.5)',
  capitalPinNonUn: 'rgba(200, 120, 0, 0.5)',
  label: 'rgba(30, 30, 50, 0.85)',
  labelNonUn: 'rgba(180, 100, 0, 0.7)',
  labelCapital: 'rgba(60, 60, 80, 0.7)',
  labelCapitalNonUn: 'rgba(180, 100, 0, 0.6)',
  labelShadow: 'rgba(255, 255, 255, 0.6)',
  seaLabelRgb: '40, 80, 140',
  markerRgb: '60, 60, 80',
  selected: '#7a7a88',
  correct: '#16a34a',
  incorrect: '#dc2626',
  correction: '#ca8a04',
  capitalPinHighlight: 'rgba(30, 30, 50, 0.85)',
};

export function getGlobeTheme(theme: 'dark' | 'light'): GlobeThemeColors {
  return theme === 'light' ? LIGHT_GLOBE : DARK_GLOBE;
}
