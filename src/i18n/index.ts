// Configuración de i18next multi-idioma para GeoExpert
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
export { detectLocale } from '../utils/locale';

const NAMESPACES = ['common', 'explore', 'game', 'passport', 'stats', 'settings', 'profile'] as const;

/** Idiomas soportados → nombre nativo (para el selector de idioma) */
export const SUPPORTED_LOCALES: Record<string, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  'pt-BR': 'Português (Brasil)',
  'pt-PT': 'Português',
  ru: 'Русский',
  ja: '日本語',
  ko: '한국어',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  hi: 'हिन्दी',
  th: 'ภาษาไทย',
  vi: 'Tiếng Việt',
  tr: 'Türkçe',
  pl: 'Polski',
  nl: 'Nederlands',
  sv: 'Svenska',
  ro: 'Română',
  uk: 'Українська',
  cs: 'Čeština',
  hu: 'Magyar',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  nb: 'Norsk',
};

/** Carga los 7 namespaces de un idioma vía dynamic import */
async function loadResources(lang: string): Promise<Record<string, Record<string, string>>> {
  const modules = await Promise.all(
    NAMESPACES.map((ns) => import(`./locales/${lang}/${ns}.json`)),
  );
  const resources: Record<string, Record<string, string>> = {};
  NAMESPACES.forEach((ns, i) => {
    resources[ns] = modules[i].default;
  });
  return resources;
}


/**
 * Inicializa i18next con el idioma indicado.
 * Carga recursos dinámicamente (solo el idioma activo + fallback inglés).
 */
export async function initI18n(locale: string): Promise<void> {
  const resources = await loadResources(locale);

  // Cargar fallback (inglés) si no es el idioma activo
  let fallbackResources: Record<string, Record<string, string>> | null = null;
  if (locale !== 'en') {
    fallbackResources = await loadResources('en');
  }

  await i18n.use(initReactI18next).init({
    lng: locale,
    fallbackLng: 'en',
    ns: [...NAMESPACES],
    defaultNS: 'common',
    resources: {
      [locale]: resources,
      ...(fallbackResources ? { en: fallbackResources } : {}),
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

/**
 * Cambia el idioma de la app. Carga recursos dinámicamente si no están ya cargados.
 */
export async function changeAppLanguage(newLocale: string): Promise<void> {
  if (!i18n.hasResourceBundle(newLocale, 'common')) {
    const resources = await loadResources(newLocale);
    for (const ns of NAMESPACES) {
      i18n.addResourceBundle(newLocale, ns, resources[ns], true, true);
    }
  }
  await i18n.changeLanguage(newLocale);
}

export default i18n;
