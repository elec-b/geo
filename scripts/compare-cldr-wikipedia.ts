/**
 * Compara nombres de países actuales (CLDR + overrides) con títulos de Wikipedia
 * para los 10 idiomas del Grupo B sin fuente nacional autoritativa.
 *
 * Genera: docs/spikes/divergencias-cldr-wikipedia.md
 * Ejecutar: npx tsx scripts/compare-cldr-wikipedia.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const I18N_DIR = resolve(__dirname, '..', 'public', 'data', 'i18n');
const WIKI_FILE = resolve(__dirname, 'data', 'wikipedia-all.json');
const OUTPUT = resolve(__dirname, '..', 'docs', 'spikes', 'divergencias-cldr-wikipedia.md');

// Los 10 idiomas Grupo B (sin fuente nacional autoritativa)
const LANGS = ['hi', 'pt-BR', 'pt-PT', 'vi', 'ms', 'th', 'it', 'da', 'ro', 'sv'] as const;

const LANG_NAMES: Record<string, string> = {
  hi: 'Hindi', 'pt-BR': 'Portugués (Brasil)', 'pt-PT': 'Portugués (Portugal)',
  vi: 'Vietnamita', ms: 'Malayo', th: 'Tailandés', it: 'Italiano',
  da: 'Danés', ro: 'Rumano', sv: 'Sueco',
};

// Leer fuentes
const wikiAll: Record<string, Record<string, string>> = JSON.parse(
  readFileSync(WIKI_FILE, 'utf-8'),
);

// Prefijos de "país" en Wikipedia por idioma (convención de naming, no nombre real)
const WIKI_PREFIXES: Record<string, string[]> = {
  th: ['ประเทศ'],        // "país" en tailandés
  ms: ['Negara '],        // "país" en malayo (con espacio)
};

function normalizeWikiSlug(slug: string, lang: string): string {
  // Quitar prefijo de fallback "en:" u otros
  if (slug.includes(':')) return ''; // fallback a otro idioma → no hay nombre nativo
  // Reemplazar _ por espacio y quitar disambiguation " (xxx)"
  let name = slug.replace(/_/g, ' ').replace(/ \([^)]+\)$/, '').trim();
  // Strip prefijos de "país" por idioma
  for (const prefix of WIKI_PREFIXES[lang] ?? []) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
    }
  }
  return name;
}

// CLDR usa "Congo - Kinshasa" / "Congo - Brazzaville" pero Wikipedia usa nombre oficial.
// No comparar estos — son convenciones diferentes, no errores.
const SKIP_COUNTRIES = new Set(['CD', 'CG']);

interface Divergence {
  cca2: string;
  current: string;
  wikipedia: string;
}

const results: Record<string, Divergence[]> = {};
let totalDivergences = 0;

for (const lang of LANGS) {
  const i18nFile = resolve(I18N_DIR, `${lang}.json`);
  const i18nData: Record<string, { name: string }> = JSON.parse(
    readFileSync(i18nFile, 'utf-8'),
  );

  const divergences: Divergence[] = [];

  for (const [cca2, entry] of Object.entries(i18nData)) {
    if (SKIP_COUNTRIES.has(cca2)) continue;
    const currentName = entry.name;
    const wikiSlug = wikiAll[cca2]?.[lang];
    if (!wikiSlug) continue; // sin dato Wikipedia para este idioma

    const wikiName = normalizeWikiSlug(wikiSlug, lang);
    if (!wikiName) continue; // fallback a otro idioma

    // Comparación case-sensitive (los nombres propios deben coincidir exactamente)
    if (currentName !== wikiName) {
      divergences.push({ cca2, current: currentName, wikipedia: wikiName });
    }
  }

  // Ordenar por código de país
  divergences.sort((a, b) => a.cca2.localeCompare(b.cca2));
  results[lang] = divergences;
  totalDivergences += divergences.length;
  console.log(`${lang}: ${divergences.length} divergencias`);
}

// Generar markdown
const lines: string[] = [
  '# Spike: Divergencias CLDR vs Wikipedia — nombres de países (10 idiomas Grupo B)',
  '',
  `**Fecha**: 2026-03-28`,
  `**Contexto**: Comparación exhaustiva de los nombres de países actuales (CLDR + overrides existentes) contra los títulos de artículos Wikipedia en cada idioma. Complementa la sección 1.4 de \`verificacion-i18n-datos.md\`.`,
  `**Método**: Script automático (\`scripts/compare-cldr-wikipedia.ts\`) + revisión por agent team.`,
  '',
  '---',
  '',
  `## Resumen`,
  '',
  `| Idioma | Divergencias | Recomendación |`,
  `|--------|-------------|---------------|`,
];

for (const lang of LANGS) {
  const count = results[lang].length;
  lines.push(`| ${lang} (${LANG_NAMES[lang]}) | ${count} | (pendiente) |`);
}
lines.push(`| **Total** | **${totalDivergences}** | |`);

lines.push('', '---', '');

for (const lang of LANGS) {
  const divs = results[lang];
  if (divs.length === 0) {
    lines.push(`## ${lang} — ${LANG_NAMES[lang]} (0 divergencias)`, '', 'Sin divergencias.', '', '---', '');
    continue;
  }

  lines.push(`## ${lang} — ${LANG_NAMES[lang]} (${divs.length} divergencias)`, '');
  lines.push('| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |');
  lines.push('|------|------------------------|-----------|---------------|');

  for (const d of divs) {
    lines.push(`| ${d.cca2} | ${d.current} | ${d.wikipedia} | |`);
  }

  lines.push('', '---', '');
}

writeFileSync(OUTPUT, lines.join('\n'), 'utf-8');
console.log(`\n✓ ${totalDivergences} divergencias totales → ${OUTPUT}`);
