import React from 'react';
import { View, StyleSheet } from 'react-native';

interface StaticLogoSVGProps {
  size?: number;
  borderRadius?: number;
}

export const StaticLogoSVG: React.FC<StaticLogoSVGProps> = ({
  size = 60,
  borderRadius = 16,
}) => {
  // Calculate bubble sizes relative to the container
  const containerSize = size;
  const bubbleSize = containerSize * 0.35; // Each bubble is 35% of container size
  
  return (
    <View style={[
      styles.container, 
      { 
        width: containerSize, 
        height: containerSize,
        borderRadius,
        overflow: 'hidden',
      }
    ]}>
      {/* Background */}
      <View style={[styles.background, { width: containerSize, height: containerSize }]} />
      
      {/* Blue bubble - positioned to match SVG layout */}
      <View style={[
        styles.bubble,
        styles.blueBubble,
        {
          width: bubbleSize,
          height: bubbleSize,
          borderRadius: bubbleSize / 2,
          position: 'absolute',
          right: containerSize * 0.15,
          bottom: containerSize * 0.15,
        }
      ]} />
      
      {/* Pink bubble - positioned to match SVG layout */}
      <View style={[
        styles.bubble,
        styles.pinkBubble,
        {
          width: bubbleSize * 1.2, // Slightly larger
          height: bubbleSize * 1.2,
          borderRadius: (bubbleSize * 1.2) / 2,
          position: 'absolute',
          right: containerSize * 0.05,
          top: containerSize * 0.15,
        }
      ]} />
      
      {/* Green bubble - positioned to match SVG layout */}
      <View style={[
        styles.bubble,
        styles.greenBubble,
        {
          width: bubbleSize * 0.9, // Slightly smaller
          height: bubbleSize * 0.9,
          borderRadius: (bubbleSize * 0.9) / 2,
          position: 'absolute',
          left: containerSize * 0.15,
          bottom: containerSize * 0.25,
        }
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 3,
  },
  background: {
    backgroundColor: '#808080',
    position: 'absolute',
  },
  bubble: {
    // Base bubble styles
  },
  blueBubble: {
    backgroundColor: '#8CE3FF',
  },
  pinkBubble: {
    backgroundColor: '#FCC1C3',
  },
  greenBubble: {
    backgroundColor: '#B8F8BA',
  },
});
