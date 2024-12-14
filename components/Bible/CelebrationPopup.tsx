import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CelebrationContent {
  phrase: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const celebrations: CelebrationContent[] = [
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
];

interface CelebrationPopupProps {
  visible: boolean;
  onComplete: () => void;
}

const CelebrationPopup: React.FC<CelebrationPopupProps> = ({ visible, onComplete }) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const randomIndex = React.useMemo(() => Math.floor(Math.random() * celebrations.length), [visible]);
  
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
  }, [visible]);

  if (!visible) return null;

  const celebration = celebrations[randomIndex];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.popup}>
        <Text style={styles.text}>{celebration.phrase}</Text>
        <MaterialCommunityIcons 
          name={celebration.icon} 
          size={50} 
          color="#FFD700"
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  popup: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  icon: {
    marginTop: 10,
  },
});

export default CelebrationPopup;