import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, useWindowDimensions, Pressable } from "react-native";
import { Ionicons } from '@expo/vector-icons';

const createStyles = (isLargeScreen: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  resetButton: {
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  badge: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

const Achievements = () => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const styles = createStyles(isLargeScreen);

  // Add error boundary and loading state
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      try {
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading achievements:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Achievements</Text>
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Achievements</Text>
      </View>

      <ScrollView>
        {/* Reading Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading Progress</Text>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="book" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Total Stories Read</Text>
              <Text style={styles.cardSubtitle}>47 of 365 stories</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="time" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Average Reading Time</Text>
              <Text style={styles.cardSubtitle}>15 minutes per story</Text>
            </View>
          </View>
        </View>

        {/* Streaks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Current Streak</Text>
              <Text style={styles.cardSubtitle}>12 days</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="trending-up" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Best Streak</Text>
              <Text style={styles.cardSubtitle}>28 days</Text>
            </View>
          </View>
        </View>

        {/* Testament Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testament Progress</Text>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="book" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Old Testament</Text>
              <Text style={styles.cardSubtitle}>32 of 219 stories</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="book" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>New Testament</Text>
              <Text style={styles.cardSubtitle}>15 of 146 stories</Text>
            </View>
          </View>
        </View>

        {/* Reading Plans Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading Plans</Text>
          
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="list" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>30 Days with Jesus</Text>
              <Text style={styles.cardSubtitle}>Progress: 15/30 days</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '50%' }]} />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="list" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Wisdom Literature</Text>
              <Text style={styles.cardSubtitle}>Progress: 5/20 days</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '25%' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Challenges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenges</Text>
          
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="trophy" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Early Bird</Text>
              <Text style={styles.cardSubtitle}>Read 5 days before 8 AM</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '80%' }]} />
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>4/5</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="flame" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Weekly Warrior</Text>
              <Text style={styles.cardSubtitle}>Complete 7 day streak</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '60%' }]} />
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>4/7</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Group Leader</Text>
              <Text style={styles.cardSubtitle}>Lead 5 group sessions</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '40%' }]} />
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2/5</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset Statistics</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong.</Text>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default function WrappedAchievements() {
  return (
    <ErrorBoundary>
      <Achievements />
    </ErrorBoundary>
  );
}
