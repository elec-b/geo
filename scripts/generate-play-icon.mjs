/**
 * generate-play-icon.mjs — App icon 512×512 para Google Play Console.
 *
 * Play auto-extrae el icono del AAB, pero la UI permite subir un 512×512
 * explícito para asegurar máxima calidad. Mismo diseño que el icono iOS
 * (fondo #060608 + globo wireframe), escalado a 512×512.
 *
 * Uso: node scripts/generate-play-icon.mjs
 * Output: docs/stores/play-icon-512.png
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGO_SVG = readFileSync(join(ROOT, 'public/assets/logo.svg'));
const OUT = join(ROOT, 'docs/stores/play-icon-512.png');
const BG = { r: 6, g: 6, b: 8, alpha: 255 }; // #060608

async function main() {
  mkdirSync(dirname(OUT), { recursive: true });

  const iconSize = 512;
  const logoSize = 358; // ~70% del icon (coherente con generate-icons.mjs)
  const offset = Math.round((iconSize - logoSize) / 2);

  const logo = await sharp(LOGO_SVG, { density: 400 })
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  await sharp({
    create: { width: iconSize, height: iconSize, channels: 4, background: BG }
  })
    .composite([{ input: logo, top: offset, left: offset }])
    .flatten({ background: BG })
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  console.log(`Play app icon generado: ${OUT} (${iconSize}×${iconSize})`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
