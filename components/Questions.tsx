import { Text, View, FlatList, Image, Pressable, StyleSheet, Platform } from 'react-native'
import React, { useState } from 'react'
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

const Questions: React.FC<QuestionsProps> = ({ segmentId }) => {
  if (!segmentId) return null;
  
  const { colors, theme } = useAppSettings();
  const { segmentId: appContextSegmentId } = useAppContext();
  const idSplit = segmentId.split("-");
  const language = idSplit[0];
  const version = idSplit[1];
  const segID = idSplit[idSplit.length - 1];
  const [ qRef, setQRef ] = useState<string>("QRef1");

  const toggleQuestion = (qRef: string) => {
    if (qRef === "QRef1") setQRef("QRef2");
    if (qRef === "QRef2") setQRef("QRef3");
    if (qRef === "QRef3") setQRef("QRef1");
  }

  const questions: Record<string, string> =
    QuestionsList[segID as keyof typeof QuestionsList];

  // Define color schemes for each question set
  const getQuestionSetColors = (currentQRef: string) => {
    switch (currentQRef) {
      case 'QRef1':
        return {
          gradient: ['#667eea', '#764ba2'] as const, // Blue to purple
          name: 'Reflection Questions'
        };
      case 'QRef2':
        return {
          gradient: ['#f093fb', '#f5576c'] as const, // Pink to coral
          name: 'Application Questions'
        };
      case 'QRef3':
        return {
          gradient: ['#4facfe', '#00f2fe'] as const, // Light blue to cyan
          name: 'Discussion Questions'
        };
      default:
        return {
          gradient: ['#667eea', '#764ba2'] as const,
          name: 'Questions'
        };
    }
  };

  const currentColors = getQuestionSetColors(qRef);

  const styles = StyleSheet.create({
    container: {
      marginVertical: 32,
      paddingHorizontal: 20,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    discussionImage: {
      width: 180,
      height: 90,
      opacity: 0.8,
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    titleUnderline: {
      width: 60,
      height: 3,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    questionsCard: {
      borderRadius: 16,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
      overflow: 'hidden',
    },
    gradientContainer: {
      padding: 24,
      borderRadius: 16,
    },
    questionSetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 20,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    questionItem: {
      marginBottom: 20,
    },
    questionText: {
      fontSize: 17,
      lineHeight: 26,
      color: '#FFFFFF',
      fontWeight: '500',
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    questionBullet: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FFFFFF',
      marginRight: 12,
      marginTop: 9,
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 2,
    },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    buttonContainer: {
      alignItems: 'center',
    },
    changeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.04)' : colors.border,
    },
    buttonIcon: {
      marginRight: 8,
    },
    buttonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
      letterSpacing: -0.2,
    },
    buttonSubtext: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Image
          source={require("@/assets/images/SVB-Discuss-together.png")}
          style={styles.discussionImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Questions</Text>
        <View style={styles.titleUnderline} />
      </View>

      {/* Questions Card with Gradient */}
      <View style={styles.questionsCard}>
        <LinearGradient
          colors={currentColors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <Text style={styles.questionSetTitle}>
            {currentColors.name}
          </Text>
          
          <FlatList
            data={["Q1", "Q2", "Q3", "Q4"]}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={[
                styles.questionItem,
                { marginBottom: index === 3 ? 0 : 20 }
              ]}>
                <View style={styles.questionRow}>
                  <View style={styles.questionBullet} />
                  <Text style={styles.questionText}>
                    {Qs[`${questions[qRef]}-${item}`]}
                  </Text>
                </View>
              </View>
            )}
          />
        </LinearGradient>
      </View>

      {/* Change Questions Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.changeButton}
          onPress={() => toggleQuestion(qRef)}
          android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
        >
          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons 
                name="refresh" 
                size={18} 
                color={colors.primary} 
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>
                Change Questions
              </Text>
            </View>
            <Text style={styles.buttonSubtext}>
              Tap for {qRef === 'QRef1' ? 'Application' : qRef === 'QRef2' ? 'Discussion' : 'Reflection'} Questions
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default Questions;
