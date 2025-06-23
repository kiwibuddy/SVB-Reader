import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { bluetoothSessionManager } from '@/services/BluetoothSessionManager';
import { GroupSession, Participant, Role, GroupSessionState } from '@/types';

interface GroupReadingContextType {
  // State
  currentSession: GroupSession | null;
  isHost: boolean;
  currentRole: Role | null;
  currentUserName: string;
  isScanning: boolean;
  nearbyGroups: GroupSession[];
  
  // Actions
  startHostSession: (storyId: string, storyTitle: string, scriptureRef: string, role: Role, userName: string, planId?: string, challengeId?: string) => Promise<string>;
  stopSession: () => Promise<void>;
  joinSession: (sessionId: string, role: Role, userName: string) => Promise<boolean>;
  leaveSession: () => Promise<void>;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  acceptJoiner: (deviceId: string, userName: string, role: Role) => Promise<boolean>;
  updateScrollPosition: (position: number) => void;
  setUserName: (name: string) => void;
  startReading: () => void;
}

type GroupReadingAction =
  | { type: 'SET_SESSION'; payload: GroupSession | null }
  | { type: 'SET_HOST'; payload: boolean }
  | { type: 'SET_ROLE'; payload: Role | null }
  | { type: 'SET_USER_NAME'; payload: string }
  | { type: 'SET_SCANNING'; payload: boolean }
  | { type: 'SET_NEARBY_GROUPS'; payload: GroupSession[] }
  | { type: 'ADD_NEARBY_GROUP'; payload: GroupSession }
  | { type: 'REMOVE_NEARBY_GROUP'; payload: string }
  | { type: 'UPDATE_SESSION'; payload: Partial<GroupSession> }
  | { type: 'ADD_PARTICIPANT'; payload: Participant }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'UPDATE_PARTICIPANT'; payload: { deviceId: string; updates: Partial<Participant> } };

const initialState: GroupSessionState = {
  currentSession: null,
  isHost: false,
  currentRole: null,
  currentUserName: '',
  scrollPosition: 0,
  isScanning: false,
  nearbyGroups: [],
};

function groupReadingReducer(state: GroupSessionState, action: GroupReadingAction): GroupSessionState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, currentSession: action.payload };
    case 'SET_HOST':
      return { ...state, isHost: action.payload };
    case 'SET_ROLE':
      return { ...state, currentRole: action.payload };
    case 'SET_USER_NAME':
      return { ...state, currentUserName: action.payload };
    case 'SET_SCANNING':
      return { ...state, isScanning: action.payload };
    case 'SET_NEARBY_GROUPS':
      return { ...state, nearbyGroups: action.payload };
    case 'ADD_NEARBY_GROUP':
      return {
        ...state,
        nearbyGroups: [...state.nearbyGroups.filter(g => g.id !== action.payload.id), action.payload],
      };
    case 'REMOVE_NEARBY_GROUP':
      return {
        ...state,
        nearbyGroups: state.nearbyGroups.filter(g => g.id !== action.payload),
      };
    case 'UPDATE_SESSION':
      return {
        ...state,
        currentSession: state.currentSession ? { ...state.currentSession, ...action.payload } : null,
      };
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              participants: [...state.currentSession.participants, action.payload],
            }
          : null,
      };
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              participants: state.currentSession.participants.filter(p => p.deviceId !== action.payload),
            }
          : null,
      };
    case 'UPDATE_PARTICIPANT':
      return {
        ...state,
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              participants: state.currentSession.participants.map(p =>
                p.deviceId === action.payload.deviceId ? { ...p, ...action.payload.updates } : p
              ),
            }
          : null,
      };
    default:
      return state;
  }
}

const GroupReadingContext = createContext<GroupReadingContextType | undefined>(undefined);

export const GroupReadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(groupReadingReducer, initialState);

  // Real Bluetooth implementations
  const startHostSession = useCallback(async (
    storyId: string,
    storyTitle: string,
    scriptureRef: string,
    role: Role,
    userName: string,
    planId?: string,
    challengeId?: string
  ): Promise<string> => {
    try {
      dispatch({ type: 'SET_USER_NAME', payload: userName });
      dispatch({ type: 'SET_HOST', payload: true });
      dispatch({ type: 'SET_ROLE', payload: role });
      
      const sessionId = await bluetoothSessionManager.startBroadcasting(
        storyId,
        storyTitle,
        scriptureRef,
        role,
        userName,
        planId,
        challengeId
      );
      
      return sessionId;
    } catch (error) {
      console.error('Error starting host session:', error);
      dispatch({ type: 'SET_HOST', payload: false });
      throw error;
    }
  }, []);

  const stopSession = useCallback(async (): Promise<void> => {
    try {
      await bluetoothSessionManager.stopBroadcasting();
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_HOST', payload: false });
      dispatch({ type: 'SET_ROLE', payload: null });
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  }, []);

  const joinSession = useCallback(async (sessionId: string, role: Role, userName: string): Promise<boolean> => {
    try {
      const success = await bluetoothSessionManager.requestToJoin(sessionId, role, userName);
      if (success) {
        dispatch({ type: 'SET_USER_NAME', payload: userName });
        dispatch({ type: 'SET_ROLE', payload: role });
      }
      return success;
    } catch (error) {
      console.error('Error joining session:', error);
      return false;
    }
  }, []);

  const leaveSession = useCallback(async (): Promise<void> => {
    try {
      await bluetoothSessionManager.leaveGroup();
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_HOST', payload: false });
      dispatch({ type: 'SET_ROLE', payload: null });
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  }, []);

  const startScanning = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_SCANNING', payload: true });
      const nearbyGroups = await bluetoothSessionManager.discoverNearbyGroups();
      dispatch({ type: 'SET_NEARBY_GROUPS', payload: nearbyGroups });
    } catch (error) {
      console.error('Error starting scan:', error);
      dispatch({ type: 'SET_SCANNING', payload: false });
    }
  }, []);

  const stopScanning = useCallback((): void => {
    dispatch({ type: 'SET_SCANNING', payload: false });
    dispatch({ type: 'SET_NEARBY_GROUPS', payload: [] });
    // Note: bluetoothSessionManager.stopScanning() is called automatically in discoverNearbyGroups
  }, []);

  const acceptJoiner = useCallback(async (deviceId: string, userName: string, role: Role): Promise<boolean> => {
    try {
      const success = await bluetoothSessionManager.acceptJoiner(deviceId, userName, role);
      if (success) {
        const newParticipant: Participant = {
          deviceId,
          deviceName: 'Joined Device',
          userName: userName,
          role,
          isReady: true,
          isConnected: true,
        };
        dispatch({ type: 'ADD_PARTICIPANT', payload: newParticipant });
      }
      return success;
    } catch (error) {
      console.error('Error accepting joiner:', error);
      return false;
    }
  }, []);

  const updateScrollPosition = useCallback(async (position: number): Promise<void> => {
    try {
      await bluetoothSessionManager.syncScrollPosition(position);
    } catch (error) {
      console.error('Error syncing scroll position:', error);
    }
  }, []);

  const setUserName = useCallback((name: string): void => {
    dispatch({ type: 'SET_USER_NAME', payload: name });
  }, []);

  const startReading = useCallback((): void => {
    if (state.currentSession) {
      dispatch({ type: 'UPDATE_SESSION', payload: { status: 'reading' } });
    }
  }, [state.currentSession]);

  // Set up Bluetooth session event listeners
  useEffect(() => {
    // Listen for session state changes
    const sessionCallback = (session: GroupSession) => {
      dispatch({ type: 'SET_SESSION', payload: session });
    };

    // Listen for scroll sync events
    const scrollCallback = (position: number) => {
      // Handle incoming scroll sync
      console.log('Received scroll sync:', position);
    };

    // Listen for participant events
    const participantJoinedCallback = (participant: Participant) => {
      dispatch({ type: 'ADD_PARTICIPANT', payload: participant });
    };

    const participantLeftCallback = (deviceId: string) => {
      dispatch({ type: 'REMOVE_PARTICIPANT', payload: deviceId });
    };

    // Register callbacks with Bluetooth manager
    bluetoothSessionManager.onGroupStateChange(sessionCallback);
    bluetoothSessionManager.onScrollSync(scrollCallback);
    bluetoothSessionManager.onParticipantJoined(participantJoinedCallback);
    bluetoothSessionManager.onParticipantLeft(participantLeftCallback);

    return () => {
      // Cleanup would go here if the manager supported callback removal
    };
  }, []);

  // Handle app state changes for background scanning
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !state.currentSession) {
        // Start scanning for nearby groups when app becomes active
        startScanning();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Stop scanning when app goes to background
        stopScanning();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Start scanning if app is already active
    if (AppState.currentState === 'active' && !state.currentSession) {
      startScanning();
    }

    return () => {
      subscription?.remove();
    };
  }, [state.currentSession, startScanning, stopScanning]);

  const contextValue: GroupReadingContextType = {
    currentSession: state.currentSession,
    isHost: state.isHost,
    currentRole: state.currentRole,
    currentUserName: state.currentUserName,
    isScanning: state.isScanning,
    nearbyGroups: state.nearbyGroups,
    startHostSession,
    stopSession,
    joinSession,
    leaveSession,
    startScanning,
    stopScanning,
    acceptJoiner,
    updateScrollPosition,
    setUserName,
    startReading,
  };

  return (
    <GroupReadingContext.Provider value={contextValue}>
      {children}
    </GroupReadingContext.Provider>
  );
};

export const useGroupReading = (): GroupReadingContextType => {
  const context = useContext(GroupReadingContext);
  if (context === undefined) {
    throw new Error('useGroupReading must be used within a GroupReadingProvider');
  }
  return context;
}; 