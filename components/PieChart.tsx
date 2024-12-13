// PieChartComponent.tsx
import React from "react";
import { Dimensions, View } from "react-native";
import { PolarChart, Pie } from "victory-native";
import { getColors } from "@/scripts/getColors";

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
  const redColor = getColors("red");
  const greenColor = getColors("green");
  const blueColor = getColors("blue");
  const DATA = [
    { value: colorData.black, color: "grey", label: "Black" },
    { value: colorData.red, color: redColor.light, label: "Red" },
    { value: colorData.green, color: greenColor.light, label: "Green" },
    { value: colorData.blue, color: blueColor.light, label: "Blue" },
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
