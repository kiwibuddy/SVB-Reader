import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';

interface ViewToggleProps {
  isChronological: boolean;
  onToggle: (isChronological: boolean) => void;
  disabled?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  isChronological,
  onToggle,
  disabled = false
}) => {
  const { colors } = useAppSettings();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      borderRadius: 8,
      padding: 2,
      marginBottom: 12,
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    activeButton: {
      backgroundColor: colors.card,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    inactiveButton: {
      backgroundColor: 'transparent',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    activeText: {
      color: colors.text,
    },
    inactiveText: {
      color: colors.secondary,
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

  const handlePress = (value: boolean) => {
    if (!disabled) {
      onToggle(value);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          isChronological ? styles.activeButton : styles.inactiveButton,
          disabled && styles.disabledButton
        ]}
        onPress={() => handlePress(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name="time-outline"
          size={16}
          color={isChronological ? colors.text : colors.secondary}
        />
        <Text style={[
          styles.buttonText,
          isChronological ? styles.activeText : styles.inactiveText
        ]}>
          Timeline
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toggleButton,
          !isChronological ? styles.activeButton : styles.inactiveButton,
          disabled && styles.disabledButton
        ]}
        onPress={() => handlePress(false)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name="library-outline"
          size={16}
          color={!isChronological ? colors.text : colors.secondary}
        />
        <Text style={[
          styles.buttonText,
          !isChronological ? styles.activeText : styles.inactiveText
        ]}>
          Books
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ViewToggle; 