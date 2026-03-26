// Utilidades de detección de idioma del dispositivo

/** Idiomas soportados por la app */
const SUPPORTED: Set<string> = new Set([
  'es', 'en', 'fr', 'de', 'it', 'pt-BR', 'pt-PT',
  'ru', 'ja', 'ko', 'zh-Hans', 'zh-Hant',
  'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'ro',
  'uk', 'cs', 'hu', 'id', 'ms', 'nb',
]);

/** Detecta el idioma del dispositivo y lo mapea al más cercano soportado */
export function detectLocale(): string {
  const browserLang = navigator.language ?? 'en';
  if (SUPPORTED.has(browserLang)) return browserLang;
  // zh-CN → zh-Hans, zh-TW → zh-Hant
  if (browserLang.startsWith('zh-CN') || browserLang.startsWith('zh-SG')) return 'zh-Hans';
  if (browserLang.startsWith('zh')) return 'zh-Hant';
  // pt → pt-BR (más hablantes)
  if (browserLang.startsWith('pt-BR')) return 'pt-BR';
  if (browserLang.startsWith('pt')) return 'pt-PT';
  // nb, nn, no → nb
  if (browserLang.startsWith('nb') || browserLang.startsWith('nn') || browserLang.startsWith('no')) return 'nb';
  // Idioma base (ej: "fr-CA" → "fr")
  const base = browserLang.split('-')[0];
  if (SUPPORTED.has(base)) return base;
  return 'en';
}
