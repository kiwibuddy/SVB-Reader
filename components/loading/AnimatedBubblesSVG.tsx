import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface StaticIconProps {
  size?: number;
}

export const AnimatedBubblesSVG: React.FC<StaticIconProps> = ({
  size = 120,
}) => {
  const borderRadius = size * 0.1875; // Dynamic border radius for rounded appearance
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image 
        source={require('@/assets/images/icon.png')}
        style={[styles.icon, { width: size, height: size, borderRadius }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    // Icon styles
  },
});
