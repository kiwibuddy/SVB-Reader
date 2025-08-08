import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CheckCircle from '@/components/CheckCircle';
import { databaseManager } from '@/api/database-manager';
import { useAppSettings } from '@/context/AppSettingsContext';

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
  const { colors } = useAppSettings();

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
            {title}
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

      <View style={[styles.checkContainer, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
        <GroupCompletionBadge segmentId={segmentId} />
        <CheckCircle
          segmentId={segmentId}
          context={context}
          planId={planId}
          challengeId={challengeId}
          iconSize={24}
        />
      </View>
    </TouchableOpacity>
  );
};

export default ChronologicalSegmentItem; 

const GroupCompletionBadge: React.FC<{ segmentId: string }> = ({ segmentId }) => {
  const [hasGroupCompletion, setHasGroupCompletion] = React.useState<boolean>(false);
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const db = databaseManager.getDatabase();
        const row = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM group_segment_completion WHERE segmentID = ?',
          [segmentId]
        );
        if (mounted) setHasGroupCompletion((row?.count || 0) > 0);
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, [segmentId]);
  if (!hasGroupCompletion) return null;
  return <Ionicons name="people-circle" size={20} color={'#42A5F5'} />;
};