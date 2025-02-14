import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppSettings, type SupportedLanguage } from '@/context/AppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsScreen() {
  const { language, setLanguage } = useAppSettings();
  const { t } = useTranslation();

  const languages: Array<{label: string, value: SupportedLanguage}> = [
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
    { label: 'Deutsch', value: 'de' }
  ] as const;

  const styles = StyleSheet.create({
    languageButton: {
      padding: 10,
      marginVertical: 5,
      borderRadius: 5,
      backgroundColor: '#f0f0f0',
    },
    selectedLanguage: {
      backgroundColor: '#007AFF',
    }
  });

  return (
    // ... existing settings UI
    <View>
      <Text>{t('selectLanguage')}</Text>
      {languages.map(lang => (
        <TouchableOpacity 
          key={lang.value}
          onPress={() => setLanguage(lang.value)}
          style={[
            styles.languageButton,
            language === lang.value && styles.selectedLanguage
          ]}
        >
          <Text>{lang.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
} 