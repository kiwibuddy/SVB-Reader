import React from "react";
import { Pressable } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useAppContext } from "@/context/GlobalContext"; // Use the combined context
import { Colors } from "@/constants/Colors";

interface CheckCircleProps {
  segmentId: string; // Passed from parent component
  iconSize: number;
}

const CheckCircle: React.FC<CheckCircleProps> = ({ segmentId, iconSize }) => {
  const { readSegments, markAsRead } = useAppContext(); // Get state from combined context

  const isRead = readSegments.includes(segmentId); // Check if this segment is marked as read

  return (
    <Pressable onPress={() => markAsRead(segmentId, isRead)}>
      <AntDesign
        name={isRead ? "checkcircle" : "checkcircleo"}
        size={iconSize}
        color={isRead ? Colors.light.tint : "gray"} // Green when read, gray when not
      />
    </Pressable>
  );
};

export default CheckCircle;
