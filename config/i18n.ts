import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import UI_ENG from '@/assets/data/UI-ENG.json';
import UI_FRA from '@/assets/data/FRA-UI.json';
import threadUi from '@/assets/data/thread-ui.json';

function withThread(base: Record<string, unknown>, extra: { tabs: object; thread: object }) {
  const ui = (base.UI || {}) as Record<string, unknown>;
  return {
    ...base,
    UI: {
      ...ui,
      tabs: { ...(ui.tabs as object), ...extra.tabs },
      thread: extra.thread,
    },
  };
}

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: withThread(UI_ENG as Record<string, unknown>, threadUi.en) },
      fr: { translation: withThread(UI_FRA as Record<string, unknown>, threadUi.fr) },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    debug: false
  });

export default i18next;
