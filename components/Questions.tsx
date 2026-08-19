import { Text, View, Pressable, StyleSheet, Animated, Platform, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useAppSettings } from '@/context/AppSettingsContext';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getQuestionsUnified, hasQuestionsData, type AudienceType } from '@/api/question-functions';
import { getAppState, setAppState } from '@/api/sqlite';
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
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>('family');
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
    getAppState('questionAudience').then((value) => {
      if (value === 'school' || value === 'family' || value === 'smallgroup') {
        setSelectedAudience(value);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    retryCountRef.current = 0; // Reset retry count on new query
    loadQuestions();
  }, [segmentId, selectedAudience, currentSet, language]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      // Use unified API that handles both English (SQLite) and French (QuestionsLoader)
      logger.info(`📖 Loading questions for ${segmentId}, audience: ${selectedAudience}, set: ${currentSet}, language: ${language}`);
      
      // For English, check if questions data exists in database (handles migration in progress)
      if (language === 'en') {
        const dataExists = await hasQuestionsData();
        if (!dataExists && retryCountRef.current < 5) {
          setQuestions([]);
          setIsLoading(false);
          retryCountRef.current++;
          
          // Retry after a delay
          setTimeout(() => loadQuestions(), 2000);
          return;
        }
      }

      // Fetch questions using unified API
      const fetchedQuestions = await getQuestionsUnified(
        segmentId,
        selectedAudience,
        currentSet,
        language
      );
      
      logger.info(`✅ Loaded ${fetchedQuestions.length} questions for ${language}`);
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
    void setAppState('questionAudience', audience);
    
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
    // Toggle between set 1 and set 2 - simple and reliable
    setCurrentSet(prev => {
      const newSet = prev === 1 ? 2 : 1;
      logger.info(`🔄 Toggling question set from ${prev} to ${newSet}`);
      return newSet;
    });
    
    // Simple fade animation without blocking
    fadeAnim.setValue(0.5);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
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
      padding: 12,
      paddingHorizontal: 24,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: AUDIENCE_CONFIG[selectedAudience].color,
      backgroundColor: AUDIENCE_CONFIG[selectedAudience].backgroundColor,
      minWidth: 100,
      minHeight: 44,
      flexDirection: 'row',
      gap: 8,
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
            
            {/* Refresh Button */}
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
              <Pressable
                style={styles.refreshButton}
                onPress={handleRefreshQuestions}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                android_ripple={{ color: AUDIENCE_CONFIG[selectedAudience].color, borderless: false }}
              >
                <MaterialIcons 
                  name="autorenew" 
                  size={20} 
                  color={AUDIENCE_CONFIG[selectedAudience].color} 
                />
                <Text style={{ fontSize: 13, color: AUDIENCE_CONFIG[selectedAudience].color, fontWeight: '600', marginLeft: 4 }}>
                  {t('UI.home.changeSet')}
                </Text>
              </Pressable>
            </View>
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
