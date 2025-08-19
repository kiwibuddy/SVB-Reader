import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface StaticSplashIconProps {
  size?: number;
}

export const AnimatedSplashIcon: React.FC<StaticSplashIconProps> = ({
  size = 120,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image 
        source={require('@/assets/images/icon.png')}
        style={[styles.icon, { width: size, height: size }]}
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
