import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { qrCodeDiscoveryManager } from '@/services/QRCodeDiscoveryManager';
import { GroupSession, Participant, Role, GroupSessionState } from '@/types';

interface GroupReadingContextType {
  // State
  currentSession: GroupSession | null;
  isHost: boolean;
  currentRole: Role | null;
  currentUserName: string;
  
  // Actions
  startHostSession: (storyId: string, storyTitle: string, scriptureRef: string, role: Role, userName: string, planId?: string, challengeId?: string) => Promise<string>;
  stopSession: () => Promise<void>;
  joinSession: (sessionId: string, role: Role, userName: string) => Promise<boolean>;
  leaveSession: () => Promise<void>;
  setUserName: (name: string) => void;
  startReading: () => void;
}

type GroupReadingAction =
  | { type: 'SET_SESSION'; payload: GroupSession | null }
  | { type: 'SET_HOST'; payload: boolean }
  | { type: 'SET_ROLE'; payload: Role | null }
  | { type: 'SET_USER_NAME'; payload: string }
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

  // Real BLE implementations
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
      console.log('🔵 Starting QR code host session...');
      
      dispatch({ type: 'SET_USER_NAME', payload: userName });
      dispatch({ type: 'SET_HOST', payload: true });
      dispatch({ type: 'SET_ROLE', payload: role });
      
      // Create session object
      const session: GroupSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        storyId,
        storyTitle,
        scriptureReference: scriptureRef,
        hostDeviceId: 'qr_host_device',
        hostUserName: userName,
        participants: [{
          deviceId: 'qr_host_device',
          deviceName: 'QR Host Device',
          userName: userName,
          role,
          isReady: true,
          isConnected: true
        }],
        status: 'forming',
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000),
        planId,
        challengeId
      };
      
      // Update state with session
      dispatch({ type: 'SET_SESSION', payload: session });
      
      console.log('🔵 QR code host session started:', session.id);
      return session.id;
    } catch (error) {
      console.error('🔴 Error starting QR code host session:', error);
      dispatch({ type: 'SET_HOST', payload: false });
      throw error;
    }
  }, []);

  const stopSession = useCallback(async (): Promise<void> => {
    try {
      console.log('🔵 Stopping QR code session...');
      
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_HOST', payload: false });
      dispatch({ type: 'SET_ROLE', payload: null });
      
      console.log('🔵 QR code session stopped');
    } catch (error) {
      console.error('🔴 Error stopping QR code session:', error);
    }
  }, []);

  const joinSession = useCallback(async (sessionId: string, role: Role, userName: string): Promise<boolean> => {
    try {
      console.log('🔗 Joining QR code session:', sessionId);
      
      // TODO: Parse session from QR code data
      // For now, create a placeholder session
      const session: GroupSession = {
        id: sessionId,
        storyId: 'S001',
        storyTitle: 'God Creates',
        scriptureReference: 'Genesis 1:1-2:25',
        hostDeviceId: 'qr_host_device',
        hostUserName: 'QR Host',
        participants: [{
          deviceId: 'qr_host_device',
          deviceName: 'QR Host Device',
          userName: 'QR Host',
          role: 'reader',
          isReady: true,
          isConnected: true
        }],
        status: 'forming',
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000)
      };
      
      dispatch({ type: 'SET_USER_NAME', payload: userName });
      dispatch({ type: 'SET_HOST', payload: false });
      dispatch({ type: 'SET_ROLE', payload: role });
      dispatch({ type: 'SET_SESSION', payload: session });
      
      console.log('🔗 Successfully joined QR code session');
      return true;
    } catch (error) {
      console.error('🔴 Error joining QR code session:', error);
      return false;
    }
  }, []);

  const leaveSession = useCallback(async (): Promise<void> => {
    try {
      console.log('🔌 Leaving QR code session...');
      
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_HOST', payload: false });
      dispatch({ type: 'SET_ROLE', payload: null });
      
      console.log('🔌 Successfully left QR code session');
    } catch (error) {
      console.error('🔴 Error leaving QR code session:', error);
    }
  }, [state.currentSession]);




  const setUserName = useCallback((name: string): void => {
    dispatch({ type: 'SET_USER_NAME', payload: name });
  }, []);

  const startReading = useCallback((): void => {
    if (state.currentSession) {
      dispatch({ type: 'UPDATE_SESSION', payload: { status: 'reading' } });
    }
  }, [state.currentSession]);







  const contextValue: GroupReadingContextType = {
    currentSession: state.currentSession,
    isHost: state.isHost,
    currentRole: state.currentRole,
    currentUserName: state.currentUserName,
    startHostSession,
    stopSession,
    joinSession,
    leaveSession,
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