import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedSVGLogo } from './AnimatedSVGLogo';

export const SimpleLoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <AnimatedSVGLogo
        size={80}
        enableAnimation={true}
        showRoundedBackground={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
