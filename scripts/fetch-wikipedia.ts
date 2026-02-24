/**
 * Script para obtener slugs de Wikipedia en español para cada país.
 * Usa Wikidata SPARQL (propiedad P297 = ISO 3166-1 alpha-2) para obtener
 * sitelinks de es.wikipedia.org con fallback a en.wikipedia.org.
 *
 * Ejecutar: npm run fetch-wikipedia
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, 'data');

// Consulta SPARQL: obtener ISO alpha-2 y sitelinks de Wikipedia ES/EN
const SPARQL_QUERY = `
SELECT ?item ?iso ?articleEs ?articleEn WHERE {
  ?item wdt:P297 ?iso .
  OPTIONAL {
    ?articleEs schema:about ?item ;
              schema:isPartOf <https://es.wikipedia.org/> .
  }
  OPTIONAL {
    ?articleEn schema:about ?item ;
              schema:isPartOf <https://en.wikipedia.org/> .
  }
}
`;

interface WikiEntry {
  slug: string;
  lang: string;
}

/** Extrae el slug de una URL de Wikipedia */
function extractSlug(url: string): string {
  const match = url.match(/\/wiki\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : '';
}

/** Valida un enlace de Wikipedia con HEAD request */
async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('Consultando Wikidata SPARQL...');

  const url = 'https://query.wikidata.org/sparql?' + new URLSearchParams({
    query: SPARQL_QUERY,
    format: 'json',
  });

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'GeoExpert/1.0 (https://github.com; educational geography app)',
      Accept: 'application/sparql-results+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error SPARQL: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const bindings = data.results.bindings;
  console.log(`Recibidos ${bindings.length} resultados de Wikidata`);

  // Procesar resultados: preferir ES, fallback a EN
  const entries = new Map<string, { slug: string; lang: string; url: string }>();

  for (const binding of bindings) {
    const iso = binding.iso.value.toUpperCase();

    if (binding.articleEs?.value) {
      const slug = extractSlug(binding.articleEs.value);
      if (slug) {
        entries.set(iso, {
          slug,
          lang: 'es',
          url: `https://es.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
        });
      }
    } else if (binding.articleEn?.value && !entries.has(iso)) {
      const slug = extractSlug(binding.articleEn.value);
      if (slug) {
        entries.set(iso, {
          slug,
          lang: 'en',
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
        });
      }
    }
  }

  console.log(`Países con slug: ${entries.size}`);

  // Validar URLs con HEAD requests (en lotes de 20)
  console.log('Validando URLs con HEAD...');
  const allEntries = [...entries.entries()];
  const BATCH_SIZE = 20;
  let validated = 0;
  let failed = 0;

  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    const batch = allEntries.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async ([iso, entry]) => {
        const ok = await validateUrl(entry.url);
        return { iso, ok };
      }),
    );

    for (const { iso, ok } of results) {
      if (ok) {
        validated++;
      } else {
        console.warn(`  ✗ ${iso}: ${entries.get(iso)!.url}`);
        entries.delete(iso);
        failed++;
      }
    }
  }

  console.log(`Validados: ${validated}, fallidos: ${failed}`);

  // Construir JSON de salida (ordenado por ISO)
  const sorted = [...entries.entries()].sort(([a], [b]) => a.localeCompare(b));
  const output: Record<string, WikiEntry> = {};
  for (const [iso, entry] of sorted) {
    output[iso] = { slug: entry.slug, lang: entry.lang };
  }

  // Escribir archivo
  mkdirSync(DATA_DIR, { recursive: true });
  const outPath = resolve(DATA_DIR, 'wikipedia-es.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✓ ${Object.keys(output).length} entradas escritas → ${outPath}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
