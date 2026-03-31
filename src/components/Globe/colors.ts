// Colores de highlight de países en el globo
// Importar getGlobeTheme para acceso theme-aware
import { getGlobeTheme } from '../../styles/globeTheme';

/** Retorna los colores de highlight según el tema activo */
export function getHighlightColors(theme: 'dark' | 'light') {
  const gt = getGlobeTheme(theme);
  return {
    selected: gt.selected,
    correct: gt.correct,
    incorrect: gt.incorrect,
    correction: gt.correction,
    capitalPinHighlight: gt.capitalPinHighlight,
  };
}
