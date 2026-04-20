/**
 * generate-feature-graphic.mjs — Feature Graphic 1024×500 para Google Play.
 *
 * Banner promocional que aparece arriba de la ficha de la app en Play Store.
 * Requisitos Google Play: exactamente 1024×500, JPEG o 24-bit PNG (no alpha).
 *
 * Layout: globo wireframe a la izquierda, «Exploris» grande a la derecha,
 * subtítulo localizado debajo leído de docs/stores/metadata/<lang>.md
 * (campo «Subtitle — iOS only»). Fondo oscuro #060608.
 *
 * Genera 1 PNG por locale (32 totales) en docs/stores/feature-graphic/<lang>.png.
 *
 * Uso: node scripts/generate-feature-graphic.mjs
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGO_SVG = readFileSync(join(ROOT, 'public/assets/logo.svg'));
const METADATA_DIR = join(ROOT, 'docs/stores/metadata');
const OUT_DIR = join(ROOT, 'docs/stores/feature-graphic');

const W = 1024;
const H = 500;
const BG = { r: 6, g: 6, b: 8 }; // #060608 (no alpha — Play no acepta PNG con alpha)

/** Extrae el subtítulo iOS (texto limpio, sin contador) del .md */
function parseSubtitle(content) {
  const m = content.match(/## Subtitle[^\n]*\n([^\n]+)/);
  if (!m) return null;
  // Quita el sufijo " · NN/NN chars"
  return m[1].replace(/\s*·\s*\d+\/\d+\s*chars.*$/, '').trim();
}

/** Escape de caracteres especiales XML para texto seguro en SVG */
function xmlEscape(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function buildLogoBuffer(size) {
  return sharp(LOGO_SVG, { density: 400 })
    .resize(size, size)
    .png()
    .toBuffer();
}

async function generateFor(lang, subtitle, logoBuf) {
  const logoSize = 380;
  const logoX = 70;
  const logoY = Math.round((H - logoSize) / 2);

  const textX = 505;
  const titleY = H / 2 - 10;
  const subtitleY = H / 2 + 55;
  const subtitleMaxWidth = W - textX - 40; // margen derecho de 40px

  const textSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font-family: 'Helvetica Neue', 'Arial', sans-serif; font-size: 96px; font-weight: 700; fill: #ffffff; letter-spacing: 4px; }
    .sub   { font-family: 'Helvetica Neue', 'Arial', sans-serif; font-size: 28px; font-weight: 400; fill: #a8b4c8; letter-spacing: 1px; }
  </style>
  <text x="${textX}" y="${titleY}" class="title">Exploris</text>
  <text x="${textX}" y="${subtitleY}" class="sub" textLength="${subtitleMaxWidth}" lengthAdjust="spacingAndGlyphs">${xmlEscape(subtitle)}</text>
</svg>`;

  const out = join(OUT_DIR, `${lang}.png`);
  await sharp({
    create: { width: W, height: H, channels: 3, background: BG }
  })
    .composite([
      { input: logoBuf, top: logoY, left: logoX },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .flatten({ background: BG })
    .png({ compressionLevel: 9 })
    .toFile(out);

  return out;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const logoBuf = await buildLogoBuffer(380);

  const files = readdirSync(METADATA_DIR).filter(f => f.endsWith('.md'));
  let ok = 0, fail = 0;

  for (const file of files) {
    const lang = basename(file, '.md');
    const content = readFileSync(join(METADATA_DIR, file), 'utf-8');
    const subtitle = parseSubtitle(content);
    if (!subtitle) {
      console.warn(`  ⚠ ${lang}: sin subtítulo, saltando`);
      fail++;
      continue;
    }
    await generateFor(lang, subtitle, logoBuf);
    process.stdout.write(`  ${lang}: "${subtitle}" ✓\n`);
    ok++;
  }

  console.log(`\n→ ${ok} feature graphics generados en ${OUT_DIR}/ (${fail} errores)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
