import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close-outline" size={24} color="black" />
        </Pressable>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>About This App</Text>
        
        <Text style={styles.heading}>Welcome!</Text>
        <Text style={styles.paragraph}>
          This app is designed to help you navigate through content easily and efficiently.
        </Text>

        <Text style={styles.heading}>Features</Text>
        <Text style={styles.paragraph}>
          • Easy navigation between chapters{'\n'}
          • Clean, intuitive interface{'\n'}
          • Bookmark functionality{'\n'}
          • Dark/Light mode support
        </Text>

        <Text style={styles.heading}>How to Use</Text>
        <Text style={styles.paragraph}>
          Navigate through the app using the bottom navigation bar. Use the book icon
          to access the full table of contents, and the home icon to return to the
          main screen.
        </Text>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 15,
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 15,
  },
  version: {
    marginTop: 30,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});