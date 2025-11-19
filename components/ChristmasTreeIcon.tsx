import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Polygon, Line } from 'react-native-svg';

interface ChristmasTreeIconProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Christmas Tree Icon Component - Simple Outline Style
 * A minimalist Christmas tree icon matching the app's clean design language
 * Similar style to the existing calendar-outline icons
 */
const ChristmasTreeIcon: React.FC<ChristmasTreeIconProps> = ({ 
  size = 40, 
  color = '#FFFFFF', // White for consistency with other icons
  backgroundColor = '#228B22' // Christmas green background
}) => {
  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: backgroundColor,
      }
    ]}>
      <Svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* Ultra-simple tree outline matching app's minimalist icon style */}
        
        {/* Tree shape - single continuous outline */}
        <Path
          d="M 12 3 L 7 11 L 9 11 L 6 16 L 10 16 L 10 20 L 14 20 L 14 16 L 18 16 L 15 11 L 17 11 Z"
          stroke={color}
          strokeWidth="1.8"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        {/* Star on top */}
        <Path
          d="M 12 1 L 11.3 2.8 L 12.7 2.8 Z"
          fill={color}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChristmasTreeIcon;

