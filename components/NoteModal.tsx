import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import NoteInput from './NoteInput';

// Dynamically import expo-clipboard to prevent crash if module isn't available
let Clipboard: any = null;
try {
  Clipboard = require('expo-clipboard');
} catch (error) {
  console.log('expo-clipboard not available, copy feature will be disabled');
}

interface NoteModalProps {
  visible: boolean;
  noteText: string;
  emojiIcon?: string | null;
  scriptureReference?: string;
  scriptureText?: string;
  onClose: () => void;
  onEdit: (newNoteText: string) => void;
  onDelete: () => void;
}

const NoteModal: React.FC<NoteModalProps> = ({
  visible,
  noteText,
  emojiIcon,
  scriptureReference,
  scriptureText,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { colors, isDarkMode } = useAppSettings();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animate modal entrance
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      setIsEditing(false);
      setShowExportMenu(false);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Haptic feedback
            if (Platform.OS === 'ios') {
              try {
                const Haptics = await import('expo-haptics');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              } catch (error) {
                // Haptics not available
              }
            }
            onDelete();
          },
        },
      ]
    );
  };

  const handleExport = async (mode: 'note-only' | 'scripture-and-note') => {
    if (!Clipboard) {
      Alert.alert('Not Available', 'Copy feature requires app update. Please rebuild the app.', [{ text: 'OK' }]);
      return;
    }

    let textToCopy = '';

    if (mode === 'note-only') {
      textToCopy = noteText;
    } else {
      const parts = [];
      if (scriptureReference) parts.push(scriptureReference);
      if (scriptureText) parts.push(scriptureText);
      if (noteText) parts.push(`\nNote: ${noteText}`);
      textToCopy = parts.join('\n');
    }

    await Clipboard.setStringAsync(textToCopy);

    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = await import('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics not available
      }
    }

    // Show confirmation (you can replace with a toast notification if you have one)
    Alert.alert('Copied!', 'Note has been copied to clipboard.', [{ text: 'OK' }]);
    setShowExportMenu(false);
  };

  const handleSaveEdit = (newNoteText: string) => {
    onEdit(newNoteText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDeleteFromEdit = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Haptic feedback
            if (Platform.OS === 'ios') {
              try {
                const Haptics = await import('expo-haptics');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              } catch (error) {
                // Haptics not available
              }
            }
            onDelete();
            setIsEditing(false);
          },
        },
      ]
    );
  };

  // If in editing mode, show the NoteInput component
  if (isEditing) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.editContainer}>
          <NoteInput
            initialValue={noteText}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
            onDelete={handleDeleteFromEdit}
            isEditing={true}
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {emojiIcon && (
                  <Text style={styles.emojiIcon}>{emojiIcon}</Text>
                )}
                <Ionicons 
                  name="document-text" 
                  size={24} 
                  color={colors.text} 
                />
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Note
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* Scripture Reference (if provided) */}
            {scriptureReference && (
              <View style={[styles.referenceContainer, { backgroundColor: isDarkMode ? colors.background : '#F5F5F5' }]}>
                <Ionicons name="book-outline" size={16} color={colors.secondary} />
                <Text style={[styles.referenceText, { color: colors.secondary }]}>
                  {scriptureReference}
                </Text>
              </View>
            )}

            {/* Note Content */}
            <ScrollView 
              style={styles.contentScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.noteText, { color: colors.text }]}>
                {noteText}
              </Text>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { borderColor: colors.border }
                ]}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="create-outline" size={20} color="#007AFF" />
                <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>
                  {t('UI.noteActions.edit')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { borderColor: colors.border }
                ]}
                onPress={() => setShowExportMenu(true)}
              >
                <Ionicons name="share-outline" size={20} color="#30D158" />
                <Text style={[styles.actionButtonText, { color: '#30D158' }]}>
                  {t('UI.noteActions.copy')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { borderColor: colors.border }
                ]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
                  {t('UI.noteActions.delete')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Export Menu */}
            {showExportMenu && (
              <View style={[styles.exportMenu, { backgroundColor: isDarkMode ? colors.background : '#F5F5F5' }]}>
                <Text style={[styles.exportMenuTitle, { color: colors.text }]}>
                  Copy as:
                </Text>
                <TouchableOpacity
                  style={[styles.exportOption, { borderBottomColor: colors.border }]}
                  onPress={() => handleExport('note-only')}
                >
                  <Ionicons name="document-text-outline" size={20} color={colors.text} />
                  <Text style={[styles.exportOptionText, { color: colors.text }]}>
                    Note Only
                  </Text>
                </TouchableOpacity>
                {scriptureText && (
                  <TouchableOpacity
                    style={styles.exportOption}
                    onPress={() => handleExport('scripture-and-note')}
                  >
                    <Ionicons name="book-outline" size={20} color={colors.text} />
                    <Text style={[styles.exportOptionText, { color: colors.text }]}>
                      Scripture + Note
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.exportCancelButton, { marginTop: 8 }]}
                  onPress={() => setShowExportMenu(false)}
                >
                  <Text style={[styles.exportCancelText, { color: colors.secondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emojiIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  referenceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentScroll: {
    maxHeight: 300,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exportMenu: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  exportMenuTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exportOptionText: {
    fontSize: 16,
  },
  exportCancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  exportCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default NoteModal;

