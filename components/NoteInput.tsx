import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { trackFeature } from '@/services/analytics';

interface NoteInputProps {
  initialValue?: string;
  onSave: (noteText: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  maxLength?: number;
  isEditing?: boolean;
}

const NoteInput: React.FC<NoteInputProps> = ({
  initialValue = '',
  onSave,
  onCancel,
  onDelete,
  maxLength = 500,
  isEditing = false,
}) => {
  const { colors, isDarkMode } = useAppSettings();
  const [noteText, setNoteText] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  const remainingChars = maxLength - noteText.length;
  const charPercentage = (noteText.length / maxLength) * 100;

  // Determine counter color based on character count
  const getCounterColor = () => {
    if (charPercentage < 80) {
      return '#30D158'; // Green
    } else if (charPercentage < 96) {
      return '#FFB347'; // Yellow/Orange
    } else {
      return '#FF3B30'; // Red
    }
  };

  const handleSave = async () => {
    const trimmedNote = noteText.trim();
    
    // Don't save empty notes
    if (trimmedNote.length === 0) {
      onCancel();
      return;
    }

    // Track note creation/editing
    trackFeature(isEditing ? 'note_edited' : 'note_created', {
      note_length: trimmedNote.length,
    });

    setIsSaving(true);
    
    // Haptic feedback on save
    if (Platform.OS === 'ios') {
      try {
        const Haptics = await import('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics not available
      }
    }

    onSave(trimmedNote);
    setIsSaving(false);
  };

  const canSave = noteText.trim().length > 0 && noteText.length <= maxLength;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <Animated.View 
        style={[
          styles.container,
          {
            backgroundColor: isDarkMode ? colors.background : '#FFFFFF',
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons 
              name="create-outline" 
              size={24} 
              color={colors.text} 
            />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isEditing ? 'Edit Note' : 'Add Note'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Text Input */}
        <TextInput
          ref={textInputRef}
          style={[
            styles.textInput,
            {
              color: colors.text,
              backgroundColor: isDarkMode ? colors.card : '#F5F5F5',
              borderColor: isDarkMode ? colors.border : '#E0E0E0',
            },
          ]}
          value={noteText}
          onChangeText={setNoteText}
          placeholder="Write your study note here..."
          placeholderTextColor={colors.secondary}
          multiline
          maxLength={maxLength}
          textAlignVertical="top"
          autoCorrect
          autoCapitalize="sentences"
          returnKeyType="default"
        />

        {/* Character Counter */}
        <View style={styles.counterContainer}>
          <Text style={[styles.counterText, { color: getCounterColor() }]}>
            {remainingChars} characters remaining
          </Text>
          <Text style={[styles.counterSubtext, { color: colors.secondary }]}>
            {noteText.length}/{maxLength}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              { borderColor: colors.border }
            ]}
            onPress={onCancel}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          {/* Delete button - only show when editing existing note */}
          {isEditing && onDelete && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                { borderColor: '#FF3B30' }
              ]}
              onPress={onDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.buttonText, { color: '#FF3B30' }]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              {
                backgroundColor: canSave ? '#007AFF' : colors.border,
                opacity: canSave ? 1 : 0.5,
              }
            ]}
            onPress={handleSave}
            disabled={!canSave || isSaving}
          >
            {isSaving ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Save Note' : 'Add Note'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: Platform.OS === 'ios' ? 44 : 24, // Extra padding for iPhone camera cutout
    paddingHorizontal: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  textInput: {
    minHeight: 180,
    maxHeight: 240,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  counterSubtext: {
    fontSize: 12,
    fontWeight: '400',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default NoteInput;

