import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { ThreadColors } from '@/constants/Colors';
import { FF } from '@/constants/featureFlags';
import { useFontSize } from '@/context/FontSizeContext';
import { useSyncAppSettings, SupportedLanguage } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { bibleStorageManager } from '@/services/BibleStorageManager';
import BibleDownloadModal from '@/components/BibleDownloadModal';

type AppearanceMode = 'light' | 'dark' | 'auto';
type FontSizeOption = 'small' | 'medium' | 'large';

export default function SettingsScreen() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const { fontSize, setFontSize, sizes } = useFontSize();
  const {
    isDarkMode,
    setDarkMode,
    isOrientationLocked,
    setOrientationLock,
    language,
    setLanguage,
  } = useSyncAppSettings();
  const { t } = useTranslation();

  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;

  // Appearance mode: derive initial from current isDarkMode + system
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>(() => {
    if (isDarkMode && systemScheme === 'dark') return 'auto';
    if (!isDarkMode && systemScheme !== 'dark') return 'auto';
    return isDarkMode ? 'dark' : 'light';
  });

  const handleAppearanceChange = async (mode: AppearanceMode) => {
    setAppearanceMode(mode);
    switch (mode) {
      case 'light':
        await setDarkMode(false);
        break;
      case 'dark':
        await setDarkMode(true);
        break;
      case 'auto':
        await setDarkMode(systemScheme === 'dark');
        break;
    }
  };

  // Keep auto mode in sync with system changes
  useEffect(() => {
    if (appearanceMode === 'auto') {
      setDarkMode(systemScheme === 'dark');
    }
  }, [systemScheme, appearanceMode]);

  // French Bible download state
  const [isFrenchBibleDownloaded, setIsFrenchBibleDownloaded] = useState(false);
  const [showBibleDownloadModal, setShowBibleDownloadModal] = useState(false);
  const [checkingDownload, setCheckingDownload] = useState(false);
  const [frenchBibleSize, setFrenchBibleSize] = useState(52073208);
  const [downloadedFrenchBibleSize, setDownloadedFrenchBibleSize] = useState<number | null>(null);

  const formatFileSize = (bytes: number): string => (bytes / 1024 / 1024).toFixed(1);

  const checkBibleDownloadStatus = async () => {
    if (language === 'fr') {
      setCheckingDownload(true);
      const isDownloaded = await bibleStorageManager.isBibleDownloaded('fr');
      setIsFrenchBibleDownloaded(isDownloaded);

      const metadata = await bibleStorageManager.getBibleMetadata('fr');
      if (metadata) setFrenchBibleSize(metadata.files.bible.size);

      if (isDownloaded) {
        try {
          const actualSize = await bibleStorageManager.getBibleSize('fr');
          setDownloadedFrenchBibleSize(actualSize > 0 ? actualSize : (metadata?.files.bible.size || null));
        } catch {
          setDownloadedFrenchBibleSize(metadata?.files.bible.size || null);
        }
      } else {
        setDownloadedFrenchBibleSize(null);
      }
      setCheckingDownload(false);
    }
  };

  useEffect(() => {
    checkBibleDownloadStatus();
  }, [language]);

  const handleLanguageToggle = async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    if (lang === 'fr') {
      const isDownloaded = await bibleStorageManager.isBibleDownloaded('fr');
      setIsFrenchBibleDownloaded(isDownloaded);
      if (!isDownloaded) {
        let size = frenchBibleSize;
        try {
          const metadata = await bibleStorageManager.getBibleMetadata('fr');
          if (metadata) {
            size = metadata.files.bible.size;
            setFrenchBibleSize(size);
          }
        } catch {}
        const mb = formatFileSize(size);
        const message =
          lang === 'fr'
            ? `La Bible française est requise pour lire en français. Voulez-vous la télécharger maintenant ? (${mb} Mo)`
            : `French Bible is required to read in French. Would you like to download it now? (${mb} MB)`;
        setTimeout(() => {
          Alert.alert(t('UI.bibleDownload.downloadBible'), message, [
            { text: t('UI.alerts.cancel'), style: 'cancel' },
            { text: t('UI.bibleDownload.download'), onPress: () => setShowBibleDownloadModal(true) },
          ]);
        }, 500);
      }
    }
  };

  const handleDeleteBible = () => {
    Alert.alert(t('UI.bibleDownload.deleteBible'), t('UI.bibleDownload.deleteBibleConfirm'), [
      { text: t('UI.alerts.cancel'), style: 'cancel' },
      {
        text: t('UI.bibleDownload.delete'),
        style: 'destructive',
        onPress: async () => {
          const success = await bibleStorageManager.deleteBible('fr');
          if (success) {
            setIsFrenchBibleDownloaded(false);
            setDownloadedFrenchBibleSize(null);
            Alert.alert(t('UI.alerts.success'), t('UI.bibleDownload.bibleDeleted'));
            await checkBibleDownloadStatus();
          }
        },
      },
    ]);
  };

  const sliderValue = useMemo(() => {
    switch (fontSize) {
      case 'small': return 0;
      case 'medium': return 1;
      case 'large': return 2;
      default: return 1;
    }
  }, [fontSize]);

  const handleSliderChange = (value: number) => {
    const size: FontSizeOption = value <= 0.5 ? 'small' : value <= 1.5 ? 'medium' : 'large';
    setFontSize(size);
  };

  const appearanceOptions: { label: string; value: AppearanceMode }[] = [
    { label: t('UI.settings.light'), value: 'light' },
    { label: t('UI.settings.dark'), value: 'dark' },
    { label: t('UI.settings.auto'), value: 'auto' },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: palette.hair }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={palette.ink} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.ink }]}>{t('UI.settings.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Language */}
        {FF.FRENCH_ENABLED && (
          <>
            <Text style={[styles.sectionLabel, { color: palette.mute }]}>
              {t('UI.settings.language')}
            </Text>
            <View style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
              {(['en', 'fr'] as SupportedLanguage[]).map((lang, i) => (
                <Pressable
                  key={lang}
                  style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.hair }]}
                  onPress={() => handleLanguageToggle(lang)}
                >
                  <Text style={[styles.rowText, { color: palette.ink }]}>
                    {lang === 'en' ? 'English' : 'Français'}
                  </Text>
                  {language === lang && <Ionicons name="checkmark" size={18} color={palette.acc} />}
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* French Bible Download */}
        {FF.FRENCH_ENABLED && language === 'fr' && (
          <>
            <Text style={[styles.sectionLabel, { color: palette.mute }]}>
              {(t('UI.bibleDownload.frenchBible') || 'FRENCH BIBLE').toUpperCase()}
            </Text>
            <View style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
              {checkingDownload ? (
                <View style={styles.row}>
                  <Text style={[styles.rowText, { color: palette.mute }]}>{t('UI.bibleDownload.checking')}…</Text>
                </View>
              ) : isFrenchBibleDownloaded ? (
                <>
                  <View style={styles.row}>
                    <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                    <Text style={[styles.rowText, { color: palette.ink, marginLeft: 8 }]}>
                      {t('UI.bibleDownload.downloaded')} ({downloadedFrenchBibleSize ? formatFileSize(downloadedFrenchBibleSize) : formatFileSize(frenchBibleSize)} MB)
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.hair }]}
                    onPress={handleDeleteBible}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    <Text style={[styles.rowText, { color: '#FF3B30', marginLeft: 8 }]}>
                      {t('UI.bibleDownload.delete')}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.row}>
                    <Ionicons name="cloud-download-outline" size={18} color={palette.mute} />
                    <Text style={[styles.rowText, { color: palette.mute, marginLeft: 8 }]}>
                      {t('UI.bibleDownload.notDownloaded')}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.hair }]}
                    onPress={() => setShowBibleDownloadModal(true)}
                  >
                    <Ionicons name="download-outline" size={16} color={palette.acc} />
                    <Text style={[styles.rowText, { color: palette.acc, marginLeft: 8 }]}>
                      {t('UI.bibleDownload.downloadNow')} ({formatFileSize(frenchBibleSize)} MB)
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </>
        )}

        {/* Font Size */}
        <Text style={[styles.sectionLabel, { color: palette.mute }]}>
          {t('UI.settings.fontSize')}
        </Text>
        <View style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
          <View style={styles.fontRow}>
            <Text style={{ fontSize: sizes.caption, color: palette.ink }}>A</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={2}
              step={1}
              value={sliderValue}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={palette.acc}
              maximumTrackTintColor={palette.hair}
              thumbTintColor={palette.acc}
            />
            <Text style={{ fontSize: sizes.title, color: palette.ink }}>A</Text>
          </View>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: palette.mute }]}>
          {t('UI.settings.appearance')}
        </Text>
        <View style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
          {appearanceOptions.map((opt, i) => (
            <Pressable
              key={opt.value}
              style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.hair }]}
              onPress={() => handleAppearanceChange(opt.value)}
            >
              <Text style={[styles.rowText, { color: palette.ink }]}>{opt.label}</Text>
              {appearanceMode === opt.value && <Ionicons name="checkmark" size={18} color={palette.acc} />}
            </Pressable>
          ))}
        </View>

        {/* Orientation Lock */}
        <Text style={[styles.sectionLabel, { color: palette.mute }]}>
          {t('UI.settings.orientation')}
        </Text>
        <View style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
          <View style={styles.row}>
            <Text style={[styles.rowText, { color: palette.ink }]}>{t('UI.settings.lockOrientation')}</Text>
            <Switch
              value={isOrientationLocked}
              onValueChange={(v) => setOrientationLock(v)}
              trackColor={{ true: palette.acc }}
            />
          </View>
        </View>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: palette.mute }]}>{t('UI.settings.info')}</Text>
        <View style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
          <Pressable style={styles.row} onPress={() => router.push('/About')}>
            <Text style={[styles.rowText, { color: palette.ink }]}>{t('UI.about.title')}</Text>
            <Ionicons name="chevron-forward" size={16} color={palette.mute} />
          </Pressable>
        </View>
      </ScrollView>

      <BibleDownloadModal
        visible={showBibleDownloadModal}
        language="fr"
        languageDisplay="Français"
        fileSize={frenchBibleSize}
        onClose={() => setShowBibleDownloadModal(false)}
        onDownloadComplete={async () => {
          setIsFrenchBibleDownloaded(true);
          setShowBibleDownloadModal(false);
          await checkBibleDownloadStatus();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  scroll: { paddingBottom: 60 },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 6,
    paddingHorizontal: 14,
  },
  card: {
    marginHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    minHeight: 44,
  },
  rowText: { fontSize: 15 },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  slider: { flex: 1, height: 40 },
});
