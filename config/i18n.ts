import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
// MVP: Only English for now, will add other languages in v2
// import UI_FRE from '@/assets/data/UI-FRE.json';
// import UI_GER from '@/assets/data/UI-GER.json';
import UI_ENG from '@/assets/data/UI-ENG.json';

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: UI_ENG },
      // MVP: Removed for launch, will re-add in v2
      // fr: { translation: UI_FRE },
      // de: { translation: UI_GER },
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    debug: false // Set to false to disable missing key warnings
  });

export default i18next; 