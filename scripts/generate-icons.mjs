// Script para generar app icon y splash screens desde el logo SVG
import sharp from 'sharp';
import { readFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGO_SVG = readFileSync(join(ROOT, 'public/assets/logo.svg'));
const BG = { r: 10, g: 10, b: 12, alpha: 255 }; // #0a0a0c

async function generateIcon() {
  const iconSize = 1024;
  const logoSize = 716; // ~70% del icono
  const offset = Math.round((iconSize - logoSize) / 2);

  const logo = await sharp(LOGO_SVG, { density: 300 })
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  await sharp({
    create: { width: iconSize, height: iconSize, channels: 4, background: BG }
  })
    .composite([{ input: logo, top: offset, left: offset }])
    .flatten({ background: BG })
    .png()
    .toFile(join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'));

  console.log('App icon generado (1024x1024)');
}

async function generateSplash() {
  const splashSize = 2732;
  const logoSize = 360;
  const offset = Math.round((splashSize - logoSize) / 2);

  const logo = await sharp(LOGO_SVG, { density: 300 })
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  const splashDir = join(ROOT, 'ios/App/App/Assets.xcassets/Splash.imageset');
  const mainFile = join(splashDir, 'splash-2732x2732.png');

  await sharp({
    create: { width: splashSize, height: splashSize, channels: 4, background: BG }
  })
    .composite([{ input: logo, top: offset, left: offset }])
    .png()
    .toFile(mainFile);

  // Copiar para las 3 escalas (iOS las necesita)
  copyFileSync(mainFile, join(splashDir, 'splash-2732x2732-1.png'));
  copyFileSync(mainFile, join(splashDir, 'splash-2732x2732-2.png'));

  console.log('Splash screens generados (2732x2732 x3)');
}

await generateIcon();
await generateSplash();
console.log('Listo.');
