import { Text, View, Pressable, StyleSheet, Animated, Platform, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useAppSettings } from '@/context/AppSettingsContext';
import { getQuestionsForSegment, hasQuestionsData, type AudienceType } from '@/api/question-functions';
import logger from '@/utils/logger';

interface QuestionsProps {
  segmentId: string;
}

// Define audience configurations
const AUDIENCE_CONFIG = {
  school: {
    title: 'School Questions',
    color: '#4ECDC4', // Teal color
    backgroundColor: '#E8F8F5', // Light teal background
  },
  family: {
    title: 'Family Questions', 
    color: '#FF69B4', // Pink color
    backgroundColor: '#FDF2F8', // Light pink background
  },
  smallgroup: {
    title: 'Small Group Questions',
    color: '#9CA3AF', // Light grey color
    backgroundColor: '#F9FAFB', // Light grey background
  }
};

const Questions: React.FC<QuestionsProps> = ({ segmentId }) => {
  const { colors } = useAppSettings();
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>('school');
  const [currentSet, setCurrentSet] = useState<1 | 2>(1);
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const retryCountRef = useRef(0);

  useEffect(() => {
    retryCountRef.current = 0; // Reset retry count on new query
    loadQuestions();
  }, [segmentId, selectedAudience, currentSet]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      // Check if questions data exists in database (handles migration in progress)
      const dataExists = await hasQuestionsData();
      if (!dataExists && retryCountRef.current < 5) {
        setQuestions([]);
        setIsLoading(false);
        retryCountRef.current++;
        
        // Retry after a delay
        setTimeout(() => loadQuestions(), 2000);
        return;
      }

      // Fetch questions from SQLite database
      const fetchedQuestions = await getQuestionsForSegment(
        segmentId,
        selectedAudience,
        currentSet
      );
      
      setQuestions(fetchedQuestions);
    } catch (error) {
      logger.error('Error loading questions:', error);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudienceChange = (audience: AudienceType) => {
    if (audience === selectedAudience) return;
    
    // Update state immediately before animation
    setSelectedAudience(audience);
    setCurrentSet(1);
    
    // Then do the fade animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleRefreshQuestions = () => {
    // Toggle between set 1 and set 2
    setCurrentSet(prev => prev === 1 ? 2 : 1);
  };

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
      letterSpacing: -0.3,
    },
    audienceSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    audienceButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    audienceButtonSelected: {
      borderColor: AUDIENCE_CONFIG[selectedAudience].color,
      backgroundColor: AUDIENCE_CONFIG[selectedAudience].backgroundColor,
    },
    audienceButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    audienceButtonTextSelected: {
      color: AUDIENCE_CONFIG[selectedAudience].color,
    },
    questionsContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
    },
    questionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    questionBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: AUDIENCE_CONFIG[selectedAudience].color,
      marginTop: 8,
      marginRight: 12,
    },
    questionText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'center',
    },
    refreshButton: {
      alignSelf: 'center',
      marginTop: 16,
      padding: 8,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: AUDIENCE_CONFIG[selectedAudience].color,
      backgroundColor: AUDIENCE_CONFIG[selectedAudience].backgroundColor,
      minWidth: 40,
      minHeight: 40,
    },
  });

  return (
    <View style={styles.container}>
      {/* Title - Get story title from segmentId */}
      <Text style={styles.title}>
        {(() => {
          // Import SegmentTitles to get the story title
          const SegmentTitles = require('@/assets/data/SegmentTitles.json');
          const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
          const storyTitle = segmentData?.title || 'Story Questions';
          return `${storyTitle} Questions`;
        })()}
      </Text>

      {/* Audience Selector */}
      <View style={styles.audienceSelector}>
        {Object.entries(AUDIENCE_CONFIG).map(([audienceKey, config]) => {
          const audience = audienceKey as AudienceType;
          const isSelected = audience === selectedAudience;
          
          return (
            <Pressable
              key={audience}
              style={[
                styles.audienceButton,
                isSelected && styles.audienceButtonSelected
              ]}
              onPress={() => handleAudienceChange(audience)}
            >
              <Text 
                style={[
                  styles.audienceButtonText,
                  isSelected && styles.audienceButtonTextSelected
                ]}
              >
                {config.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Questions Container */}
      <Animated.View style={[styles.questionsContainer, { opacity: fadeAnim }]}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color={AUDIENCE_CONFIG[selectedAudience].color} />
            <Text style={[styles.emptyStateText, { marginTop: 8 }]}>
              Loading questions...
            </Text>
          </View>
        ) : questions.length > 0 ? (
          <>
            {questions.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <View style={styles.questionBullet} />
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
            
            {/* Refresh Button inside the card */}
            <Pressable
              style={styles.refreshButton}
              onPress={handleRefreshQuestions}
            >
              <MaterialIcons 
                name="autorenew" 
                size={20} 
                color={AUDIENCE_CONFIG[selectedAudience].color} 
              />
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No questions available for this audience
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default Questions;
