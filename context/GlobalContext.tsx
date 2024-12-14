import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import readingPlansData from "../assets/data/ReadingPlansChallenges.json";

// Add this interface near the top of the file, before AppContextType
interface ReadingPlanProgress {
  planId: string;
  completedSegments: string[];
  dateStarted: string;
  lastRead: string;
  isCompleted: boolean;
}

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
  completedSegments: string[];
  markSegmentComplete: (segmentId: string, isComplete: boolean) => Promise<void>;
  readingPlanProgress: Record<string, ReadingPlanProgress>;
  updateReadingPlanProgress: (planId: string, segmentId: string) => void;
  startReadingPlan: (planId: string) => void;
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
  completedSegments: [],
  markSegmentComplete: async () => {},
  readingPlanProgress: {},
  updateReadingPlanProgress: () => {},
  startReadingPlan: () => {},
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
  const [completedSegments, setCompletedSegments] = useState<string[]>([]);
  const [readingPlanProgress, setReadingPlanProgress] = useState<Record<string, ReadingPlanProgress>>({});

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

    const loadCompletedSegments = async () => {
      const stored = await AsyncStorage.getItem('completedSegments');
      if (stored) {
        setCompletedSegments(JSON.parse(stored));
      }
    };

    loadSegmentId();
    loadReadStatus();
    loadReadingPlan();
    loadCompletedSegments();
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

  const markSegmentComplete = async (segmentId: string, isComplete: boolean) => {
    try {
      let updatedSegments;
      if (isComplete) {
        updatedSegments = [...completedSegments, segmentId];
      } else {
        updatedSegments = completedSegments.filter(id => id !== segmentId);
      }
      setCompletedSegments(updatedSegments);
      await AsyncStorage.setItem('completedSegments', JSON.stringify(updatedSegments));
    } catch (error) {
      console.error('Error updating segment completion:', error);
    }
  };

  const startReadingPlan = (planId: string) => {
    setReadingPlanProgress(prev => ({
      ...prev,
      [planId]: {
        planId,
        completedSegments: [],
        dateStarted: new Date().toISOString(),
        lastRead: new Date().toISOString(),
        isCompleted: false
      }
    }));
  };

  const updateReadingPlanProgress = (planId: string, segmentId: string) => {
    setReadingPlanProgress(prev => {
      const planProgress = prev[planId] || {
        planId,
        completedSegments: [],
        dateStarted: new Date().toISOString(),
        lastRead: new Date().toISOString(),
        isCompleted: false
      };

      const updatedSegments = [...planProgress.completedSegments];
      if (!updatedSegments.includes(segmentId)) {
        updatedSegments.push(segmentId);
      }

      // Find the plan in ReadingPlansChallenges.json
      const plan = readingPlansData.plans.find(p => p.id === planId);
      const totalSegments = plan ? Object.values(plan.segments).reduce(
        (acc, book) => acc + book.segments.length, 
        0
      ) : 0;

      return {
        ...prev,
        [planId]: {
          ...planProgress,
          completedSegments: updatedSegments,
          lastRead: new Date().toISOString(),
          isCompleted: updatedSegments.length === totalSegments
        }
      };
    });
  };

  return (
    <AppContext.Provider
      value={{ segmentId, updateSegmentId, readSegments, markAsRead, readingPlan, updateReadingPlan, emojiActions, updateEmojiActions, completedSegments, markSegmentComplete, readingPlanProgress, updateReadingPlanProgress, startReadingPlan }}
    >
      {children}
    </AppContext.Provider>
  );
};
