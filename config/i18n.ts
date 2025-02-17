import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import UI_FRE from '@/assets/data/UI-FRE.json';
import UI_GER from '@/assets/data/UI-GER.json';
import UI_ENG from '@/assets/data/UI-ENG.json';

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: UI_ENG },
      fr: { translation: UI_FRE },
      de: { translation: UI_GER },
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    debug: true // Add this temporarily to see what's happening
  });

export default i18next; 