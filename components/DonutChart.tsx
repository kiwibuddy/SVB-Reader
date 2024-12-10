// DonutChartComponent.tsx
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

interface DonutChartComponentProps {
  colorData: ColorData;
}

const DonutChartComponent: React.FC<DonutChartComponentProps> = ({
  colorData,
}) => {
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
  const chartHeight = screenWidth * 0.1;
  return (
    <View style={{ height: chartHeight, width: chartHeight, flex: 0, marginHorizontal: 10 }}>
      <PolarChart
        data={DATA}
        labelKey={"label"}
        valueKey={"value"}
        colorKey={"color"}
      >
        <Pie.Chart innerRadius={chartHeight * 0.2} startAngle={-90} />
      </PolarChart>
    </View>
  );
};

export default DonutChartComponent;
