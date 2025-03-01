import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const POPUP_WIDTH = SCREEN_WIDTH * 0.6;
const POPUP_HEIGHT = SCREEN_HEIGHT * 0.22;
const ICON_SIZE = POPUP_HEIGHT * 0.5;

interface CelebrationContent {
  phrase: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

// Combined celebration phrases from both components
const celebrations: CelebrationContent[] = [
  // Original celebrations from Bible version
  { phrase: "You're Crushing It!", icon: "trophy-award" },
  { phrase: "Way to Go!", icon: "star-face" },
  { phrase: "Amazing Progress!", icon: "rocket-launch" },
  { phrase: "Keep It Up!", icon: "fire" },
  { phrase: "You're On Fire!", icon: "lightning-bolt" },
  { phrase: "Level Up!", icon: "medal" },
  { phrase: "Super Star!", icon: "star-circle" },
  { phrase: "Awesome Job!", icon: "party-popper" },
  { phrase: "Victory Dance Time!", icon: "dance-ballroom" },
  { phrase: "New Achievement Unlocked!", icon: "lock-open" },
  
  // Additional Bible-themed celebrations from root version
  { phrase: "BibleLevel Up!", icon: "medal" },
  { phrase: "New Story Read!", icon: "book-open" },
  { phrase: "Growing in Faith!", icon: "sprout" },
  { phrase: "Light of the World!", icon: "lightbulb-on" },
  { phrase: "Truth Seeker!", icon: "book-open-variant" },
  { phrase: "Amazing Wisdom Gained!", icon: "school" },
  { phrase: "Spirit Led!", icon: "heart-flash" },
  { phrase: "Faith Builder!", icon: "stairs" },
  { phrase: "Prayer Champion!", icon: "hand-heart" },
  { phrase: "Bible Explorer!", icon: "compass" },
  { phrase: "Disciple's Heart!", icon: "heart-pulse" },
  { phrase: "Kingdom Builder!", icon: "castle" }
];

// Color options - can be used or overridden with a fixed color
const COLORS = ['#f4694d', '#84f44d', '#4dd8f4', '#bc4df4'];
const DEFAULT_COLOR = '#FFD700'; // Gold color from Bible version

interface CelebrationPopupProps {
  visible: boolean;
  onComplete: () => void;
  useRandomColors?: boolean; // Optional flag to use random colors
  useBibleThemed?: boolean; // Optional flag to only use Bible-themed celebrations
  backgroundColor?: string; // Optional background color override
  overlayOpacity?: number; // Optional overlay opacity
}

const CelebrationPopup: React.FC<CelebrationPopupProps> = ({ 
  visible, 
  onComplete,
  useRandomColors = false,
  useBibleThemed = false,
  backgroundColor = 'rgba(0,0,0,0.5)',
  overlayOpacity = 0.5
}) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  
  // Filter celebrations if Bible-themed only is requested
  const celebrationList = useBibleThemed 
    ? celebrations.filter(c => 
        c.phrase.includes('Bible') || 
        c.phrase.includes('Faith') || 
        c.phrase.includes('Spirit') ||
        c.phrase.includes('Prayer') ||
        c.icon === 'book-open' ||
        c.icon === 'compass' ||
        c.icon === 'castle'
      )
    : celebrations;
  
  const randomIndex = React.useMemo(
    () => Math.floor(Math.random() * celebrationList.length), 
    [visible, celebrationList]
  );
  
  const colorIndex = React.useMemo(
    () => Math.floor(Math.random() * COLORS.length), 
    [visible]
  );
  
  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1400), // 1.4s delay + 0.3s fade in + 0.3s fade out = 2s total
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        onComplete();
      });
    }
  }, [visible, fadeAnim, onComplete]);

  if (!visible) return null;

  const celebration = celebrationList[randomIndex];
  const celebrationColor = useRandomColors ? COLORS[colorIndex] : DEFAULT_COLOR;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          backgroundColor: backgroundColor 
        }
      ]}
    >
      <View style={styles.popup}>
        <Text style={[styles.text, { color: celebrationColor }]}>
          {celebration.phrase}
        </Text>
        <MaterialCommunityIcons 
          name={celebration.icon} 
          size={ICON_SIZE}
          color={celebrationColor}
          style={styles.icon}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    width: POPUP_WIDTH,
    minHeight: POPUP_HEIGHT * 0.8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  text: {
    fontSize: POPUP_HEIGHT * 0.14,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  icon: {
    marginTop: 10,
  },
});

export default CelebrationPopup;