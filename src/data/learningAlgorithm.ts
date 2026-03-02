// Algoritmo de aprendizaje — funciones puras sin estado ni side effects
import type { QuestionType } from './types';
import type { AttemptRecord, CountryAttempts } from '../stores/types';

// --- Constantes ---

/** Peso de cada tipo para el cálculo de progreso general (modo Aventura) */
const TYPE_PROGRESS_WEIGHT: Record<QuestionType, number> = {
  E: 0.10, C: 0.12, D: 0.12, F: 0.16, A: 0.25, B: 0.25,
};

/** Pesos iniciales de selección de tipo (sesgo hacia E) */
const INITIAL_TYPE_WEIGHTS: Record<QuestionType, number> = {
  E: 0.35, C: 0.18, D: 0.18, F: 0.14, A: 0.08, B: 0.07,
};

/** Pesos finales de selección de tipo (sesgo hacia A/B) */
const FINAL_TYPE_WEIGHTS: Record<QuestionType, number> = {
  E: 0.08, C: 0.10, D: 0.10, F: 0.12, A: 0.30, B: 0.30,
};

/** Streak mínimo para considerar un país-tipo dominado */
const MASTERY_STREAK = 2;

/** Multiplicador máximo para refuerzo de tipos con baja mastery */
const REINFORCEMENT_FACTOR = 2.5;

/** Umbral de progreso para considerar "listo para sello" */
const READINESS_THRESHOLD = 0.85;

const ALL_TYPES: QuestionType[] = ['E', 'C', 'D', 'F', 'A', 'B'];

// --- Funciones ---

/**
 * Dominio de un país en un tipo concreto (0-1).
 * streak ≥ 2 → dominado (1.0). streak = 1 → 0.6. streak = 0 con intentos → ratio × 0.4.
 */
export function countryTypeMastery(record?: AttemptRecord): number {
  if (!record || (record.correct === 0 && record.incorrect === 0)) return 0;

  if (record.streak >= MASTERY_STREAK) return 1.0;
  if (record.streak === 1) return 0.6;

  // streak = 0 con intentos: ratio de aciertos × 0.4 (máx 0.4)
  const total = record.correct + record.incorrect;
  const ratio = total > 0 ? record.correct / total : 0;
  return ratio * 0.4;
}

/**
 * Progreso general (0-1).
 * - Modo tipo concreto: promedio de mastery del tipo para todos los países.
 * - Modo aventura: promedio ponderado de todos los tipos × todos los países.
 */
export function calculateProgress(
  attempts: Record<string, CountryAttempts>,
  levelCountries: string[],
  mode: QuestionType | 'adventure',
): number {
  if (levelCountries.length === 0) return 0;

  if (mode !== 'adventure') {
    // Modo tipo concreto: promedio de mastery para ese tipo
    let sum = 0;
    for (const cca2 of levelCountries) {
      sum += countryTypeMastery(attempts[cca2]?.[mode]);
    }
    return sum / levelCountries.length;
  }

  // Modo aventura: promedio ponderado por tipo y país
  let weightedSum = 0;
  for (const cca2 of levelCountries) {
    const ca = attempts[cca2] ?? {};
    for (const t of ALL_TYPES) {
      weightedSum += countryTypeMastery(ca[t]) * TYPE_PROGRESS_WEIGHT[t];
    }
  }
  return weightedSum / levelCountries.length;
}

/**
 * Calcula pesos de selección de tipo para modo Aventura.
 * Interpola entre INITIAL y FINAL según el progreso, y refuerza tipos con baja mastery.
 */
export function selectTypeWeights(
  attempts: Record<string, CountryAttempts>,
  levelCountries: string[],
): Record<QuestionType, number> {
  const progress = calculateProgress(attempts, levelCountries, 'adventure');

  // Interpolar linealmente entre pesos iniciales y finales
  const weights = {} as Record<QuestionType, number>;
  for (const t of ALL_TYPES) {
    weights[t] = INITIAL_TYPE_WEIGHTS[t] + (FINAL_TYPE_WEIGHTS[t] - INITIAL_TYPE_WEIGHTS[t]) * progress;
  }

  // Refuerzo: amplificar tipos con mastery promedio < 0.5
  for (const t of ALL_TYPES) {
    let typeMasterySum = 0;
    for (const cca2 of levelCountries) {
      typeMasterySum += countryTypeMastery(attempts[cca2]?.[t]);
    }
    const avgMastery = levelCountries.length > 0 ? typeMasterySum / levelCountries.length : 0;

    if (avgMastery < 0.5) {
      // Factor de refuerzo: 1.0 cuando mastery = 0.5, hasta REINFORCEMENT_FACTOR cuando mastery = 0
      const factor = 1 + (REINFORCEMENT_FACTOR - 1) * (1 - avgMastery / 0.5);
      weights[t] *= Math.min(factor, REINFORCEMENT_FACTOR);
    }
  }

  // Normalizar para que sumen 1.0
  const sum = ALL_TYPES.reduce((s, t) => s + weights[t], 0);
  if (sum > 0) {
    for (const t of ALL_TYPES) {
      weights[t] /= sum;
    }
  }

  return weights;
}

/** Selección de tipo por ruleta (roulette wheel selection) */
export function selectWeightedType(weights: Record<QuestionType, number>): QuestionType {
  const r = Math.random();
  let cumulative = 0;
  for (const t of ALL_TYPES) {
    cumulative += weights[t];
    if (r < cumulative) return t;
  }
  // Fallback por errores de redondeo
  return ALL_TYPES[ALL_TYPES.length - 1];
}

/** ¿Progreso ≥ umbral de preparación para sello? */
export function isReadyForStamp(
  attempts: Record<string, CountryAttempts>,
  levelCountries: string[],
): boolean {
  return calculateProgress(attempts, levelCountries, 'adventure') >= READINESS_THRESHOLD;
}
