// PieChartComponent.tsx
import React from "react";
import { Dimensions, View } from "react-native";
import { PolarChart, Pie } from "victory-native";
import { getColors } from "@/scripts/getColors";
import { useAppSettings } from '@/context/AppSettingsContext';

interface ColorData {
  total: number;
  black: number;
  red: number;
  green: number;
  blue: number;
}

interface PieChartComponentProps {
  colorData: ColorData;
  size?: number;
}

const PieChartComponent: React.FC<PieChartComponentProps> = ({ colorData }) => {
  const { colors, isDarkMode } = useAppSettings();
  
  const getChartColors = (type: string) => {
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
  
  const DATA = [
    { value: colorData.black, color: getChartColors('black'), label: "Black" },
    { value: colorData.red, color: getChartColors('red'), label: "Red" },
    { value: colorData.green, color: getChartColors('green'), label: "Green" },
    { value: colorData.blue, color: getChartColors('blue'), label: "Blue" },
  ];

  // Calculate half of the screen height
  const screenWidth = Dimensions.get("window").width;
  const chartHeight = screenWidth * 0.3; // 50% of screen height
  return (
    <View style={{ height: chartHeight, width: chartHeight, flex: 1 }}>
      <PolarChart
        data={DATA} // specify your data
        labelKey={"label"} // specify data key for labels
        valueKey={"value"} // specify data key for values
        colorKey={"color"} // specify data key for color
      >
        <Pie.Chart />
      </PolarChart>
    </View>
  );
};

export default PieChartComponent;
