import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo, Image } from 'react-native';
import { ProgressIndicator, LinearProgress } from './ProgressIndicator';
import { useAppSettings } from '@/context/AppSettingsContext';

export type LoadingStage = 
  | 'initializing'
  | 'loading-database'
  | 'loading-content' 
  | 'preparing-reading'
  | 'almost-ready'
  | 'complete';

interface LoadingScreenProps {
  stage: LoadingStage;
  progress?: number; // 0 to 1
  customMessage?: string;
  showProgress?: boolean;
  onComplete?: () => void;
}

const LOADING_MESSAGES: Record<LoadingStage, string> = {
  'initializing': 'Initializing SourceView Together...',
  'loading-database': 'Loading Bible content...',
  'loading-content': 'Preparing verses...',
  'preparing-reading': 'Setting up your reading experience...',
  'almost-ready': 'Almost ready...',
  'complete': 'Welcome to SourceView Together!',
};

const STAGE_PROGRESS: Record<LoadingStage, number> = {
  'initializing': 0.1,
  'loading-database': 0.3,
  'loading-content': 0.6,
  'preparing-reading': 0.8,
  'almost-ready': 0.95,
  'complete': 1.0,
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  stage,
  progress,
  customMessage,
  showProgress = true,
  onComplete,
}) => {
  const { colors, isDarkMode } = useAppSettings();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [announceMessage, setAnnounceMessage] = useState<string>('');

  // Check for accessibility preferences
  useEffect(() => {
    const checkAccessibility = async () => {
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(isReduceMotionEnabled);
    };
    checkAccessibility();
  }, []);

  // Handle stage changes for accessibility
  useEffect(() => {
    const message = customMessage || LOADING_MESSAGES[stage];
    setAnnounceMessage(message);
    
    if (stage === 'complete' && onComplete) {
      setTimeout(onComplete, 500);
    }
  }, [stage, customMessage, onComplete]);

  const currentProgress = progress !== undefined ? progress : STAGE_PROGRESS[stage];
  const displayMessage = customMessage || LOADING_MESSAGES[stage];

  const getAnimationType = () => {
    if (reduceMotion) return 'gentle-pulse';
    
    switch (stage) {
      case 'initializing':
        return 'gentle-pulse';
      case 'loading-database':
      case 'loading-content':
        return 'pulse';
      case 'preparing-reading':
        return 'scale-rotate';
      case 'almost-ready':
        return 'gentle-pulse';
      default:
        return 'gentle-pulse';
    }
  };

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
      accessible={true}
      accessibilityLabel={announceMessage}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(currentProgress * 100) }}
    >
      {/* Background gradient effect */}
      <View 
        style={[
          styles.backgroundGradient, 
          { 
            backgroundColor: isDarkMode 
              ? 'rgba(255, 87, 51, 0.05)' 
              : 'rgba(255, 87, 51, 0.02)' 
          }
        ]} 
      />

      {/* Main content */}
      <View style={styles.content}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>

        {/* App Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          SourceView Together
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          Experience the Bible in community
        </Text>

        {/* Progress Section */}
        {showProgress && (
          <View style={styles.progressSection}>
            <ProgressIndicator
              progress={currentProgress}
              message={displayMessage}
              showPercentage={stage === 'loading-database' || stage === 'loading-content'}
              animated={!reduceMotion}
            />
          </View>
        )}

        {/* Linear progress for detailed operations */}
        {(stage === 'loading-database' || stage === 'loading-content') && (
          <View style={styles.linearProgressContainer}>
            <LinearProgress
              progress={currentProgress}
              animated={!reduceMotion}
              height={6}
            />
          </View>
        )}

        {/* Loading dots for final stages */}
        {(stage === 'almost-ready' || stage === 'complete') && (
          <LoadingDots colors={colors} animate={!reduceMotion} />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.secondary }]}>
          Powered by faith • Built for community
        </Text>
      </View>
    </View>
  );
};

// Simple loading dots component
const LoadingDots: React.FC<{ colors: any; animate: boolean }> = ({ colors, animate }) => {
  return (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: colors.primary },
            // Simple CSS-like animation would go here if needed
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: 120,
    height: 120,
    borderRadius: 27, // Rounded corners for the icon (120 * 0.225 for nice rounded appearance)
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Mistrully',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    fontFamily: 'Manrope-Light',
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  linearProgressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Manrope-Light',
  },
});
