/**
 * Obtiene nombres de capitales en todos los idiomas soportados vía Wikidata SPARQL.
 * Usa P36 (capital) y rdfs:label para obtener las traducciones.
 *
 * Genera: scripts/data/capitals-all.json
 * Formato: { "AD": { "es": "Andorra la Vella", "en": "Andorra la Vella", ... }, ... }
 *
 * Ejecutar: npx tsx scripts/fetch-capitals-i18n.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, 'data');

// Los 26 idiomas soportados (BCP 47 → key del JSON)
const LANGUAGES: Record<string, string> = {
  es: 'es', en: 'en', fr: 'fr', de: 'de', it: 'it', pt: 'pt-BR',
  ru: 'ru', ja: 'ja', ko: 'ko', zh: 'zh-Hans', hi: 'hi', th: 'th',
  vi: 'vi', tr: 'tr', pl: 'pl', nl: 'nl', sv: 'sv', ro: 'ro',
  uk: 'uk', cs: 'cs', hu: 'hu', id: 'id', ms: 'ms', nb: 'nb',
  el: 'el', ca: 'ca', da: 'da', fi: 'fi', sk: 'sk', hr: 'hr',
};

// Idiomas para la consulta SPARQL (BCP 47 básicos)
const SPARQL_LANGS = Object.keys(LANGUAGES);

// Consulta SPARQL: obtener capital + labels en todos los idiomas
// P297 = ISO 3166-1 alpha-2, P36 = capital
const SPARQL_QUERY = `
SELECT ?iso ?capitalLabel (LANG(?capitalLabel) AS ?lang) WHERE {
  ?item wdt:P297 ?iso .
  ?item wdt:P36 ?capital .
  ?capital rdfs:label ?capitalLabel .
  FILTER(LANG(?capitalLabel) IN (${SPARQL_LANGS.map((l) => `"${l}"`).join(', ')}))
}
ORDER BY ?iso ?lang
`;

interface SparqlBinding {
  iso: { value: string };
  capitalLabel: { value: string };
  lang: { value: string };
}

async function main() {
  console.log('Consultando Wikidata SPARQL para capitales en todos los idiomas...');
  console.log(`Idiomas: ${SPARQL_LANGS.join(', ')}`);

  const url =
    'https://query.wikidata.org/sparql?' +
    new URLSearchParams({ query: SPARQL_QUERY, format: 'json' });

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'GeoExpert/1.0 (educational geography app)',
      Accept: 'application/sparql-results+json',
    },
  });

  if (!response.ok) {
    throw new Error(`SPARQL error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const bindings: SparqlBinding[] = data.results.bindings;
  console.log(`Recibidos ${bindings.length} resultados`);

  // Cargar datos suplementarios de español como referencia
  const SUPP_ES_PATH = resolve(__dirname, 'data', 'capitals-es.json');
  const suppEs: Record<string, { capital: string }> = JSON.parse(
    readFileSync(SUPP_ES_PATH, 'utf-8'),
  );

  // Agrupar por ISO → lang → label
  const result: Record<string, Record<string, string>> = {};

  for (const binding of bindings) {
    const iso = binding.iso.value.toUpperCase();
    const lang = binding.lang.value;
    const label = binding.capitalLabel.value;

    // Mapear lang SPARQL → key del JSON
    const jsonKey = LANGUAGES[lang];
    if (!jsonKey) continue;

    if (!result[iso]) result[iso] = {};

    // Wikidata puede tener múltiples capitales (históricas, de facto).
    // Preferimos la primera que encontremos (ORDER BY en la query).
    if (!result[iso][jsonKey]) {
      result[iso][jsonKey] = label;
    }
  }

  // zh-Hant: copiar de zh si existe (CLDR no distingue en Wikidata labels)
  // pt-PT: copiar de pt-BR
  // nb: copiar de nb (ya incluido directamente)
  for (const iso of Object.keys(result)) {
    if (result[iso]['zh-Hans'] && !result[iso]['zh-Hant']) {
      result[iso]['zh-Hant'] = result[iso]['zh-Hans'];
    }
    if (result[iso]['pt-BR'] && !result[iso]['pt-PT']) {
      result[iso]['pt-PT'] = result[iso]['pt-BR'];
    }
  }

  // Asegurar que el español coincide con nuestros datos curados
  // (override Wikidata con nuestros datos si difieren)
  for (const [iso, entry] of Object.entries(suppEs)) {
    if (!result[iso]) result[iso] = {};
    result[iso].es = entry.capital;
  }

  // Reportar cobertura
  const allCodes = Object.keys(suppEs);
  const allLangKeys = Object.values(LANGUAGES);
  // Añadir zh-Hant y pt-PT
  allLangKeys.push('zh-Hant', 'pt-PT');
  const uniqueLangKeys = [...new Set(allLangKeys)];

  let missing = 0;
  const missingReport: string[] = [];
  for (const iso of allCodes) {
    for (const lang of uniqueLangKeys) {
      if (!result[iso]?.[lang]) {
        missing++;
        missingReport.push(`  ${iso}/${lang}`);
      }
    }
  }

  if (missing > 0) {
    console.log(`\n⚠ ${missing} traducciones faltantes:`);
    // Solo mostrar las primeras 50
    missingReport.slice(0, 50).forEach((l) => console.log(l));
    if (missingReport.length > 50) {
      console.log(`  ... y ${missingReport.length - 50} más`);
    }
  }

  // Ordenar por ISO
  const sorted: Record<string, Record<string, string>> = {};
  for (const iso of allCodes.sort()) {
    sorted[iso] = result[iso] ?? {};
  }

  // Escribir
  mkdirSync(DATA_DIR, { recursive: true });
  const outPath = resolve(DATA_DIR, 'capitals-all.json');
  writeFileSync(outPath, JSON.stringify(sorted, null, 2), 'utf-8');
  console.log(
    `\n✓ ${Object.keys(sorted).length} países × ${uniqueLangKeys.length} idiomas → ${outPath}`,
  );
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
