import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import i18next from '@/config/i18n';
import { useEffect } from 'react';

export const useTranslation = () => {
  const { language } = useSyncAppSettings();
  const { t, i18n } = useI18nTranslation();

  // Force re-render when language changes
  useEffect(() => {
    if (i18next.language !== language) {
      i18next.changeLanguage(language);
    }
  }, [language]);

  return { t };
};
