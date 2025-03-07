import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFontSize } from '@/context/FontSizeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

const About = () => {
  const router = useRouter();
  const { sizes } = useFontSize();
  const { colors } = useAppSettings();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    backButton: {
      padding: 8,
    },
    title: {
      color: colors.text,
      fontSize: sizes.title,
      fontWeight: 'bold',
      marginLeft: 16,
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: sizes.subtitle,
      fontWeight: '600',
      marginBottom: 8,
    },
    text: {
      color: colors.text,
      fontSize: sizes.body,
      lineHeight: sizes.body * 1.4,
      marginBottom: 8,
    },
    bulletList: {
      marginLeft: 16,
      marginBottom: 8,
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    bullet: {
      color: colors.text,
      fontSize: sizes.body,
      marginRight: 8,
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    featureSection: {
      marginBottom: 12,
    },
    footerText: {
      fontStyle: 'italic',
      marginBottom: 16,
    },
  });

  // Helper function to safely render lists
  const renderBulletList = (key: string) => {
    try {
      const items = t(key, { returnObjects: true });
      if (!Array.isArray(items)) return null;
      
      return items.map((item, index) => (
        <View key={index} style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.text}>{item}</Text>
        </View>
      ));
    } catch (error) {
      console.warn(`Failed to render bullet list for key: ${key}`, error);
      return null;
    }
  };

  // Helper function to safely get translation
  const safeTranslate = (key: string) => {
    try {
      return t(key);
    } catch (error) {
      console.warn(`Failed to translate key: ${key}`, error);
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{safeTranslate('UI.about.title')}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{safeTranslate('UI.about.subtitle')}</Text>
          <Text style={styles.text}>{safeTranslate('UI.about.description')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{safeTranslate('UI.about.legacy.title')}</Text>
          <Text style={styles.text}>{safeTranslate('UI.about.legacy.description')}</Text>
          <View style={styles.bulletList}>
            {renderBulletList('UI.about.legacy.features')}
          </View>
          <Text style={styles.text}>{safeTranslate('UI.about.legacy.impact')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{safeTranslate('UI.about.reader.title')}</Text>
          <Text style={styles.text}>{safeTranslate('UI.about.reader.description')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{safeTranslate('UI.about.features.title')}</Text>
          
          {/* Interactive Group Reading */}
          <View style={styles.featureSection}>
            <Text style={styles.sectionTitle}>
              {safeTranslate('UI.about.features.sections.reading.title')}
            </Text>
            <Text style={styles.text}>
              {safeTranslate('UI.about.features.sections.reading.description')}
            </Text>
            <View style={styles.bulletList}>
              {renderBulletList('UI.about.features.sections.reading.items')}
            </View>
          </View>

          {/* Meaningful Reflection */}
          <View style={styles.featureSection}>
            <Text style={styles.sectionTitle}>
              {safeTranslate('UI.about.features.sections.reflection.title')}
            </Text>
            <Text style={styles.text}>
              {safeTranslate('UI.about.features.sections.reflection.description')}
            </Text>
            <View style={styles.bulletList}>
              {renderBulletList('UI.about.features.sections.reflection.items')}
            </View>
          </View>

          {/* Motivated Journey */}
          <View style={styles.featureSection}>
            <Text style={styles.sectionTitle}>
              {safeTranslate('UI.about.features.sections.journey.title')}
            </Text>
            <Text style={styles.text}>
              {safeTranslate('UI.about.features.sections.journey.description')}
            </Text>
            <View style={styles.bulletList}>
              {renderBulletList('UI.about.features.sections.journey.items')}
            </View>
          </View>

          {/* Personalized Experience */}
          <View style={styles.featureSection}>
            <Text style={styles.sectionTitle}>
              {safeTranslate('UI.about.features.sections.experience.title')}
            </Text>
            <Text style={styles.text}>
              {safeTranslate('UI.about.features.sections.experience.description')}
            </Text>
            <View style={styles.bulletList}>
              {renderBulletList('UI.about.features.sections.experience.items')}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{safeTranslate('UI.about.vision.title')}</Text>
          <Text style={styles.text}>{safeTranslate('UI.about.vision.description')}</Text>
          <Text style={styles.text}>{safeTranslate('UI.about.vision.impact')}</Text>
          <Text style={styles.text}>{safeTranslate('UI.about.vision.cta')}</Text>
        </View>

        <Text style={[styles.text, styles.footerText]}>
          {safeTranslate('UI.about.footer')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default About; 