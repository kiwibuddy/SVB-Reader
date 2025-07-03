import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useAppSettings } from '@/context/AppSettingsContext';
import i18next from '@/config/i18n';

export const useTranslation = () => {
  const { language } = useAppSettings();
  const { t } = useI18nTranslation();
  


  // Sync language with i18next
  if (i18next.language !== language) {

    i18next.changeLanguage(language);
  }

  return { t };
};