// DonutChartComponent.tsx
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

interface DonutChartComponentProps {
  colorData: ColorData;
}

const DonutChartComponent: React.FC<DonutChartComponentProps> = ({
  colorData,
}) => {
  const { colors, isDarkMode } = useAppSettings();

  const getChartColors = (type: string) => {
    if (isDarkMode) {
      switch (type) {
        case 'black':
          return colors.bubbles.default;
        case 'red':
          return '#FF6B6B'; // Brighter red for dark mode
        case 'green':
          return '#4CAF50'; // Brighter green for dark mode
        case 'blue':
          return '#64B5F6'; // Brighter blue for dark mode
        default:
          return colors.bubbles.default;
      }
    } else {
      switch (type) {
        case 'black':
          return '#808080'; // Grey for light mode
        case 'red':
          return getColors("red").light;
        case 'green':
          return getColors("green").light;
        case 'blue':
          return getColors("blue").light;
        default:
          return '#808080';
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
  const chartHeight = screenWidth * 0.1;
  return (
    <View style={{ 
      height: chartHeight, 
      width: chartHeight, 
      flex: 0, 
      marginHorizontal: 10,
      backgroundColor: 'transparent'
    }}>
      <PolarChart
        data={DATA}
        labelKey={"label"}
        valueKey={"value"}
        colorKey={"color"}
      >
        <Pie.Chart 
          innerRadius={chartHeight * 0.2} 
          startAngle={-90}
        />
      </PolarChart>
    </View>
  );
};

export default DonutChartComponent;
