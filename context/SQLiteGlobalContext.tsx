import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  getCurrentSegmentId,
  setCurrentSegmentId,
  getCurrentReadingPlan,
  setCurrentReadingPlan,
  getLastReadSegment,
  setLastReadSegment,
  getAppLanguage,
  setAppLanguage,
  getAppVersion,
  setAppVersion,
  getReadSegments,
  markSegmentAsRead,
  getActivePlanFromDB,
  getActiveChallengesFromDB,
  getSegmentCompletionStatus,
  getPlanProgress,
  getChallengeProgress,
  startPlan,
  startChallenge,
  getCurrentStreak,
  getBestStreak,
  getCompletedSegmentsCount,
  getTotalSegmentsCount,
  getEmojiStats,
  getSourceStats,
  getOldTestamentProgress,
  getNewTestamentProgress,
  getLongestSession,
  getCompletedBooks,
  checkEmojiCollection,
  getReadingStreak,
  getBookProgress
} from '@/api/sqlite';

// Types for the context
interface AppState {
  // Core app state
  segmentId: string;
  readingPlan: string;
  lastReadSegment: string | null;
  language: string;
  version: string;
  
  // Reading progress
  readSegments: string[];
  completedSegments: Record<string, boolean>;
  
  // Active plans and challenges
  activePlan: any | null;
  activeChallenges: Record<string, any>;
  
  // Statistics and progress
  currentStreak: number;
  bestStreak: number;
  completedSegmentsCount: number;
  totalSegmentsCount: number;
  
  // Emoji and engagement
  emojiStats: any;
  sourceStats: any;
  emojiActions: number; // Track emoji changes for re-renders
  
  // Testament progress
  oldTestamentProgress: any;
  newTestamentProgress: any;
  
  // Reading analytics
  longestSession: any;
  completedBooks: any[];
  emojiCollection: any;
  readingStreak: any;
  bookProgress: any;
  
  // Loading states
  isLoading: boolean;
  lastUpdated: Date;
}

interface SQLiteGlobalContextType {
  // State
  state: AppState;
  
  // Core actions
  updateSegmentId: (segmentId: string) => Promise<void>;
  updateReadingPlan: (readingPlan: string) => Promise<void>;
  updateLastReadSegment: (segmentId: string) => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  updateVersion: (version: string) => Promise<void>;
  
  // Reading actions
  markAsRead: (segmentId: string) => Promise<void>;
  
  // Plan and challenge actions
  startPlanAction: (planId: string) => Promise<void>;
  startChallengeAction: (challengeId: string) => Promise<void>;
  
  // Emoji actions
  updateEmojiActions: (newEmojiActions: number) => Promise<void>;
  
  // Refresh actions
  refreshAllData: () => Promise<void>;
  refreshProgressData: () => Promise<void>;
  refreshStatistics: () => Promise<void>;
  
  // Utility actions
  getSegmentCompletion: (segmentId: string, context?: 'main' | 'plan' | 'challenge' | 'today', planId?: string, challengeId?: string) => Promise<any>;
  getPlanProgressData: (planId: string) => Promise<any>;
  getChallengeProgressData: (challengeId: string) => Promise<any>;
}

// Initial state
const initialState: AppState = {
  segmentId: 'S001',
  readingPlan: 'chronological',
  lastReadSegment: null,
  language: 'en',
  version: 'nlt',
  readSegments: [],
  completedSegments: {},
  activePlan: null,
  activeChallenges: {},
  currentStreak: 0,
  bestStreak: 0,
  completedSegmentsCount: 0,
  totalSegmentsCount: 0,
  emojiStats: {},
  sourceStats: {},
  emojiActions: 0,
  oldTestamentProgress: 0,
  newTestamentProgress: 0,
  longestSession: null,
  completedBooks: [],
  emojiCollection: {},
  readingStreak: {},
  bookProgress: {},
  isLoading: true,
  lastUpdated: new Date(),
};

// Create context
const SQLiteGlobalContext = createContext<SQLiteGlobalContextType | undefined>(undefined);

// Provider component
export const SQLiteGlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  // Debounced refresh function
  const debouncedRefresh = useCallback((refreshFunction: () => Promise<void>, delay: number = 1000) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        await refreshFunction();
      } catch (error) {
        console.error('Error in debounced refresh:', error);
      }
    }, delay);
  }, []);

  // Load all app state from SQLite
  const loadAppState = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const [
        segmentId,
        readingPlan,
        lastReadSegment,
        language,
        version,
        readSegments,
        activePlan,
        activeChallenges,
        currentStreak,
        bestStreak,
        completedSegmentsCount,
        totalSegmentsCount,
        emojiStats,
        sourceStats,
        oldTestamentProgress,
        newTestamentProgress,
        longestSession,
        completedBooks,
        emojiCollection,
        readingStreak,
        bookProgress
      ] = await Promise.all([
        getCurrentSegmentId(),
        getCurrentReadingPlan(),
        getLastReadSegment(),
        getAppLanguage(),
        getAppVersion(),
        getReadSegments(),
        getActivePlanFromDB(),
        getActiveChallengesFromDB(),
        getCurrentStreak(),
        getBestStreak(),
        getCompletedSegmentsCount(),
        getTotalSegmentsCount(),
        getEmojiStats(),
        getSourceStats(),
        getOldTestamentProgress(),
        getNewTestamentProgress(),
        getLongestSession(),
        getCompletedBooks(),
        checkEmojiCollection(),
        getReadingStreak(),
        getBookProgress('all')
      ]);

      // Build completed segments map
      const completedSegments: Record<string, boolean> = {};
      for (const segmentId of readSegments) {
        const status = await getSegmentCompletionStatus(segmentId, 'main');
        if (status.isCompleted) {
          completedSegments[segmentId] = true;
        }
      }

      setState(prev => ({
        ...prev,
        segmentId,
        readingPlan,
        lastReadSegment,
        language,
        version,
        readSegments,
        completedSegments,
        activePlan,
        activeChallenges,
        currentStreak,
        bestStreak,
        completedSegmentsCount,
        totalSegmentsCount,
        emojiStats,
        sourceStats,
        oldTestamentProgress,
        newTestamentProgress,
        longestSession,
        completedBooks,
        emojiCollection,
        readingStreak,
        bookProgress,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      isInitializedRef.current = true;
    } catch (error) {
      console.error('Error loading app state:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadAppState();
    
    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [loadAppState]);

  // Core action functions
  const updateSegmentId = useCallback(async (segmentId: string) => {
    try {
      await setCurrentSegmentId(segmentId);
      setState(prev => ({ ...prev, segmentId, lastUpdated: new Date() }));
    } catch (error) {
      console.error('Error updating segment ID:', error);
    }
  }, []);

  const updateReadingPlan = useCallback(async (readingPlan: string) => {
    try {
      await setCurrentReadingPlan(readingPlan);
      setState(prev => ({ ...prev, readingPlan, lastUpdated: new Date() }));
    } catch (error) {
      console.error('Error updating reading plan:', error);
    }
  }, []);

  const updateLastReadSegment = useCallback(async (segmentId: string) => {
    try {
      await setLastReadSegment(segmentId);
      setState(prev => ({ ...prev, lastReadSegment: segmentId, lastUpdated: new Date() }));
    } catch (error) {
      console.error('Error updating last read segment:', error);
    }
  }, []);

  const updateLanguage = useCallback(async (language: string) => {
    try {
      await setAppLanguage(language);
      setState(prev => ({ ...prev, language, lastUpdated: new Date() }));
    } catch (error) {
      console.error('Error updating language:', error);
    }
  }, []);

  const updateVersion = useCallback(async (version: string) => {
    try {
      await setAppVersion(version);
      setState(prev => ({ ...prev, version, lastUpdated: new Date() }));
    } catch (error) {
      console.error('Error updating version:', error);
    }
  }, []);

  const markAsRead = useCallback(async (segmentId: string) => {
    try {
      await markSegmentAsRead(segmentId);
      
      // Update local state immediately for UI responsiveness
      setState(prev => ({
        ...prev,
        readSegments: [...new Set([...prev.readSegments, segmentId])],
        completedSegments: { ...prev.completedSegments, [segmentId]: true },
        lastUpdated: new Date(),
      }));

      // Debounced refresh of statistics
      debouncedRefresh(async () => {
        const [newCompletedCount, newTotalCount, newCurrentStreak, newBestStreak] = await Promise.all([
          getCompletedSegmentsCount(),
          getTotalSegmentsCount(),
          getCurrentStreak(),
          getBestStreak(),
        ]);

        setState(prev => ({
          ...prev,
          completedSegmentsCount: newCompletedCount,
          totalSegmentsCount: newTotalCount,
          currentStreak: newCurrentStreak,
          bestStreak: newBestStreak,
          lastUpdated: new Date(),
        }));
      }, 2000);
    } catch (error) {
      console.error('Error marking segment as read:', error);
    }
  }, [debouncedRefresh]);

  const startPlanAction = useCallback(async (planId: string) => {
    try {
      await startPlan(planId);
      
      // Refresh plan data
      const [newActivePlan, newActiveChallenges] = await Promise.all([
        getActivePlanFromDB(),
        getActiveChallengesFromDB(),
      ]);

      setState(prev => ({
        ...prev,
        activePlan: newActivePlan,
        activeChallenges: newActiveChallenges,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error starting plan:', error);
    }
  }, []);

  const startChallengeAction = useCallback(async (challengeId: string) => {
    try {
      await startChallenge(challengeId);
      
      // Refresh challenge data
      const newActiveChallenges = await getActiveChallengesFromDB();
      
      setState(prev => ({
        ...prev,
        activeChallenges: newActiveChallenges,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error starting challenge:', error);
    }
  }, []);

  // Emoji actions
  const updateEmojiActions = useCallback(async (newEmojiActions: number) => {
    setState(prev => ({
      ...prev,
      emojiActions: newEmojiActions,
      lastUpdated: new Date()
    }));
  }, []);

  // Refresh functions
  const refreshAllData = useCallback(async () => {
    await loadAppState();
  }, [loadAppState]);

  const refreshProgressData = useCallback(async () => {
    try {
      const [readSegments, activePlan, activeChallenges, completedCount, totalCount] = await Promise.all([
        getReadSegments(),
        getActivePlanFromDB(),
        getActiveChallengesFromDB(),
        getCompletedSegmentsCount(),
        getTotalSegmentsCount(),
      ]);

      // Build completed segments map
      const completedSegments: Record<string, boolean> = {};
      for (const segmentId of readSegments) {
        const status = await getSegmentCompletionStatus(segmentId, 'main');
        if (status.isCompleted) {
          completedSegments[segmentId] = true;
        }
      }

      setState(prev => ({
        ...prev,
        readSegments,
        completedSegments,
        activePlan,
        activeChallenges,
        completedSegmentsCount: completedCount,
        totalSegmentsCount: totalCount,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error refreshing progress data:', error);
    }
  }, []);

  const refreshStatistics = useCallback(async () => {
    try {
      const [
        currentStreak,
        bestStreak,
        emojiStats,
        sourceStats,
        oldTestamentProgress,
        newTestamentProgress,
        longestSession,
        completedBooks,
        emojiCollection,
        readingStreak,
        bookProgress
      ] = await Promise.all([
        getCurrentStreak(),
        getBestStreak(),
        getEmojiStats(),
        getSourceStats(),
        getOldTestamentProgress(),
        getNewTestamentProgress(),
        getLongestSession(),
        getCompletedBooks(),
        checkEmojiCollection(),
        getReadingStreak(),
        getBookProgress('all')
      ]);

      setState(prev => ({
        ...prev,
        currentStreak,
        bestStreak,
        emojiStats,
        sourceStats,
        oldTestamentProgress,
        newTestamentProgress,
        longestSession,
        completedBooks,
        emojiCollection,
        readingStreak,
        bookProgress,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error refreshing statistics:', error);
    }
  }, []);

  // Utility functions
  const getSegmentCompletion = useCallback(async (
    segmentId: string, 
    context: 'main' | 'plan' | 'challenge' | 'today' = 'main', 
    planId?: string, 
    challengeId?: string
  ) => {
    try {
      return await getSegmentCompletionStatus(segmentId, context, planId, challengeId);
    } catch (error) {
      console.error('Error getting segment completion:', error);
      return { isCompleted: false, color: null };
    }
  }, []);

  const getPlanProgressData = useCallback(async (planId: string) => {
    try {
      return await getPlanProgress(planId);
    } catch (error) {
      console.error('Error getting plan progress:', error);
      return null;
    }
  }, []);

  const getChallengeProgressData = useCallback(async (challengeId: string) => {
    try {
      return await getChallengeProgress(challengeId);
    } catch (error) {
      console.error('Error getting challenge progress:', error);
      return null;
    }
  }, []);

  const contextValue: SQLiteGlobalContextType = {
    state,
    updateSegmentId,
    updateReadingPlan,
    updateLastReadSegment,
    updateLanguage,
    updateVersion,
    markAsRead,
    startPlanAction,
    startChallengeAction,
    updateEmojiActions,
    refreshAllData,
    refreshProgressData,
    refreshStatistics,
    getSegmentCompletion,
    getPlanProgressData,
    getChallengeProgressData,
  };

  return (
    <SQLiteGlobalContext.Provider value={contextValue}>
      {children}
    </SQLiteGlobalContext.Provider>
  );
};

// Hook to use the context
export const useSQLiteGlobalContext = (): SQLiteGlobalContextType => {
  const context = useContext(SQLiteGlobalContext);
  if (context === undefined) {
    throw new Error('useSQLiteGlobalContext must be used within a SQLiteGlobalProvider');
  }
  return context;
};

// Convenience hooks for specific data
export const useAppState = () => {
  const { state } = useSQLiteGlobalContext();
  return state;
};

export const useAppActions = () => {
  const { 
    updateSegmentId, 
    updateReadingPlan, 
    updateLastReadSegment, 
    updateLanguage, 
    updateVersion,
    markAsRead,
    startPlanAction,
    startChallengeAction,
    updateEmojiActions,
    refreshAllData,
    refreshProgressData,
    refreshStatistics,
    getSegmentCompletion,
    getPlanProgressData,
    getChallengeProgressData,
  } = useSQLiteGlobalContext();
  
  return {
    updateSegmentId,
    updateReadingPlan,
    updateLastReadSegment,
    updateLanguage,
    updateVersion,
    markAsRead,
    startPlanAction,
    startChallengeAction,
    updateEmojiActions,
    refreshAllData,
    refreshProgressData,
    refreshStatistics,
    getSegmentCompletion,
    getPlanProgressData,
    getChallengeProgressData,
  };
};

export default SQLiteGlobalContext;
