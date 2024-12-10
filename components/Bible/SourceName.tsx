import React from "react";
import { View, Text } from "react-native";

interface SourceNameProps {
  sourceName: string;
  align: "left" | "right";
}

const SourceNameComponent: React.FC<SourceNameProps> = ({ sourceName, align }) => {
  return (
    <View style={{ marginTop: 10, marginBottom: 5, alignItems: align === "left" ? "flex-start" : "flex-end" }}>
      <Text
        style={{
          color: "grey",
          fontStyle: "italic",
          fontSize: 20,
          lineHeight: 36,
          textAlign: align,
        }}
      >
        {sourceName.toUpperCase()}
      </Text>
    </View>
  );
};

export default SourceNameComponent;
