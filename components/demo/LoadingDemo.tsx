import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSettings } from '@/context/AppSettingsContext';
import {
  StaticSplashIcon,
  ProgressIndicator,
  LinearProgress,
  LoadingScreen,
  LoadingStage,
  SkeletonLoader,
  SkeletonText,
  SkeletonCard,
  SkeletonBibleVerse,
  SkeletonList,
  SkeletonNavigationItem,
  SkeletonReadingProgress,
} from '@/components/loading';

export const LoadingDemo: React.FC = () => {
  const { colors } = useAppSettings();
  const [progress, setProgress] = useState(0.3);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('loading-database');
  const [showSkeletons, setShowSkeletons] = useState(true);

  const stages: LoadingStage[] = [
    'initializing',
    'loading-database',
    'loading-content',
    'preparing-reading',
    'almost-ready',
    'complete'
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>
          Loading System Demo
        </Text>

        {/* Animated Icons Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Animated Splash Icons
          </Text>
          <View style={styles.iconRow}>
            <View style={styles.iconContainer}>
              <StaticSplashIcon size={80} />
              <Text style={[styles.iconLabel, { color: colors.secondary }]}>
                Static Icon
              </Text>
            </View>
            <View style={styles.iconContainer}>
              <StaticSplashIcon size={80} />
              <Text style={[styles.iconLabel, { color: colors.secondary }]}>
                Static Icon
              </Text>
            </View>
            <View style={styles.iconContainer}>
              <StaticSplashIcon size={80} />
              <Text style={[styles.iconLabel, { color: colors.secondary }]}>
                Static Icon
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Indicators Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Progress Indicators
          </Text>
          
          <View style={styles.progressContainer}>
            <ProgressIndicator 
              progress={progress} 
              showPercentage={true}
              message="Loading Bible content..."
            />
          </View>

          <View style={styles.progressContainer}>
            <LinearProgress 
              progress={progress}
              message="Preparing verses..."
            />
          </View>

          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => setProgress(Math.max(0, progress - 0.1))}
            >
              <Text style={styles.buttonText}>-10%</Text>
            </TouchableOpacity>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {Math.round(progress * 100)}%
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => setProgress(Math.min(1, progress + 0.1))}
            >
              <Text style={styles.buttonText}>+10%</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading Stages Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Loading Stages
          </Text>
          
          <View style={styles.stageButtons}>
            {stages.map((stage) => (
              <TouchableOpacity
                key={stage}
                style={[
                  styles.stageButton,
                  { 
                    backgroundColor: loadingStage === stage ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setLoadingStage(stage)}
              >
                <Text style={[
                  styles.stageButtonText,
                  { 
                    color: loadingStage === stage ? '#fff' : colors.text,
                  }
                ]}>
                  {stage.replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.currentStage, { color: colors.secondary }]}>
            Current: {loadingStage}
          </Text>
        </View>

        {/* Skeleton Loading Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Skeleton Loading Components
          </Text>

          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: colors.secondary }]}
            onPress={() => setShowSkeletons(!showSkeletons)}
          >
            <Text style={styles.buttonText}>
              {showSkeletons ? 'Hide Skeletons' : 'Show Skeletons'}
            </Text>
          </TouchableOpacity>

          {showSkeletons ? (
            <View style={styles.skeletonContainer}>
              <Text style={[styles.skeletonLabel, { color: colors.secondary }]}>
                Bible Verse Skeleton:
              </Text>
              <SkeletonBibleVerse />

              <Text style={[styles.skeletonLabel, { color: colors.secondary }]}>
                Navigation Item Skeleton:
              </Text>
              <SkeletonNavigationItem />

              <Text style={[styles.skeletonLabel, { color: colors.secondary }]}>
                Reading Progress Skeleton:
              </Text>
              <SkeletonReadingProgress />

              <Text style={[styles.skeletonLabel, { color: colors.secondary }]}>
                Text Skeleton:
              </Text>
              <SkeletonText lines={3} />

              <Text style={[styles.skeletonLabel, { color: colors.secondary }]}>
                List Skeleton:
              </Text>
              <SkeletonList count={3} />
            </View>
          ) : (
            <View style={styles.realContent}>
              <Text style={[styles.realContentText, { color: colors.text }]}>
                📖 This is what real content looks like when loading is complete!
              </Text>
              <Text style={[styles.realContentSubtext, { color: colors.secondary }]}>
                The skeleton components provide smooth placeholders while your actual content loads.
              </Text>
            </View>
          )}
        </View>

        {/* Full Loading Screen Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Full Loading Screen Preview
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
            This is what users see during app initialization
          </Text>
          
          <View style={styles.loadingPreview}>
            <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
              <LoadingScreen
                stage={loadingStage}
                progress={progress}
                showProgress={true}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'Mistrully',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Manrope-SemiBold',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Manrope-Light',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'Manrope-Regular',
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  stageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  stageButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  currentStage: {
    fontSize: 14,
    marginTop: 8,
    textTransform: 'capitalize',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  skeletonContainer: {
    marginTop: 8,
  },
  skeletonLabel: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  realContent: {
    padding: 20,
    alignItems: 'center',
  },
  realContentText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Manrope-Medium',
  },
  realContentSubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Manrope-Light',
  },
  loadingPreview: {
    marginTop: 16,
  },
  previewContainer: {
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
