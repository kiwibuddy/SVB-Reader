import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import i18next from '@/config/i18n';
import { useEffect } from 'react';

export const useTranslation = () => {
  const { language } = useSyncAppSettings();
  const { t, i18n } = useI18nTranslation();

  // Force re-render when language changes
  useEffect(() => {
    console.log('[useTranslation] Language changed to:', language);
    console.log('[useTranslation] i18next current language:', i18next.language);
  if (i18next.language !== language) {
      console.log('[useTranslation] Changing i18next language to:', language);
    i18next.changeLanguage(language);
  }
  }, [language]);

  return { t };
};
