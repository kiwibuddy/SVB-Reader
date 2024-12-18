import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatusIndicatorProps {
  status: 'active' | 'paused' | 'completed' | 'not-started';
  size?: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 24 }) => {
  const getIconProps = () => {
    switch (status) {
      case 'active':
        return { name: 'checkmark-circle', color: '#4CAF50' };
      case 'paused':
        return { name: 'pause-circle', color: '#FFA000' };
      case 'completed':
        return { name: 'ribbon', color: '#2196F3' };
      default:
        return { name: 'ellipse-outline', color: '#9E9E9E' };
    }
  };

  const { name, color } = getIconProps();

  return (
    <View style={styles.container}>
      <Ionicons name={name as any} size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
}); 