import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
// import { bluetoothSessionManager } from '@/services/BluetoothSessionManager';
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

  // Mock implementations for development build
  const startHostSession = useCallback(async (
    storyId: string,
    storyTitle: string,
    scriptureRef: string,
    role: Role,
    userName: string,
    planId?: string,
    challengeId?: string
  ): Promise<string> => {
    console.log('Mock: Starting host session', { storyId, storyTitle, scriptureRef, role, userName });
    dispatch({ type: 'SET_USER_NAME', payload: userName });
    dispatch({ type: 'SET_HOST', payload: true });
    dispatch({ type: 'SET_ROLE', payload: role });
    
    // Mock session creation
    const mockSession: GroupSession = {
      id: 'mock-session-' + Date.now(),
      hostDeviceId: 'mock-host',
      hostUserName: userName,
      storyId,
      storyTitle,
      scriptureReference: scriptureRef,
      status: 'forming',
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000, // 5 minutes
      participants: [{
        deviceId: 'mock-host',
        deviceName: 'Mock Host Device',
        userName: userName,
        role,
        isReady: true,
        isConnected: true,
      }],
      planId,
      challengeId,
    };
    
    dispatch({ type: 'SET_SESSION', payload: mockSession });
    return mockSession.id;
  }, []);

  const stopSession = useCallback(async (): Promise<void> => {
    console.log('Mock: Stopping session');
    dispatch({ type: 'SET_SESSION', payload: null });
    dispatch({ type: 'SET_HOST', payload: false });
    dispatch({ type: 'SET_ROLE', payload: null });
  }, []);

  const joinSession = useCallback(async (sessionId: string, role: Role, userName: string): Promise<boolean> => {
    console.log('Mock: Joining session', { sessionId, role, userName });
    dispatch({ type: 'SET_USER_NAME', payload: userName });
    dispatch({ type: 'SET_ROLE', payload: role });
    return true;
  }, []);

  const leaveSession = useCallback(async (): Promise<void> => {
    console.log('Mock: Leaving session');
    dispatch({ type: 'SET_SESSION', payload: null });
    dispatch({ type: 'SET_HOST', payload: false });
    dispatch({ type: 'SET_ROLE', payload: null });
  }, []);

  const startScanning = useCallback(async (): Promise<void> => {
    console.log('Mock: Starting scanning');
    dispatch({ type: 'SET_SCANNING', payload: true });
    
    // Mock some nearby groups for testing
    setTimeout(() => {
      const mockGroups: GroupSession[] = [
        {
          id: 'mock-group-1',
          hostDeviceId: 'mock-host-1',
          hostUserName: 'Sarah',
          storyId: 'S001',
          storyTitle: 'In the Beginning',
          scriptureReference: 'Genesis 1:1-2:3',
          status: 'forming',
          createdAt: Date.now(),
          expiresAt: Date.now() + 300000,
          participants: [
            { deviceId: 'mock-host-1', deviceName: 'Sarah Device', userName: 'Sarah', role: 'narrator', isReady: true, isConnected: true },
          ],
        },
        {
          id: 'mock-group-2',
          hostDeviceId: 'mock-host-2',
          hostUserName: 'David',
          storyId: 'S015',
          storyTitle: 'The Call of Abraham',
          scriptureReference: 'Genesis 12:1-9',
          status: 'forming',
          createdAt: Date.now() - 30000,
          expiresAt: Date.now() + 270000,
          participants: [
            { deviceId: 'mock-host-2', deviceName: 'David Device', userName: 'David', role: 'god', isReady: true, isConnected: true },
            { deviceId: 'mock-joiner-1', deviceName: 'Emma Device', userName: 'Emma', role: 'narrator', isReady: true, isConnected: true },
          ],
        },
        {
          id: 'mock-group-3',
          hostDeviceId: 'mock-host-3',
          hostUserName: 'Michael',
          storyId: 'S042',
          storyTitle: 'The Burning Bush',
          scriptureReference: 'Exodus 3:1-15',
          status: 'forming',
          createdAt: Date.now() - 60000,
          expiresAt: Date.now() + 240000,
          participants: [
            { deviceId: 'mock-host-3', deviceName: 'Michael Device', userName: 'Michael', role: 'main_character', isReady: true, isConnected: true },
            { deviceId: 'mock-joiner-2', deviceName: 'Lisa Device', userName: 'Lisa', role: 'narrator', isReady: true, isConnected: true },
            { deviceId: 'mock-joiner-3', deviceName: 'James Device', userName: 'James', role: 'other_voices', isReady: true, isConnected: true },
          ],
        },
      ];
      dispatch({ type: 'SET_NEARBY_GROUPS', payload: mockGroups });
    }, 1000);
  }, []);

  const stopScanning = useCallback((): void => {
    console.log('Mock: Stopping scanning');
    dispatch({ type: 'SET_SCANNING', payload: false });
    dispatch({ type: 'SET_NEARBY_GROUPS', payload: [] });
  }, []);

  const acceptJoiner = useCallback(async (deviceId: string, userName: string, role: Role): Promise<boolean> => {
    console.log('Mock: Accepting joiner', { deviceId, userName, role });
    const newParticipant: Participant = {
      deviceId,
      deviceName: 'Joined Device',
      userName: userName,
      role,
      isReady: true,
      isConnected: true,
    };
    dispatch({ type: 'ADD_PARTICIPANT', payload: newParticipant });
    return true;
  }, []);

  const updateScrollPosition = useCallback((position: number): void => {
    console.log('Mock: Updating scroll position', { position });
  }, []);

  const setUserName = useCallback((name: string): void => {
    dispatch({ type: 'SET_USER_NAME', payload: name });
  }, []);

  const startReading = useCallback((): void => {
    console.log('Mock: Starting reading');
    if (state.currentSession) {
      dispatch({ type: 'UPDATE_SESSION', payload: { status: 'reading' } });
    }
  }, [state.currentSession]);

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