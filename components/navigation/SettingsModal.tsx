import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { useFontSize } from '@/context/FontSizeContext';
import { useSyncAppSettings, SupportedLanguage } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { bibleStorageManager } from '@/services/BibleStorageManager';
import BibleDownloadModal from '@/components/BibleDownloadModal';

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
  } = useSyncAppSettings();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  // State for collapsible language selector
  const [isLanguageExpanded, setIsLanguageExpanded] = useState(false);
  
  // State for Bible downloads
  const [isFrenchBibleDownloaded, setIsFrenchBibleDownloaded] = useState(false);
  const [showBibleDownloadModal, setShowBibleDownloadModal] = useState(false);
  const [checkingDownload, setCheckingDownload] = useState(false);
  const [frenchBibleSize, setFrenchBibleSize] = useState(52073208); // Default to new size (49.7 MB)
  const [downloadedFrenchBibleSize, setDownloadedFrenchBibleSize] = useState<number | null>(null); // Actual downloaded file size

  // Supported languages: English and French
  const languages: { label: string; value: SupportedLanguage }[] = [
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
    // { label: 'Deutsch', value: 'de' }   // German support - coming in future version
  ];
  
  // Check if French Bible is downloaded
  useEffect(() => {
    checkBibleDownloadStatus();
  }, [language]);

  const checkBibleDownloadStatus = async () => {
    if (language === 'fr') {
      setCheckingDownload(true);
      const isDownloaded = await bibleStorageManager.isBibleDownloaded('fr');
      setIsFrenchBibleDownloaded(isDownloaded);
      
      // Fetch metadata to get expected file size
      const metadata = await bibleStorageManager.getBibleMetadata('fr');
      if (metadata) {
        setFrenchBibleSize(metadata.files.bible.size);
      }
      
      // If Bible is downloaded, get the actual file size
      if (isDownloaded) {
        try {
          const actualSize = await bibleStorageManager.getBibleSize('fr');
          if (actualSize > 0) {
            setDownloadedFrenchBibleSize(actualSize);
          } else {
            // If getBibleSize returns 0, fall back to metadata size
            setDownloadedFrenchBibleSize(metadata?.files.bible.size || null);
          }
        } catch (error) {
          console.error('Failed to get downloaded Bible size:', error);
          // Fall back to metadata size if we can't get actual size
          setDownloadedFrenchBibleSize(metadata?.files.bible.size || null);
        }
      } else {
        setDownloadedFrenchBibleSize(null);
      }
      
      setCheckingDownload(false);
    }
  };

  // Helper function to format file size (matches BibleDownloadModal)
  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(1);
  };

  // Handle language change - only one can be active at a time
  const handleLanguageToggle = async (selectedLang: SupportedLanguage) => {
    await setLanguage(selectedLang);
    
    // Check if French Bible is downloaded when switching to French
    if (selectedLang === 'fr') {
      const isDownloaded = await bibleStorageManager.isBibleDownloaded('fr');
      setIsFrenchBibleDownloaded(isDownloaded);
      
      if (!isDownloaded) {
        // Fetch metadata to get actual file size
        let actualFileSize = frenchBibleSize; // Use cached size if available
        try {
          const metadata = await bibleStorageManager.getBibleMetadata('fr');
          if (metadata) {
            actualFileSize = metadata.files.bible.size;
            setFrenchBibleSize(actualFileSize); // Cache it for future use
          }
        } catch (error) {
          console.error('Failed to fetch Bible metadata:', error);
          // Fall back to cached size if fetch fails
        }

        // Build alert message with actual file size
        const fileSizeMB = formatFileSize(actualFileSize);
        // Use selectedLang to determine message language (since we just switched to French)
        const message = selectedLang === 'fr' 
          ? `La Bible française est requise pour lire en français. Voulez-vous la télécharger maintenant ? (${fileSizeMB} Mo)`
          : `French Bible is required to read in French. Would you like to download it now? (${fileSizeMB} MB)`;

        // Prompt user to download French Bible
        setTimeout(() => {
          Alert.alert(
            t('UI.bibleDownload.downloadBible'),
            message,
            [
              {
                text: t('UI.alerts.cancel'),
                style: 'cancel',
              },
              {
                text: t('UI.bibleDownload.download'),
                onPress: () => setShowBibleDownloadModal(true),
              },
            ]
          );
        }, 500);
      }
    }
  };

  const handleDeleteBible = async () => {
    Alert.alert(
      t('UI.bibleDownload.deleteBible'),
      t('UI.bibleDownload.deleteBibleConfirm'),
      [
        {
          text: t('UI.alerts.cancel'),
          style: 'cancel',
        },
        {
          text: t('UI.bibleDownload.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await bibleStorageManager.deleteBible('fr');
            if (success) {
              setIsFrenchBibleDownloaded(false);
              setDownloadedFrenchBibleSize(null);
              Alert.alert(t('UI.alerts.success'), t('UI.bibleDownload.bibleDeleted'));
              // Refresh download status
              await checkBibleDownloadStatus();
            }
          },
        },
      ]
    );
  };

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
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      zIndex: 100000,
    },
    modalContent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      paddingTop: Math.max(insets.top + 20, 20),
      paddingHorizontal: 20,
      paddingBottom: Math.max(insets.bottom + 20, 20),
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
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingVertical: 8,
    },
    settingLabel: {
      fontSize: sizes.subtitle,
      marginBottom: 8,
      color: colors.text,
    },
    settingLabelContainer: {
      flex: 1,
    },
    settingValue: {
      fontSize: sizes.caption,
      color: colors.secondary,
      marginTop: 4,
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
    languageList: {
      backgroundColor: colors.card,
      borderRadius: 8,
      marginTop: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageItemText: {
      fontSize: sizes.body,
      color: colors.text,
    },
    languageItemTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    downloadStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      gap: 8,
    },
    downloadStatusText: {
      fontSize: sizes.body,
      marginLeft: 8,
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 8,
    },
    downloadButtonText: {
      color: '#FFFFFF',
      fontSize: sizes.body,
      fontWeight: '600',
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      gap: 6,
      marginTop: 8,
    },
    deleteButtonText: {
      fontSize: sizes.caption,
      fontWeight: '500',
    },
  });

  const slideAnim = React.useRef(new Animated.Value(-1000)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 15,
        bounciness: 5
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -1000,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          modalStyles.overlay,
          {
            transform: [{
              translateY: slideAnim
            }]
          }
        ]}
      >
        <View style={{width: '100%', height: '100%'}}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.title}>{t('UI.settings.title')}</Text>
            
            {/* Font Size */}
            <View style={modalStyles.setting}>
              <Text style={modalStyles.settingLabel}>{t('UI.settings.fontSize')}</Text>
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

            {/* Language Selection - Collapsible */}
            <View style={modalStyles.setting}>
              <TouchableOpacity 
                style={modalStyles.settingRow}
                onPress={() => setIsLanguageExpanded(!isLanguageExpanded)}
              >
                <View style={modalStyles.settingLabelContainer}>
                  <Text style={modalStyles.settingLabel}>{t('UI.settings.language')}</Text>
                  <Text style={modalStyles.settingValue}>
                    {language === 'fr' ? 'Français' : 'English'}
                  </Text>
                </View>
                <MaterialIcons 
                  name={isLanguageExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>
              
              {/* Expanded Language List */}
              {isLanguageExpanded && (
                <View style={modalStyles.languageList}>
                  {languages.map((lang, index) => {
                    const isActive = language === lang.value;
                    
                    return (
                      <View 
                        key={lang.value} 
                        style={[
                          modalStyles.languageItem,
                          index === languages.length - 1 && { borderBottomWidth: 0 }
                        ]}
                      >
                        <Text style={[
                          modalStyles.languageItemText,
                          isActive && modalStyles.languageItemTextActive
                        ]}>
                          {lang.label} {isActive && '✓'}
                        </Text>
                        <Switch
                          value={isActive}
                          onValueChange={async (isOn) => {
                            if (isOn && !isActive) {
                              await handleLanguageToggle(lang.value);
                            }
                          }}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Bible Downloads Section - Only show when French is selected */}
            {language === 'fr' && (
              <View style={modalStyles.setting}>
                <Text style={[modalStyles.settingLabel, { marginBottom: 12 }]}>
                  📖 {t('UI.bibleDownload.frenchBible')}
                </Text>
                
                {checkingDownload ? (
                  <Text style={[modalStyles.settingValue, { marginLeft: 8 }]}>
                    {t('UI.bibleDownload.checking')}...
                  </Text>
                ) : isFrenchBibleDownloaded ? (
                  <View>
                    <View style={[modalStyles.downloadStatus, { backgroundColor: colors.card }]}>
                      <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                      <Text style={[modalStyles.downloadStatusText, { color: colors.text }]}>
                        {t('UI.bibleDownload.downloaded')} ({downloadedFrenchBibleSize ? formatFileSize(downloadedFrenchBibleSize) : formatFileSize(frenchBibleSize)} MB)
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[modalStyles.deleteButton, { borderColor: colors.border }]}
                      onPress={handleDeleteBible}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      <Text style={[modalStyles.deleteButtonText, { color: '#FF3B30' }]}>
                        {t('UI.bibleDownload.delete')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={[modalStyles.downloadStatus, { backgroundColor: colors.card }]}>
                      <Ionicons name="cloud-download-outline" size={20} color={colors.secondary} />
                      <Text style={[modalStyles.downloadStatusText, { color: colors.secondary }]}>
                        {t('UI.bibleDownload.notDownloaded')}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[modalStyles.downloadButton, { backgroundColor: colors.primary }]}
                      onPress={() => setShowBibleDownloadModal(true)}
                    >
                      <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                      <Text style={modalStyles.downloadButtonText}>
                        {t('UI.bibleDownload.downloadNow')} ({(frenchBibleSize / 1024 / 1024).toFixed(1)} MB)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Dark Mode */}
            <View style={modalStyles.settingRow}>
              <Text style={modalStyles.settingLabel}>{t('UI.settings.darkMode')}</Text>
              <Switch
                value={isDarkMode}
                onValueChange={async (value) => {
                  await setDarkMode(value);
                }}
              />
            </View>

            {/* Orientation Lock */}
            <View style={modalStyles.settingRow}>
              <Text style={modalStyles.settingLabel}>{t('UI.settings.lockOrientation')}</Text>
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
              <Text style={modalStyles.closeButtonText}>{t('UI.settings.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Bible Download Modal */}
      <BibleDownloadModal
        visible={showBibleDownloadModal}
        language="fr"
        languageDisplay="Français"
        fileSize={frenchBibleSize} // Dynamically fetched from metadata
        onClose={() => setShowBibleDownloadModal(false)}
        onDownloadComplete={async () => {
          setIsFrenchBibleDownloaded(true);
          setShowBibleDownloadModal(false);
          // Refresh download status to get actual file size
          await checkBibleDownloadStatus();
        }}
      />
    </Modal>
  );
};

export default SettingsModal;
