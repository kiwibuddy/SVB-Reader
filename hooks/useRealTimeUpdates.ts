import { useEffect, useRef, useCallback } from 'react';
import logger from '@/utils/logger';
import { AppState } from 'react-native';

// Type for React Native's setTimeout return value
type TimeoutHandle = ReturnType<typeof setTimeout>;
import { useSQLiteGlobalContext } from '@/context/SQLiteGlobalContext';

interface RealTimeUpdateOptions {
  enabled?: boolean;
  refreshInterval?: number; // milliseconds
  refreshOnAppStateChange?: boolean;
  refreshOnFocus?: boolean;
  debounceDelay?: number; // milliseconds
}

interface RealTimeUpdateCallbacks {
  onDataChanged?: (dataType: string, newData: any) => void;
  onRefreshStart?: () => void;
  onRefreshComplete?: () => void;
  onError?: (error: Error) => void;
}

export const useRealTimeUpdates = (
  options: RealTimeUpdateOptions = {},
  callbacks: RealTimeUpdateCallbacks = {}
) => {
  const {
    enabled = true,
    refreshInterval = 30000, // 30 seconds default
    refreshOnAppStateChange = true,
    refreshOnFocus = true,
    debounceDelay = 1000,
  } = options;

  const {
    onDataChanged,
    onRefreshStart,
    onRefreshComplete,
    onError,
  } = callbacks;

  const {
    state,
    refreshAllData,
    refreshProgressData,
    refreshStatistics,
  } = useSQLiteGlobalContext();

  // Refs for managing intervals and timeouts
  const intervalRef = useRef<TimeoutHandle | null>(null);
  const debounceTimeoutRef = useRef<TimeoutHandle | null>(null);
  const lastRefreshRef = useRef<Date>(new Date());
  const isRefreshingRef = useRef(false);

  // Debounced refresh function
  const debouncedRefresh = useCallback((refreshFunction: () => Promise<void>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        if (isRefreshingRef.current) return;
        
        isRefreshingRef.current = true;
        onRefreshStart?.();
        
        await refreshFunction();
        
        lastRefreshRef.current = new Date();
        onRefreshComplete?.();
      } catch (error) {
        logger.error('Error in debounced refresh:', error);
        onError?.(error as Error);
      } finally {
        isRefreshingRef.current = false;
      }
    }, debounceDelay);
  }, [debounceDelay, onRefreshStart, onRefreshComplete, onError]);

  // Smart refresh function that determines what needs updating
  const smartRefresh = useCallback(async () => {
    try {
      if (isRefreshingRef.current) return;
      
      isRefreshingRef.current = true;
      onRefreshStart?.();

      // Determine what needs refreshing based on last update time
      const now = new Date();
      const timeSinceLastRefresh = now.getTime() - lastRefreshRef.current.getTime();
      
      // If it's been more than 5 minutes, do a full refresh
      if (timeSinceLastRefresh > 5 * 60 * 1000) {
        await refreshAllData();
        onDataChanged?.('all', state);
      } else {
        // Otherwise, refresh progress data (more frequent changes)
        await refreshProgressData();
        onDataChanged?.('progress', {
          readSegments: state.readSegments,
          completedSegments: state.completedSegments,
          activePlan: state.activePlan,
          activeChallenges: state.activeChallenges,
        });
      }
      
      lastRefreshRef.current = now;
      onRefreshComplete?.();
    } catch (error) {
      logger.error('Error in smart refresh:', error);
      onError?.(error as Error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [
    refreshAllData,
    refreshProgressData,
    state,
    onRefreshStart,
    onRefreshComplete,
    onDataChanged,
    onError,
  ]);

  // Debounced smart refresh
  const debouncedSmartRefresh = useCallback(() => {
    debouncedRefresh(smartRefresh);
  }, [debouncedRefresh, smartRefresh]);

  // Set up interval-based refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    intervalRef.current = setInterval(() => {
      debouncedSmartRefresh();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, refreshInterval, debouncedSmartRefresh]);

  // Set up app state change listener
  useEffect(() => {
    if (!enabled || !refreshOnAppStateChange) return;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground
        debouncedSmartRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [enabled, refreshOnAppStateChange, debouncedSmartRefresh]);

  // Manual refresh functions
  const refreshAll = useCallback(() => {
    debouncedRefresh(refreshAllData);
  }, [debouncedRefresh, refreshAllData]);

  const refreshProgress = useCallback(() => {
    debouncedRefresh(refreshProgressData);
  }, [debouncedRefresh, refreshProgressData]);

  const refreshStats = useCallback(() => {
    debouncedRefresh(refreshStatistics);
  }, [debouncedRefresh, refreshStatistics]);

  const forceRefresh = useCallback(async () => {
    try {
      if (isRefreshingRef.current) return;
      
      isRefreshingRef.current = true;
      onRefreshStart?.();
      
      await refreshAllData();
      
      lastRefreshRef.current = new Date();
      onRefreshComplete?.();
    } catch (error) {
      logger.error('Error in force refresh:', error);
      onError?.(error as Error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshAllData, onRefreshStart, onRefreshComplete, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isRefreshing: isRefreshingRef.current,
    lastRefresh: lastRefreshRef.current,
    
    // Actions
    refreshAll,
    refreshProgress,
    refreshStats,
    forceRefresh,
    smartRefresh: debouncedSmartRefresh,
    
    // Utilities
    clearDebounce: () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    },
  };
};

// Specialized hooks for different data types
export const useProgressUpdates = (options?: RealTimeUpdateOptions) => {
  const { refreshProgressData } = useSQLiteGlobalContext();
  
  return useRealTimeUpdates(
    { refreshInterval: 15000, ...options }, // More frequent for progress
    {
      onDataChanged: (dataType, newData) => {
        logger.info('Progress data updated:', dataType, newData);
      },
    }
  );
};

export const useStatisticsUpdates = (options?: RealTimeUpdateOptions) => {
  const { refreshStatistics } = useSQLiteGlobalContext();
  
  return useRealTimeUpdates(
    { refreshInterval: 60000, ...options }, // Less frequent for stats
    {
      onDataChanged: (dataType, newData) => {
        logger.info('Statistics updated:', dataType, newData);
      },
    }
  );
};

export const useFullDataUpdates = (options?: RealTimeUpdateOptions) => {
  const { refreshAllData } = useSQLiteGlobalContext();
  
  return useRealTimeUpdates(
    { refreshInterval: 120000, ...options }, // Less frequent for full data
    {
      onDataChanged: (dataType, newData) => {
        logger.info('Full data updated:', dataType, newData);
      },
    }
  );
};

export default useRealTimeUpdates;
