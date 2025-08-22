import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';

interface QRInfoScreenProps {
  storyTitle: string;
  onClose: () => void;
}

const QRInfoScreen: React.FC<QRInfoScreenProps> = ({
  storyTitle,
  onClose,
}) => {
  const { colors } = useAppSettings();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 8 : 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    iconBackground: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 32,
    },
    storyName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 4,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderColor: colors.border,
      borderWidth: 1,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepsList: {
      marginBottom: 16,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    stepNumberText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    stepText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 22,
      flex: 1,
    },
    highlightCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    highlightTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    highlightText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    buttonContainer: {
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    closeButtonLarge: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Help</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: 20
        }}
        bounces={true}
        alwaysBounceVertical={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="qr-code" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>QR Code Sharing</Text>
          <Text style={styles.storyName}>"{storyTitle}"</Text>
          <Text style={styles.subtitle}>
            Learn how QR codes help others join your reading group
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoTitle}>
            <Ionicons name="help-circle" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>How It Works</Text>
          </View>
          
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Start broadcasting your reading group (tap "Start Broadcasting")
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                A QR code will be generated with your session information
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Others can scan the QR code to instantly join your group
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>
                Share the QR code via text, social media, or show it in person
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.highlightCard}>
          <View style={styles.highlightTitle}>
            <Ionicons name="information-circle" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Why Use QR Codes?</Text>
          </View>
          <Text style={styles.highlightText}>
            QR codes make it super easy for others to join your reading group without having to manually enter session IDs or search for your group. Just scan and join!
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoTitle}>
            <Ionicons name="people" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Other Ways to Join</Text>
          </View>
          <Text style={styles.stepText}>
            If QR scanning doesn't work, others can also:{'\n\n'}
            • Find your session on their home screen{'\n'}
            • Manually enter the Session ID{'\n'}
            • Use the share link you send them
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.closeButtonLarge}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default QRInfoScreen; 