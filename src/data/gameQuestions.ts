// Generación de preguntas para el juego — Tipo A (texto→mapa: localizar país)
import type { CountryData } from './types';

/** Pregunta de tipo A: el usuario debe localizar un país en el globo */
export interface GameQuestion {
  type: 'A';
  /** Código cca2 del país objetivo */
  targetCca2: string;
  /** Texto que se muestra al usuario (nombre del país) */
  prompt: string;
}

/**
 * Genera una lista de preguntas barajada a partir de los códigos de países del nivel.
 * Evita repetición inmediata si se proporciona `lastAskedCca2`.
 */
export function generateQuestions(
  levelCountries: string[],
  countries: Map<string, CountryData>,
  lastAskedCca2?: string,
): GameQuestion[] {
  // Barajar (Fisher-Yates)
  const shuffled = [...levelCountries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Evitar que la primera pregunta repita la última del ciclo anterior
  if (lastAskedCca2 && shuffled[0] === lastAskedCca2 && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  return shuffled.map((cca2) => ({
    type: 'A' as const,
    targetCca2: cca2,
    prompt: countries.get(cca2)?.name ?? cca2,
  }));
}
