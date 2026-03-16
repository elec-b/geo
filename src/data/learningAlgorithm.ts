// Algoritmo de aprendizaje v3 — funciones puras, sin estado ni side effects
// Implementa: etapas individuales por país, cola de prioridad, avance colectivo,
// inferencia ascendente, progreso ponderado, herencia entre niveles y país compañero.
import type { Continent, GameLevel, QuestionType } from './types';
import type { AttemptRecord, CountryAttempts } from '../stores/types';

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

const ALL_TYPES: QuestionType[] = ['E', 'C', 'D', 'F', 'A', 'B'];

// --- Funciones internas ---

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
 * Anti-repetición: evita tipos preguntados recientemente cuando hay empate.
 */
function selectTypeForCountry(
  ca: CountryAttempts,
  stage: 1 | 2 | 3,
  recentTypes?: QuestionType[],
): QuestionType {
  const types = STAGE_TYPES[stage];

  // Filtrar tipos no dominados
  const notDominated = types.filter((t) => {
    const rec = ca[t];
    return !rec || rec.streak < MASTERY_STREAK;
  });

  const candidates = notDominated.length > 0 ? notDominated : types;

  // Encontrar la peor racha entre candidatos
  let worstStreak = Infinity;
  for (const t of candidates) {
    const streak = ca[t]?.streak ?? 0;
    if (streak < worstStreak) worstStreak = streak;
  }

  // Desempate: preferir tipos no recientes para garantizar cobertura
  const tied = candidates.filter((t) => (ca[t]?.streak ?? 0) === worstStreak);
  if (recentTypes && recentTypes.length > 0 && tied.length > 1) {
    const recentSet = new Set(recentTypes);
    const fresh = tied.filter((t) => !recentSet.has(t));
    if (fresh.length > 0) {
      return fresh[Math.floor(Math.random() * fresh.length)];
    }
  }
  return tied[Math.floor(Math.random() * tied.length)];
}

/** Precisión histórica de un país (para elegir compañero) */
function getCountryAccuracy(ca: CountryAttempts | undefined): number {
  if (!ca) return 1;
  let c = 0, t = 0;
  for (const type of ALL_TYPES) {
    const rec = ca[type];
    if (rec) { c += rec.correct; t += rec.correct + rec.incorrect; }
  }
  return t > 0 ? c / t : 1;
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
 * ¿Un país domina un tipo por intento directo (sin inferencia ascendente)?
 * Útil para distinguir ✓ verde (directo) de ✓ gris (inferido) en estadísticas.
 */
export function isDirectlyDominated(ca: CountryAttempts | undefined, type: QuestionType): boolean {
  if (!ca) return false;
  const rec = ca[type];
  return !!rec && rec.streak >= MASTERY_STREAK;
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
    if (stage2Types.some((t) => isDominated(ca, t))) {
      baseStage = 3;
    }
  }

  // Aplicar regresión
  return applyRegression(ca, baseStage);
}

/**
 * Calcula las etapas efectivas de todos los países, aplicando avance colectivo.
 * Avance colectivo: si ≥ 40% de países (mín 3) dominan una etapa,
 * los países sin datos avanzan a la siguiente etapa.
 * Los países heredados no cuentan para el umbral.
 */
export function getEffectiveStages(
  allAttempts: Record<string, CountryAttempts>,
  countries: string[],
  inheritedCountries?: Map<string, Set<QuestionType>>,
): Map<string, 1 | 2 | 3> {
  const stages = new Map<string, 1 | 2 | 3>();

  // Calcular etapas individuales
  for (const cca2 of countries) {
    stages.set(cca2, getCountryStage(allAttempts[cca2]));
  }

  // Avance colectivo: evaluar si hay suficiente dominio grupal
  // Los heredados no cuentan para el umbral
  const ownCountries = inheritedCountries
    ? countries.filter((cca2) => !inheritedCountries.has(cca2))
    : countries;
  const total = ownCountries.length;
  const minCount = Math.max(COLLECTIVE_ADVANCE_MIN, Math.ceil(total * COLLECTIVE_ADVANCE_RATIO));

  // Contar cuántos países (propios) dominan cada etapa
  const dominateStage1 = ownCountries.filter((cca2) => (stages.get(cca2) ?? 1) >= 2).length;
  const dominateStage2 = ownCountries.filter((cca2) => (stages.get(cca2) ?? 1) >= 3).length;

  // Avance colectivo de etapa 1 → 2
  if (dominateStage1 >= minCount) {
    for (const cca2 of countries) {
      if (stages.get(cca2) === 1) {
        stages.set(cca2, 2);
      }
    }
  }

  // Avance colectivo de etapa 2 → 3
  if (dominateStage2 >= minCount) {
    for (const cca2 of countries) {
      if (stages.get(cca2) === 2) {
        stages.set(cca2, 3);
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
 * 3. En progreso: países con intentos pero no todos los tipos dominados
 *
 * Países que dominan todos los tipos de su etapa salen del pool.
 * País compañero: si quedan ≤ 2 activos, se intercala un dominado (~50%).
 *
 * Anti-repetición: buffer sobre el pool activo (no sobre todos los países).
 *
 * @param fixedType - Si se especifica, fuerza ese tipo de pregunta (modo tipo concreto)
 * @param recentTypes - Tipos preguntados recientemente (anti-repetición de tipo)
 * @param inheritedCountries - Mapa de país → tipos heredados (sin datos propios)
 */
export function selectNextQuestion(
  allAttempts: Record<string, CountryAttempts>,
  countries: string[],
  recent: string[],
  fixedType?: QuestionType,
  recentTypes?: QuestionType[],
  inheritedCountries?: Map<string, Set<QuestionType>>,
): QuestionSelection | null {
  if (countries.length === 0) return null;

  // Calcular etapas efectivas (antes del buffer para determinar pool activo)
  const stages = getEffectiveStages(allAttempts, countries, inheritedCountries);

  // Determinar pool activo (países no dominados en su etapa/tipo)
  const isActive = (cca2: string): boolean => {
    const ca = allAttempts[cca2];
    if (fixedType) return !isDominated(ca, fixedType);
    const stage = stages.get(cca2) ?? 1;
    return !STAGE_TYPES[stage].every((t) => isDominated(ca, t));
  };

  const activeCount = countries.filter(isActive).length;

  // Buffer de anti-repetición basado en pool activo
  const bufferSize = Math.min(3, Math.floor(activeCount / 2));
  const recentSet = new Set(recent.slice(-bufferSize));

  // Clasificar países en categorías
  const reinforcement: string[] = [];
  const fresh: string[] = [];
  const inProgress: string[] = [];
  const dominated: string[] = []; // para compañero

  for (const cca2 of countries) {
    // Filtrar países recientes
    if (recentSet.has(cca2)) continue;

    const ca = allAttempts[cca2];
    const stage = stages.get(cca2) ?? 1;

    if (fixedType) {
      // Modo tipo concreto: clasificar según el tipo fijo
      if (isDominated(ca, fixedType)) {
        dominated.push(cca2);
      } else if (!ca || !ca[fixedType]) {
        fresh.push(cca2);
      } else if (ca[fixedType]!.streak < 0) {
        reinforcement.push(cca2);
      } else {
        inProgress.push(cca2);
      }
    } else {
      // Modo aventura: clasificar según la etapa
      const stageTypes = STAGE_TYPES[stage];

      if (stageTypes.every((t) => isDominated(ca, t))) {
        dominated.push(cca2);
      } else if (!ca || stageTypes.every((t) => !ca[t])) {
        fresh.push(cca2);
      } else if (stageTypes.some((t) => { const r = ca[t]; return r && r.streak < 0; })) {
        reinforcement.push(cca2);
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

  // País compañero: si quedan pocos activos, intercalar un dominado
  if (selectedCca2 && reinforcement.length + fresh.length + inProgress.length <= 2
      && dominated.length > 0 && Math.random() < 0.5) {
    // Elegir el de peor precisión entre dominados
    let worst = dominated[0];
    let worstAcc = getCountryAccuracy(allAttempts[worst]);
    for (let i = 1; i < dominated.length; i++) {
      const acc = getCountryAccuracy(allAttempts[dominated[i]]);
      if (acc < worstAcc) { worst = dominated[i]; worstAcc = acc; }
    }
    selectedCca2 = worst;
  }

  // Fallback: si ninguna categoría tiene candidatos
  if (!selectedCca2) {
    // Intentar relajando el buffer solo sobre el pool activo
    const activePool = countries.filter(isActive);
    if (activePool.length > 0) {
      selectedCca2 = activePool[Math.floor(Math.random() * activePool.length)];
    } else {
      // Pool agotado: todos dominados → null
      return null;
    }
  }

  // Determinar tipo de pregunta
  let questionType: QuestionType;
  if (fixedType) {
    questionType = fixedType;
  } else {
    const ca = allAttempts[selectedCca2] ?? {};
    const stage = stages.get(selectedCca2) ?? 1;
    questionType = selectTypeForCountry(ca, stage, recentTypes);
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
 * Convierte la racha de un tipo en un factor continuo [0, 1].
 * Permite crédito gradual antes de alcanzar dominio (streak ≥ 1).
 */
function streakToFactor(rec: AttemptRecord | undefined): number {
  if (!rec) return 0;
  if (rec.streak >= 1) return 1.0;
  if (rec.streak === 0) return 0.5;
  if (rec.streak === -1) return 0.25;
  return 0; // streak ≤ -2
}

/**
 * Factor de progreso para un tipo, considerando inferencia ascendente.
 * Si hay registro directo, usa su racha. Si no, aplica inferencia (A→E, B→C/D/F).
 * Esto garantiza que países heredados (solo A/B sintéticos) y países con tipos
 * inferidos reciban crédito completo en la barra de progreso.
 */
function inferredStreakFactor(ca: CountryAttempts | undefined, type: QuestionType): number {
  if (!ca) return 0;
  const rec = ca[type];
  if (rec) return streakToFactor(rec);
  // Inferencia ascendente: A dominado → E inferido; B dominado → C/D/F inferidos
  if (type === 'E' && ca.A && ca.A.streak >= MASTERY_STREAK) return 1.0;
  if ((type === 'C' || type === 'D' || type === 'F') && ca.B && ca.B.streak >= MASTERY_STREAK) return 1.0;
  return 0;
}

/**
 * Calcula el progreso.
 * - Aventura: progreso ponderado (0-100%) según avance por país con crédito gradual.
 * - Tipo concreto: países que dominan ese tipo (X de Y).
 */
export function calculateProgress(
  attempts: Record<string, CountryAttempts>,
  levelCountries: string[],
  mode: QuestionType | 'adventure',
  inheritedCountries?: Map<string, Set<QuestionType>>,
): ProgressResult {
  const total = levelCountries.length;
  if (total === 0) return { current: 0, total: 0 };

  if (mode === 'adventure') {
    // Progreso gradual: cada acierto/fallo mueve la barra
    const stages = getEffectiveStages(attempts, levelCountries, inheritedCountries);
    let sum = 0;
    for (const cca2 of levelCountries) {
      const ca = attempts[cca2];

      // Crédito gradual por racha de cada tipo (con inferencia: A→E, B→C/D/F)
      const fE = inferredStreakFactor(ca, 'E');
      const fCDF = Math.max(inferredStreakFactor(ca, 'C'), inferredStreakFactor(ca, 'D'), inferredStreakFactor(ca, 'F'));
      const fA = inferredStreakFactor(ca, 'A');
      const fB = inferredStreakFactor(ca, 'B');
      let credit = fE * 20 + fCDF * 30 + fA * 25 + fB * 25;

      // Floor por avance colectivo (países sin datos propios o con crédito inferior)
      const stage = stages.get(cca2) ?? 1;
      const collectiveFloor = stage >= 3 ? 50 : stage >= 2 ? 20 : 0;
      credit = Math.max(credit, collectiveFloor);

      sum += credit;
    }
    return { current: Math.round((sum / total) * 10) / 10, total: 100 };
  }

  // Tipo concreto: domina ese tipo
  let current = 0;
  for (const cca2 of levelCountries) {
    const ca = attempts[cca2];
    if (isDominated(ca, mode)) {
      current++;
    }
  }
  return { current, total };
}

/**
 * ¿El usuario está listo para las pruebas de sello?
 * 100% de países dominan A y B.
 */
export function isReadyForStamp(
  attempts: Record<string, CountryAttempts>,
  levelCountries: string[],
): boolean {
  if (levelCountries.length === 0) return false;
  return levelCountries.every((cca2) => {
    const ca = attempts[cca2];
    return isDominated(ca, 'A') && isDominated(ca, 'B');
  });
}

/**
 * ¿Todos los países dominan un tipo concreto?
 */
export function isTypeFullyDominated(
  attempts: Record<string, CountryAttempts>,
  levelCountries: string[],
  type: QuestionType,
): boolean {
  if (levelCountries.length === 0) return false;
  return levelCountries.every((cca2) => isDominated(attempts[cca2], type));
}

/**
 * Sugiere el siguiente tipo de juego tras dominar uno concreto.
 * Busca el siguiente tipo no dominado al 100% en orden pedagógico (E → C/D/F → A/B).
 * Dentro de la misma etapa, prioriza el de menos progreso.
 */
export function getNextSuggestedType(
  attempts: Record<string, CountryAttempts>,
  levelCountries: string[],
  currentType: QuestionType,
): QuestionType | null {
  const stageOrder: QuestionType[][] = [['E'], ['C', 'D', 'F'], ['A', 'B']];

  for (const stageTypes of stageOrder) {
    const candidates = stageTypes.filter((t) =>
      t !== currentType && !isTypeFullyDominated(attempts, levelCountries, t),
    );
    if (candidates.length === 0) continue;
    if (candidates.length === 1) return candidates[0];
    // Priorizar el de menos progreso (menos países dominados)
    let best = candidates[0];
    let bestCount = Infinity;
    for (const t of candidates) {
      let count = 0;
      for (const cca2 of levelCountries) {
        if (isDominated(attempts[cca2], t)) count++;
      }
      if (count < bestCount) { bestCount = count; best = t; }
    }
    return best;
  }
  return null;
}

// --- Herencia entre niveles ---

/**
 * Calcula los intentos efectivos aplicando herencia del nivel anterior.
 * Si ambos sellos del nivel anterior están ganados, los países que dominan A y B
 * se heredan como {A: streak:1, B: streak:1}. Datos propios sobrescriben.
 * Herencia transitiva: guía ← mochilero ← turista.
 */
export function getAttemptsWithInheritance(
  ownAttempts: Record<string, CountryAttempts>,
  level: GameLevel,
  continent: Continent,
  getStampsForLevel: (level: GameLevel, continent: Continent) => { countries: boolean; capitals: boolean },
  getAttemptsForLevel: (level: GameLevel, continent: Continent) => Record<string, CountryAttempts>,
): Record<string, CountryAttempts> {
  if (level === 'turista') return ownAttempts;

  const prevLevel: GameLevel = level === 'guía' ? 'mochilero' : 'turista';
  const prevStamps = getStampsForLevel(prevLevel, continent);
  if (!prevStamps.countries || !prevStamps.capitals) return ownAttempts;

  // Obtener datos del nivel anterior (con herencia transitiva)
  const prevOwn = getAttemptsForLevel(prevLevel, continent);
  const prevAttempts = getAttemptsWithInheritance(
    prevOwn, prevLevel, continent, getStampsForLevel, getAttemptsForLevel,
  );

  const merged: Record<string, CountryAttempts> = {};

  // Copiar herencia: E del sello de países, C/D/F del sello de capitales
  // A y B nunca se heredan — deben jugarse en cada nivel
  for (const [cca2, ca] of Object.entries(prevAttempts)) {
    if (isDominated(ca, 'A') && isDominated(ca, 'B')) {
      merged[cca2] = {
        E: { correct: 0, incorrect: 0, streak: 1 },
        C: { correct: 0, incorrect: 0, streak: 1 },
        D: { correct: 0, incorrect: 0, streak: 1 },
        F: { correct: 0, incorrect: 0, streak: 1 },
      };
    }
  }

  // Datos propios sobrescriben (tipo por tipo)
  for (const [cca2, ca] of Object.entries(ownAttempts)) {
    if (!merged[cca2]) {
      merged[cca2] = ca;
    } else {
      merged[cca2] = { ...merged[cca2] };
      for (const t of ALL_TYPES) {
        if (ca[t]) {
          (merged[cca2] as Record<string, unknown>)[t] = ca[t];
        }
      }
    }
  }

  return merged;
}

/**
 * ¿Un país tiene datos heredados pero no propios?
 */
export function isInherited(
  cca2: string,
  ownAttempts: Record<string, CountryAttempts>,
  mergedAttempts: Record<string, CountryAttempts>,
): boolean {
  return !ownAttempts[cca2] && !!mergedAttempts[cca2];
}

/**
 * Para un país, devuelve los tipos que tienen datos heredados pero NO propios.
 * Útil para saber qué tipos necesitan verificación en el nuevo nivel.
 */
export function getInheritedTypes(
  cca2: string,
  ownAttempts: Record<string, CountryAttempts>,
  mergedAttempts: Record<string, CountryAttempts>,
): Set<QuestionType> {
  const result = new Set<QuestionType>();
  const merged = mergedAttempts[cca2];
  if (!merged) return result;
  const own = ownAttempts[cca2];
  for (const t of ALL_TYPES) {
    if (merged[t] && (!own || !own[t])) {
      result.add(t);
    }
  }
  return result;
}

// --- Niveles y sellos ---

const LEVELS_ORDER: GameLevel[] = ['turista', 'mochilero', 'guía'];
const ALL_CONTINENTS: Continent[] = ['África', 'América', 'Asia', 'Europa', 'Oceanía'];

/** Tipo de los sellos por nivel×continente */
export type StampsData = Record<GameLevel, Record<Continent, { countries: boolean; capitals: boolean }>>;

/**
 * ¿Un nivel está desbloqueado para un continente?
 * Turista siempre desbloqueado. Mochilero requiere ambos sellos de Turista. Guía requiere ambos de Mochilero.
 */
export function isLevelUnlocked(
  level: GameLevel,
  continent: Continent,
  stamps: StampsData,
): boolean {
  if (level === 'turista') return true;
  const prevLevel = level === 'mochilero' ? 'turista' : 'mochilero';
  const prev = stamps[prevLevel][continent];
  return prev.countries && prev.capitals;
}

/**
 * Calcula el nivel alcanzado en un continente (el más alto con ambos sellos ganados).
 * Devuelve null si no tiene ni siquiera Turista completado.
 */
export function getContinentLevel(
  continent: Continent,
  stamps: StampsData,
): GameLevel | null {
  let highest: GameLevel | null = null;
  for (const level of LEVELS_ORDER) {
    const s = stamps[level][continent];
    if (s.countries && s.capitals) {
      highest = level;
    } else {
      break; // sin sellos en este nivel → no puede tener los siguientes
    }
  }
  return highest;
}

/**
 * Nivel global = mínimo de los 5 continentes.
 * Devuelve null si algún continente no tiene ni Turista completado.
 */
export function getGlobalLevel(stamps: StampsData): GameLevel | null {
  let minIdx = LEVELS_ORDER.length; // empezar alto

  for (const continent of ALL_CONTINENTS) {
    const cl = getContinentLevel(continent, stamps);
    if (cl === null) return null; // algún continente sin completar → sin nivel global
    const idx = LEVELS_ORDER.indexOf(cl);
    if (idx < minIdx) minIdx = idx;
  }

  return minIdx < LEVELS_ORDER.length ? LEVELS_ORDER[minIdx] : null;
}
