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

interface PlanProgress {
  planId: string;
  completedSegments: string[];
  dateStarted: string;
  lastRead: string;
  isCompleted: boolean;
  isPaused: boolean;
}

interface ChallengeProgress {
  challengeId: string;
  completedSegments: string[];
  dateStarted: string;
  lastRead: string;
  isCompleted: boolean;
  isPaused: boolean;
}

interface CompletionData {
  isCompleted: boolean;
  color: string | null;
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
  completedSegments: Record<string, CompletionData>;
  markSegmentComplete: (segmentId: string, isComplete: boolean, color?: string | null) => Promise<void>;
  readingPlanProgress: Record<string, ReadingPlanProgress>;
  startReadingPlan: (planId: string) => void;
  activePlan: PlanProgress | null;
  startPlan: (planId: string) => void;
  pausePlan: () => void;
  resumePlan: () => void;
  switchPlan: (newPlanId: string) => Promise<void>;
  activeChallenges: Record<string, ChallengeProgress>;
  startChallenge: (challengeId: string) => void;
  pauseChallenge: (challengeId: string) => void;
  resumeChallenge: (challengeId: string) => void;
  restartChallenge: (challengeId: string) => void;
  updateReadingPlanProgress: (planId: string, segmentId: string) => Promise<void>;
  updateChallengeProgress: (challengeId: string, segmentId: string) => Promise<void>;
  selectedReaderColor: string | null;
  updateSelectedReaderColor: (color: string | null) => void;
  language: string;
  version: string;
  setLanguage: (lang: string) => void;
  setVersion: (ver: string) => void;
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
  completedSegments: {},
  markSegmentComplete: async () => {},
  readingPlanProgress: {},
  startReadingPlan: () => {},
  activePlan: null,
  startPlan: () => {},
  pausePlan: () => {},
  resumePlan: () => {},
  switchPlan: async () => {},
  activeChallenges: {},
  startChallenge: () => {},
  pauseChallenge: () => {},
  resumeChallenge: () => {},
  restartChallenge: () => {},
  updateReadingPlanProgress: async () => {},
  updateChallengeProgress: async () => {},
  selectedReaderColor: null,
  updateSelectedReaderColor: () => {},
  language: 'en',
  version: 'NLT',
  setLanguage: () => {},
  setVersion: () => {},
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
  const [completedSegments, setCompletedSegments] = useState<Record<string, CompletionData>>({});
  const [readingPlanProgress, setReadingPlanProgress] = useState<Record<string, ReadingPlanProgress>>({});
  const [activePlan, setActivePlan] = useState<PlanProgress | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<Record<string, ChallengeProgress>>({});
  const [selectedReaderColor, setSelectedReaderColor] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [version, setVersion] = useState('NLT');

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

  // Load saved state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const [savedPlan, savedChallenges] = await Promise.all([
          AsyncStorage.getItem('activePlan'),
          AsyncStorage.getItem('activeChallenges')
        ]);
        
        if (savedPlan) setActivePlan(JSON.parse(savedPlan));
        if (savedChallenges) setActiveChallenges(JSON.parse(savedChallenges));
      } catch (error) {
        console.error('Error loading saved plan/challenge state:', error);
      }
    };

    loadSavedState();
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

  // Plan Management Functions
  const startPlan = async (planId: string) => {
    const newPlan: PlanProgress = {
      planId,
      completedSegments: [],
      dateStarted: new Date().toISOString(),
      lastRead: new Date().toISOString(),
      isCompleted: false,
      isPaused: false
    };
    
    setActivePlan(newPlan);
    await AsyncStorage.setItem('activePlan', JSON.stringify(newPlan));
  };

  const pausePlan = async () => {
    if (activePlan) {
      const pausedPlan = { ...activePlan, isPaused: true };
      setActivePlan(pausedPlan);
      await AsyncStorage.setItem('activePlan', JSON.stringify(pausedPlan));
    }
  };

  const resumePlan = async () => {
    if (activePlan) {
      const resumedPlan = { ...activePlan, isPaused: false };
      setActivePlan(resumedPlan);
      await AsyncStorage.setItem('activePlan', JSON.stringify(resumedPlan));
    }
  };

  const switchPlan = async (newPlanId: string) => {
    if (activePlan && !activePlan.isPaused) {
      await pausePlan();
    }
    await startPlan(newPlanId);
  };

  // Challenge Management Functions
  const startChallenge = async (challengeId: string) => {
    const newChallenge: ChallengeProgress = {
      challengeId,
      completedSegments: [],
      dateStarted: new Date().toISOString(),
      lastRead: new Date().toISOString(),
      isCompleted: false,
      isPaused: false
    };
    
    setActiveChallenges(prev => ({
      ...prev,
      [challengeId]: newChallenge
    }));
    await AsyncStorage.setItem('activeChallenges', JSON.stringify({
      ...activeChallenges,
      [challengeId]: newChallenge
    }));
  };

  const pauseChallenge = async (challengeId: string) => {
    if (activeChallenges[challengeId]) {
      const updatedChallenges = {
        ...activeChallenges,
        [challengeId]: { ...activeChallenges[challengeId], isPaused: true }
      };
      setActiveChallenges(updatedChallenges);
      await AsyncStorage.setItem('activeChallenges', JSON.stringify(updatedChallenges));
    }
  };

  const resumeChallenge = async (challengeId: string) => {
    if (activeChallenges[challengeId]) {
      const updatedChallenges = {
        ...activeChallenges,
        [challengeId]: { ...activeChallenges[challengeId], isPaused: false }
      };
      setActiveChallenges(updatedChallenges);
      await AsyncStorage.setItem('activeChallenges', JSON.stringify(updatedChallenges));
    }
  };

  const restartChallenge = async (challengeId: string) => {
    await startChallenge(challengeId);
  };

  // Update markSegmentComplete to handle plans and challenges
  const markSegmentComplete = async (segmentId: string, isComplete: boolean, color?: string | null) => {
    try {
      const updatedSegments = { ...completedSegments };
      
      if (isComplete) {
        updatedSegments[segmentId] = { isCompleted: true, color: color || null };
      } else {
        delete updatedSegments[segmentId];
      }
      
      setCompletedSegments(updatedSegments);
      await AsyncStorage.setItem('completedSegments', JSON.stringify(updatedSegments));
    } catch (error) {
      console.error('Error updating segment completion:', error);
    }
  };

  // Helper function to check if a segment is part of a plan/challenge
  const isSegmentInPlan = (segmentId: string, plan: any) => {
    return Object.values(plan.segments).some((book: any) => 
      book.segments.includes(segmentId)
    );
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

  const updateReadingPlanProgress = async (planId: string, segmentId: string) => {
    try {
      const currentPlan = activePlan;
      if (!currentPlan || currentPlan.planId !== planId) return;

      const updatedSegments = [...currentPlan.completedSegments];
      if (!updatedSegments.includes(segmentId)) {
        updatedSegments.push(segmentId);
      }

      const updatedPlan = {
        ...currentPlan,
        completedSegments: updatedSegments,
        isCompleted: false
      };

      setActivePlan(updatedPlan);
      await AsyncStorage.setItem('activePlan', JSON.stringify(updatedPlan));
    } catch (error) {
      console.error('Error updating plan progress:', error);
    }
  };

  const updateChallengeProgress = async (challengeId: string, segmentId: string) => {
    try {
      // Get current challenges
      const currentChallenges = { ...activeChallenges };
      const challenge = currentChallenges[challengeId];
      
      if (!challenge) return;

      // Update completed segments
      const updatedSegments = [...challenge.completedSegments];
      if (!updatedSegments.includes(segmentId)) {
        updatedSegments.push(segmentId);
      }

      // Update challenge progress
      const updatedChallenge = {
        ...challenge,
        completedSegments: updatedSegments,
        isCompleted: false // You might want to add logic to check if challenge is complete
      };

      // Save to state and storage
      const updatedChallenges = {
        ...currentChallenges,
        [challengeId]: updatedChallenge
      };
      
      setActiveChallenges(updatedChallenges);
      await AsyncStorage.setItem('activeChallenges', JSON.stringify(updatedChallenges));
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  };

  const updateSelectedReaderColor = async (color: string | null) => {
    setSelectedReaderColor(color);
  };

  return (
    <AppContext.Provider
      value={{
        segmentId,
        updateSegmentId,
        readSegments,
        markAsRead,
        readingPlan,
        updateReadingPlan,
        emojiActions,
        updateEmojiActions,
        completedSegments,
        markSegmentComplete,
        readingPlanProgress,
        startReadingPlan,
        activePlan,
        startPlan,
        pausePlan,
        resumePlan,
        switchPlan,
        activeChallenges,
        startChallenge,
        pauseChallenge,
        resumeChallenge,
        restartChallenge,
        updateReadingPlanProgress,
        updateChallengeProgress,
        selectedReaderColor,
        updateSelectedReaderColor,
        language,
        version,
        setLanguage,
        setVersion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
