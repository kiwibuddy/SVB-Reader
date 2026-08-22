import React from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThreadPalette } from '@/constants/Colors';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  palette: ThreadPalette;
  clearLabel: string;
  isDarkMode?: boolean;
  style?: StyleProp<ViewStyle>;
  onSubmit?: () => void;
};

const SearchField = ({
  value,
  onChangeText,
  placeholder,
  palette,
  clearLabel,
  isDarkMode = false,
  style,
  onSubmit,
}: Props) => {
  const hideKeyboard = () => {
    Keyboard.dismiss();
    onSubmit?.();
  };

  return (
    <View style={[styles.field, { backgroundColor: palette.surf, borderColor: palette.hair }, style]}>
      <Ionicons name="search-outline" size={18} color={palette.mute} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.mute}
        style={[styles.input, { color: palette.ink }]}
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        returnKeyType="search"
        enablesReturnKeyAutomatically
        blurOnSubmit
        onSubmitEditing={hideKeyboard}
        keyboardAppearance={isDarkMode ? 'dark' : 'light'}
        underlineColorAndroid="transparent"
        accessibilityRole="search"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          style={styles.clear}
        >
          <Ionicons name="close-circle" size={18} color={palette.mute} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 6,
    minHeight: 40,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 0,
  },
  clear: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchField;
