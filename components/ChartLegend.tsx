// LegendComponent.tsx
import { getColors } from "@/scripts/getColors";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppSettings } from '@/context/AppSettingsContext';

interface ColorData {
  total: number;
  black: number;
  red: number;
  green: number;
  blue: number;
}

const LegendComponent: React.FC<{ colorData: ColorData }> = ({ colorData }) => {
  const { colors, isDarkMode } = useAppSettings();
  
  const getLegendColors = (type: string) => {
    // Use exactly the same color logic as reading role selection buttons (active state)
    if (isDarkMode) {
      switch (type) {
        case 'black':
          return '#2A2A2A'; // Slightly brighter than bubble black
        case 'red':
          return '#D32F2F'; // Colors.error[700] - brighter than bubble red
        case 'green':
          return '#388E3C'; // Colors.success[700] - brighter than bubble green
        case 'blue':
          return '#1976D2'; // Colors.secondary[700] - brighter than bubble blue
        default:
          return colors.bubbles.default;
      }
    } else {
      switch (type) {
        case 'black':
          return '#E0E0E0'; // Colors.neutral[300] - brighter than bubble black
        case 'red':
          return '#EF9A9A'; // Colors.error[200] - brighter than bubble red
        case 'green':
          return '#A5D6A7'; // Colors.success[200] - brighter than bubble green
        case 'blue':
          return '#90CAF9'; // Colors.secondary[200] - brighter than bubble blue
        default:
          return colors.bubbles.default;
      }
    }
  };
  
  const data = [
    { label: "Narrator", color: getLegendColors('black'), value: colorData.black },
    { label: "God", color: getLegendColors('red'), value: colorData.red },
    { label: "Main Character(s)", color: getLegendColors('green'), value: colorData.green },
    { label: "Others", color: getLegendColors('blue'), value: colorData.blue },
  ];

  return (
    <View style={styles.legendContainer}>
      {data.map((item) => {
        const percentage = ((item.value / colorData.total) * 100).toFixed(1); // Calculate percentage
        return (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.label}: {percentage}%
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  legendContainer: {
    padding: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  colorBox: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  legendText: {
    fontSize: 16,
  },
});

export default LegendComponent;
