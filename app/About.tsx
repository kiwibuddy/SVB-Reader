import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFontSize } from '@/context/FontSizeContext';
import { useAppSettings } from '@/context/AppSettingsContext';

const About = () => {
  const router = useRouter();
  const { sizes } = useFontSize();
  const { colors } = useAppSettings();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowPrivacyModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalParagraph}>
              <Text style={{ fontWeight: 'bold' }}>Last updated:</Text> December 2024
            </Text>
            
            <Text style={styles.modalParagraph}>
              SourceView Reader ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Bible reading app.
            </Text>

            <Text style={styles.modalSubheading}>Information We Collect</Text>
            <Text style={styles.modalParagraph}>
              • <Text style={{ fontWeight: '600' }}>Reading Progress:</Text> Your reading history, bookmarks, and progress through Bible passages are stored locally on your device.
            </Text>
            <Text style={styles.modalParagraph}>
              • <Text style={{ fontWeight: '600' }}>Emoji Reactions:</Text> When you react to verses with emojis, these reactions are stored locally on your device.
            </Text>
            <Text style={styles.modalParagraph}>
              • <Text style={{ fontWeight: '600' }}>App Settings:</Text> Your preferences for text size, theme, and language are stored locally.
            </Text>
            <Text style={styles.modalParagraph}>
              • <Text style={{ fontWeight: '600' }}>Group Reading Data:</Text> When using group reading features, temporary session data is shared between nearby devices via Bluetooth.
            </Text>

            <Text style={styles.modalSubheading}>How We Use Your Information</Text>
            <Text style={styles.modalParagraph}>
              We use your information solely to provide and improve the SourceView Reader experience. Your reading progress helps us remember where you left off, and your preferences ensure a comfortable reading experience.
            </Text>

            <Text style={styles.modalSubheading}>Data Storage & Security</Text>
            <Text style={styles.modalParagraph}>
              • All your data is stored locally on your device
            </Text>
            <Text style={styles.modalParagraph}>
              • We do not collect or transmit personal information to external servers
            </Text>
            <Text style={styles.modalParagraph}>
              • Group reading sessions use temporary Bluetooth connections that are not stored
            </Text>

            <Text style={styles.modalSubheading}>Third-Party Services</Text>
            <Text style={styles.modalParagraph}>
              SourceView Reader does not integrate with third-party analytics, advertising, or tracking services. Your reading experience remains private and focused.
            </Text>

            <Text style={styles.modalSubheading}>Children's Privacy</Text>
            <Text style={styles.modalParagraph}>
              Our app is designed for users of all ages. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
            </Text>

            <Text style={styles.modalSubheading}>Changes to This Policy</Text>
            <Text style={styles.modalParagraph}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app and updating the "Last updated" date.
            </Text>

            <Text style={styles.contactInfo}>
              For questions about this Privacy Policy, please contact us at: [YOUR EMAIL]
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
            <Text style={styles.modalTitle}>Terms of Service</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalParagraph}>
              <Text style={{ fontWeight: 'bold' }}>Last updated:</Text> December 2024
            </Text>
            
            <Text style={styles.modalParagraph}>
              By downloading and using SourceView Reader, you agree to these Terms of Service. If you do not agree, please do not use the app.
            </Text>

            <Text style={styles.modalSubheading}>App Description</Text>
            <Text style={styles.modalParagraph}>
              SourceView Reader is a Bible reading application that facilitates group reading experiences through role-based reading assignments and interactive features.
            </Text>

            <Text style={styles.modalSubheading}>Acceptable Use</Text>
            <Text style={styles.modalParagraph}>
              You agree to use SourceView Reader only for lawful purposes and in accordance with these Terms. You agree not to:
            </Text>
            <Text style={styles.modalParagraph}>
              • Use the app to harass, abuse, or harm others
            </Text>
            <Text style={styles.modalParagraph}>
              • Attempt to reverse engineer or modify the app
            </Text>
            <Text style={styles.modalParagraph}>
              • Use the app for commercial purposes without permission
            </Text>
            <Text style={styles.modalParagraph}>
              • Share inappropriate content through group reading features
            </Text>

            <Text style={styles.modalSubheading}>Intellectual Property</Text>
            <Text style={styles.modalParagraph}>
              The SourceView Reader app, including its design, features, and content, is protected by copyright and other intellectual property laws. The Bible text used in the app is from the New Living Translation (NLT) and is used with permission.
            </Text>

            <Text style={styles.modalSubheading}>User Content</Text>
            <Text style={styles.modalParagraph}>
              When you use features like emoji reactions or group reading, you retain ownership of your content. You grant us a limited license to display and process this content solely for the purpose of providing the app's functionality.
            </Text>

            <Text style={styles.modalSubheading}>Disclaimers</Text>
            <Text style={styles.modalParagraph}>
              • The app is provided "as is" without warranties of any kind
            </Text>
            <Text style={styles.modalParagraph}>
              • We are not responsible for the accuracy of Bible translations
            </Text>
            <Text style={styles.modalParagraph}>
              • Group reading features depend on device compatibility and proximity
            </Text>

            <Text style={styles.modalSubheading}>Limitation of Liability</Text>
            <Text style={styles.modalParagraph}>
              In no event shall SourceView Reader be liable for any indirect, incidental, special, or consequential damages arising from your use of the app.
            </Text>

            <Text style={styles.modalSubheading}>Termination</Text>
            <Text style={styles.modalParagraph}>
              We may terminate or suspend your access to the app immediately, without prior notice, for any reason, including breach of these Terms.
            </Text>

            <Text style={styles.modalSubheading}>Governing Law</Text>
            <Text style={styles.modalParagraph}>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
            </Text>

            <Text style={styles.contactInfo}>
              For questions about these Terms of Service, please contact us at: [YOUR EMAIL]
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
        <Text style={styles.title}>About</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.heading1}>About SourceView Reader</Text>
          
          <Text style={styles.subtitle}>Read Together. Grow Together.</Text>
          
          <Text style={styles.paragraph}>
            Imagine sitting with your friends, each taking turns bringing ancient words to life through your voices. This isn't just another Bible app—it's a whole new way to experience scripture together.
          </Text>
          
          <Text style={styles.paragraph}>
            SourceView Reader transforms Bible reading from something you do alone into something you share. When friends gather around this app, the Bible becomes a living conversation. Different voices. Fresh perspectives. Real connections.
          </Text>

          <Text style={styles.heading2}>Why We Created This</Text>
          
          <Text style={styles.paragraph}>
            We've all been there—trying to read the Bible but getting lost in the format, confused about who's speaking, or simply finding it hard to stay engaged. What if there was a better way?
          </Text>
          
          <Text style={styles.paragraph}>
            The SourceView Bible began with a simple idea: what if we could see at a glance who is speaking in each passage? What if we could experience scripture the way its first audiences did—as dynamic stories and letters shared in community?
          </Text>
          
          <Text style={styles.paragraph}>
            After 40,000+ hours of research by people passionate about making scripture accessible, the SourceView format was born. Now, with the SourceView Reader app, we're bringing this revolutionary approach to your friend group, study circle, or family gathering.
          </Text>

          <Text style={styles.heading2}>How It Works</Text>

          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>1. Gather Your Circle (2-4 People)</Text>
            <Text style={styles.stepDescription}>
              Load up a Bible story on everyone's phones. Each person chooses a reading role:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              <View style={[styles.colorBadge, { backgroundColor: '#E5E5E5' }]}>
                <Text style={[styles.colorBadgeText, { color: '#555' }]}>Gray for Narrator</Text>
              </View>
              <View style={[styles.colorBadge, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.colorBadgeText, { color: '#D32F2F' }]}>Red for God</Text>
              </View>
              <View style={[styles.colorBadge, { backgroundColor: '#E8F5E8' }]}>
                <Text style={[styles.colorBadgeText, { color: '#388E3C' }]}>Green for Main Character</Text>
              </View>
              <View style={[styles.colorBadge, { backgroundColor: '#E3F2FD' }]}>
                <Text style={[styles.colorBadgeText, { color: '#1976D2' }]}>Blue for Other Voices</Text>
              </View>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>2. Start Reading Together</Text>
            <Text style={styles.stepDescription}>
              When it's your turn to read, your speech bubbles light up with a special glow. No more confusion about who reads what—just follow the colors and glowing cues.
            </Text>
          </View>

          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>3. React & Reflect</Text>
            <Text style={styles.stepDescription}>
              Found a verse that speaks to you? Long-press to mark it with:
            </Text>
            <View style={{ marginTop: 8 }}>
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>❤️</Text>
                <Text style={styles.emojiDescription}>when it touches your heart</Text>
              </View>
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>👍</Text>
                <Text style={styles.emojiDescription}>when you strongly agree</Text>
              </View>
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>🤔</Text>
                <Text style={styles.emojiDescription}>when it makes you think</Text>
              </View>
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>🙏</Text>
                <Text style={styles.emojiDescription}>when it moves you to pray</Text>
              </View>
            </View>
            <Text style={[styles.stepDescription, { marginTop: 8 }]}>
              After each story, dive into thought-provoking questions that make scripture relevant to your daily life.
            </Text>
          </View>

          <Text style={styles.heading2}>Features That Keep You Coming Back</Text>

          <Text style={styles.heading3}>Flexible Reading Plans</Text>
          <Text style={styles.paragraph}>Whether you have 5 minutes or 50:</Text>
          <Text style={styles.bulletPoint}>
            • <Text style={{ fontWeight: '600' }}>Quick Challenges</Text> - Focused reading experiences around themes like "Hope in Difficult Times" or "4 Gospels and Acts"
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={{ fontWeight: '600' }}>Journey Plans</Text> - Longer paths through scripture, including the complete Bible in a year
          </Text>
          <Text style={styles.bulletPoint}>
            • Start, pause, or switch between plans anytime—the app remembers your progress
          </Text>

          <Text style={styles.heading3}>Track Your Growth</Text>
          <Text style={styles.paragraph}>Watch your understanding deepen over time:</Text>
          <Text style={styles.bulletPoint}>• See your current and best reading streaks</Text>
          <Text style={styles.bulletPoint}>• Track progress through the Old and New Testaments</Text>
          <Text style={styles.bulletPoint}>• Earn achievement badges that celebrate your consistency</Text>
          <Text style={styles.bulletPoint}>• Remember exactly where you left off, even across multiple reading plans</Text>

          <Text style={styles.heading3}>Make It Yours</Text>
          <Text style={styles.paragraph}>The app adapts to how you want to read:</Text>
          <Text style={styles.bulletPoint}>• Adjust text size for comfortable reading</Text>
          <Text style={styles.bulletPoint}>• Switch between light mode (for daytime) and dark mode (for evening reading)</Text>
          <Text style={styles.bulletPoint}>• Select your preferred language</Text>
          <Text style={styles.bulletPoint}>• Lock screen orientation when reading in bed</Text>

          <Text style={styles.heading2}>Join the Movement</Text>
          
          <Text style={styles.paragraph}>
            Around the world, friend groups, roommates, couples, and families are rediscovering the power of experiencing scripture together. They're having deeper conversations. Making unexpected discoveries. Building stronger faith communities.
          </Text>
          
          <Text style={styles.paragraph}>
            The Bible was never meant to be experienced alone. Download SourceView Reader today and see what happens when ancient wisdom meets modern community.
          </Text>

          <View style={styles.callout}>
            <Text style={styles.calloutText}>
              Ready to get started? Tap "Get Started" and begin your journey through scripture—or better yet, invite a friend to join you.
            </Text>
          </View>

          {/* Legal Section */}
          <View style={styles.legalSection}>
            <Text style={styles.legalHeading}>Legal Information</Text>
            <View style={styles.legalLinksContainer}>
              <Pressable
                style={styles.legalLink}
                onPress={() => setShowPrivacyModal(true)}
              >
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </Pressable>
              <Pressable
                style={styles.legalLink}
                onPress={() => setShowTermsModal(true)}
              >
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </Pressable>
            </View>
          </View>
          
          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Legal Modals */}
      <PrivacyPolicyModal />
      <TermsOfServiceModal />
    </SafeAreaView>
  );
};

export default About; 