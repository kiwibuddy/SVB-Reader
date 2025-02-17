import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { useFontSize } from '@/context/FontSizeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { SupportedLanguage } from '@/context/AppSettingsContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

type FontSize = 'small' | 'medium' | 'large';

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { fontSize, setFontSize, sizes } = useFontSize();
  const { 
    isOrientationLocked, 
    setOrientationLock, 
    isDarkMode, 
    setDarkMode, 
    colors,
    language,
    setLanguage 
  } = useAppSettings();
  const { t } = useTranslation();

  const languages: Array<{ label: string; value: SupportedLanguage }> = [
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
    { label: 'Deutsch', value: 'de' }
  ];

  const sliderValue = useMemo(() => {
    switch(fontSize) {
      case 'small': return 0;
      case 'medium': return 1;
      case 'large': return 2;
      default: return 1;
    }
  }, [fontSize]);

  const handleSliderChange = (value: number) => {
    const size = value <= 0.5 ? 'small' : value <= 1.5 ? 'medium' : 'large';
    setFontSize(size);
  };

  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.background + 'CC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      width: '80%',
      maxWidth: 400,
    },
    title: {
      fontSize: sizes.title,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: colors.text,
    },
    setting: {
      marginBottom: 20,
    },
    settingLabel: {
      fontSize: sizes.subtitle,
      marginBottom: 8,
      color: colors.text,
    },
    fontSizePreview: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 10,
    },
    previewText: {
      color: '#007AFF',
      fontSize: sizes.body,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    picker: {
      width: '100%',
      height: 50,
    },
    closeButton: {
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 10,
      marginTop: 10,
    },
    closeButtonText: {
      color: 'white',
      textAlign: 'center',
      fontSize: sizes.button,
      fontWeight: '600',
    },
    languageSelector: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
      width: '100%',
    },
    languageOption: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedLanguage: {
      backgroundColor: colors.primary + '20',
    },
    languageText: {
      color: colors.text,
      fontSize: 16,
    },
    selectedLanguageText: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <View style={modalStyles.modalContent}>
          <Text style={modalStyles.title}>Settings</Text>
          
          {/* Font Size */}
          <View style={modalStyles.setting}>
            <Text style={modalStyles.settingLabel}>Font Size</Text>
            <View style={modalStyles.fontSizePreview}>
              {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                <Text 
                  key={size}
                  style={[
                    modalStyles.previewText,
                    { fontSize: size === 'small' ? sizes.caption : 
                             size === 'medium' ? sizes.body : 
                             sizes.title }
                  ]}
                >
                  AAA
                </Text>
              ))}
            </View>
            <Slider
              style={modalStyles.slider}
              minimumValue={0}
              maximumValue={2}
              step={1}
              value={sliderValue}
              onValueChange={handleSliderChange}
            />
          </View>

          {/* Language Selection */}
          <View style={modalStyles.setting}>
            <Text style={modalStyles.settingLabel}>Language</Text>
            <View style={modalStyles.languageSelector}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={[
                    modalStyles.languageOption,
                    language === lang.value && modalStyles.selectedLanguage,
                  ]}
                  onPress={() => setLanguage(lang.value)}
                >
                  <Text
                    style={[
                      modalStyles.languageText,
                      language === lang.value && modalStyles.selectedLanguageText,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dark Mode */}
          <View style={modalStyles.setting}>
            <Text style={modalStyles.settingLabel}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={async (value) => {
                await setDarkMode(value);
              }}
            />
          </View>

          {/* Orientation Lock */}
          <View style={modalStyles.setting}>
            <Text style={modalStyles.settingLabel}>Lock Screen Orientation</Text>
            <Switch
              value={isOrientationLocked}
              onValueChange={async (value) => {
                await setOrientationLock(value);
              }}
            />
          </View>

          <TouchableOpacity 
            style={modalStyles.closeButton}
            onPress={onClose}
          >
            <Text style={modalStyles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

export default SettingsModal;
