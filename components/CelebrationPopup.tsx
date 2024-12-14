import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const POPUP_WIDTH = SCREEN_WIDTH * 0.6;
const POPUP_HEIGHT = SCREEN_HEIGHT * 0.22; // Slightly taller to accommodate larger icon
const ICON_SIZE = POPUP_HEIGHT * 0.5;    // Increased icon size to 50% of popup height

interface CelebrationContent {
  phrase: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const celebrations: CelebrationContent[] = [
  { phrase: "You're Crushing It!", icon: "trophy" },
  { phrase: "Way to Go!", icon: "star-face" },
  { phrase: "Amazing Progress!", icon: "rocket" },
  { phrase: "Keep It Up!", icon: "fire" },
  { phrase: "You're On Fire!", icon: "lightning-bolt" },
  { phrase: "BibleLevel Up!", icon: "medal" },
  { phrase: "Super Star!", icon: "star-circle" },
  { phrase: "Awesome Job!", icon: "party-popper" },
  { phrase: "Victory Dance Time!", icon: "dance" },
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

interface CelebrationPopupProps {
  visible: boolean;
  onComplete: () => void;
}

const COLORS = ['#f4694d', '#84f44d', '#4dd8f4', '#bc4df4'];

const CelebrationPopup: React.FC<CelebrationPopupProps> = ({ visible, onComplete }) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const randomIndex = React.useMemo(() => Math.floor(Math.random() * celebrations.length), [visible]);
  const colorIndex = React.useMemo(() => Math.floor(Math.random() * COLORS.length), [visible]);
  
  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1400),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        onComplete();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const celebration = celebrations[randomIndex];
  const celebrationColor = COLORS[colorIndex];

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
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
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'transparent',
  },
  popup: {
    width: POPUP_WIDTH,
    minHeight: POPUP_HEIGHT * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  text: {
    fontSize: POPUP_HEIGHT * 0.14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  icon: {
    marginTop: 8,
  }
});

export default CelebrationPopup;
