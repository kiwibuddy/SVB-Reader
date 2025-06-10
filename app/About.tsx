import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFontSize } from '@/context/FontSizeContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import LegalModal from '@/components/LegalModal';

const About = () => {
  const router = useRouter();
  const { sizes } = useFontSize();
  const { colors } = useAppSettings();
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms'>('privacy');

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
      color: colors.textSecondary,
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
      color: colors.textSecondary,
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
  });

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

          <Text style={styles.heading2}>Legal Information</Text>
          
          <Pressable 
            style={styles.stepContainer}
            onPress={() => {
              setLegalModalType('privacy');
              setLegalModalVisible(true);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Privacy Policy</Text>
                <Text style={styles.stepDescription}>
                  Learn how we protect your privacy and handle your data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Pressable>

          <Pressable 
            style={styles.stepContainer}
            onPress={() => {
              setLegalModalType('terms');
              setLegalModalVisible(true);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Terms of Service</Text>
                <Text style={styles.stepDescription}>
                  Understand your rights and responsibilities when using our app
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Pressable>

          <Text style={styles.heading3}>App Information</Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontWeight: '600' }}>Version:</Text> 1.1.0{'\n'}
            <Text style={{ fontWeight: '600' }}>Developer:</Text> KiwiBuddy{'\n'}
            <Text style={{ fontWeight: '600' }}>Support:</Text> [YOUR EMAIL]
          </Text>
          
          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
      
      <LegalModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        type={legalModalType}
      />
    </SafeAreaView>
  );
};

export default About; 