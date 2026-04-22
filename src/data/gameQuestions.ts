// Generación de preguntas para el juego — Tipos A-F
import type { TFunction } from 'i18next';
import type { CountryData, CapitalCoords } from './types';
import type { QuestionSelection } from './learningAlgorithm';

// --- Tipos de pregunta (union discriminada) ---

/** Tipos A/B: el usuario toca un país en el globo */
interface GameQuestionMap {
  type: 'A' | 'B';
  targetCca2: string;
  prompt: string;
}

/** Tipos C-F: el usuario elige entre 4 opciones de texto */
export interface GameQuestionChoice {
  type: 'C' | 'D' | 'E' | 'F';
  targetCca2: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export type GameQuestion = GameQuestionMap | GameQuestionChoice;

// --- Utilidades ---

/** Barajado Fisher-Yates in-place */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Selecciona `n` distractores de `candidates`, excluyendo `correct`.
 * Devuelve las 4 opciones (correcta + distractores) barajadas.
 */
export function pickOptions(candidates: string[], correct: string, n = 3): string[] {
  const filtered = candidates.filter((c) => c !== correct);
  shuffle(filtered);
  const distractors = filtered.slice(0, n);
  return shuffle([correct, ...distractors]);
}

// --- Generadores por tipo ---

/** Tipo A: "Localiza [país]" → el usuario toca en el globo */
export function generateQuestionsTypeA(
  levelCountries: string[],
  countries: Map<string, CountryData>,
): GameQuestion[] {
  return levelCountries.map((cca2) => ({
    type: 'A' as const,
    targetCca2: cca2,
    prompt: countries.get(cca2)?.name ?? cca2,
  }));
}

/** Tipo B: "Localiza la capital [capital]" → el usuario toca en el globo */
export function generateQuestionsTypeB(
  levelCountries: string[],
  capitals: Map<string, CapitalCoords>,
): GameQuestion[] {
  // Excluye países sin nombre de capital en el idioma activo (evita banner vacío).
  return levelCountries
    .filter((cca2) => !!capitals.get(cca2)?.name)
    .map((cca2) => ({
      type: 'B' as const,
      targetCca2: cca2,
      prompt: capitals.get(cca2)!.name,
    }));
}

/** Tipo C: "¿Cuál es la capital de X?" → 4 opciones (capitales) */
export function generateQuestionsTypeC(
  levelCountries: string[],
  countries: Map<string, CountryData>,
  distractorPool?: string[],
  t?: TFunction,
): GameQuestion[] {
  // Recoger las capitales del pool de distractores (todos los países del nivel)
  const allCapitals = (distractorPool ?? levelCountries)
    .map((cca2) => countries.get(cca2)?.capital)
    .filter((c): c is string => !!c);

  return levelCountries
    .filter((cca2) => countries.get(cca2)?.capital)
    .map((cca2) => {
      const country = countries.get(cca2)!;
      return {
        type: 'C' as const,
        targetCca2: cca2,
        prompt: t ? t('game:question.capitalOf', { country: country.name }) : `What is the capital of ${country.name}?`,
        options: pickOptions(allCapitals, country.capital),
        correctAnswer: country.capital,
      };
    });
}

/** Tipo D: "[Capital] es la capital de..." → 4 opciones (países) */
export function generateQuestionsTypeD(
  levelCountries: string[],
  countries: Map<string, CountryData>,
  distractorPool?: string[],
  t?: TFunction,
): GameQuestion[] {
  const allNames = (distractorPool ?? levelCountries)
    .map((cca2) => countries.get(cca2)?.name)
    .filter((n): n is string => !!n);

  return levelCountries
    .filter((cca2) => countries.get(cca2)?.capital)
    .map((cca2) => {
      const country = countries.get(cca2)!;
      return {
        type: 'D' as const,
        targetCca2: cca2,
        prompt: t ? t('game:question.capitalBelongsTo', { capital: country.capital }) : `${country.capital} is the capital of...`,
        options: pickOptions(allNames, country.name),
        correctAnswer: country.name,
      };
    });
}

/** Tipo E: "¿Qué país está resaltado?" → 4 opciones (países). El globo resalta el país. */
export function generateQuestionsTypeE(
  levelCountries: string[],
  countries: Map<string, CountryData>,
  distractorPool?: string[],
  t?: TFunction,
): GameQuestion[] {
  const allNames = (distractorPool ?? levelCountries)
    .map((cca2) => countries.get(cca2)?.name)
    .filter((n): n is string => !!n);

  return levelCountries.map((cca2) => {
    const country = countries.get(cca2)!;
    return {
      type: 'E' as const,
      targetCca2: cca2,
      prompt: t ? t('game:question.whichCountry') : 'Which country is highlighted?',
      options: pickOptions(allNames, country.name),
      correctAnswer: country.name,
    };
  });
}

/** Tipo F: "¿Cuál es la capital de este país?" → 4 opciones (capitales). El globo resalta el país. */
export function generateQuestionsTypeF(
  levelCountries: string[],
  countries: Map<string, CountryData>,
  distractorPool?: string[],
  t?: TFunction,
): GameQuestion[] {
  const allCapitals = (distractorPool ?? levelCountries)
    .map((cca2) => countries.get(cca2)?.capital)
    .filter((c): c is string => !!c);

  return levelCountries
    .filter((cca2) => countries.get(cca2)?.capital)
    .map((cca2) => {
      const country = countries.get(cca2)!;
      return {
        type: 'F' as const,
        targetCca2: cca2,
        prompt: t ? t('game:question.whichCapital') : 'What is the capital of this country?',
        options: pickOptions(allCapitals, country.capital),
        correctAnswer: country.capital,
      };
    });
}

/** Filtro de tipo de pregunta para el selector provisional */
export type QuestionTypeFilter = 'mixed' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/**
 * Genera preguntas de un tipo específico, barajadas.
 * Dispatcher que delega al generador correspondiente.
 */
export function generateQuestionsByType(
  type: Exclude<QuestionTypeFilter, 'mixed'>,
  levelCountries: string[],
  countries: Map<string, CountryData>,
  capitals: Map<string, CapitalCoords>,
  lastAskedCca2?: string,
  distractorPool?: string[],
  t?: TFunction,
): GameQuestion[] {
  let questions: GameQuestion[];
  const pool = distractorPool ?? levelCountries;

  switch (type) {
    case 'A':
      questions = generateQuestionsTypeA(levelCountries, countries);
      break;
    case 'B':
      questions = generateQuestionsTypeB(levelCountries, capitals);
      break;
    case 'C':
      questions = generateQuestionsTypeC(levelCountries, countries, pool, t);
      break;
    case 'D':
      questions = generateQuestionsTypeD(levelCountries, countries, pool, t);
      break;
    case 'E':
      questions = generateQuestionsTypeE(levelCountries, countries, pool, t);
      break;
    case 'F':
      questions = generateQuestionsTypeF(levelCountries, countries, pool, t);
      break;
  }

  shuffle(questions);

  // Evitar que la primera pregunta repita la última del ciclo anterior
  if (lastAskedCca2 && questions[0]?.targetCca2 === lastAskedCca2 && questions.length > 1) {
    [questions[0], questions[1]] = [questions[1], questions[0]];
  }

  return questions;
}

/**
 * Genera UNA pregunta para un país y tipo específicos (seleccionados por el algoritmo).
 * Los distractores se eligen del mismo nivel (levelCountries).
 * Devuelve null si no se puede generar (ej: tipo B sin capital).
 */
export function generateSingleQuestion(
  selection: QuestionSelection,
  levelCountries: string[],
  countries: Map<string, CountryData>,
  capitals: Map<string, CapitalCoords>,
  t?: TFunction,
): GameQuestion | null {
  const { cca2, questionType } = selection;
  const country = countries.get(cca2);
  if (!country) return null;

  // Datos auxiliares para distractores
  const allCapitals = levelCountries
    .map((c) => countries.get(c)?.capital)
    .filter((c): c is string => !!c);
  const allNames = levelCountries
    .map((c) => countries.get(c)?.name)
    .filter((n): n is string => !!n);

  switch (questionType) {
    case 'A':
      return { type: 'A', targetCca2: cca2, prompt: country.name };

    case 'B':
      if (!capitals.get(cca2)?.name) return null;
      return { type: 'B', targetCca2: cca2, prompt: capitals.get(cca2)!.name };

    case 'C':
      if (!country.capital || allCapitals.length < 4) return null;
      return {
        type: 'C', targetCca2: cca2,
        prompt: t ? t('game:question.capitalOf', { country: country.name }) : `What is the capital of ${country.name}?`,
        options: pickOptions(allCapitals, country.capital),
        correctAnswer: country.capital,
      };

    case 'D':
      if (!country.capital || allNames.length < 4) return null;
      return {
        type: 'D', targetCca2: cca2,
        prompt: t ? t('game:question.capitalBelongsTo', { capital: country.capital }) : `${country.capital} is the capital of...`,
        options: pickOptions(allNames, country.name),
        correctAnswer: country.name,
      };

    case 'E':
      if (allNames.length < 4) return null;
      return {
        type: 'E', targetCca2: cca2,
        prompt: t ? t('game:question.whichCountry') : 'Which country is highlighted?',
        options: pickOptions(allNames, country.name),
        correctAnswer: country.name,
      };

    case 'F':
      if (!country.capital || allCapitals.length < 4) return null;
      return {
        type: 'F', targetCca2: cca2,
        prompt: t ? t('game:question.whichCapital') : 'What is the capital of this country?',
        options: pickOptions(allCapitals, country.capital),
        correctAnswer: country.capital,
      };
  }
}
