import { Text, View, Pressable, StyleSheet, Animated, Platform } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import SchoolQuestions from "@/assets/data/SchoolQuestions.json";
import FamilyQuestions from "@/assets/data/FamilyQuestions.json";
import SmallGroupQuestions from "@/assets/data/SmallGroupQuestions.json";
import SchoolQuestionsSet2 from "@/assets/data/SchoolQuestionsSet2.json";
import FamilyQuestionsSet2 from "@/assets/data/FamilyQuestionsSet2.json";
import SmallGroupQuestionsSet2 from "@/assets/data/SmallGroupQuestionsSet2.json";
import { useAppSettings } from '@/context/AppSettingsContext';

// Define audience types
type AudienceType = 'school' | 'family' | 'smallgroup';

// Define question data sources for each audience
const audienceQuestionData = {
  school: {
    set1: SchoolQuestions.SchoolQuestions,
    set2: SchoolQuestionsSet2.SchoolQuestionsSet2
  },
  family: {
    set1: FamilyQuestions.FamilyQuestions,
    set2: FamilyQuestionsSet2.FamilyQuestionsSet2
  },
  smallgroup: {
    set1: SmallGroupQuestions.SmallGroupQuestions,
    set2: SmallGroupQuestionsSet2.SmallGroupQuestionsSet2
  }
};

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
  const [currentSet, setCurrentSet] = useState<'set1' | 'set2'>('set1');
  const [questions, setQuestions] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadQuestions();
  }, [segmentId, selectedAudience, currentSet]);

  const loadQuestions = () => {
    // Get the questions directly for this segment and audience
    const audienceQuestions = audienceQuestionData[selectedAudience];
    const questionSet = audienceQuestions[currentSet];
    const segmentQuestions = questionSet[segmentId as keyof typeof questionSet];
    
    if (!segmentQuestions) {
      setQuestions([]);
      return;
    }

    // Convert the question object to an array
    const questionsArray = [
      segmentQuestions.Q1,
      segmentQuestions.Q2,
      segmentQuestions.Q3,
      segmentQuestions.Q4
    ].filter(Boolean); // Remove any undefined questions
    
    setQuestions(questionsArray);
  };

  const handleAudienceChange = (audience: AudienceType) => {
    if (audience === selectedAudience) return;
    
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Change audience and reset to set1
      setSelectedAudience(audience);
      setCurrentSet('set1');
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleRefreshQuestions = () => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Toggle between set1 and set2
      setCurrentSet(currentSet === 'set1' ? 'set2' : 'set1');
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
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
        {questions.length > 0 ? (
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
