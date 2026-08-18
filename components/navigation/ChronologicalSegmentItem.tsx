import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, useReducer, useLayoutEffect, useImperativeHandle, useDebugValue } from 'react';
import logger from '@/utils/logger';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';

interface ChronologicalSegmentItemProps {
  segmentId: string;
  title: string;
  book: string;
  bookName: string;
  ref: string;
  phase: string;
  phaseColor: string;
  isCompleted: boolean;
  onPress: (segmentId: string) => void;
  context: 'plan' | 'challenge' | 'main';
  planId?: string;
  challengeId?: string;
}

const ChronologicalSegmentItem: React.FC<ChronologicalSegmentItemProps> = ({
  segmentId,
  title,
  book,
  bookName,
  ref,
  phase,
  phaseColor,
  isCompleted,
  onPress,
  context,
  planId,
  challengeId
}) => {
  const { colors, language } = useSyncAppSettings();

  // Get localized title
  const localizedTitle = useMemo(() => {
    if (language === 'fr') {
      try {
        const fraUI = require('@/assets/data/FRA-UI.json');
        return fraUI.Titles?.[segmentId] || title;
      } catch (error) {
        return title;
      }
    }
    return title;
  }, [segmentId, title, language]);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    phaseIndicator: {
      width: 4,
      height: '100%',
      borderRadius: 2,
      marginRight: 12,
      backgroundColor: phaseColor,
    },
    contentContainer: {
      flex: 1,
      marginRight: 12,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    bookBadge: {
      backgroundColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginLeft: 8,
    },
    bookText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.secondary,
    },
    referenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    bookName: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
      marginRight: 4,
    },
    reference: {
      fontSize: 13,
      color: colors.secondary,
    },
    phaseText: {
      fontSize: 12,
      color: phaseColor,
      fontWeight: '500',
      fontStyle: 'italic',
    },
    checkContainer: {
      marginLeft: 8,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(segmentId)}
      activeOpacity={0.7}
    >
      <View style={[styles.phaseIndicator, { backgroundColor: phaseColor }]} />
      
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {localizedTitle}
          </Text>
          <View style={styles.bookBadge}>
            <Text style={styles.bookText}>{book}</Text>
          </View>
        </View>
        
        <View style={styles.referenceRow}>
          <Text style={styles.bookName}>{bookName}</Text>
          <Text style={styles.reference}>{ref}</Text>
        </View>
        
        <Text style={styles.phaseText}>{phase}</Text>
      </View>

      <View style={styles.checkContainer}>
        <Ionicons 
          name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'} 
          size={24} 
          color={isCompleted ? '#4CAF50' : '#CCCCCC'} 
        />
      </View>
    </TouchableOpacity>
  );
};

export default ChronologicalSegmentItem;
