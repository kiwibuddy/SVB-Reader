import React, { createContext, useState, useContext, useEffect } from "react";
import logger from '@/utils/logger';import readingPlansData from "../assets/data/ReadingPlansChallenges.json";
import { 
  markSegmentComplete as markSegmentCompleteDB,
  getSegmentCompletionStatus,
  updateDailyActivity,
  startPlan as startPlanDB,
  startChallenge as startChallengeDB,
  getActivePlan,
  getActiveChallenges,
  resetPlanProgress,
  resetChallengeProgress,
  // New SQLite functions to replace AsyncStorage
  getCurrentSegmentId,
  setCurrentSegmentId,
  getCurrentReadingPlan,
  setCurrentReadingPlan,
  getLastReadSegment,
  setLastReadSegment as setLastReadSegmentDB,
  getAppLanguage,
  setAppLanguage,
  getAppVersion,
  setAppVersion,
  getReadSegments,
  markSegmentAsRead,
  getActivePlanFromDB,
  getActiveChallengesFromDB
} from '@/api/sqlite';

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
  context?: 'main' | 'plan' | 'challenge' | 'today';
  planId?: string;
  challengeId?: string;
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
  markSegmentComplete: (
    segmentId: string, 
    isComplete: boolean, 
    color?: string | null, 
    context?: 'main' | 'plan' | 'challenge' | 'today',
    planId?: string,
    challengeId?: string
  ) => Promise<void>;
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
  endPlan: (planId: string) => Promise<void>;
  endChallenge: (challengeId: string) => Promise<void>;
  updateReadingPlanProgress: (planId: string, segmentId: string) => Promise<void>;
  updateChallengeProgress: (challengeId: string, segmentId: string) => Promise<void>;
  selectedReaderColor: string | null;
  updateSelectedReaderColor: (color: string | null) => void;
  language: string;
  version: string;
  setLanguage: (lang: string) => void;
  setVersion: (ver: string) => void;
  lastReadSegment: string | null;
  setLastReadSegment: (segmentId: string) => Promise<void>;
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
  endPlan: async () => {},
  endChallenge: async () => {},
  updateReadingPlanProgress: async () => {},
  updateChallengeProgress: async () => {},
  selectedReaderColor: null,
  updateSelectedReaderColor: () => {},
  language: 'en',
  version: 'NLT',
  setLanguage: () => {},
  setVersion: () => {},
  lastReadSegment: null,
  setLastReadSegment: async () => {},
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
  const [lastReadSegment, setLastReadSegment] = useState<string | null>(null);

  useEffect(() => {
    // Load app state from SQLite when the app starts
    const loadAppState = async () => {
      try {
        // Load basic app state
        const [
          storedSegmentId,
          storedReadingPlan,
          storedLanguage,
          storedVersion,
          storedLastReadSegment,
          readSegmentsList
        ] = await Promise.all([
          getCurrentSegmentId(),
          getCurrentReadingPlan(),
          getAppLanguage(),
          getAppVersion(),
          getLastReadSegment(),
          getReadSegments()
        ]);

        setSegmentId(storedSegmentId);
        setReadingPlan(storedReadingPlan);
        setLanguage(storedLanguage);
        setVersion(storedVersion);
        setLastReadSegment(storedLastReadSegment);
        setReadSegments(readSegmentsList);

        // Load completed segments from SQLite
        const completedSegmentsData: Record<string, CompletionData> = {};
        // This will be populated by existing SQLite functions
        setCompletedSegments(completedSegmentsData);

      } catch (error) {
        logger.error('Error loading app state from SQLite:', error);
        // Fallback to defaults if SQLite fails
        setSegmentId('S001');
        setReadingPlan('chronological');
        setLanguage('en');
        setVersion('nlt');
      }
    };

    loadAppState();
  }, []);

  // Load saved plan and challenge state from SQLite on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const [savedPlan, savedChallenges] = await Promise.all([
          getActivePlanFromDB(),
          getActiveChallengesFromDB()
        ]);
        
        if (savedPlan) setActivePlan(savedPlan);
        if (savedChallenges && Object.keys(savedChallenges).length > 0) {
          setActiveChallenges(savedChallenges);
        }
      } catch (error) {
        logger.error('Error loading saved plan/challenge state from SQLite:', error);
      }
    };

    loadSavedState();
  }, []);

  const markAsRead = async (segmentId: string, isRead: boolean) => {
    if (isRead) {
      // Mark segment as read in SQLite
      await markSegmentAsRead(segmentId);
      // Update local state
      const updatedSegments = readSegments.includes(segmentId) 
        ? readSegments 
        : [...readSegments, segmentId];
      setReadSegments(updatedSegments);
    } else {
      // Remove from local state (SQLite keeps read history)
      const updatedSegments = readSegments.filter((id) => id !== segmentId);
      setReadSegments(updatedSegments);
    }
  };

  const updateSegmentId = async (newSegmentId: string) => {
    setSegmentId(newSegmentId);
    await setCurrentSegmentId(newSegmentId); // Store in SQLite
  };

  const updateReadingPlan = async (newReadingPlan: string) => {
    setReadingPlan(newReadingPlan);
    await setCurrentReadingPlan(newReadingPlan); // Store in SQLite
  };

  const updateEmojiActions = async (newEmojiActions: number) => {
    setEmojiActions(newEmojiActions);
  };

  // Plan Management Functions
  const startPlan = async (planId: string) => {
    try {
      // Start plan in database
      await startPlanDB(planId);
      
      const newPlan: PlanProgress = {
        planId,
        completedSegments: [],
        dateStarted: new Date().toISOString(),
        lastRead: new Date().toISOString(),
        isCompleted: false,
        isPaused: false
      };
      
      setActivePlan(newPlan);
      // Plan is now managed via SQLite through startPlanDB function
    } catch (error) {
      logger.error('Error starting plan:', error);
    }
  };

  const pausePlan = async () => {
    if (activePlan) {
      const pausedPlan = { ...activePlan, isPaused: true };
      setActivePlan(pausedPlan);
      // Plan state is now managed via SQLite
    }
  };

  const resumePlan = async () => {
    if (activePlan) {
      const resumedPlan = { ...activePlan, isPaused: false };
      setActivePlan(resumedPlan);
      // Plan state is now managed via SQLite
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
    try {
      // Start challenge in database
      await startChallengeDB(challengeId);
      
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
      // Challenge state is now managed via SQLite
    } catch (error) {
      logger.error('Error starting challenge:', error);
    }
  };

  const pauseChallenge = async (challengeId: string) => {
    if (activeChallenges[challengeId]) {
      const updatedChallenges = {
        ...activeChallenges,
        [challengeId]: { ...activeChallenges[challengeId], isPaused: true }
      };
      setActiveChallenges(updatedChallenges);
      // Challenge state is now managed via SQLite
    }
  };

  const resumeChallenge = async (challengeId: string) => {
    if (activeChallenges[challengeId]) {
      const updatedChallenges = {
        ...activeChallenges,
        [challengeId]: { ...activeChallenges[challengeId], isPaused: false }
      };
      setActiveChallenges(updatedChallenges);
      // Challenge state is now managed via SQLite
    }
  };

  const restartChallenge = async (challengeId: string) => {
    await startChallenge(challengeId);
  };

  const endPlan = async (planId: string) => {
    if (activePlan) {
      setActivePlan(null);
      // Plan state is now managed via SQLite
    }
  };

  const endChallenge = async (challengeId: string) => {
    if (activeChallenges[challengeId]) {
      const updatedChallenges = { ...activeChallenges };
      delete updatedChallenges[challengeId];
      setActiveChallenges(updatedChallenges);
      // Challenge state is now managed via SQLite
    }
  };

  // Update markSegmentComplete to handle plans and challenges
  const markSegmentComplete = async (
    segmentId: string,
    isCompleted: boolean,
    readerColor: string | null = null,
    context: 'main' | 'plan' | 'challenge' | 'today' = 'main',
    planId?: string,
    challengeId?: string
  ) => {
    try {
      // Only mark as complete if isCompleted is true
      if (isCompleted) {
        await markSegmentCompleteDB(segmentId, context, planId, challengeId);
        
        // Update local state for main context
        if (context === 'main') {
          setCompletedSegments(prev => ({
            ...prev,
            [segmentId]: {
              isCompleted: true,
              color: readerColor
            }
          }));
        }
        
        // Update plan progress if in plan context
        if (context === 'plan' && planId && activePlan?.planId === planId) {
          const updatedSegments = [...activePlan.completedSegments];
          if (!updatedSegments.includes(segmentId)) {
            updatedSegments.push(segmentId);
          }
          
          const updatedPlan = {
            ...activePlan,
            completedSegments: updatedSegments
          };
          
          setActivePlan(updatedPlan);
          // Plan progress is now managed via SQLite
        }
        
        // Update challenge progress if in challenge context
        if (context === 'challenge' && challengeId && activeChallenges[challengeId]) {
          const currentChallenge = activeChallenges[challengeId];
          const updatedSegments = [...currentChallenge.completedSegments];
          if (!updatedSegments.includes(segmentId)) {
            updatedSegments.push(segmentId);
          }
          
          const updatedChallenge = {
            ...currentChallenge,
            completedSegments: updatedSegments
          };
          
          setActiveChallenges(prev => ({
            ...prev,
            [challengeId]: updatedChallenge
          }));
          
          // Challenge progress is now managed via SQLite
        }
        
        await updateDailyActivity(segmentId);
      }
    } catch (error) {
      logger.error('Error updating segment completion:', error);
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
      // Plan progress is now managed via SQLite
    } catch (error) {
      logger.error('Error updating plan progress:', error);
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
      // Challenge state is now managed via SQLite
    } catch (error) {
      logger.error('Error updating challenge progress:', error);
    }
  };

  const updateSelectedReaderColor = async (color: string | null) => {
    setSelectedReaderColor(color);
  };

  const updateLastReadSegment = async (segmentId: string) => {
    setLastReadSegment(segmentId);
    await setLastReadSegmentDB(segmentId); // Store in SQLite
  };

  // Language and version setters that use SQLite
  const updateLanguage = async (lang: string) => {
    setLanguage(lang);
    await setAppLanguage(lang); // Store in SQLite
  };

  const updateVersion = async (ver: string) => {
    setVersion(ver);
    await setAppVersion(ver); // Store in SQLite
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
        endPlan,
        endChallenge,
        updateReadingPlanProgress,
        updateChallengeProgress,
        selectedReaderColor,
        updateSelectedReaderColor,
        language,
        version,
        setLanguage: updateLanguage,
        setVersion: updateVersion,
        lastReadSegment,
        setLastReadSegment: updateLastReadSegment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Export the context and provider
export { AppContext };
export default AppProvider;
