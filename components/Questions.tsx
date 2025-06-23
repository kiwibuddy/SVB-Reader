import { Text, View, FlatList, Image, Pressable, StyleSheet, Animated, Platform } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '@/context/GlobalContext';
import QuestionsList from "@/assets/data/QuestionRefs.json";
import UIData from "@/assets/data/UI-ENG.json";
import { useAppSettings } from '@/context/AppSettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Define the type for questions with an index signature
interface Questions {
  [key: string]: string; // Allow indexing with a string
}
const Qs: Questions = UIData.Questions;

interface QuestionsProps {
  segmentId: string;
}

// Define question categories with their colors and icons (only 3 categories)
const QUESTION_CATEGORIES = [
  {
    id: 'QRef1',
    title: 'Opening the Word',
    subtitle: 'Reflection Questions',
    icon: 'book-outline',
    gradientColors: ['#7B68EE', '#9B7EF7'],
  },
  {
    id: 'QRef2', 
    title: 'Following Examples',
    subtitle: 'Application Questions',
    icon: 'people-outline',
    gradientColors: ['#FF69B4', '#FF8BC6'],
  },
  {
    id: 'QRef3',
    title: 'Growing Deeper',
    subtitle: 'Spiritual Growth',
    icon: 'leaf-outline', 
    gradientColors: ['#4ECDC4', '#6ED9D1'],
  }
];

const Questions: React.FC<QuestionsProps> = ({ segmentId }) => {
  const { colors } = useAppSettings();
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadQuestions();
  }, [segmentId, selectedCategory]);

  const loadQuestions = () => {
    const segmentQuestions = QuestionsList[segmentId as keyof typeof QuestionsList];
    if (!segmentQuestions) {
      setQuestions([]);
      return;
    }

    const currentCategory = QUESTION_CATEGORIES[selectedCategory];
    const qRefKey = segmentQuestions[currentCategory.id as keyof typeof segmentQuestions];
    
    if (!qRefKey) {
      setQuestions([]);
      return;
    }

    // Get questions for this category
    const questionKeys = Object.keys(Qs).filter(key => key.startsWith(qRefKey + '-Q'));
    const questionTexts = questionKeys.map(key => Qs[key]).filter(Boolean);
    
    setQuestions(questionTexts);
  };

  const handleCategoryChange = (index: number) => {
    if (index === selectedCategory) return;
    
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Change category
      setSelectedCategory(index);
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const currentCategory = QUESTION_CATEGORIES[selectedCategory];

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 16, // Standard app spacing
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
    },
    cardHeader: {
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    headerContent: {
      alignItems: 'center',
    },
    headerIcon: {
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    headerSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      marginTop: 2,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    cardContent: {
      backgroundColor: colors.card,
      padding: 20,
    },
    questionsContainer: {
      marginBottom: 20,
    },
    questionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    questionBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: currentCategory.gradientColors[0],
      marginTop: 8,
      marginRight: 12,
    },
    questionText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
    },
    categorySelector: {
      flexDirection: 'row',
      gap: 8,
    },
    categoryButton: {
      flex: 1,
      height: 60,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    categoryButtonSelected: {
      borderColor: 'rgba(255, 255, 255, 0.3)',
      transform: [{ scale: 1.02 }],
    },
    categoryButtonGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    categoryButtonContent: {
      alignItems: 'center',
    },
    categoryButtonIcon: {
      marginBottom: 4,
    },
    categoryButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
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
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header with gradient */}
        <LinearGradient
          colors={currentCategory.gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardHeader}
        >
          <View style={styles.headerContent}>
            <Ionicons 
              name={currentCategory.icon as any} 
              size={32} 
              color="#FFFFFF" 
              style={styles.headerIcon}
            />
            <Text style={styles.headerTitle}>
              {currentCategory.title}
            </Text>
            <Text style={styles.headerSubtitle}>
              {currentCategory.subtitle}
            </Text>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.cardContent}>
          <Animated.View style={[styles.questionsContainer, { opacity: fadeAnim }]}>
            {questions.length > 0 ? (
              questions.map((question, index) => (
                <View key={index} style={styles.questionItem}>
                  <View style={styles.questionBullet} />
                  <Text style={styles.questionText}>{question}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No questions available for this category
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Category selector buttons */}
          <View style={styles.categorySelector}>
            {QUESTION_CATEGORIES.map((category, index) => (
              <Pressable
                key={index}
                style={[
                  styles.categoryButton,
                  selectedCategory === index && styles.categoryButtonSelected
                ]}
                onPress={() => handleCategoryChange(index)}
              >
                <LinearGradient
                  colors={selectedCategory === index ? category.gradientColors as any : ['transparent', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryButtonGradient}
                >
                  <View style={styles.categoryButtonContent}>
                    <Ionicons 
                      name={category.icon as any} 
                      size={16} 
                      color={selectedCategory === index ? "#FFFFFF" : colors.secondary}
                      style={styles.categoryButtonIcon}
                    />
                    <Text 
                      style={[
                        styles.categoryButtonText,
                        { color: selectedCategory === index ? "#FFFFFF" : colors.secondary }
                      ]}
                      numberOfLines={2}
                    >
                      {category.title}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default Questions;
