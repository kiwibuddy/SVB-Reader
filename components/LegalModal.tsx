import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFontSize } from '@/context/FontSizeContext';
import { useAppSettings } from '@/context/AppSettingsContext';

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

const LegalModal: React.FC<LegalModalProps> = ({ visible, onClose, type }) => {
  const { sizes } = useFontSize();
  const { colors } = useAppSettings();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.background,
      borderRadius: 16,
      margin: 20,
      maxHeight: '85%',
      width: '90%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      color: colors.text,
      fontSize: sizes.title,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: 8,
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    heading2: {
      color: colors.text,
      fontSize: sizes.subtitle + 2,
      fontWeight: '700',
      marginTop: 20,
      marginBottom: 12,
    },
    heading3: {
      color: colors.text,
      fontSize: sizes.subtitle,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    paragraph: {
      color: colors.text,
      fontSize: sizes.body,
      lineHeight: sizes.body * 1.5,
      marginBottom: 12,
    },
    bulletPoint: {
      color: colors.text,
      fontSize: sizes.body,
      lineHeight: sizes.body * 1.5,
      marginBottom: 6,
      marginLeft: 16,
    },
    effectiveDate: {
      color: colors.textSecondary,
      fontSize: sizes.caption,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 16,
    },
  });

  const renderPrivacyPolicy = () => (
    <>
      <Text style={styles.effectiveDate}>Effective Date: {new Date().toLocaleDateString()}</Text>
      
      <Text style={styles.heading2}>Information We Collect</Text>
      <Text style={styles.bulletPoint}>• Reading preferences and Bible translations</Text>
      <Text style={styles.bulletPoint}>• Emoji reactions and role selections</Text>
      <Text style={styles.bulletPoint}>• Reading progress and achievements</Text>
      <Text style={styles.bulletPoint}>• All data stored locally on your device</Text>
      
      <Text style={styles.heading2}>How We Use Your Information</Text>
      <Text style={styles.bulletPoint}>• Enable collaborative Bible reading</Text>
      <Text style={styles.bulletPoint}>• Track your reading progress</Text>
      <Text style={styles.bulletPoint}>• Maintain streaks and achievements</Text>
      <Text style={styles.bulletPoint}>• Customize your experience</Text>
      
      <Text style={styles.heading2}>Data Storage</Text>
      <Text style={styles.paragraph}>
        All your data is stored locally on your device using SQLite. We do not store your information on our servers or share it with third parties.
      </Text>
      
      <Text style={styles.heading2}>Your Rights</Text>
      <Text style={styles.bulletPoint}>• View your data within the app</Text>
      <Text style={styles.bulletPoint}>• Delete data by uninstalling the app</Text>
      <Text style={styles.bulletPoint}>• Contact us with questions</Text>
      
             <Text style={styles.heading2}>Contact</Text>
       <Text style={styles.paragraph}>
         Questions? Contact us at support@svbyouthreader.com
       </Text>
    </>
  );

  const renderTermsOfService = () => (
    <>
      <Text style={styles.effectiveDate}>Effective Date: {new Date().toLocaleDateString()}</Text>
      
      <Text style={styles.heading2}>What SVB Youth Reader Does</Text>
      <Text style={styles.bulletPoint}>• Collaborative Bible reading with friends</Text>
      <Text style={styles.bulletPoint}>• Color-coded reading roles</Text>
      <Text style={styles.bulletPoint}>• Verse reactions with emoji</Text>
      <Text style={styles.bulletPoint}>• Reading progress tracking</Text>
      <Text style={styles.bulletPoint}>• Achievements and challenges</Text>
      
      <Text style={styles.heading2}>User Guidelines</Text>
      <Text style={styles.bulletPoint}>• Be respectful in social interactions</Text>
      <Text style={styles.bulletPoint}>• Use app for personal, non-commercial purposes</Text>
      <Text style={styles.bulletPoint}>• Report inappropriate behavior</Text>
      <Text style={styles.bulletPoint}>• Respect others' religious beliefs</Text>
      
      <Text style={styles.heading2}>Your Data</Text>
      <Text style={styles.paragraph}>
        Your reading data is stored locally on your device. Uninstalling the app will delete your data.
      </Text>
      
      <Text style={styles.heading2}>Age Requirements</Text>
      <Text style={styles.paragraph}>
        Suitable for all ages. Users under 13 should have parental permission.
      </Text>
      
             <Text style={styles.heading2}>Contact</Text>
       <Text style={styles.paragraph}>
         Questions about these terms? Contact us at support@svbyouthreader.com
       </Text>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {type === 'privacy' ? renderPrivacyPolicy() : renderTermsOfService()}
              <View style={{ height: 20 }} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default LegalModal; 