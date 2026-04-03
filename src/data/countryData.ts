// Loader de datos estáticos de países y capitales con caché multi-idioma
import type { CountryData, CapitalCoords, ContinentOrSpecial } from './types';
import { getCdnCountriesBase } from './cdnUpdate';

/** Datos base agnósticos al idioma (de countries-base.json) */
interface BaseEntry {
  cca2: string;
  ccn3: string;
  continent: ContinentOrSpecial;
  population: number;
  area: number;
  flagSvg: string;
  currencies: { code: string; symbol: string }[];
  hdi: number | null;
  ihdi: number | null;
  unMember: boolean;
  sovereignCountry?: string;
}

/** Datos traducidos por idioma (de i18n/{lang}.json) */
interface I18nEntry {
  name: string;
  capital: string;
  demonym: string;
  languages: string[];
  currencyNames: string[];
  wikipediaSlug: string | null;
}

// Caché: locale → Map de países
let cachedLocale: string | null = null;
let cachedCountries: Map<string, CountryData> | null = null;
let cachedCapitals: Map<string, CapitalCoords> | null = null;

// Datos base (cargados una vez, compartidos entre idiomas)
let cachedBase: BaseEntry[] | null = null;
let cachedCoordsRaw: Record<string, { latlng: [number, number] }> | null = null;

// Datos sintéticos para territorios sin entrada en REST Countries API
// Keyed por locale → datos traducidos
const SYNTHETIC_I18N: Record<string, Record<string, { name: string; capital: string; demonym: string; languages: string[]; currencyNames: string[]; wikipediaSlug: string | null }>> = {
  SOL: {
    es: { name: 'Somalilandia', capital: 'Hargeisa', demonym: 'somalilándés', languages: ['Somalí', 'Árabe'], currencyNames: ['Chelín somalilándés'], wikipediaSlug: 'Somalilandia' },
    en: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'Somalilander', languages: ['Somali', 'Arabic'], currencyNames: ['Somaliland shilling'], wikipediaSlug: 'Somaliland' },
    fr: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somalilandais', languages: ['Somali', 'Arabe'], currencyNames: ['Shilling du Somaliland'], wikipediaSlug: 'Somaliland' },
    de: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somaliländisch', languages: ['Somali', 'Arabisch'], currencyNames: ['Somaliland-Schilling'], wikipediaSlug: 'Somaliland' },
    it: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somalilandese', languages: ['Somalo', 'Arabo'], currencyNames: ['Scellino del Somaliland'], wikipediaSlug: 'Somaliland' },
    ja: { name: 'ソマリランド', capital: 'ハルゲイサ', demonym: 'ソマリランドの', languages: ['ソマリ語', 'アラビア語'], currencyNames: ['ソマリランド・シリング'], wikipediaSlug: 'ソマリランド' },
    ko: { name: '소말릴란드', capital: '하르게이사', demonym: '소말릴란드의', languages: ['소말리어', '아랍어'], currencyNames: ['소말릴란드 실링'], wikipediaSlug: null },
    'zh-Hans': { name: '索马里兰', capital: '哈尔格萨', demonym: '索马里兰的', languages: ['索马里语', '阿拉伯语'], currencyNames: ['索马里兰先令'], wikipediaSlug: '索马里兰' },
    'zh-Hant': { name: '索馬利蘭', capital: '哈爾格薩', demonym: '索馬利蘭的', languages: ['索馬利語', '阿拉伯語'], currencyNames: ['索馬利蘭先令'], wikipediaSlug: '索馬利蘭' },
    ru: { name: 'Сомалиленд', capital: 'Харгейса', demonym: 'сомалилендский', languages: ['Сомалийский', 'Арабский'], currencyNames: ['Сомалилендский шиллинг'], wikipediaSlug: 'Сомалиленд' },
    hi: { name: 'सोमालीलैंड', capital: 'हरगेसा', demonym: 'सोमालीलैंडी', languages: ['सोमाली', 'अरबी'], currencyNames: ['सोमालीलैंड शिलिंग'], wikipediaSlug: null },
    th: { name: 'โซมาลีแลนด์', capital: 'ฮาร์เกซา', demonym: 'โซมาลีแลนด์', languages: ['โซมาลี', 'อาหรับ'], currencyNames: ['ชิลลิงโซมาลีแลนด์'], wikipediaSlug: null },
    vi: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'Somaliland', languages: ['Somali', 'Ả Rập'], currencyNames: ['Shilling Somaliland'], wikipediaSlug: null },
    tr: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'Somalilandlı', languages: ['Somalice', 'Arapça'], currencyNames: ['Somaliland şilini'], wikipediaSlug: null },
    pl: { name: 'Somaliland', capital: 'Hargejsa', demonym: 'somalilandczyk', languages: ['Somalijski', 'Arabski'], currencyNames: ['Szyling somalilandzki'], wikipediaSlug: 'Somaliland' },
    nl: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'Somalisch', languages: ['Somalisch', 'Arabisch'], currencyNames: ['Somalilandse shilling'], wikipediaSlug: null },
    sv: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somaliländsk', languages: ['Somaliska', 'Arabiska'], currencyNames: ['Somaliländsk shilling'], wikipediaSlug: null },
    ro: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somalilandez', languages: ['Somaleză', 'Arabă'], currencyNames: ['Șilingul Somaliland'], wikipediaSlug: null },
    uk: { name: 'Сомаліленд', capital: 'Харгейса', demonym: 'сомалілендський', languages: ['Сомалійська', 'Арабська'], currencyNames: ['Сомалілендський шилінг'], wikipediaSlug: null },
    cs: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somalilandský', languages: ['Somálština', 'Arabština'], currencyNames: ['Somalilandský šilink'], wikipediaSlug: null },
    hu: { name: 'Szomáliföld', capital: 'Hargeisa', demonym: 'szomáliföldi', languages: ['Szomáli', 'Arab'], currencyNames: ['Szomáliföldi shilling'], wikipediaSlug: null },
    id: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'Somaliland', languages: ['Somalia', 'Arab'], currencyNames: ['Shilling Somaliland'], wikipediaSlug: null },
    ms: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'Somaliland', languages: ['Somali', 'Arab'], currencyNames: ['Syiling Somaliland'], wikipediaSlug: null },
    nb: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somalilandsk', languages: ['Somali', 'Arabisk'], currencyNames: ['Somalilandsk shilling'], wikipediaSlug: null },
    'pt-BR': { name: 'Somalilândia', capital: 'Hargeisa', demonym: 'somalilandês', languages: ['Somali', 'Árabe'], currencyNames: ['Xelim da Somalilândia'], wikipediaSlug: 'Somalilândia' },
    'pt-PT': { name: 'Somalilândia', capital: 'Hargeisa', demonym: 'somalilandês', languages: ['Somali', 'Árabe'], currencyNames: ['Xelim da Somalilândia'], wikipediaSlug: 'Somalilândia' },
    el: { name: 'Σομαλιλάνδη', capital: 'Χαργκέισα', demonym: 'σομαλιλανδικός', languages: ['Σομαλική', 'Αραβική'], currencyNames: ['Σελίνι Σομαλιλάνδης'], wikipediaSlug: null },
    ca: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somalilandès', languages: ['Somalí', 'Àrab'], currencyNames: ['Xíling de Somaliland'], wikipediaSlug: null },
    da: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somalilandsk', languages: ['Somali', 'Arabisk'], currencyNames: ['Somalilandsk shilling'], wikipediaSlug: null },
    fi: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somalilandilainen', languages: ['Somali', 'Arabia'], currencyNames: ['Somalimaan šillinki'], wikipediaSlug: null },
    sk: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somalilandský', languages: ['Somálčina', 'Arabčina'], currencyNames: ['Somalilandský šiling'], wikipediaSlug: null },
    hr: { name: 'Somaliland', capital: 'Hargeisa', demonym: 'somalilandski', languages: ['Somalski', 'Arapski'], currencyNames: ['Somalilandski šiling'], wikipediaSlug: null },
  },
  CYN: {
    es: { name: 'Chipre del Norte', capital: 'Nicosia del Norte', demonym: 'turcochipriota', languages: ['Turco'], currencyNames: ['Lira turca'], wikipediaSlug: 'República_Turca_del_Norte_de_Chipre' },
    en: { name: 'Northern Cyprus', capital: 'North Nicosia', demonym: 'Northern Cypriot', languages: ['Turkish'], currencyNames: ['Turkish lira'], wikipediaSlug: 'Northern_Cyprus' },
    fr: { name: 'Chypre du Nord', capital: 'Nicosie-Nord', demonym: 'chypriote turc', languages: ['Turc'], currencyNames: ['Livre turque'], wikipediaSlug: 'Chypre_du_Nord' },
    de: { name: 'Nordzypern', capital: 'Nordzypern', demonym: 'nordzyprisch', languages: ['Türkisch'], currencyNames: ['Türkische Lira'], wikipediaSlug: 'Nordzypern' },
    it: { name: 'Cipro del Nord', capital: 'Nicosia Nord', demonym: 'cipriota turco', languages: ['Turco'], currencyNames: ['Lira turca'], wikipediaSlug: 'Cipro_del_Nord' },
    ja: { name: '北キプロス', capital: '北ニコシア', demonym: '北キプロスの', languages: ['トルコ語'], currencyNames: ['トルコリラ'], wikipediaSlug: '北キプロス・トルコ共和国' },
    ko: { name: '북키프로스', capital: '북니코시아', demonym: '북키프로스의', languages: ['터키어'], currencyNames: ['터키 리라'], wikipediaSlug: null },
    'zh-Hans': { name: '北塞浦路斯', capital: '北尼科西亚', demonym: '北塞浦路斯的', languages: ['土耳其语'], currencyNames: ['土耳其里拉'], wikipediaSlug: '北塞浦路斯' },
    'zh-Hant': { name: '北賽普勒斯', capital: '北尼科西亞', demonym: '北賽普勒斯的', languages: ['土耳其語'], currencyNames: ['土耳其里拉'], wikipediaSlug: '北賽普勒斯' },
    ru: { name: 'Северный Кипр', capital: 'Северная Никосия', demonym: 'северокипрский', languages: ['Турецкий'], currencyNames: ['Турецкая лира'], wikipediaSlug: 'Турецкая_Республика_Северного_Кипра' },
    hi: { name: 'उत्तरी साइप्रस', capital: 'उत्तर निकोसिया', demonym: 'उत्तरी साइप्रसी', languages: ['तुर्की'], currencyNames: ['तुर्की लीरा'], wikipediaSlug: null },
    th: { name: 'ไซปรัสเหนือ', capital: 'นิโคเซียเหนือ', demonym: 'ไซปรัสเหนือ', languages: ['ตุรกี'], currencyNames: ['ลีราตุรกี'], wikipediaSlug: null },
    vi: { name: 'Bắc Síp', capital: 'Bắc Nicosia', demonym: 'Bắc Síp', languages: ['Thổ Nhĩ Kỳ'], currencyNames: ['Lia Thổ Nhĩ Kỳ'], wikipediaSlug: null },
    tr: { name: 'Kuzey Kıbrıs', capital: 'Lefkoşa', demonym: 'Kuzey Kıbrıslı', languages: ['Türkçe'], currencyNames: ['Türk lirası'], wikipediaSlug: 'Kuzey_Kıbrıs_Türk_Cumhuriyeti' },
    pl: { name: 'Cypr Północny', capital: 'Nikozja Północna', demonym: 'północnocypryjski', languages: ['Turecki'], currencyNames: ['Lira turecka'], wikipediaSlug: null },
    nl: { name: 'Noord-Cyprus', capital: 'Noord-Nicosia', demonym: 'Noord-Cypriotisch', languages: ['Turks'], currencyNames: ['Turkse lira'], wikipediaSlug: null },
    sv: { name: 'Nordcypern', capital: 'Norra Nicosia', demonym: 'nordcypriotisk', languages: ['Turkiska'], currencyNames: ['Turkisk lira'], wikipediaSlug: null },
    ro: { name: 'Ciprul de Nord', capital: 'Nicosia de Nord', demonym: 'nord-cipriot', languages: ['Turcă'], currencyNames: ['Liră turcească'], wikipediaSlug: null },
    uk: { name: 'Північний Кіпр', capital: 'Північна Нікосія', demonym: 'північнокіпрський', languages: ['Турецька'], currencyNames: ['Турецька ліра'], wikipediaSlug: null },
    cs: { name: 'Severní Kypr', capital: 'Severní Nikósie', demonym: 'severokyperský', languages: ['Turečtina'], currencyNames: ['Turecká lira'], wikipediaSlug: null },
    hu: { name: 'Észak-Ciprus', capital: 'Észak-Nicosia', demonym: 'észak-ciprusi', languages: ['Török'], currencyNames: ['Török líra'], wikipediaSlug: null },
    id: { name: 'Siprus Utara', capital: 'Nikosia Utara', demonym: 'Siprus Utara', languages: ['Turki'], currencyNames: ['Lira Turki'], wikipediaSlug: null },
    ms: { name: 'Cyprus Utara', capital: 'Nicosia Utara', demonym: 'Cyprus Utara', languages: ['Turki'], currencyNames: ['Lira Turki'], wikipediaSlug: null },
    nb: { name: 'Nord-Kypros', capital: 'Nord-Nikosia', demonym: 'nordkypriotisk', languages: ['Tyrkisk'], currencyNames: ['Tyrkisk lira'], wikipediaSlug: null },
    'pt-BR': { name: 'Chipre do Norte', capital: 'Nicósia do Norte', demonym: 'cipriota turco', languages: ['Turco'], currencyNames: ['Lira turca'], wikipediaSlug: null },
    'pt-PT': { name: 'Chipre do Norte', capital: 'Nicósia do Norte', demonym: 'cipriota turco', languages: ['Turco'], currencyNames: ['Lira turca'], wikipediaSlug: null },
    el: { name: 'Βόρεια Κύπρος', capital: 'Βόρεια Λευκωσία', demonym: 'βορειοκυπριακός', languages: ['Τουρκικά'], currencyNames: ['Τουρκική λίρα'], wikipediaSlug: null },
    ca: { name: 'Xipre del Nord', capital: 'Nicòsia del Nord', demonym: 'xipriota turc', languages: ['Turc'], currencyNames: ['Lira turca'], wikipediaSlug: null },
    da: { name: 'Nordcypern', capital: 'Nord-Nicosia', demonym: 'nordcypriotisk', languages: ['Tyrkisk'], currencyNames: ['Tyrkisk lira'], wikipediaSlug: null },
    fi: { name: 'Pohjois-Kypros', capital: 'Pohjois-Nikosia', demonym: 'pohjoiskypriolainen', languages: ['Turkki'], currencyNames: ['Turkin liira'], wikipediaSlug: null },
    sk: { name: 'Severný Cyprus', capital: 'Severná Nikózia', demonym: 'severocyperský', languages: ['Turečtina'], currencyNames: ['Turecká líra'], wikipediaSlug: null },
    hr: { name: 'Sjeverni Cipar', capital: 'Sjeverna Nikozija', demonym: 'sjevernociparski', languages: ['Turski'], currencyNames: ['Turska lira'], wikipediaSlug: null },
  },
  AQ: {
    es: { name: 'Antártida', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antártida' },
    en: { name: 'Antarctica', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarctica' },
    fr: { name: 'Antarctique', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarctique' },
    de: { name: 'Antarktis', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarktis' },
    it: { name: 'Antartide', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antartide' },
    ja: { name: '南極大陸', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: '南極大陸' },
    ko: { name: '남극', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: '남극' },
    'zh-Hans': { name: '南极洲', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: '南极洲' },
    'zh-Hant': { name: '南極洲', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: '南極洲' },
    ru: { name: 'Антарктида', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Антарктида' },
    hi: { name: 'अंटार्कटिका', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: null },
    th: { name: 'แอนตาร์กติกา', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: null },
    vi: { name: 'Nam Cực', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: null },
    tr: { name: 'Antarktika', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarktika' },
    pl: { name: 'Antarktyka', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarktyka' },
    nl: { name: 'Antarctica', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarctica_(continent)' },
    sv: { name: 'Antarktis', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarktis' },
    ro: { name: 'Antarctica', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: null },
    uk: { name: 'Антарктида', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Антарктида' },
    cs: { name: 'Antarktida', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarktida' },
    hu: { name: 'Antarktisz', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarktisz' },
    id: { name: 'Antartika', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antartika' },
    ms: { name: 'Antartika', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: null },
    nb: { name: 'Antarktis', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarktis' },
    'pt-BR': { name: 'Antártida', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antártida' },
    'pt-PT': { name: 'Antártida', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antártida' },
    el: { name: 'Ανταρκτική', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Ανταρκτική' },
    ca: { name: 'Antàrtida', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antàrtida' },
    da: { name: 'Antarktis', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarktis' },
    fi: { name: 'Etelämanner', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Etelämanner' },
    sk: { name: 'Antarktída', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarktída' },
    hr: { name: 'Antarktika', capital: '', demonym: '', languages: [], currencyNames: [], wikipediaSlug: 'Antarktika' },
  },
};

const SYNTHETIC_BASE: BaseEntry[] = [
  { cca2: 'SOL', ccn3: '', continent: 'africa', population: 5700000, area: 137600, flagSvg: '', currencies: [{ code: 'SOS', symbol: 'Sl' }], hdi: null, ihdi: null, unMember: false },
  { cca2: 'CYN', ccn3: '', continent: 'europe', population: 382230, area: 3355, flagSvg: '', currencies: [{ code: 'TRY', symbol: '₺' }], hdi: null, ihdi: null, unMember: false },
  { cca2: 'AQ', ccn3: '010', continent: 'antarctica', population: 0, area: 14200000, flagSvg: '', currencies: [], hdi: null, ihdi: null, unMember: false },
];

const SYNTHETIC_CAPITAL_COORDS: Array<[string, [number, number]]> = [
  ['SOL', [9.56, 44.06]],
  ['CYN', [35.19, 33.36]],
];

function getSyntheticI18n(cca2: string, locale: string) {
  const byLocale = SYNTHETIC_I18N[cca2];
  if (!byLocale) return null;
  // Intentar locale exacto, luego fallback a inglés
  return byLocale[locale] ?? byLocale.en ?? null;
}

function mergeEntry(base: BaseEntry, i18n: I18nEntry): CountryData {
  return {
    cca2: base.cca2,
    ccn3: base.ccn3,
    name: i18n.name,
    capital: i18n.capital,
    continent: base.continent,
    population: base.population,
    area: base.area,
    flagSvg: base.flagSvg,
    currencies: base.currencies.map((c, idx) => ({
      name: i18n.currencyNames[idx] ?? c.code,
      symbol: c.symbol,
    })),
    languages: i18n.languages,
    demonym: i18n.demonym,
    hdi: base.hdi,
    ihdi: base.ihdi,
    wikipediaSlug: i18n.wikipediaSlug,
    unMember: base.unMember,
    ...(base.sovereignCountry ? { sovereignCountry: base.sovereignCountry } : {}),
  };
}

/**
 * Carga countries-base.json + i18n/{locale}.json y fusiona.
 * Cachea por locale; invalida al cambiar idioma.
 */
export async function loadCountryData(locale = 'es'): Promise<Map<string, CountryData>> {
  if (cachedLocale === locale && cachedCountries) return cachedCountries;

  // Cargar base (una sola vez): CDN tiene prioridad sobre bundled
  if (!cachedBase) {
    const cdnBase = await getCdnCountriesBase();
    if (cdnBase) {
      cachedBase = cdnBase as BaseEntry[];
    } else {
      const resp = await fetch(`${import.meta.env.BASE_URL}data/countries-base.json`);
      cachedBase = await resp.json();
    }
  }

  // Cargar i18n
  const i18nResp = await fetch(`${import.meta.env.BASE_URL}data/i18n/${locale}.json`);
  const i18nData: Record<string, I18nEntry> = await i18nResp.json();

  // Fusionar
  const map = new Map<string, CountryData>();
  for (const base of cachedBase!) {
    const i18n = i18nData[base.cca2];
    if (i18n) {
      map.set(base.cca2, mergeEntry(base, i18n));
    }
  }

  // Inyectar sintéticos
  for (const synthBase of SYNTHETIC_BASE) {
    if (!map.has(synthBase.cca2)) {
      const synthI18n = getSyntheticI18n(synthBase.cca2, locale);
      if (synthI18n) {
        map.set(synthBase.cca2, mergeEntry(synthBase, synthI18n));
      }
    }
  }

  cachedLocale = locale;
  cachedCountries = map;
  // Invalidar capitales (dependen del nombre traducido)
  cachedCapitals = null;
  return map;
}

/**
 * Carga capitals.json (coordenadas) y asigna nombres desde country data.
 * Requiere que loadCountryData() se haya ejecutado antes.
 */
export async function loadCapitals(): Promise<Map<string, CapitalCoords>> {
  if (cachedCapitals) return cachedCapitals;

  // Cargar coords (una sola vez)
  if (!cachedCoordsRaw) {
    const resp = await fetch(`${import.meta.env.BASE_URL}data/capitals.json`);
    cachedCoordsRaw = await resp.json();
  }

  const countries = getCountryData();
  const map = new Map<string, CapitalCoords>();

  for (const [cca2, coords] of Object.entries(cachedCoordsRaw!)) {
    const country = countries.get(cca2);
    map.set(cca2, { name: country?.capital ?? '', latlng: coords.latlng });
  }

  // Inyectar capitales de territorios sintéticos
  for (const [cca2, latlng] of SYNTHETIC_CAPITAL_COORDS) {
    if (!map.has(cca2)) {
      const country = countries.get(cca2);
      map.set(cca2, { name: country?.capital ?? '', latlng });
    }
  }

  cachedCapitals = map;
  return map;
}

/**
 * Getter síncrono para datos de países. Lanza error si no se ha cargado aún.
 */
export function getCountryData(): Map<string, CountryData> {
  if (!cachedCountries) throw new Error('Datos de países no cargados. Llama a loadCountryData() primero.');
  return cachedCountries;
}

/**
 * Getter síncrono para capitales. Lanza error si no se ha cargado aún.
 */
export function getCapitals(): Map<string, CapitalCoords> {
  if (!cachedCapitals) throw new Error('Datos de capitales no cargados. Llama a loadCapitals() primero.');
  return cachedCapitals;
}

/**
 * Invalida toda la caché. Llamar al cambiar de idioma.
 */
export function invalidateCache(): void {
  cachedLocale = null;
  cachedCountries = null;
  cachedCapitals = null;
}
