// Algoritmo de aprendizaje — funciones puras, sin estado ni side effects
// Implementa: etapas individuales por país, cola de prioridad, avance colectivo,
// inferencia ascendente y progreso discreto.
import type { QuestionType } from './types';
import type { CountryAttempts } from '../stores/types';

// --- Constantes ---

/** Tipos de pregunta agrupados por etapa */
const STAGE_TYPES: Record<1 | 2 | 3, QuestionType[]> = {
  1: ['E'],
  2: ['C', 'D', 'F'],
  3: ['A', 'B'],
};

/** Racha mínima para considerar un tipo dominado */
const MASTERY_STREAK = 1;

/** Racha negativa que desencadena regresión de etapa */
const REGRESSION_STREAK = -2;

/** Proporción mínima de países que deben dominar la etapa para avance colectivo */
const COLLECTIVE_ADVANCE_RATIO = 0.40;

/** Número mínimo absoluto de países dominados para avance colectivo */
const COLLECTIVE_ADVANCE_MIN = 3;

/** Precisión global mínima para avance colectivo */
const COLLECTIVE_ADVANCE_ACCURACY = 0.80;

/** Proporción de países que dominan A y B para estar listo para sello */
const STAMP_READINESS_RATIO = 0.80;

const ALL_TYPES: QuestionType[] = ['E', 'C', 'D', 'F', 'A', 'B'];

// --- Funciones internas ---

/**
 * Precisión global (ratio de aciertos) para todos los países con datos.
 */
function getGlobalAccuracy(
  allAttempts: Record<string, CountryAttempts>,
  countries: string[],
): number {
  let totalCorrect = 0;
  let totalAttempts = 0;

  for (const cca2 of countries) {
    const ca = allAttempts[cca2];
    if (!ca) continue;
    for (const t of ALL_TYPES) {
      const rec = ca[t];
      if (!rec) continue;
      totalCorrect += rec.correct;
      totalAttempts += rec.correct + rec.incorrect;
    }
  }

  return totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
}

/**
 * Aplica regresión en cascada: si un tipo tiene racha ≤ REGRESSION_STREAK,
 * el país regresa a la etapa de ese tipo.
 * Devuelve la etapa efectiva tras regresión (puede ser menor que `baseStage`).
 */
function applyRegression(ca: CountryAttempts, baseStage: 1 | 2 | 3): 1 | 2 | 3 {
  let stage = baseStage;

  // Revisar si algún tipo de la etapa actual o inferior tiene regresión
  // Prioridad: revisar de etapa mayor a menor
  if (stage >= 3) {
    for (const t of STAGE_TYPES[3]) {
      const rec = ca[t];
      if (rec && rec.streak <= REGRESSION_STREAK) {
        stage = 2;
        break;
      }
    }
  }
  if (stage >= 2) {
    for (const t of STAGE_TYPES[2]) {
      const rec = ca[t];
      if (rec && rec.streak <= REGRESSION_STREAK) {
        stage = 1;
        break;
      }
    }
  }

  return stage;
}

/**
 * Selecciona el tipo de pregunta para un país en su etapa.
 * Prioriza tipos no dominados; dentro de esos, el de peor racha.
 */
function selectTypeForCountry(ca: CountryAttempts, stage: 1 | 2 | 3): QuestionType {
  const types = STAGE_TYPES[stage];

  // Filtrar tipos no dominados
  const notDominated = types.filter((t) => {
    const rec = ca[t];
    return !rec || rec.streak < MASTERY_STREAK;
  });

  const candidates = notDominated.length > 0 ? notDominated : types;

  // Elegir el de peor racha (más negativo)
  let best = candidates[0];
  let bestStreak = ca[best]?.streak ?? 0;

  for (let i = 1; i < candidates.length; i++) {
    const t = candidates[i];
    const streak = ca[t]?.streak ?? 0;
    if (streak < bestStreak) {
      best = t;
      bestStreak = streak;
    }
  }

  return best;
}

// --- Funciones exportadas ---

/**
 * ¿Un país domina un tipo concreto?
 * Dominio binario: racha ≥ MASTERY_STREAK.
 * Inferencia ascendente: A dominado → E dominado. B dominado → C, D y F dominados.
 */
export function isDominated(ca: CountryAttempts | undefined, type: QuestionType): boolean {
  if (!ca) return false;

  // Dominio directo
  const rec = ca[type];
  if (rec && rec.streak >= MASTERY_STREAK) return true;

  // Inferencia ascendente: A → E
  if (type === 'E') {
    const recA = ca['A'];
    if (recA && recA.streak >= MASTERY_STREAK) return true;
  }

  // Inferencia ascendente: B → C, D, F
  if (type === 'C' || type === 'D' || type === 'F') {
    const recB = ca['B'];
    if (recB && recB.streak >= MASTERY_STREAK) return true;
  }

  return false;
}

/**
 * Etapa individual de un país (1, 2 o 3) basada en su registro de intentos.
 * - Etapa 1: E no dominado
 * - Etapa 2: E dominado, pero C/D/F no todos dominados
 * - Etapa 3: E + C/D/F dominados
 * Con regresión: si un tipo tiene racha ≤ REGRESSION_STREAK, el país baja de etapa.
 */
export function getCountryStage(ca: CountryAttempts | undefined): 1 | 2 | 3 {
  if (!ca) return 1;

  // Calcular etapa base por dominio
  let baseStage: 1 | 2 | 3 = 1;

  if (isDominated(ca, 'E')) {
    baseStage = 2;
    const stage2Types: QuestionType[] = ['C', 'D', 'F'];
    if (stage2Types.every((t) => isDominated(ca, t))) {
      baseStage = 3;
    }
  }

  // Aplicar regresión
  return applyRegression(ca, baseStage);
}

/**
 * Calcula las etapas efectivas de todos los países, aplicando avance colectivo.
 * Avance colectivo: si ≥ 40% de países (mín 3) dominan una etapa y la precisión
 * global es ≥ 80%, los países sin datos avanzan a la siguiente etapa.
 */
export function getEffectiveStages(
  allAttempts: Record<string, CountryAttempts>,
  countries: string[],
): Map<string, 1 | 2 | 3> {
  const stages = new Map<string, 1 | 2 | 3>();

  // Calcular etapas individuales
  for (const cca2 of countries) {
    stages.set(cca2, getCountryStage(allAttempts[cca2]));
  }

  // Avance colectivo: evaluar si hay suficiente dominio grupal
  const globalAccuracy = getGlobalAccuracy(allAttempts, countries);
  if (globalAccuracy < COLLECTIVE_ADVANCE_ACCURACY) return stages;

  const total = countries.length;
  const minCount = Math.max(COLLECTIVE_ADVANCE_MIN, Math.ceil(total * COLLECTIVE_ADVANCE_RATIO));

  // Contar cuántos países dominan cada etapa
  // Un país «domina la etapa N» si su etapa individual es > N
  const dominateStage1 = countries.filter((cca2) => (stages.get(cca2) ?? 1) >= 2).length;
  const dominateStage2 = countries.filter((cca2) => (stages.get(cca2) ?? 1) >= 3).length;

  // Avance colectivo de etapa 1 → 2
  if (dominateStage1 >= minCount) {
    for (const cca2 of countries) {
      if (stages.get(cca2) === 1) {
        // Solo avanzar si no tiene datos (país nuevo) o si su etapa natural es 1
        const ca = allAttempts[cca2];
        if (!ca || Object.keys(ca).length === 0) {
          stages.set(cca2, 2);
        }
      }
    }
  }

  // Avance colectivo de etapa 2 → 3
  if (dominateStage2 >= minCount) {
    for (const cca2 of countries) {
      if (stages.get(cca2) === 2) {
        const ca = allAttempts[cca2];
        if (!ca || Object.keys(ca).length === 0) {
          stages.set(cca2, 3);
        }
      }
    }
  }

  return stages;
}

/**
 * Resultado de la selección de siguiente pregunta.
 */
export interface QuestionSelection {
  cca2: string;
  questionType: QuestionType;
}

/**
 * Selecciona la siguiente pregunta usando una cola de prioridad.
 *
 * Categorías (de mayor a menor prioridad):
 * 1. Refuerzo: países con racha negativa en su etapa actual
 * 2. Nuevos: países sin intentos en ningún tipo de su etapa
 * 3. En progreso: países con intentos pero no todos los tipos de su etapa dominados
 * 4. Mantenimiento: países con todos los tipos de su etapa dominados
 *
 * Anti-repetición: buffer de N países recientes (N = mín(3, total÷2)).
 *
 * @param fixedType - Si se especifica, fuerza ese tipo de pregunta (modo tipo concreto)
 */
export function selectNextQuestion(
  allAttempts: Record<string, CountryAttempts>,
  countries: string[],
  recent: string[],
  fixedType?: QuestionType,
): QuestionSelection | null {
  if (countries.length === 0) return null;

  // Buffer de anti-repetición
  const bufferSize = Math.min(3, Math.floor(countries.length / 2));
  const recentSet = new Set(recent.slice(-bufferSize));

  // Calcular etapas efectivas
  const stages = getEffectiveStages(allAttempts, countries);

  // Clasificar países en categorías
  const reinforcement: string[] = [];
  const fresh: string[] = [];
  const inProgress: string[] = [];
  const maintenance: string[] = [];

  for (const cca2 of countries) {
    // Filtrar países recientes
    if (recentSet.has(cca2)) continue;

    const ca = allAttempts[cca2];
    const stage = stages.get(cca2) ?? 1;

    if (fixedType) {
      // Modo tipo concreto: clasificar según el tipo fijo
      if (!ca || !ca[fixedType]) {
        fresh.push(cca2);
      } else if (isDominated(ca, fixedType)) {
        maintenance.push(cca2);
      } else if (ca[fixedType]!.streak < 0) {
        reinforcement.push(cca2);
      } else {
        inProgress.push(cca2);
      }
    } else {
      // Modo aventura: clasificar según la etapa
      const stageTypes = STAGE_TYPES[stage];

      if (!ca || stageTypes.every((t) => !ca[t])) {
        fresh.push(cca2);
      } else if (stageTypes.some((t) => { const r = ca[t]; return r && r.streak < 0; })) {
        reinforcement.push(cca2);
      } else if (stageTypes.every((t) => isDominated(ca, t))) {
        maintenance.push(cca2);
      } else {
        inProgress.push(cca2);
      }
    }
  }

  // Seleccionar país por prioridad; dentro de cada categoría, aleatorio
  const pick = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

  let selectedCca2: string | undefined;
  if (reinforcement.length > 0) selectedCca2 = pick(reinforcement);
  else if (fresh.length > 0) selectedCca2 = pick(fresh);
  else if (inProgress.length > 0) selectedCca2 = pick(inProgress);
  else if (maintenance.length > 0) selectedCca2 = pick(maintenance);

  // Si todos fueron filtrados por anti-repetición, ignorar el buffer
  if (!selectedCca2) {
    const allCategories = [...reinforcement, ...fresh, ...inProgress, ...maintenance];
    if (allCategories.length === 0) {
      // Todos están en el buffer — elegir cualquiera
      selectedCca2 = countries[Math.floor(Math.random() * countries.length)];
    } else {
      selectedCca2 = pick(allCategories);
    }
  }

  // Determinar tipo de pregunta
  let questionType: QuestionType;
  if (fixedType) {
    questionType = fixedType;
  } else {
    const ca = allAttempts[selectedCca2] ?? {};
    const stage = stages.get(selectedCca2) ?? 1;
    questionType = selectTypeForCountry(ca, stage);
  }

  return { cca2: selectedCca2, questionType };
}

/**
 * Resultado del cálculo de progreso.
 */
export interface ProgressResult {
  current: number;
  total: number;
}

/**
 * Calcula el progreso discreto (X de Y).
 * - Aventura: países que dominan A Y B.
 * - Tipo concreto: países que dominan ese tipo.
 */
export function calculateProgress(
  attempts: Record<string, CountryAttempts>,
  levelCountries: string[],
  mode: QuestionType | 'adventure',
): ProgressResult {
  const total = levelCountries.length;
  if (total === 0) return { current: 0, total: 0 };

  let current = 0;

  if (mode === 'adventure') {
    // Aventura: domina A Y B
    for (const cca2 of levelCountries) {
      const ca = attempts[cca2];
      if (isDominated(ca, 'A') && isDominated(ca, 'B')) {
        current++;
      }
    }
  } else {
    // Tipo concreto: domina ese tipo
    for (const cca2 of levelCountries) {
      const ca = attempts[cca2];
      if (isDominated(ca, mode)) {
        current++;
      }
    }
  }

  return { current, total };
}

/**
 * ¿El usuario está listo para las pruebas de sello?
 * ≥ 80% de países dominan A y B.
 */
export function isReadyForStamp(
  attempts: Record<string, CountryAttempts>,
  levelCountries: string[],
): boolean {
  if (levelCountries.length === 0) return false;

  let dominated = 0;
  for (const cca2 of levelCountries) {
    const ca = attempts[cca2];
    if (isDominated(ca, 'A') && isDominated(ca, 'B')) {
      dominated++;
    }
  }

  return dominated / levelCountries.length >= STAMP_READINESS_RATIO;
}
