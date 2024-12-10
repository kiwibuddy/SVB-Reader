import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the interface for both segmentId and read status
interface AppContextType {
  segmentId: string;
  updateSegmentId: (id: string) => void;
  readSegments: string[];
  markAsRead: (segmentId: string, isRead: boolean) => Promise<void>;
  readingPlan: string;
  updateReadingPlan: (newReadingPlan: string) => Promise<void>;
  emojiActions: number;
  updateEmojiActions: (newEmojiActions: number) => Promise<void>;
}

const defaultContext: AppContextType = {
  segmentId: "S001",
  updateSegmentId: () => {},
  readSegments: [],
  markAsRead: async () => { },
  readingPlan: "Bible1Year",
  updateReadingPlan: async () => Promise.resolve(), // Updated to return a Promise
  emojiActions: 0,
  updateEmojiActions: async () => {},
};

// Create the context
const AppContext = createContext<AppContextType>(defaultContext);

// Create a custom hook to use the context
export const useAppContext = () => useContext(AppContext);

// Create the provider component that handles both segmentId and read status
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State for current segment
  const [segmentId, setSegmentId] = useState<string>("S001");
  const [readingPlan, setReadingPlan] = useState<string>("Bible1Year");
  // State and logic for read segments
  const [readSegments, setReadSegments] = useState<string[]>([]);
  const [emojiActions, setEmojiActions] = useState<number>(0);

  useEffect(() => {
    // Load read status from AsyncStorage when the app starts
    const loadReadStatus = async () => {
      const storedSegments = await AsyncStorage.getItem("readSegments");
      if (storedSegments) {
        setReadSegments(JSON.parse(storedSegments));
      }
    };

    const loadSegmentId = async () => {
      const storedSegmentId = await AsyncStorage.getItem("segmentId");
      if (storedSegmentId) {
        setSegmentId(storedSegmentId);
      }
    };

    const loadReadingPlan = async () => {
      const storedReadingPlan = await AsyncStorage.getItem("readingPlan");
      if (storedReadingPlan) {
        setReadingPlan(storedReadingPlan);
      }
    };

    loadSegmentId();
    loadReadStatus();
    loadReadingPlan();
  }, []);

  const markAsRead = async (segmentId: string, isRead: boolean) => {
    const updatedSegments = isRead
      ? readSegments.filter((id) => id !== segmentId) // Remove if already read
      : [...readSegments, segmentId]; // Add if not read

    setReadSegments(updatedSegments);
    await AsyncStorage.setItem("readSegments", JSON.stringify(updatedSegments)); // Persist to AsyncStorage
  };

  const updateSegmentId = async (newSegmentId: string) => {
    setSegmentId(newSegmentId); // Update the segmentId
    await AsyncStorage.setItem('segmentId', newSegmentId); // Store in AsyncStorage
  };

  const updateReadingPlan = async (newReadingPlan: string) => {
    setReadingPlan(newReadingPlan);
    await AsyncStorage.setItem('readingPlan', newReadingPlan);
  };

  const updateEmojiActions = async (newEmojiActions: number) => {
    setEmojiActions(newEmojiActions);
  };

  return (
    <AppContext.Provider
      value={{ segmentId, updateSegmentId, readSegments, markAsRead, readingPlan, updateReadingPlan, emojiActions, updateEmojiActions }}
    >
      {children}
    </AppContext.Provider>
  );
};
