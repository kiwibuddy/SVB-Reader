// LegendComponent.tsx
import { getColors } from "@/scripts/getColors";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface ColorData {
  total: number;
  black: number;
  red: number;
  green: number;
  blue: number;
}

const LegendComponent: React.FC<{ colorData: ColorData }> = ({ colorData }) => {
  const data = [
    { label: "Narrator", color: "grey", value: colorData.black },
    { label: "God", color: getColors("red").light, value: colorData.red }, // Use a color code or function as needed
    { label: "Main Character(s)", color: getColors("green").light, value: colorData.green },
    { label: "Others", color: getColors("blue").light, value: colorData.blue },
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
