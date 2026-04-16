/**
 * layout-check.mjs — Check intensivo de layout multi-idioma
 *
 * Recorre los 32 idiomas × 4 pantallas principales, detecta overflow DOM
 * y captura screenshots a viewport de iPhone.
 *
 * Uso:
 *   1. npm run dev  (en otro terminal)
 *   2. node scripts/layout-check.mjs
 *
 * Output:
 *   layout-check-output/screenshots/{locale}/01-explore.png, etc.
 *   layout-check-output/report.json
 */

import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// ─── Configuración ───────────────────────────────────────────

const BASE_URL = 'http://localhost:5173';
const STORE_KEY = 'exploris-store';
const OUTPUT_DIR = 'layout-check-output';

// Viewport: iPhone 14 (390x844, deviceScaleFactor 3)
const DEVICE = devices['iPhone 14'];

const LOCALES = [
  'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'hi',
  'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nb', 'nl', 'pl',
  'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sv', 'th', 'tr', 'uk',
  'vi', 'zh-Hans', 'zh-Hant',
];

// Selectores de alto riesgo por pantalla
const RISK_SELECTORS = [
  // Pasaporte
  '.passport-grid__level-name',
  '.passport-header__name',
  '.passport-header__level',
  '.passport-legend__item',
  '.passport-grid__continent-label',
  // Jugar / LevelSelector
  '.level-selector__level-name',
  '.level-selector__continent-pill',
  '.level-selector__aventura-name',
  '.level-selector__aventura-desc',
  '.level-selector__types-divider-text',
  '.level-selector__type-label',
  '.level-selector__start',
  // Explorar
  '.continent-filter__pill',
  '.explore-segmented__btn',
  '.explore-labels__btn',
  // Stats
  '.stats-tab',
  '.stats-pill',
  '.stats-header__title',
  '.stats-legend span',
  '.stats-reset',
  '.stats-stamp-notice',
  // Tab bar
  '.tab-bar__label',
  // Genéricos: botones visibles, encabezados
  'button',
  'h2',
  'h3',
];

// ─── Funciones de detección (se inyectan en el navegador) ────

/** Función que corre dentro de page.evaluate() */
function detectOverflowsInPage(selectors) {
  const issues = [];
  const seen = new Set();

  function cssPath(el) {
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body) {
      let sel = cur.tagName.toLowerCase();
      if (cur.className && typeof cur.className === 'string') {
        const main = cur.className.split(' ')[0];
        if (main) sel = '.' + main;
      }
      parts.unshift(sel);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  const viewportW = window.innerWidth;

  for (const selector of selectors) {
    for (const el of document.querySelectorAll(selector)) {
      if (seen.has(el)) continue;
      seen.add(el);

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      const sW = el.scrollWidth;
      const cW = el.clientWidth;
      const sH = el.scrollHeight;
      const cH = el.clientHeight;

      const text = (el.textContent || '').trim().substring(0, 80);

      // Check 1: Elemento se sale por la derecha del viewport (clipped)
      // Ignorar elementos diminutos (<5px visibles) - suelen ser decoraciones
      if (rect.right > viewportW + 1 && rect.left < viewportW) {
        const clippedPx = Math.round(rect.right - viewportW);
        if (clippedPx >= 2) {
          issues.push({
            selector: cssPath(el),
            matchedBy: selector,
            text,
            issue: 'clipped-right',
            clippedPx,
            rectLeft: Math.round(rect.left),
            rectRight: Math.round(rect.right),
            viewportW,
          });
        }
      }

      // Check 2: Elemento se sale por la izquierda
      if (rect.left < -1 && rect.right > 0) {
        const clippedPx = Math.round(-rect.left);
        if (clippedPx >= 2) {
          issues.push({
            selector: cssPath(el),
            matchedBy: selector,
            text,
            issue: 'clipped-left',
            clippedPx,
            rectLeft: Math.round(rect.left),
          });
        }
      }

      // Check 3: Horizontal overflow dentro del propio elemento
      if (sW > cW + 1) {
        issues.push({
          selector: cssPath(el),
          matchedBy: selector,
          text,
          issue: 'horizontal-overflow',
          scrollWidth: sW,
          clientWidth: cW,
          overflow: style.overflow + ' / ' + style.overflowX,
          textOverflow: style.textOverflow,
          whiteSpace: style.whiteSpace,
        });
      }

      // Check 4: Vertical overflow (si el contenedor no es scrollable)
      if (sH > cH + 1 && style.overflowY !== 'auto' && style.overflowY !== 'scroll') {
        issues.push({
          selector: cssPath(el),
          matchedBy: selector,
          text,
          issue: 'vertical-overflow',
          scrollHeight: sH,
          clientHeight: cH,
          overflow: style.overflow + ' / ' + style.overflowY,
        });
      }

      // Check 5: Truncado activo por ellipsis
      if (style.textOverflow === 'ellipsis' && sW > cW + 1) {
        issues.push({
          selector: cssPath(el),
          matchedBy: selector,
          text,
          issue: 'text-truncated-ellipsis',
          scrollWidth: sW,
          clientWidth: cW,
        });
      }
    }
  }
  return issues;
}

// ─── Navegación ──────────────────────────────────────────────

async function switchLocale(page, locale) {
  await page.evaluate(([key, loc]) => {
    const raw = localStorage.getItem(key);
    const store = raw ? JSON.parse(raw) : { state: { settings: {} }, version: 1 };
    if (!store.state) store.state = { settings: {} };
    if (!store.state.settings) store.state.settings = {};
    store.state.settings.locale = loc;
    localStorage.setItem(key, JSON.stringify(store));
  }, [STORE_KEY, locale]);

  await page.reload({ waitUntil: 'networkidle' });

  // Esperar a que el loading screen desaparezca
  try {
    await page.waitForSelector('.loading-screen--hidden', { timeout: 15000 });
  } catch {
    // Si no aparece el selector, esperar un poco y continuar
    await page.waitForTimeout(3000);
  }
  // Dar tiempo a React para re-renderizar y cargar datos de país
  await page.waitForTimeout(800);
}

async function goToExplore(page) {
  await page.locator('.tab-bar__button').nth(0).click();
  await page.waitForTimeout(500);
}

async function goToPlay(page) {
  await page.locator('.tab-bar__button').nth(1).click();
  try {
    await page.waitForSelector('.level-selector', { state: 'visible', timeout: 5000 });
  } catch {
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(500);
}

async function goToPassport(page) {
  await page.locator('.tab-bar__button').nth(2).click();
  try {
    await page.waitForSelector('.passport-view', { state: 'visible', timeout: 5000 });
  } catch {
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(500);
}

async function openStats(page) {
  // El botón de stats es el primero en .app-header__right (antes del engranaje)
  const statsBtn = page.locator('.app-header__right .app-header__button').first();
  if (await statsBtn.isVisible()) {
    await statsBtn.click();
    try {
      await page.waitForSelector('.stats-overlay', { state: 'visible', timeout: 5000 });
    } catch {
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

async function closeStats(page) {
  const closeBtn = page.locator('.stats-header__close');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
}

async function detectOverflows(page) {
  return page.evaluate(detectOverflowsInPage, RISK_SELECTORS);
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Layout check — 32 idiomas × 4 pantallas\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...DEVICE,
  });
  const page = await context.newPage();

  const allIssues = [];
  const startTime = Date.now();

  // Carga inicial
  console.log('Cargando app...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  try {
    await page.waitForSelector('.loading-screen--hidden', { timeout: 30000 });
  } catch {
    console.log('  ⚠ Loading screen no desapareció, continuando...');
    await page.waitForTimeout(5000);
  }

  for (let i = 0; i < LOCALES.length; i++) {
    const locale = LOCALES[i];
    const progress = `[${i + 1}/${LOCALES.length}]`;
    process.stdout.write(`${progress} ${locale}...`);

    const localeDir = join(OUTPUT_DIR, 'screenshots', locale);
    mkdirSync(localeDir, { recursive: true });

    // Cambiar idioma
    await switchLocale(page, locale);

    let localeIssueCount = 0;

    // 1. Explorar
    await goToExplore(page);
    let issues = await detectOverflows(page);
    issues.forEach(iss => { iss.locale = locale; iss.screen = 'explore'; });
    allIssues.push(...issues);
    localeIssueCount += issues.length;
    await page.screenshot({ path: join(localeDir, '01-explore.png') });

    // 2. Jugar (selector)
    await goToPlay(page);
    issues = await detectOverflows(page);
    issues.forEach(iss => { iss.locale = locale; iss.screen = 'play'; });
    allIssues.push(...issues);
    localeIssueCount += issues.length;
    await page.screenshot({ path: join(localeDir, '02-play.png') });

    // Expandir grid de tipos si existe el divider
    const divider = page.locator('.level-selector__types-divider');
    if (await divider.isVisible({ timeout: 1000 }).catch(() => false)) {
      await divider.click();
      await page.waitForTimeout(400);
      issues = await detectOverflows(page);
      issues.forEach(iss => { iss.locale = locale; iss.screen = 'play-types'; });
      allIssues.push(...issues);
      localeIssueCount += issues.length;
      await page.screenshot({ path: join(localeDir, '02-play-types.png') });
    }

    // 3. Pasaporte
    await goToPassport(page);
    issues = await detectOverflows(page);
    issues.forEach(iss => { iss.locale = locale; iss.screen = 'passport'; });
    allIssues.push(...issues);
    localeIssueCount += issues.length;
    await page.screenshot({ path: join(localeDir, '03-passport.png') });

    // 4. Estadísticas
    const statsOpened = await openStats(page);
    if (statsOpened) {
      issues = await detectOverflows(page);
      issues.forEach(iss => { iss.locale = locale; iss.screen = 'stats'; });
      allIssues.push(...issues);
      localeIssueCount += issues.length;
      await page.screenshot({ path: join(localeDir, '04-stats.png') });
      await closeStats(page);
    }

    if (localeIssueCount > 0) {
      console.log(` ⚠ ${localeIssueCount} issues`);
    } else {
      console.log(' ✓');
    }
  }

  await browser.close();

  // ─── Reporte ─────────────────────────────────────────────

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Guardar JSON
  writeFileSync(
    join(OUTPUT_DIR, 'report.json'),
    JSON.stringify(allIssues, null, 2),
  );

  // Resumen
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`Completado en ${elapsed}s — ${allIssues.length} issues encontrados`);
  console.log(`Screenshots: ${OUTPUT_DIR}/screenshots/`);
  console.log(`Reporte: ${OUTPUT_DIR}/report.json`);

  if (allIssues.length > 0) {
    // Agrupar por locale
    const byLocale = new Map();
    for (const iss of allIssues) {
      if (!byLocale.has(iss.locale)) byLocale.set(iss.locale, []);
      byLocale.get(iss.locale).push(iss);
    }

    console.log(`\nIssues por idioma:`);
    for (const [loc, issues] of [...byLocale.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${loc}: ${issues.length} issues`);
      // Mostrar los primeros de cada pantalla
      const byScreen = new Map();
      for (const iss of issues) {
        if (!byScreen.has(iss.screen)) byScreen.set(iss.screen, []);
        byScreen.get(iss.screen).push(iss);
      }
      for (const [screen, screenIssues] of byScreen) {
        const sample = screenIssues[0];
        console.log(`    ${screen}: "${sample.text}" (${sample.issue})`);
      }
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
