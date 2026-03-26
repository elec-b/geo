// Configuración de i18next para GeoExpert
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonEs from './locales/es/common.json';
import exploreEs from './locales/es/explore.json';
import gameEs from './locales/es/game.json';
import passportEs from './locales/es/passport.json';
import statsEs from './locales/es/stats.json';
import settingsEs from './locales/es/settings.json';
import profileEs from './locales/es/profile.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'es',
    fallbackLng: 'es',
    ns: ['common', 'explore', 'game', 'passport', 'stats', 'settings', 'profile'],
    defaultNS: 'common',
    resources: {
      es: {
        common: commonEs,
        explore: exploreEs,
        game: gameEs,
        passport: passportEs,
        stats: statsEs,
        settings: settingsEs,
        profile: profileEs,
      },
    },
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },
  });

export default i18n;
