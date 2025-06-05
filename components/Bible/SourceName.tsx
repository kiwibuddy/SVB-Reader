import React from "react";
import { View, Text } from "react-native";
import { baseSizes } from "@/context/FontSizeContext";

interface SourceNameProps {
  sourceName: string;
  align: "left" | "right";
}

const SourceNameComponent: React.FC<SourceNameProps> = ({ sourceName, align }) => {
  const isNarrator = sourceName === "THE NARRATOR";
  
  return (
    <View style={{ 
      marginTop: isNarrator ? 6 : 8, 
      marginBottom: isNarrator ? 2 : 3, 
      alignItems: align === "left" ? "flex-start" : "flex-end",
      marginHorizontal: isNarrator ? 8 : 16,
    }}>
      <Text
        style={{
          color: isNarrator ? "rgba(108, 108, 108, 0.8)" : "rgba(120, 120, 120, 0.85)",
          fontStyle: "italic",
          fontSize: isNarrator ? baseSizes.caption - 1 : baseSizes.caption,
          lineHeight: (isNarrator ? baseSizes.caption - 1 : baseSizes.caption) * 1.2,
          textAlign: align,
          fontWeight: isNarrator ? "400" : "500",
          letterSpacing: isNarrator ? 0.3 : 0.2,
        }}
      >
        {sourceName.toUpperCase()}
      </Text>
    </View>
  );
};

export default SourceNameComponent;
