import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import UI_ENG from '@/assets/data/UI-ENG.json';
import UI_FRA from '@/assets/data/FRA-UI.json';
// import UI_GER from '@/assets/data/UI-GER.json'; // German support - coming in future version

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: UI_ENG },
      fr: { translation: UI_FRA },
      // de: { translation: UI_GER }, // German support - coming in future version
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    debug: false // Set to false to disable missing key warnings
  });

export default i18next; 