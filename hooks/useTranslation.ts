import { useAppSettings, type SupportedLanguage } from '@/context/AppSettingsContext';
import en from '@/assets/data/UI-ENG.json';
import fr from '@/assets/data/UI-FRE.json';
import de from '@/assets/data/UI-GER.json';

interface TranslationUI {
  UI: {
    [key: string]: string;
  };
}

const translations: Record<SupportedLanguage, TranslationUI> = {
  en,
  fr,
  de
} as const;

export const useTranslation = () => {
  const { language } = useAppSettings();
  
  const t = (key: string): string => {
    try {
      return translations[language]?.UI?.[key] || translations.en.UI[key] || key;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return key;
    }
  };

  return { t };
};