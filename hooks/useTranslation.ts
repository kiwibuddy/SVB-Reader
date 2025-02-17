import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useAppSettings } from '@/context/AppSettingsContext';
import i18next from '@/config/i18n';

export const useTranslation = () => {
  const { language } = useAppSettings();
  const { t } = useI18nTranslation();
  
  console.log('Current language:', language); // Debug log
  console.log('i18next language:', i18next.language); // Debug log

  // Sync language with i18next
  if (i18next.language !== language) {
    console.log('Changing language to:', language); // Debug log
    i18next.changeLanguage(language);
  }

  return { t };
};