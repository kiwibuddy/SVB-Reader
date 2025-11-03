import { Text, View, Pressable, StyleSheet, Animated, Platform, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useAppSettings } from '@/context/AppSettingsContext';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getQuestionsForSegment, hasQuestionsData, type AudienceType } from '@/api/question-functions';
import { questionsLoader } from '@/services/QuestionsLoader';
import logger from '@/utils/logger';
import FRA_UI from '@/assets/data/FRA-UI.json';

interface QuestionsProps {
  segmentId: string;
}

// Define audience configurations (titles will be translated dynamically)
const AUDIENCE_CONFIG = {
  school: {
    color: '#4ECDC4', // Teal color
    backgroundColor: '#E8F8F5', // Light teal background
  },
  family: {
    color: '#FF69B4', // Pink color
    backgroundColor: '#FDF2F8', // Light pink background
  },
  smallgroup: {
    color: '#9CA3AF', // Light grey color
    backgroundColor: '#F9FAFB', // Light grey background
  }
};

const Questions: React.FC<QuestionsProps> = ({ segmentId }) => {
  const { colors } = useAppSettings();
  const { language } = useSyncAppSettings();
  const { t } = useTranslation();
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>('school');
  const [currentSet, setCurrentSet] = useState<1 | 2>(1);
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const retryCountRef = useRef(0);

  // Get translated audience titles
  const audienceTitles = useMemo(() => ({
    school: t('UI.home.schoolQuestions'),
    family: t('UI.home.familyQuestions'),
    smallgroup: t('UI.home.smallGroupQuestions'),
  }), [language, t]);

  useEffect(() => {
    retryCountRef.current = 0; // Reset retry count on new query
    loadQuestions();
  }, [segmentId, selectedAudience, currentSet, language]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      let fetchedQuestions: string[] = [];

      // Load questions based on language
      if (language === 'fr') {
        // For French, load from downloaded Bible file
        logger.info(`📖 Loading French questions for ${segmentId}, audience: ${selectedAudience}, set: ${currentSet}`);
        const segmentQuestions = await questionsLoader.getQuestions(segmentId, 'fr');
        
        if (segmentQuestions) {
          // Get questions for the selected audience and set
          const audienceQuestions = segmentQuestions[selectedAudience];
          const setKey = currentSet === 1 ? 'set1' : 'set2';
          fetchedQuestions = audienceQuestions[setKey] || [];
          logger.info(`✅ Loaded ${fetchedQuestions.length} French questions`);
        } else {
          logger.warn(`⚠️ No French questions found for ${segmentId}`);
        }
      } else {
        // For English, load from SQLite database
        logger.info(`📖 Loading English questions for ${segmentId}, audience: ${selectedAudience}, set: ${currentSet}`);
        
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
        fetchedQuestions = await getQuestionsForSegment(
          segmentId,
          selectedAudience,
          currentSet
        );
        logger.info(`✅ Loaded ${fetchedQuestions.length} English questions`);
      }
      
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
          // Get translated story title
          let storyTitle = 'Story';
          
          if (language === 'fr' && FRA_UI.Titles) {
            const frenchTitle = (FRA_UI.Titles as Record<string, string>)[segmentId];
            if (frenchTitle) {
              storyTitle = frenchTitle;
            }
          }
          
          // Fallback to English if French not found
          if (storyTitle === 'Story' || language === 'en') {
            const SegmentTitles = require('@/assets/data/SegmentTitles.json');
            const segmentData = SegmentTitles[segmentId as keyof typeof SegmentTitles];
            storyTitle = segmentData?.title || 'Story';
          }
          
          return `${storyTitle} ${t('UI.home.questions')}`;
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
                {audienceTitles[audience]}
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
              {t('UI.home.loadingQuestions')}
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
              {t('UI.home.noQuestionsAvailable')}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default Questions;
