import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFontSize } from '@/context/FontSizeContext';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { clearFirstLaunchFlag } from '@/hooks/useFirstLaunch';
import { useTranslation } from '@/hooks/useTranslation';
import AnalyticsSettings from '@/components/AnalyticsSettings';
import { analytics } from '@/services/analytics';

const About = () => {
  const router = useRouter();
  const { sizes } = useFontSize();
  const { colors } = useSyncAppSettings();
  const { t } = useTranslation();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);
  const [showNLTModal, setShowNLTModal] = useState(false);

  // Track screen view when focused
  useFocusEffect(
    React.useCallback(() => {
      analytics.trackScreen('About');
    }, [])
  );

  const handleResetOnboarding = async () => {
    try {
      Alert.alert(
        'Reset Onboarding',
        'This will reset the first launch flag and show the onboarding screen on the next app restart. Are you sure?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: async () => {
              try {
                await clearFirstLaunchFlag();
                Alert.alert(
                  'Success',
                  'First launch flag cleared! The app will now show onboarding on the next restart.',
                  [
                    {
                      text: 'Go to Onboarding Now',
                      onPress: () => router.replace('/'),
                    },
                    {
                      text: 'OK',
                      style: 'cancel',
                    },
                  ]
                );
              } catch (error) {
                Alert.alert(
                  'Error',
                  `Failed to clear first launch flag: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset onboarding');
    }
  };

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
    scrollContainer: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    heading1: {
      color: colors.text,
      fontSize: sizes.title + 4,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
    },
    heading2: {
      color: colors.text,
      fontSize: sizes.title,
      fontWeight: '700',
      marginTop: 24,
      marginBottom: 12,
    },
    heading3: {
      color: colors.text,
      fontSize: sizes.subtitle,
      fontWeight: '600',
      marginTop: 20,
      marginBottom: 8,
    },
    subtitle: {
      color: '#FF5733',
      fontSize: sizes.subtitle + 2,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 24,
      fontStyle: 'italic',
    },
    paragraph: {
      color: colors.text,
      fontSize: sizes.body,
      lineHeight: sizes.body * 1.6,
      marginBottom: 16,
    },
    bulletPoint: {
      color: colors.text,
      fontSize: sizes.body,
      lineHeight: sizes.body * 1.6,
      marginBottom: 8,
      marginLeft: 16,
    },
    stepContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#FF5733',
    },
    stepTitle: {
      color: colors.text,
      fontSize: sizes.subtitle,
      fontWeight: '600',
      marginBottom: 8,
    },
    stepDescription: {
      color: colors.secondary,
      fontSize: sizes.body,
      lineHeight: sizes.body * 1.5,
    },
    colorBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginHorizontal: 2,
      marginVertical: 2,
    },
    colorBadgeText: {
      fontSize: sizes.caption,
      fontWeight: '600',
    },
    emojiContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 8,
    },
    emojiText: {
      fontSize: 20,
      marginRight: 8,
    },
    emojiDescription: {
      color: colors.secondary,
      fontSize: sizes.body,
      flex: 1,
    },
    callout: {
      backgroundColor: 'rgba(255, 87, 51, 0.1)',
      borderRadius: 12,
      padding: 16,
      marginVertical: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#FF5733',
    },
    calloutText: {
      color: colors.text,
      fontSize: sizes.body,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    // Legal section styles
    legalSection: {
      marginTop: 32,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legalHeading: {
      color: colors.text,
      fontSize: sizes.subtitle,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
    },
    legalLinksContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    legalLink: {
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 120,
      alignItems: 'center',
    },
    legalLinkText: {
      color: colors.text,
      fontSize: sizes.body,
      fontWeight: '500',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      margin: 20,
      maxHeight: '80%',
      width: '90%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      color: colors.text,
      fontSize: sizes.title,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: 4,
    },
    modalBody: {
      padding: 16,
    },
    modalParagraph: {
      color: colors.text,
      fontSize: sizes.body,
      lineHeight: sizes.body * 1.5,
      marginBottom: 12,
    },
    modalSubheading: {
      color: colors.text,
      fontSize: sizes.subtitle,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    contactInfo: {
      color: colors.secondary,
      fontSize: sizes.body,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 16,
    },
    // Subtle link styles
    subtleLinkContainer: {
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    subtleLinkText: {
      color: colors.text,
      fontSize: sizes.body,
      fontWeight: '400',
    },
    // Simple reset button styles
    resetButtonContainer: {
      marginTop: 32,
      alignItems: 'center',
    },
    resetButton: {
      backgroundColor: '#FF6B47',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignSelf: 'flex-start',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    resetButtonText: {
      color: '#FFFFFF',
      fontSize: sizes.body,
      fontWeight: '600',
    },
  });

  const PrivacyPolicyModal = () => (
    <Modal
      visible={showPrivacyModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('UI.about.privacyTitle')}</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowPrivacyModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalParagraph}>
              <Text style={{ fontWeight: 'bold' }}>{t('UI.about.lastUpdated')}:</Text> December 2024
            </Text>
            
            <Text style={styles.modalParagraph}>
              {t('UI.about.privacyIntro')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.infoWeCollect')}</Text>
            <Text style={styles.modalParagraph}>
              • <Text style={{ fontWeight: '600' }}>{t('UI.about.readingProgress')}:</Text> {t('UI.about.readingProgressDesc')}
            </Text>
            <Text style={styles.modalParagraph}>
              • <Text style={{ fontWeight: '600' }}>{t('UI.about.emojiReactions')}:</Text> {t('UI.about.emojiReactionsDesc')}
            </Text>
            <Text style={styles.modalParagraph}>
              • <Text style={{ fontWeight: '600' }}>{t('UI.about.appSettings')}:</Text> {t('UI.about.appSettingsDesc')}
            </Text>
            <Text style={styles.modalParagraph}>
              • <Text style={{ fontWeight: '600' }}>{t('UI.about.groupReadingData')}:</Text> {t('UI.about.groupReadingDataDesc')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.howWeUse')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.howWeUseDesc')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.dataStorage')}</Text>
            <Text style={styles.modalParagraph}>
              • {t('UI.about.dataStoragePoint1')}
            </Text>
            <Text style={styles.modalParagraph}>
              • {t('UI.about.dataStoragePoint2')}
            </Text>
            <Text style={styles.modalParagraph}>
              • {t('UI.about.dataStoragePoint3')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.thirdParty')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.thirdPartyDesc')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.childrenPrivacy')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.childrenPrivacyDesc')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.policyChanges')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.policyChangesDesc')}
            </Text>

            <Text style={styles.contactInfo}>
              {t('UI.about.contactInfo')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const TermsOfServiceModal = () => (
    <Modal
      visible={showTermsModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowTermsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('UI.about.termsTitle')}</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalParagraph}>
              <Text style={{ fontWeight: 'bold' }}>{t('UI.about.lastUpdated')}:</Text> December 2024
            </Text>
            
            <Text style={styles.modalParagraph}>
              {t('UI.about.termsIntro')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.appDescription')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.appDescriptionText')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.acceptableUse')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.acceptableUseIntro')}
            </Text>
            <Text style={styles.modalParagraph}>
              • {t('UI.about.acceptableUsePoint1')}
            </Text>
            <Text style={styles.modalParagraph}>
              • {t('UI.about.acceptableUsePoint2')}
            </Text>
            <Text style={styles.modalParagraph}>
              • {t('UI.about.acceptableUsePoint3')}
            </Text>
            <Text style={styles.modalParagraph}>
              • {t('UI.about.acceptableUsePoint4')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.intellectualProperty')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.intellectualPropertyDesc')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.userContent')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.userContentDesc')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.disclaimers')}</Text>
            <Text style={styles.modalParagraph}>
              • {t('UI.about.disclaimersPoint1')}
            </Text>
            <Text style={styles.modalParagraph}>
              • {t('UI.about.disclaimersPoint2')}
            </Text>
            <Text style={styles.modalParagraph}>
              • {t('UI.about.disclaimersPoint3')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.limitationLiability')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.limitationLiabilityDesc')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.termination')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.terminationDesc')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.governingLaw')}</Text>
            <Text style={styles.modalParagraph}>
              {t('UI.about.governingLawDesc')}
            </Text>

            <Text style={styles.contactInfo}>
              {t('UI.about.contactInfo')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const CopyrightModal = () => (
    <Modal
      visible={showCopyrightModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCopyrightModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('UI.about.copyrightTitle')}</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowCopyrightModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalParagraph}>
              {t('UI.about.copyrightText1')}
            </Text>
            
            <Text style={styles.modalParagraph}>
              {t('UI.about.copyrightText2')}
            </Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.copyrightWebsite')}
            </Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.copyrightTrademark')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.copyrightFirstEdition')}</Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.copyrightDesign')}
            </Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.copyrightLoc')}
            </Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.copyrightIsbn')}
            </Text>

            <Text style={styles.modalParagraph}>
              (Codra) 10 9 8 7 6 5 4 3 2 1
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const NLTModal = () => (
    <Modal
      visible={showNLTModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowNLTModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('UI.about.nltTitle')}</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowNLTModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalParagraph}>
              {t('UI.about.nltText1')}
            </Text>
            
            <Text style={styles.modalParagraph}>
              {t('UI.about.nltText2')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.nltAbout')}</Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.nltAboutDesc1')}
            </Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.nltAboutDesc2')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.nltUsageGuidelines')}</Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.nltUsage1')}
            </Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.nltUsage2')}
            </Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.nltUsage3')}
            </Text>

            <Text style={styles.modalSubheading}>{t('UI.about.nltLearnMore')}</Text>

            <Text style={styles.modalParagraph}>
              {t('UI.about.nltLearnMoreDesc')}
            </Text>

            <Text style={styles.contactInfo}>
              {t('UI.about.nltPublisher')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('UI.about.title')}</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.heading1}>{t('UI.about.heading')}</Text>
          
          <Text style={styles.subtitle}>{t('UI.about.tagline')}</Text>
          
          <Text style={styles.paragraph}>
            {t('UI.about.intro1')}
          </Text>
          
          <Text style={styles.paragraph}>
            {t('UI.about.intro2')}
          </Text>

          <Text style={styles.heading2}>{t('UI.about.whyCreated')}</Text>
          
          <Text style={styles.paragraph}>
            {t('UI.about.whyPara1')}
          </Text>
          
          <Text style={styles.paragraph}>
            {t('UI.about.whyPara2')}
          </Text>
          
          <Text style={styles.paragraph}>
            {t('UI.about.whyPara3')}
          </Text>

          <Text style={styles.heading2}>{t('UI.about.howItWorks')}</Text>

          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('UI.about.step1Title')}</Text>
            <Text style={styles.stepDescription}>
              {t('UI.about.step1Desc')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              <View style={[styles.colorBadge, { backgroundColor: '#E5E5E5' }]}>
                <Text style={[styles.colorBadgeText, { color: '#555' }]}>{t('UI.about.colorGray')}</Text>
              </View>
              <View style={[styles.colorBadge, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.colorBadgeText, { color: '#D32F2F' }]}>{t('UI.about.colorRed')}</Text>
              </View>
              <View style={[styles.colorBadge, { backgroundColor: '#E8F5E8' }]}>
                <Text style={[styles.colorBadgeText, { color: '#388E3C' }]}>{t('UI.about.colorGreen')}</Text>
              </View>
              <View style={[styles.colorBadge, { backgroundColor: '#E3F2FD' }]}>
                <Text style={[styles.colorBadgeText, { color: '#1976D2' }]}>{t('UI.about.colorBlue')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('UI.about.step2Title')}</Text>
            <Text style={styles.stepDescription}>
              {t('UI.about.step2Desc')}
            </Text>
          </View>

          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('UI.about.step3Title')}</Text>
            <Text style={styles.stepDescription}>
              {t('UI.about.step3Desc')}
            </Text>
            <View style={{ marginTop: 8 }}>
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>❤️</Text>
                <Text style={styles.emojiDescription}>{t('UI.about.emojiHeart')}</Text>
              </View>
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>👍</Text>
                <Text style={styles.emojiDescription}>{t('UI.about.emojiThumbsUp')}</Text>
              </View>
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>🤔</Text>
                <Text style={styles.emojiDescription}>{t('UI.about.emojiThinking')}</Text>
              </View>
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>🙏</Text>
                <Text style={styles.emojiDescription}>{t('UI.about.emojiPraying')}</Text>
              </View>
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>📝</Text>
                <Text style={styles.emojiDescription}>{t('UI.about.emojiNotes')}</Text>
              </View>
            </View>
            <Text style={[styles.stepDescription, { marginTop: 8 }]}>
              {t('UI.about.step3Desc2')}
            </Text>
          </View>

          <Text style={styles.heading2}>{t('UI.about.features')}</Text>

          <Text style={styles.heading3}>{t('UI.about.flexiblePlans')}</Text>
          <Text style={styles.paragraph}>{t('UI.about.flexiblePlansDesc')}</Text>
          <Text style={styles.bulletPoint}>
            • <Text style={{ fontWeight: '600' }}>{t('UI.about.wholeYearPlans')}</Text> - {t('UI.about.wholeYearPlansDesc')}
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={{ fontWeight: '600' }}>{t('UI.about.monthlyChallenges')}</Text> - {t('UI.about.monthlyChallengesDesc')}
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={{ fontWeight: '600' }}>{t('UI.about.miniStudies')}</Text> - {t('UI.about.miniStudiesDesc')}
          </Text>
          <Text style={styles.bulletPoint}>
            • {t('UI.about.flexibleNote')}
          </Text>

          <Text style={styles.heading3}>{t('UI.about.trackGrowth')}</Text>
          <Text style={styles.paragraph}>{t('UI.about.trackGrowthDesc')}</Text>
          <Text style={styles.bulletPoint}>• {t('UI.about.trackStreak')}</Text>
          <Text style={styles.bulletPoint}>• {t('UI.about.trackProgress')}</Text>
          <Text style={styles.bulletPoint}>• {t('UI.about.trackBadges')}</Text>
          <Text style={styles.bulletPoint}>• {t('UI.about.trackRemember')}</Text>

          <Text style={styles.heading3}>{t('UI.about.makeItYours')}</Text>
          <Text style={styles.paragraph}>{t('UI.about.makeItYoursDesc')}</Text>
          <Text style={styles.bulletPoint}>• {t('UI.about.adjustTextSize')}</Text>
          <Text style={styles.bulletPoint}>• {t('UI.about.switchMode')}</Text>
          <Text style={styles.bulletPoint}>• {t('UI.about.selectLanguage')}</Text>
          <Text style={styles.bulletPoint}>• {t('UI.about.lockOrientation')}</Text>

          <Text style={styles.heading2}>{t('UI.about.joinMovement')}</Text>
          
          <Text style={styles.paragraph}>
            {t('UI.about.joinPara1')}
          </Text>
          
          <Text style={styles.paragraph}>
            {t('UI.about.joinPara2')}
          </Text>

          <View style={styles.callout}>
            <Text style={styles.calloutText}>
              {t('UI.about.callout')}
            </Text>
          </View>

          {/* About SourceView Section */}
          <View style={styles.legalSection}>
            <Text style={styles.legalHeading}>{t('UI.about.aboutSourceView')}</Text>
            
            <Pressable
              style={styles.subtleLinkContainer}
              onPress={() => setShowCopyrightModal(true)}
            >
              <Text style={styles.subtleLinkText}>{t('UI.about.copyright')}</Text>
            </Pressable>
            
            <Pressable
              style={styles.subtleLinkContainer}
              onPress={() => setShowNLTModal(true)}
            >
              <Text style={styles.subtleLinkText}>{t('UI.about.nlt')}</Text>
            </Pressable>
          </View>

          {/* Analytics Settings */}
          <View style={{ paddingHorizontal: 20 }}>
            <AnalyticsSettings colors={colors} isDarkMode={colors.background === '#000000'} />
          </View>

          {/* Analytics Debug Button (Testing) */}
          <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
            <Pressable
              style={{
                backgroundColor: '#FF9800',
                padding: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => router.push('/analytics-debug' as any)}
            >
              <Ionicons name="bug" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
                🧪 Analytics Debug
              </Text>
            </Pressable>
          </View>

          {/* Legal Section */}
          <View style={styles.legalSection}>
            <Text style={styles.legalHeading}>{t('UI.about.legalInfo')}</Text>
            <View style={styles.legalLinksContainer}>
              <Pressable
                style={styles.legalLink}
                onPress={() => setShowPrivacyModal(true)}
              >
                <Text style={styles.legalLinkText}>{t('UI.about.privacyPolicy')}</Text>
              </Pressable>
              <Pressable
                style={styles.legalLink}
                onPress={() => setShowTermsModal(true)}
              >
                <Text style={styles.legalLinkText}>{t('UI.about.termsOfService')}</Text>
              </Pressable>
            </View>
          </View>

          {/* Reset Onboarding - Only show in development */}
          {__DEV__ && (
            <View style={styles.resetButtonContainer}>
              <Pressable
                style={styles.resetButton}
                onPress={handleResetOnboarding}
              >
                <Text style={styles.resetButtonText}>{t('UI.about.resetOnboarding')}</Text>
              </Pressable>
            </View>
          )}
          
          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Legal Modals */}
      <PrivacyPolicyModal />
      <TermsOfServiceModal />
      <CopyrightModal />
      <NLTModal />
    </SafeAreaView>
  );
};

export default About; 