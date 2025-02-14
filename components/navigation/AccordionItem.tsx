import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';

interface AccordionItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isExpanded: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ 
  title, 
  subtitle,
  icon,
  isExpanded,
  onPress,
  children 
}) => {
  const { colors } = useAppSettings();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.secondary,
    },
    content: {
      backgroundColor: colors.background,
    },
    chevron: {
      color: colors.secondary,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} style={styles.header}>
        {icon}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color={styles.chevron.color}
        />
      </TouchableOpacity>
      {isExpanded && children}
    </View>
  );
}; 