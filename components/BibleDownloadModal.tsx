import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { bibleStorageManager, SupportedBibleLanguage } from '@/services/BibleStorageManager';
import { useTranslation } from '@/hooks/useTranslation';

interface BibleDownloadModalProps {
  visible: boolean;
  language: SupportedBibleLanguage;
  languageDisplay: string;
  fileSize: number; // in bytes
  onClose: () => void;
  onDownloadComplete: () => void;
}

export default function BibleDownloadModal({
  visible,
  language,
  languageDisplay,
  fileSize,
  onClose,
  onDownloadComplete,
}: BibleDownloadModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedMB, setDownloadedMB] = useState(0);
  const [totalMB, setTotalMB] = useState(0);

  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(1);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setProgress(0);
    setTotalMB(parseFloat(formatFileSize(fileSize)));

    try {
      const success = await bibleStorageManager.downloadBible(
        language,
        (progressData) => {
          const progressPercent = progressData.progress * 100;
          const downloaded = parseFloat(formatFileSize(progressData.bytesDownloaded));
          
          setProgress(progressPercent);
          setDownloadedMB(downloaded);
        }
      );

      if (success) {
        Alert.alert(
          t('UI.alerts.success'),
          `${languageDisplay} ${t('UI.alerts.bibleDownloaded')}`,
          [
            {
              text: t('UI.alerts.ok'),
              onPress: () => {
                onDownloadComplete();
                onClose();
              },
            },
          ]
        );
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        t('UI.alerts.error'),
        t('UI.alerts.downloadFailed'),
        [
          {
            text: t('UI.alerts.tryAgain'),
            onPress: () => setIsDownloading(false),
          },
          {
            text: t('UI.alerts.cancel'),
            onPress: onClose,
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleCancel = () => {
    if (isDownloading) {
      Alert.alert(
        t('UI.alerts.cancelDownload'),
        t('UI.alerts.cancelDownloadMessage'),
        [
          {
            text: t('UI.alerts.continueDownload'),
            style: 'cancel',
          },
          {
            text: t('UI.alerts.cancel'),
            onPress: onClose,
            style: 'destructive',
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="cloud-download-outline" size={48} color={colors.tint} />
            <Text style={[styles.title, { color: colors.text }]}>
              {t('UI.bibleDownload.downloadBible')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              {languageDisplay}
            </Text>
          </View>

          {/* File Size Info */}
          {!isDownloading && (
            <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.secondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {t('UI.bibleDownload.fileSize')}: {formatFileSize(fileSize)} MB
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="wifi-outline" size={20} color={colors.secondary} />
                <Text style={[styles.infoText, { color: colors.secondary }]}>
                  {t('UI.bibleDownload.wifiRecommended')}
                </Text>
              </View>
            </View>
          )}

          {/* Progress */}
          {isDownloading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTextRow}>
                <Text style={[styles.progressText, { color: colors.text }]}>
                  {t('UI.bibleDownload.downloading')}...
                </Text>
                <Text style={[styles.progressPercent, { color: colors.tint }]}>
                  {progress.toFixed(0)}%
                </Text>
              </View>
              
              <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.tint, width: `${progress}%` },
                  ]}
                />
              </View>

              <Text style={[styles.progressDetails, { color: colors.secondary }]}>
                {downloadedMB.toFixed(1)} / {totalMB.toFixed(1)} MB
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {!isDownloading ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                  onPress={handleCancel}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    {t('UI.alerts.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.downloadButton, { backgroundColor: colors.tint }]}
                  onPress={handleDownload}
                >
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                  <Text style={[styles.buttonText, { color: '#FFFFFF', marginLeft: 8 }]}>
                    {t('UI.bibleDownload.download')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCancel}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  {t('UI.alerts.cancel')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressDetails: {
    fontSize: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  downloadButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

