import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useSyncAppSettings } from "@/context/SyncAppSettingsContext";
import UI_ENG from "@/assets/data/UI-ENG.json";
import UI_FRA from "@/assets/data/FRA-UI.json";

interface SourceNameProps {
  sourceName: string;
  align: "left" | "right";
}

const SourceNameComponent: React.FC<SourceNameProps> = ({ sourceName, align }) => {
  const { language } = useSyncAppSettings();

  // Get the translated source name
  const translatedSourceName = useMemo(() => {
    if (language === 'en') {
      return sourceName;
    }

    // Get French translations
    const sources = UI_FRA.Sources as Record<string, string>;
    return sources[sourceName] || sourceName; // Fallback to original if not found
  }, [sourceName, language]);

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
        {translatedSourceName.toUpperCase()}
      </Text>
    </View>
  );
};

export default SourceNameComponent;
