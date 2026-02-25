// Generación de preguntas para el juego — Tipos A-F
import type { CountryData, CapitalCoords } from './types';

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
function pickOptions(candidates: string[], correct: string, n = 3): string[] {
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
  return levelCountries
    .filter((cca2) => capitals.has(cca2))
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
): GameQuestion[] {
  // Recoger las capitales de todos los países del nivel
  const allCapitals = levelCountries
    .map((cca2) => countries.get(cca2)?.capital)
    .filter((c): c is string => !!c);

  return levelCountries
    .filter((cca2) => countries.get(cca2)?.capital)
    .map((cca2) => {
      const country = countries.get(cca2)!;
      return {
        type: 'C' as const,
        targetCca2: cca2,
        prompt: `¿Cuál es la capital de ${country.name}?`,
        options: pickOptions(allCapitals, country.capital),
        correctAnswer: country.capital,
      };
    });
}

/** Tipo D: "[Capital] es la capital de..." → 4 opciones (países) */
export function generateQuestionsTypeD(
  levelCountries: string[],
  countries: Map<string, CountryData>,
): GameQuestion[] {
  const allNames = levelCountries
    .map((cca2) => countries.get(cca2)?.name)
    .filter((n): n is string => !!n);

  return levelCountries
    .filter((cca2) => countries.get(cca2)?.capital)
    .map((cca2) => {
      const country = countries.get(cca2)!;
      return {
        type: 'D' as const,
        targetCca2: cca2,
        prompt: `${country.capital} es la capital de...`,
        options: pickOptions(allNames, country.name),
        correctAnswer: country.name,
      };
    });
}

/** Tipo E: "¿Qué país está resaltado?" → 4 opciones (países). El globo resalta el país. */
export function generateQuestionsTypeE(
  levelCountries: string[],
  countries: Map<string, CountryData>,
): GameQuestion[] {
  const allNames = levelCountries
    .map((cca2) => countries.get(cca2)?.name)
    .filter((n): n is string => !!n);

  return levelCountries.map((cca2) => {
    const country = countries.get(cca2)!;
    return {
      type: 'E' as const,
      targetCca2: cca2,
      prompt: '¿Qué país está resaltado?',
      options: pickOptions(allNames, country.name),
      correctAnswer: country.name,
    };
  });
}

/** Tipo F: "¿Cuál es la capital de este país?" → 4 opciones (capitales). El globo resalta el país. */
export function generateQuestionsTypeF(
  levelCountries: string[],
  countries: Map<string, CountryData>,
): GameQuestion[] {
  const allCapitals = levelCountries
    .map((cca2) => countries.get(cca2)?.capital)
    .filter((c): c is string => !!c);

  return levelCountries
    .filter((cca2) => countries.get(cca2)?.capital)
    .map((cca2) => {
      const country = countries.get(cca2)!;
      return {
        type: 'F' as const,
        targetCca2: cca2,
        prompt: '¿Cuál es la capital de este país?',
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
): GameQuestion[] {
  let questions: GameQuestion[];

  switch (type) {
    case 'A':
      questions = generateQuestionsTypeA(levelCountries, countries);
      break;
    case 'B':
      questions = generateQuestionsTypeB(levelCountries, capitals);
      break;
    case 'C':
      questions = generateQuestionsTypeC(levelCountries, countries);
      break;
    case 'D':
      questions = generateQuestionsTypeD(levelCountries, countries);
      break;
    case 'E':
      questions = generateQuestionsTypeE(levelCountries, countries);
      break;
    case 'F':
      questions = generateQuestionsTypeF(levelCountries, countries);
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
 * Genera una mezcla de todos los tipos de pregunta.
 * Una pregunta de tipo aleatorio por país, luego baraja todo.
 */
export function generateMixedQuestions(
  levelCountries: string[],
  countries: Map<string, CountryData>,
  capitals: Map<string, CapitalCoords>,
  lastAskedCca2?: string,
): GameQuestion[] {
  const types: Array<'A' | 'B' | 'C' | 'D' | 'E' | 'F'> = ['A', 'B', 'C', 'D', 'E', 'F'];
  const questions: GameQuestion[] = [];

  // Datos auxiliares para distractores (todos del mismo nivel/continente)
  const allCapitals = levelCountries
    .map((cca2) => countries.get(cca2)?.capital)
    .filter((c): c is string => !!c);
  const allNames = levelCountries
    .map((cca2) => countries.get(cca2)?.name)
    .filter((n): n is string => !!n);

  for (const cca2 of levelCountries) {
    const country = countries.get(cca2);
    if (!country) continue;

    // Elegir un tipo aleatorio, con fallback si falta info
    const shuffledTypes = shuffle([...types]);
    let question: GameQuestion | null = null;

    for (const t of shuffledTypes) {
      switch (t) {
        case 'A':
          question = { type: 'A', targetCca2: cca2, prompt: country.name };
          break;
        case 'B':
          if (capitals.has(cca2)) {
            question = { type: 'B', targetCca2: cca2, prompt: capitals.get(cca2)!.name };
          }
          break;
        case 'C':
          if (country.capital && allCapitals.length >= 4) {
            question = {
              type: 'C', targetCca2: cca2,
              prompt: `¿Cuál es la capital de ${country.name}?`,
              options: pickOptions(allCapitals, country.capital),
              correctAnswer: country.capital,
            };
          }
          break;
        case 'D':
          if (country.capital && allNames.length >= 4) {
            question = {
              type: 'D', targetCca2: cca2,
              prompt: `${country.capital} es la capital de...`,
              options: pickOptions(allNames, country.name),
              correctAnswer: country.name,
            };
          }
          break;
        case 'E':
          if (allNames.length >= 4) {
            question = {
              type: 'E', targetCca2: cca2,
              prompt: '¿Qué país está resaltado?',
              options: pickOptions(allNames, country.name),
              correctAnswer: country.name,
            };
          }
          break;
        case 'F':
          if (country.capital && allCapitals.length >= 4) {
            question = {
              type: 'F', targetCca2: cca2,
              prompt: '¿Cuál es la capital de este país?',
              options: pickOptions(allCapitals, country.capital),
              correctAnswer: country.capital,
            };
          }
          break;
      }
      if (question) break;
    }

    // Fallback a tipo A (siempre funciona)
    if (!question) {
      question = { type: 'A', targetCca2: cca2, prompt: country.name };
    }
    questions.push(question);
  }

  shuffle(questions);

  // Evitar que la primera pregunta repita la última del ciclo anterior
  if (lastAskedCca2 && questions[0]?.targetCca2 === lastAskedCca2 && questions.length > 1) {
    [questions[0], questions[1]] = [questions[1], questions[0]];
  }

  return questions;
}
