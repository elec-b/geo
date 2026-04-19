// Script para generar app icon y splash screens desde el logo SVG
import sharp from 'sharp';
import { readFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGO_SVG = readFileSync(join(ROOT, 'public/assets/logo.svg'));
const BG = { r: 6, g: 6, b: 8, alpha: 255 }; // #060608
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// Densidades de Android. Foreground usa canvas 108dp (xxxhdpi = 432px);
// legacy usa 48dp (xxxhdpi = 192px). El ratio siempre es 108/48 = 2.25.
const ANDROID_DENSITIES = [
  { name: 'mdpi',    foreground: 108, legacy: 48  },
  { name: 'hdpi',    foreground: 162, legacy: 72  },
  { name: 'xhdpi',   foreground: 216, legacy: 96  },
  { name: 'xxhdpi',  foreground: 324, legacy: 144 },
  { name: 'xxxhdpi', foreground: 432, legacy: 192 },
];

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

async function generateAndroidIcons() {
  const resDir = join(ROOT, 'android/app/src/main/res');

  for (const { name, foreground, legacy } of ANDROID_DENSITIES) {
    const mipmapDir = join(resDir, `mipmap-${name}`);

    // 1) Foreground (adaptive icon): mismas proporciones que iOS (SVG al 70% del
    // canvas). El globo interno del SVG ocupa 78% de su viewBox → globo final a
    // 0.70 × 0.78 ≈ 55% del canvas de 108dp ≈ 59dp, dentro de la safe zone de 66dp.
    const fgLogoSize = Math.round(foreground * 0.70);
    const fgOffset = Math.round((foreground - fgLogoSize) / 2);
    const fgLogo = await sharp(LOGO_SVG, { density: 300 })
      .resize(fgLogoSize, fgLogoSize)
      .png()
      .toBuffer();
    await sharp({
      create: { width: foreground, height: foreground, channels: 4, background: TRANSPARENT },
    })
      .composite([{ input: fgLogo, top: fgOffset, left: fgOffset }])
      .png()
      .toFile(join(mipmapDir, 'ic_launcher_foreground.png'));

    // 2) Legacy (< API 26): globo al 70% sobre fondo #060608, idéntico a iOS.
    const legacyLogoSize = Math.round(legacy * 0.70);
    const legacyOffset = Math.round((legacy - legacyLogoSize) / 2);
    const legacyLogo = await sharp(LOGO_SVG, { density: 300 })
      .resize(legacyLogoSize, legacyLogoSize)
      .png()
      .toBuffer();
    const legacyFlat = await sharp({
      create: { width: legacy, height: legacy, channels: 4, background: BG },
    })
      .composite([{ input: legacyLogo, top: legacyOffset, left: legacyOffset }])
      .flatten({ background: BG })
      .png()
      .toBuffer();
    await sharp(legacyFlat).toFile(join(mipmapDir, 'ic_launcher.png'));

    // 3) Round legacy: mismo composite recortado con máscara circular.
    const circleMask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${legacy}" height="${legacy}"><circle cx="${legacy / 2}" cy="${legacy / 2}" r="${legacy / 2}" fill="#fff"/></svg>`,
    );
    await sharp(legacyFlat)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png()
      .toFile(join(mipmapDir, 'ic_launcher_round.png'));
  }

  console.log(`Android icons generados (${ANDROID_DENSITIES.length} densidades × 3 variantes)`);
}

await generateIcon();
await generateSplash();
await generateAndroidIcons();
console.log('Listo.');
