#!/usr/bin/env node

/**
 * Convierte los archivos de metadata en docs/stores/metadata/*.md
 * al formato de Fastlane (un .txt por campo por idioma).
 *
 * Uso: node scripts/metadata-to-fastlane.mjs
 * Output: fastlane/metadata/<locale>/<campo>.txt
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

// Mapeo de códigos de idioma del proyecto → locales de Apple App Store Connect
const LOCALE_MAP = {
  'en':      'en-US',
  'es':      'es-ES',
  'fr':      'fr-FR',
  'de':      'de-DE',
  'it':      'it',
  'pt-BR':   'pt-BR',
  'pt-PT':   'pt-PT',
  'nl':      'nl-NL',
  'pl':      'pl',
  'ru':      'ru',
  'ja':      'ja',
  'ko':      'ko',
  'zh-Hans': 'zh-Hans',
  'zh-Hant': 'zh-Hant',
  'da':      'da',
  'fi':      'fi',
  'nb':      'no',
  'sv':      'sv',
  'cs':      'cs',
  'sk':      'sk',
  'hu':      'hu',
  'ro':      'ro',
  'hr':      'hr',
  'uk':      'uk',
  'el':      'el',
  'tr':      'tr',
  'th':      'th',
  'vi':      'vi',
  'id':      'id',
  'ms':      'ms',
  'ca':      'ca',
  'hi':      'hi',
};

// Parsea un archivo .md y extrae los campos
function parseMetadata(content) {
  const fields = {};

  // Extraer cada sección ## y su contenido
  const sections = content.split(/^## /m).slice(1);

  for (const section of sections) {
    const [header, ...bodyLines] = section.split('\n');
    // El contenido está en las líneas siguientes al header, hasta la siguiente sección
    let body = bodyLines.join('\n').trim();

    // Eliminar la línea de conteo de chars (· XXXX/YYYY chars)
    body = body.replace(/^·\s*\d+\/\d+\s*chars\s*$/m, '').trim();

    if (header.startsWith('iOS Name')) {
      fields.name = body;
    } else if (header.startsWith('Subtitle')) {
      // Quitar " · XX/30 chars"
      fields.subtitle = body.replace(/\s*·\s*\d+\/\d+\s*chars.*$/, '').trim();
    } else if (header.startsWith('Promotional Text')) {
      fields.promotional_text = body.replace(/\s*·\s*\d+\/\d+\s*chars.*$/, '').trim();
    } else if (header.startsWith('Keywords')) {
      fields.keywords = body.replace(/\s*·\s*\d+\/\d+\s*chars.*$/, '').trim();
    } else if (header.startsWith('Description')) {
      fields.description = body;
    } else if (header.startsWith('Copyright')) {
      fields.copyright = body;
    } else if (header.startsWith('Category')) {
      // No varía por idioma, solo se necesita una vez
    }
    // Android Title y Short Description se ignoran (solo iOS por ahora)
  }

  return fields;
}

// --- Main ---

const ROOT = join(import.meta.dirname, '..');
const METADATA_DIR = join(ROOT, 'docs', 'stores', 'metadata');
const RELEASE_NOTES_DIR = join(ROOT, 'docs', 'stores', 'release-notes');
const OUTPUT_DIR = join(ROOT, 'fastlane', 'metadata');

const files = readdirSync(METADATA_DIR).filter(f => f.endsWith('.md'));
let count = 0;

for (const file of files) {
  const lang = basename(file, '.md');
  const locale = LOCALE_MAP[lang];

  if (!locale) {
    console.warn(`⚠ Sin mapeo de locale para: ${lang}, saltando`);
    continue;
  }

  const content = readFileSync(join(METADATA_DIR, file), 'utf-8');
  const fields = parseMetadata(content);

  const localeDir = join(OUTPUT_DIR, locale);
  mkdirSync(localeDir, { recursive: true });

  // Escribir cada campo como .txt
  const fieldFiles = {
    'name.txt': fields.name,
    'subtitle.txt': fields.subtitle,
    'promotional_text.txt': fields.promotional_text,
    'keywords.txt': fields.keywords,
    'description.txt': fields.description,
    'copyright.txt': fields.copyright,
  };

  for (const [filename, value] of Object.entries(fieldFiles)) {
    if (value) {
      writeFileSync(join(localeDir, filename), value + '\n');
    }
  }

  // release_notes.txt — copiado desde docs/stores/release-notes/<lang>.txt
  // Sobreescribe si existe (cada nueva versión reescribe el "what's new").
  const rnPath = join(RELEASE_NOTES_DIR, `${lang}.txt`);
  if (existsSync(rnPath)) {
    const rn = readFileSync(rnPath, 'utf-8').trim();
    writeFileSync(join(localeDir, 'release_notes.txt'), rn + '\n');
  }

  count++;
  console.log(`✓ ${locale} (${lang})`);
}

console.log(`\n${count} idiomas generados en ${OUTPUT_DIR}`);
