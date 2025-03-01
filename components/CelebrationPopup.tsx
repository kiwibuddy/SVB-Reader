import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CelebrationPopupProps {
  visible: boolean;
  onComplete: () => void;
}

const CelebrationPopup: React.FC<CelebrationPopupProps> = ({ visible, onComplete }) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const randomIndex = React.useMemo(() => Math.floor(Math.random() * 10), [visible]);
  
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
        }),
      ]).start(() => onComplete());
    }
  }, [visible, fadeAnim, onComplete]);

  const celebrations = [
    { phrase: "You're Crushing It!", icon: "trophy" },
    { phrase: "Way to Go!", icon: "star-face" },
    { phrase: "Amazing Progress!", icon: "rocket" },
    { phrase: "Keep It Up!", icon: "fire" },
    { phrase: "You're On Fire!", icon: "lightning-bolt" },
    { phrase: "Level Up!", icon: "medal" },
    { phrase: "Super Star!", icon: "star-circle" },
    { phrase: "Awesome Job!", icon: "party-popper" },
    { phrase: "Victory Time!", icon: "trophy-variant" },
    { phrase: "New Story Read!", icon: "book-open" },
  ];

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.popup}>
        <Text style={styles.text}>{celebrations[randomIndex].phrase}</Text>
        <MaterialCommunityIcons name={celebrations[randomIndex].icon as keyof typeof MaterialCommunityIcons.glyphMap} size={48} color="#FF5733" style={styles.icon} />
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
    shadowOffset: { width: 0, height: 2 },
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