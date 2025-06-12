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
      padding: 20,
    },
    container: {
      backgroundColor: colors.background,
      borderRadius: 16,
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
      padding: 0,
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    title: {
      color: colors.text,
      fontSize: sizes.title,
      fontWeight: 'bold',
      flex: 1,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      padding: 12,
      paddingBottom: 20,
    },
    heading2: {
      color: '#000',
      fontSize: sizes.subtitle + 2,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 8,
    },
    heading3: {
      color: '#000',
      fontSize: sizes.subtitle,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    paragraph: {
      color: '#000',
      fontSize: sizes.body,
      lineHeight: sizes.body * 1.4,
      marginBottom: 12,
    },
    bulletPoint: {
      color: '#000',
      fontSize: sizes.body,
      lineHeight: sizes.body * 1.4,
      marginBottom: 4,
      marginLeft: 16,
    },
    effectiveDate: {
      color: '#333',
      fontSize: sizes.caption,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 16,
    },
  });

  const renderPrivacyPolicy = () => (
    <>
      <Text style={styles.effectiveDate}>Effective Date: {new Date().toLocaleDateString()}</Text>
      
      <Text style={styles.paragraph}>
        <Text style={{ fontWeight: 'bold' }}>No Personal Data Collection:</Text> We do not collect, store, or share any personal information. All your data is saved locally on your device and is never transmitted to us or any third party.
      </Text>
      <Text style={styles.paragraph}>
        <Text style={{ fontWeight: 'bold' }}>Children's Privacy:</Text> If you are under 13, please use this app with parental permission.
      </Text>
      <Text style={styles.heading2}>Information Saved on Your Device</Text>
      <Text style={styles.bulletPoint}>• Reading preferences and Bible translations</Text>
      <Text style={styles.bulletPoint}>• Emoji reactions and role selections</Text>
      <Text style={styles.bulletPoint}>• Reading progress and achievements</Text>
      <Text style={styles.bulletPoint}>• All data stored locally on your device</Text>
      
      <Text style={styles.heading2}>How Your Information Is Used</Text>
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
        Questions? Contact us at feedback@sourceviewbible.com
      </Text>
    </>
  );

  const renderTermsOfService = () => (
    <>
      <Text style={styles.effectiveDate}>Effective Date: {new Date().toLocaleDateString()}</Text>
      
      <Text style={styles.paragraph}>
        By using this app, you agree to our <Text style={{textDecorationLine: 'underline'}}>Privacy Policy</Text>.
      </Text>
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
      
      <Text style={styles.heading2}>Disclaimer & Limitation of Liability</Text>
      <Text style={styles.paragraph}>
        This app is provided "as is" without warranties of any kind. The developer is not responsible for any loss of data, damages, or other issues arising from the use of this app. Use at your own risk.
      </Text>
      
      <Text style={styles.heading2}>Contact</Text>
      <Text style={styles.paragraph}>
        Questions about these terms? Contact us at feedback@sourceviewbible.com
      </Text>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <ScrollView 
            style={styles.scrollContainer} 
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.content}>
              {type === 'privacy' ? renderPrivacyPolicy() : renderTermsOfService()}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default LegalModal; 