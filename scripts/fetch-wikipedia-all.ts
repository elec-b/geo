/**
 * Script para obtener slugs de Wikipedia en todos los idiomas soportados.
 * Usa Wikidata SPARQL (propiedad P297 = ISO 3166-1 alpha-2) para obtener
 * sitelinks de Wikipedia en 23 idiomas únicos (26 locales de la app).
 *
 * Los sitelinks de Wikidata son autoritativos — si Wikidata los tiene, el
 * artículo existe. No se necesita validación HEAD (que además provoca
 * rate-limiting con ~6000 URLs).
 *
 * Ejecutar: npm run fetch-wikipedia-all
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, 'data');

// --- Mapeo de idiomas ---

// Idiomas únicos de Wikipedia que consultamos (23)
const WIKI_LANGS = [
  'es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
  'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'ro', 'uk', 'cs',
  'hu', 'id', 'ms', 'no',
];

// Mapeo: código Wikipedia → locales de la app que comparten ese Wikipedia
const WIKI_TO_APP_LOCALES: Record<string, string[]> = {
  es: ['es'], en: ['en'], fr: ['fr'], de: ['de'], it: ['it'],
  pt: ['pt-BR', 'pt-PT'],
  ru: ['ru'], ja: ['ja'], ko: ['ko'],
  zh: ['zh-Hans', 'zh-Hant'],
  hi: ['hi'], th: ['th'], vi: ['vi'], tr: ['tr'],
  pl: ['pl'], nl: ['nl'], sv: ['sv'], ro: ['ro'],
  uk: ['uk'], cs: ['cs'], hu: ['hu'],
  id: ['id'], ms: ['ms'],
  no: ['nb'],
};

// Mapeo inverso: locale de la app → código Wikipedia
const APP_LOCALE_TO_WIKI: Record<string, string> = {};
for (const [wikiLang, locales] of Object.entries(WIKI_TO_APP_LOCALES)) {
  for (const loc of locales) APP_LOCALE_TO_WIKI[loc] = wikiLang;
}

// Todos los locales de la app (26)
const ALL_APP_LOCALES = Object.keys(APP_LOCALE_TO_WIKI);

// --- Configuración ---

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'GeoExpert/1.0 (https://github.com; educational geography app)';

// Consulta SPARQL: obtener sitelinks de Wikipedia para todos los idiomas que necesitamos
const SPARQL_QUERY = `
SELECT ?iso ?article ?wikiLang WHERE {
  ?item wdt:P297 ?iso .
  ?article schema:about ?item ;
           schema:isPartOf ?wiki .
  ?wiki wikibase:wikiGroup "wikipedia" .
  BIND(REPLACE(STR(?wiki), "^https://([^.]+)\\\\.wikipedia\\\\.org/$", "$1") AS ?wikiLang)
  FILTER(?wikiLang IN (${WIKI_LANGS.map((l) => `"${l}"`).join(',')}))
}
`;

/** Extrae el slug de una URL de Wikipedia */
function extractSlug(url: string): string {
  const match = url.match(/\/wiki\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function main() {
  console.log('Consultando Wikidata SPARQL (todos los idiomas)...');

  const url = SPARQL_ENDPOINT + '?' + new URLSearchParams({
    query: SPARQL_QUERY,
    format: 'json',
  });

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/sparql-results+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error SPARQL: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const bindings = data.results.bindings;
  console.log(`Recibidos ${bindings.length} resultados de Wikidata`);

  // Paso 1: Construir mapa ISO → wikiLang → slug
  const rawMap = new Map<string, Map<string, string>>();

  for (const binding of bindings) {
    const iso = binding.iso.value.toUpperCase();
    const wikiLang = binding.wikiLang.value;
    const articleUrl = binding.article.value;
    const slug = extractSlug(articleUrl);
    if (!slug) continue;

    if (!rawMap.has(iso)) rawMap.set(iso, new Map());
    const langMap = rawMap.get(iso)!;
    // Quedarse con el primer resultado por (ISO, wikiLang)
    if (!langMap.has(wikiLang)) langMap.set(wikiLang, slug);
  }

  console.log(`Países con al menos un slug: ${rawMap.size}`);

  // Paso 2: Transformar a locales de la app con fallback a inglés
  // Formato: { ISO: { locale: slug } } donde slug puede ser "en:X" para fallback
  const result: Record<string, Record<string, string>> = {};

  for (const [iso, langMap] of rawMap) {
    const entry: Record<string, string> = {};

    for (const locale of ALL_APP_LOCALES) {
      const wikiLang = APP_LOCALE_TO_WIKI[locale];
      const nativeSlug = langMap.get(wikiLang);
      const englishSlug = langMap.get('en');

      if (nativeSlug) {
        entry[locale] = nativeSlug;
      } else if (englishSlug) {
        entry[locale] = `en:${englishSlug}`;
      }
      // Si no hay ni nativo ni inglés, se omite (será null en el JSON final)
    }

    if (Object.keys(entry).length > 0) {
      result[iso] = entry;
    }
  }

  // Ordenar por ISO y escribir JSON
  const sorted = Object.keys(result).sort();
  const output: Record<string, Record<string, string>> = {};
  for (const iso of sorted) {
    output[iso] = result[iso];
  }

  mkdirSync(DATA_DIR, { recursive: true });
  const outPath = resolve(DATA_DIR, 'wikipedia-all.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

  // Estadísticas finales
  let totalSlugs = 0;
  for (const entry of Object.values(output)) {
    totalSlugs += Object.keys(entry).length;
  }
  console.log(`\n✓ ${Object.keys(output).length} países, ${totalSlugs} slugs totales → ${outPath}`);

  // Cobertura por idioma
  console.log('\nCobertura por idioma:');
  for (const locale of ALL_APP_LOCALES) {
    const count = Object.values(output).filter((e) => e[locale]).length;
    console.log(`  ${locale.padEnd(7)} ${count} países`);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
