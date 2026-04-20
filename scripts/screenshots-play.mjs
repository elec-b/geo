/**
 * screenshots-play.mjs — Genera screenshots para Google Play (ratio 9:16).
 *
 * Viewport 540×960 × DPR 2 → PNG 1080×1920 (9:16 exacto, cumple prominent placement).
 * Inyecta variables CSS de safe areas Android (--sat/--sab/--sal/--sar) para que
 * el layout respete las insets del sistema como en el dispositivo real.
 *
 * Uso:
 *   1. npm run dev (en otro terminal)
 *   2. node scripts/screenshots-play.mjs                    # phone, solo es → android/phone/_test/
 *   3. node scripts/screenshots-play.mjs --all              # phone, 32 idiomas → android/phone/<tipo>/
 *   4. node scripts/screenshots-play.mjs --tablet           # tablet, solo es → android/tablet/_test/
 *   5. node scripts/screenshots-play.mjs --tablet --all     # tablet, 32 idiomas → android/tablet/<tipo>/
 *
 * Phone:  viewport 432×768 × DPR 2.5 → PNG 1080×1920 (9:16).
 * Tablet: viewport 800×1280 × DPR 2  → PNG 1600×2560 (5:8 portrait).
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

// ─── Configuración ───────────────────────────────────────────

const BASE_URL = 'http://localhost:5173';
const STORE_KEY = 'exploris-store';

// Perfiles de dispositivo — seleccionar con --phone (default) o --tablet.
const DEVICES = {
  phone: {
    // Viewport 432×768 × DPR 2.5 → PNG 1080×1920 (9:16 exacto).
    // Ancho 432 ≈ Galaxy A56 (412 CSS) → layout rem/container queries natural.
    viewport: { width: 432, height: 768 },
    dpr: 2.5,
    safeAreas: { sat: '24px', sar: '0px', sab: '0px', sal: '0px' },
    outputRoot: 'docs/stores/screenshots/android/phone',
  },
  tablet: {
    // Viewport 800×1280 × DPR 2 → PNG 1600×2560 (5:8 portrait, 10-inch tablet).
    // Cumple Play (max_dim ≤ 2× min_dim, 1.6 < 2). Portrait aprovecha mejor el
    // layout vertical de la app que landscape (el HUD queda bien dimensionado).
    viewport: { width: 800, height: 1280 },
    dpr: 2,
    safeAreas: { sat: '24px', sar: '0px', sab: '0px', sal: '0px' },
    outputRoot: 'docs/stores/screenshots/android/tablet',
  },
};

const ALL_LOCALES = [
  'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'hi',
  'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nb', 'nl', 'pl',
  'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sv', 'th', 'tr', 'uk',
  'vi', 'zh-Hans', 'zh-Hant',
];

// Los 5 screenshots acordados
const SCREENSHOTS = [
  { key: 'globe_light',         theme: 'light' },
  { key: 'country_card_light',  theme: 'light' },
  { key: 'play_pointer_light',  theme: 'light' }, // tipo A
  { key: 'play_question_light', theme: 'light' }, // tipo F
  { key: 'play_question_dark',  theme: 'dark'  }, // tipo F
];

// ─── Helpers ─────────────────────────────────────────────────

// ACTIVE_DEVICE se asigna en main() según --phone (default) o --tablet.
let ACTIVE_DEVICE = DEVICES.phone;

async function injectSafeAreas(page) {
  await page.evaluate((sa) => {
    const root = document.documentElement;
    root.style.setProperty('--sat', sa.sat);
    root.style.setProperty('--sar', sa.sar);
    root.style.setProperty('--sab', sa.sab);
    root.style.setProperty('--sal', sa.sal);
  }, ACTIVE_DEVICE.safeAreas);
}

async function setTheme(page, theme) {
  // ¿Ya estamos en el tema pedido? skip reload.
  const current = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  if (current === theme) return;

  await page.evaluate(([key, t]) => {
    const raw = localStorage.getItem(key);
    const store = raw ? JSON.parse(raw) : { state: { settings: {} }, version: 1 };
    if (!store.state) store.state = { settings: {} };
    if (!store.state.settings) store.state.settings = {};
    store.state.settings.theme = t;
    localStorage.setItem(key, JSON.stringify(store));
  }, [STORE_KEY, theme]);

  // Reload: Zustand rehidrata → App.tsx useEffect setea data-theme → GlobeD3
  // lee globeTheme[theme] del store JS. Sin reload, el canvas sigue con
  // colores del tema anterior (el setAttribute solo afecta a variables CSS).
  await page.reload({ waitUntil: 'networkidle' });
  await waitForLoadingGone(page);
  await injectSafeAreas(page);
  await page.waitForTimeout(600);
}

/** Aparca el cursor fuera del canvas para evitar hover residual. */
async function parkMouse(page) {
  await page.mouse.move(5, 5);
  await page.waitForTimeout(200);
}

async function switchLocale(page, locale) {
  await page.evaluate(([key, loc]) => {
    const raw = localStorage.getItem(key);
    const store = raw ? JSON.parse(raw) : { state: { settings: {} }, version: 1 };
    if (!store.state) store.state = { settings: {} };
    if (!store.state.settings) store.state.settings = {};
    store.state.settings.locale = loc;
    localStorage.setItem(key, JSON.stringify(store));
  }, [STORE_KEY, locale]);
}

async function waitForLoadingGone(page) {
  try {
    await page.waitForSelector('.loading-screen--hidden', { timeout: 30000 });
  } catch {
    await page.waitForTimeout(3000);
  }
}

async function goToTab(page, index) {
  await page.locator('.tab-bar__button').nth(index).click();
  await page.waitForTimeout(300);
}

// ─── Flujo de cada screenshot ────────────────────────────────

/**
 * Orienta el globo a Europa mediante el pill de filtro. Espera a que termine la
 * rotación. Siempre va a Explorar > modo Globo primero.
 */
async function orientGlobeToEurope(page) {
  await goToTab(page, 0);
  const globoBtn = page.locator('.explore-segmented__btn').first();
  if (await globoBtn.isVisible().catch(() => false)) {
    await globoBtn.click();
    await page.waitForTimeout(400);
  }

  // Pill Europa por texto (robusto i18n). La clase usa nombre contextual en-app
  // ("europa", "europe", "europ", "европа", "歐洲", etc.) — usamos regex amplio
  // y caemos al índice 3 (ES orden: Todos, África, América, Asia, Europa? ...)
  const europaByText = page.locator('.continent-filter__pill', { hasText: /europ|europe|evropa|ευρωπ|европ|歐洲|欧洲|ヨーロ|유럽|eropa/i }).first();
  if (await europaByText.isVisible({ timeout: 1500 }).catch(() => false)) {
    await europaByText.click();
  } else {
    // Fallback: 5º pill (índice 4) — suele ser Europa en ES/EN
    const pills = page.locator('.continent-filter__pill');
    const count = await pills.count();
    if (count > 4) await pills.nth(4).click();
  }
  await page.waitForTimeout(2500); // rotación + asentamiento
}

/**
 * Globo orientado a Europa (hero shot). Sin país seleccionado: el filtro ya
 * destaca los países del continente con colores — suficiente como imagen de marketing.
 */
async function captureGlobe(page) {
  await orientGlobeToEurope(page);
}

/**
 * Ficha de país abierta (país ONU europeo) en Explorar.
 * Intenta tap en coords de Francia tras orientar Europa. Si abre un territorio
 * no-ONU (ej. Groenlandia, Gibraltar), cierra y reintenta con offset.
 */
async function captureCountryCard(page) {
  await orientGlobeToEurope(page);

  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) return;

  // Tras orientar Europa, Francia queda algo a la izquierda y centro-abajo del globo.
  // Coords empíricas para viewport 540x960: probar varios puntos hasta abrir ficha ONU.
  const attempts = [
    { x: 0.42, y: 0.50 }, // Francia aprox
    { x: 0.46, y: 0.48 }, // Alemania / centro Europa
    { x: 0.40, y: 0.55 }, // España
    { x: 0.50, y: 0.52 }, // Italia
  ];

  for (const pt of attempts) {
    await page.mouse.click(box.x + box.width * pt.x, box.y + box.height * pt.y);
    await page.waitForTimeout(1200);

    const card = page.locator('.country-card');
    if (await card.isVisible().catch(() => false)) {
      // Comprobar si es país ONU (no muestra "Territorio de ..." ni "Soberanía en disputa")
      const territorioChip = page.locator('.country-card__territory-chip, .country-card__disputed-chip');
      const isNonOnu = await territorioChip.isVisible({ timeout: 500 }).catch(() => false);
      if (!isNonOnu) {
        await page.waitForTimeout(400); // asentamiento final
        return;
      }
      // Cerrar ficha antes de reintentar
      const handle = page.locator('.bottom-sheet-handle').first();
      const hBox = await handle.boundingBox();
      if (hBox) {
        await page.mouse.move(hBox.x + hBox.width / 2, hBox.y + hBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(hBox.x + hBox.width / 2, hBox.y + 500, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(400);
      }
    }
  }
}

/**
 * Inicia una sesión de Jugar > Europa > Turista > tipo específico.
 * typeIndex según SPECIFIC_TYPES en LevelSelector.tsx: E=0, C=1, D=2, F=3, A=4, B=5
 */
async function startPlay(page, typeIndex) {
  await goToTab(page, 1); // Jugar
  await page.waitForSelector('.level-selector', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(300);

  // Continente Europa por texto (robusto i18n). Fallback a índice 4 (orden típico: África, América, Asia, Europa, Oceanía en ES/EN).
  const europaByText = page.locator('.level-selector__continent-pill', { hasText: /europ|europe|evropa|ευρωπ|европ|歐洲|欧洲|ヨーロ|유럽|eropa/i }).first();
  if (await europaByText.isVisible({ timeout: 1500 }).catch(() => false)) {
    await europaByText.click();
  } else {
    const pills = page.locator('.level-selector__continent-pill');
    const count = await pills.count();
    if (count > 3) await pills.nth(3).click();
  }
  await page.waitForTimeout(300);

  // Nivel Turista (primero)
  await page.locator('.level-selector__level-card').first().click();
  await page.waitForTimeout(300);

  // Expandir grid de tipos
  const divider = page.locator('.level-selector__types-divider');
  if (await divider.isVisible().catch(() => false)) {
    await divider.click();
    await page.waitForTimeout(400);
  }

  // Click del tipo solicitado
  await page.locator('.level-selector__type-card').nth(typeIndex).click();
  await page.waitForTimeout(300);

  // Empezar
  await page.locator('.level-selector__start').click();
  await page.waitForSelector('.question-banner', { state: 'visible', timeout: 8000 });
  await page.waitForTimeout(1500); // flyTo + render choices
}

// ─── Captura ─────────────────────────────────────────────────

async function captureAll(page, outDir, lang) {
  mkdirSync(outDir, { recursive: true });

  for (const { key, theme } of SCREENSHOTS) {
    process.stdout.write(`    ${key}... `);
    await resetToExplore(page);
    await setTheme(page, theme);
    await page.waitForTimeout(500); // asentamiento del cambio de tema

    try {
      if (key === 'globe_light') {
        await captureGlobe(page);
      } else if (key === 'country_card_light') {
        await captureCountryCard(page);
      } else if (key === 'play_pointer_light') {
        await startPlay(page, 4); // tipo A
      } else if (key === 'play_question_light' || key === 'play_question_dark') {
        await startPlay(page, 3); // tipo F
      }

      await injectSafeAreas(page); // re-inject por si React re-mountó
      await parkMouse(page);       // evita hover residual sobre el globo
      await page.waitForTimeout(300);

      const fname = lang ? `${key}_${lang}.png` : `${key}.png`;
      await page.screenshot({ path: join(outDir, fname), omitBackground: false });
      console.log('✓');
    } catch (e) {
      console.log(`✗ ${e.message}`);
    }
  }
}

/**
 * Vuelve a Explorar cerrando sesiones de juego activas. Útil entre screenshots.
 */
async function resetToExplore(page) {
  // Si hay una pregunta activa (banner visible), ir al selector de nivel pulsando tab Jugar 2 veces
  const banner = page.locator('.question-banner');
  if (await banner.isVisible({ timeout: 300 }).catch(() => false)) {
    // Volver a Explorar directamente — el botón atrás de la app cancelaría la sesión
    await goToTab(page, 0);
    await page.waitForTimeout(400);
  }
  // Cerrar ficha si está abierta
  const card = page.locator('.country-card');
  if (await card.isVisible({ timeout: 300 }).catch(() => false)) {
    const handle = page.locator('.bottom-sheet-handle').first();
    const hBox = await handle.boundingBox();
    if (hBox) {
      await page.mouse.move(hBox.x + hBox.width / 2, hBox.y + hBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(hBox.x + hBox.width / 2, hBox.y + 500, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(400);
    }
  }
  await goToTab(page, 0);
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const isTablet = args.includes('--tablet');
  ACTIVE_DEVICE = isTablet ? DEVICES.tablet : DEVICES.phone;

  const locales = all ? ALL_LOCALES : ['es'];
  const outputRoot = ACTIVE_DEVICE.outputRoot;
  const testDir = join(outputRoot, '_test');
  const { viewport: vp, dpr } = ACTIVE_DEVICE;
  const uaTablet = 'Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const uaPhone  = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

  console.log(`🎬 Screenshots Play (${isTablet ? 'tablet' : 'phone'}) — ${locales.length} idioma(s) × ${SCREENSHOTS.length} pantallas`);
  console.log(`   Viewport ${vp.width}×${vp.height} × DPR ${dpr} → PNG ${vp.width*dpr}×${vp.height*dpr}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: dpr,
    userAgent: isTablet ? uaTablet : uaPhone,
  });
  const page = await context.newPage();

  console.log('Cargando app...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await waitForLoadingGone(page);
  await injectSafeAreas(page);

  const startTime = Date.now();

  for (let i = 0; i < locales.length; i++) {
    const lang = locales[i];
    console.log(`\n[${i + 1}/${locales.length}] ${lang}`);

    await switchLocale(page, lang);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForLoadingGone(page);
    await injectSafeAreas(page);
    await page.waitForTimeout(500);

    if (all) {
      // Modo batch: cada tipo a su carpeta final
      for (const { key, theme } of SCREENSHOTS) {
        const outDir = join(outputRoot, key);
        mkdirSync(outDir, { recursive: true });
        process.stdout.write(`    ${key}... `);
        await resetToExplore(page);
        await setTheme(page, theme);
        await page.waitForTimeout(500);
        try {
          if (key === 'globe_light') await captureGlobe(page);
          else if (key === 'country_card_light') await captureCountryCard(page);
          else if (key === 'play_pointer_light') await startPlay(page, 4);
          else await startPlay(page, 3);
          await injectSafeAreas(page);
          await parkMouse(page);
          await page.waitForTimeout(300);
          await page.screenshot({ path: join(outDir, `${key}_${lang}.png`) });
          console.log('✓');
        } catch (e) {
          console.log(`✗ ${e.message}`);
        }
      }
    } else {
      await captureAll(page, testDir, lang);
    }
  }

  await browser.close();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`Completado en ${elapsed}s`);
  if (!all) console.log(`Screenshots de prueba: ${testDir}/`);
  else console.log(`Screenshots: ${outputRoot}/<tipo>/`);
}

main().catch(err => {
  console.error('\n✗ Error:', err);
  process.exit(1);
});
