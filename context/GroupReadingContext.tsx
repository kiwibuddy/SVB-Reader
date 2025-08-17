import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import logger from '@/utils/logger';
import { AppState, AppStateStatus } from 'react-native';
import { qrCodeDiscoveryManager } from '@/services/QRCodeDiscoveryManager';
import { GroupSession, Participant, Role, GroupSessionState } from '@/types';
import { databaseManager } from '@/api/database-manager';

interface GroupReadingContextType {
  // State
  currentSession: GroupSession | null;
  isHost: boolean;
  currentRole: Role | null;
  currentUserName: string;
  availableRoles: Role[];
  
  // Actions
  startHostSession: (storyId: string, storyTitle: string, scriptureRef: string, role: Role, userName: string, planId?: string, challengeId?: string) => Promise<GroupSession>;
  stopSession: () => Promise<void>;
  joinSession: (sessionId: string, role: Role, userName: string) => Promise<boolean>;
  joinSessionFromQR: (qrCodeData: string, role: Role, userName: string) => Promise<boolean>;
  leaveSession: () => Promise<void>;
  setUserName: (name: string) => void;
  startReading: () => void;
  
  // Role Management
  getAvailableRoles: (hostRole: Role) => Role[];
  calculateRemainingRoles: (hostRole: Role, takenRoles: Role[]) => Role[];
  updateParticipantRole: (deviceId: string, newRole: Role) => void;
  
  // QR Code Generation
  generateSessionQRCode: (hostRole: Role) => Promise<string>;
  generateSessionQRCodeWithSession: (session: GroupSession, hostRole: Role) => Promise<string>;
  generateCompletionQRCode: () => Promise<string>;
  
  // Session Management
  refreshSessionFromDatabase: () => Promise<void>;
  isSessionValid: () => boolean;
}

type GroupReadingAction =
  | { type: 'SET_SESSION'; payload: GroupSession | null }
  | { type: 'SET_HOST'; payload: boolean }
  | { type: 'SET_ROLE'; payload: Role | null }
  | { type: 'SET_USER_NAME'; payload: string }
  | { type: 'SET_AVAILABLE_ROLES'; payload: Role[] }
  | { type: 'UPDATE_SESSION'; payload: Partial<GroupSession> }
  | { type: 'ADD_PARTICIPANT'; payload: Participant }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'UPDATE_PARTICIPANT'; payload: { deviceId: string; updates: Partial<Participant> } };

const initialState: GroupSessionState & { availableRoles: Role[] } = {
  currentSession: null,
  isHost: false,
  currentRole: null,
  currentUserName: '',
  scrollPosition: 0,
  availableRoles: [],
};

const SESSION_STORAGE_KEY = 'group_reading_session';

// Session persistence functions using SQLite
const saveSessionToDatabase = async (session: GroupSession | null): Promise<void> => {
  try {
    const db = databaseManager.getDatabase();
    if (session) {
      // Store session in a dedicated table for group reading sessions
      await db.runAsync(`
        INSERT OR REPLACE INTO group_reading_sessions (
          sessionId, storyId, storyTitle, scriptureReference, 
          hostDeviceId, hostUserName, hostRole, status, 
          createdAt, expiresAt, planId, challengeId, sessionData
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        session.id,
        session.storyId,
        session.storyTitle,
        session.scriptureReference,
        session.hostDeviceId,
        session.hostUserName,
        session.participants[0]?.role || 'narrator',
        session.status,
        new Date(session.createdAt).toISOString(),
        new Date(session.expiresAt).toISOString(),
        session.planId || null,
        session.challengeId || null,
        JSON.stringify(session)
      ]);
      logger.info('💾 Session saved to database:', session.id);
    } else {
      // Clear all sessions
      await db.runAsync('DELETE FROM group_reading_sessions');
      logger.info('💾 All sessions cleared from database');
    }
  } catch (error) {
    logger.error('🔴 Error saving session to database:', error);
  }
};

const loadSessionFromDatabase = async (): Promise<GroupSession | null> => {
  try {
    const db = databaseManager.getDatabase();
    const result = await db.getFirstAsync<{
      sessionData: string;
      expiresAt: string;
    }>('SELECT sessionData, expiresAt FROM group_reading_sessions ORDER BY createdAt DESC LIMIT 1');
    
    if (result) {
      const session = JSON.parse(result.sessionData);
      // Check if session is still valid (not expired)
      if (new Date(result.expiresAt) > new Date()) {
        logger.info('💾 Session loaded from database:', session.id);
        return session;
      } else {
        logger.info('⏰ Saved session expired, clearing...');
        await db.runAsync('DELETE FROM group_reading_sessions WHERE expiresAt < ?', [new Date().toISOString()]);
      }
    }
  } catch (error) {
    logger.error('🔴 Error loading session from database:', error);
  }
  return null;
};

function groupReadingReducer(state: typeof initialState, action: GroupReadingAction): typeof initialState {
  let newState: typeof initialState;
  
  switch (action.type) {
    case 'SET_SESSION':
      newState = { ...state, currentSession: action.payload };
      // Persist session to storage
      if (action.payload) {
        saveSessionToDatabase(action.payload);
      } else {
        saveSessionToDatabase(null);
      }
      return newState;
    case 'SET_HOST':
      return { ...state, isHost: action.payload };
    case 'SET_ROLE':
      return { ...state, currentRole: action.payload };
    case 'SET_USER_NAME':
      return { ...state, currentUserName: action.payload };
    case 'SET_AVAILABLE_ROLES':
      return { ...state, availableRoles: action.payload };
    case 'UPDATE_SESSION':
      newState = {
        ...state,
        currentSession: state.currentSession ? { ...state.currentSession, ...action.payload } : null,
      };
      // Persist updated session to storage
      if (newState.currentSession) {
        saveSessionToDatabase(newState.currentSession);
      }
      return newState;
    case 'ADD_PARTICIPANT':
      newState = {
        ...state,
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              participants: [...state.currentSession.participants, action.payload],
            }
          : null,
      };
      // Persist updated session to storage
      if (newState.currentSession) {
        saveSessionToDatabase(newState.currentSession);
      }
      return newState;
    case 'REMOVE_PARTICIPANT':
      newState = {
        ...state,
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              participants: state.currentSession.participants.filter(p => p.deviceId !== action.payload),
            }
          : null,
      };
      // Persist updated session to storage
      if (newState.currentSession) {
        saveSessionToDatabase(newState.currentSession);
      }
      return newState;
    case 'UPDATE_PARTICIPANT':
      newState = {
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
      // Persist updated session to storage
      if (newState.currentSession) {
        saveSessionToDatabase(newState.currentSession);
      }
      return newState;
    default:
      return state;
  }
}

const GroupReadingContext = createContext<GroupReadingContextType | undefined>(undefined);

export const GroupReadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(groupReadingReducer, initialState);

  // Restore session from storage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = await loadSessionFromDatabase();
        if (savedSession) {
          // Check if session is still valid (not expired)
          if (savedSession.expiresAt > Date.now()) {
            logger.info('🔄 Restoring saved session:', savedSession.id);
            dispatch({ type: 'SET_SESSION', payload: savedSession });
            // Restore other session-related state
            const hostParticipant = savedSession.participants.find(p => p.deviceId === savedSession.hostDeviceId);
            if (hostParticipant) {
              dispatch({ type: 'SET_HOST', payload: true });
              dispatch({ type: 'SET_ROLE', payload: hostParticipant.role });
              dispatch({ type: 'SET_USER_NAME', payload: hostParticipant.userName });
            }
            // Set available roles
            const availableRoles = qrCodeDiscoveryManager.getAvailableRoles(hostParticipant?.role || 'narrator');
            dispatch({ type: 'SET_AVAILABLE_ROLES', payload: availableRoles });
          } else {
            logger.info('⏰ Saved session expired, clearing...');
            await saveSessionToDatabase(null);
          }
        }
      } catch (error) {
        logger.error('🔴 Error restoring session:', error);
      }
    };

    restoreSession();
  }, []);

  // Handle app state changes to maintain session
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && state.currentSession) {
        logger.info('📱 App became active, session maintained:', state.currentSession.id);
      } else if (nextAppState === 'background' && state.currentSession) {
        logger.info('📱 App going to background, session saved:', state.currentSession.id);
        // Session is automatically saved by the reducer
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [state.currentSession]);

  // Clean up expired sessions periodically
  useEffect(() => {
    const cleanupExpiredSessions = async () => {
      try {
        const db = databaseManager.getDatabase();
        const now = new Date().toISOString();
        const deletedCount = await db.runAsync(
          'DELETE FROM group_reading_sessions WHERE expiresAt < ?',
          [now]
        );
        if (deletedCount.changes > 0) {
          logger.info(`🧹 Cleaned up ${deletedCount.changes} expired sessions`);
        }
      } catch (error) {
        logger.error('🔴 Error cleaning up expired sessions:', error);
      }
    };

    // Clean up on mount and every 5 minutes
    cleanupExpiredSessions();
    const interval = setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Real QR code implementations
  const startHostSession = useCallback(async (
    storyId: string,
    storyTitle: string,
    scriptureRef: string,
    role: Role,
    userName: string,
    planId?: string,
    challengeId?: string
  ): Promise<GroupSession> => {
    try {
      logger.info('🔵 Starting QR code host session...');
      logger.info('🔵 Host role:', role);
      
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
      
      // Set available roles for joiners
      const availableRoles = qrCodeDiscoveryManager.getAvailableRoles(role);
      dispatch({ type: 'SET_AVAILABLE_ROLES', payload: availableRoles });
      
      logger.info('🔵 QR code host session started:', session.id);
      logger.info('🔵 Available roles for joiners:', availableRoles);
      return session;
    } catch (error) {
      logger.error('🔴 Error starting QR code host session:', error);
      dispatch({ type: 'SET_HOST', payload: false });
      throw error;
    }
  }, []);

  const stopSession = useCallback(async (): Promise<void> => {
    try {
      logger.info('🔵 Stopping QR code session...');
      
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_HOST', payload: false });
      dispatch({ type: 'SET_ROLE', payload: null });
      dispatch({ type: 'SET_AVAILABLE_ROLES', payload: [] });
      
      logger.info('🔵 QR code session stopped');
    } catch (error) {
      logger.error('🔴 Error stopping QR code session:', error);
    }
  }, []);

  const joinSession = useCallback(async (sessionId: string, role: Role, userName: string): Promise<boolean> => {
    try {
      logger.info('🔗 Joining QR code session:', sessionId);
      logger.info('🔗 Selected role:', role);
      
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
          role: 'narrator',
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
      
      logger.info('🔗 Successfully joined QR code session');
      return true;
    } catch (error) {
      logger.error('🔴 Error joining QR code session:', error);
      return false;
    }
  }, []);

  const joinSessionFromQR = useCallback(async (qrCodeData: string, role: Role, userName: string): Promise<boolean> => {
    try {
      logger.info('🔗 Joining session from QR code...');
      logger.info('🔗 Selected role:', role);
      
      // Parse session from QR code
      const session = qrCodeDiscoveryManager.parseSessionFromQRCode(qrCodeData);
      
      if (!session) {
        logger.error('🔴 Failed to parse session from QR code');
        return false;
      }
      
      // Validate role selection
      const hostRole = session.participants[0].role;
      const availableRoles = qrCodeDiscoveryManager.getAvailableRoles(hostRole);
      
      if (!availableRoles.includes(role)) {
        logger.error('🔴 Invalid role selection:', role);
        logger.error('🔴 Available roles:', availableRoles);
        return false;
      }
      
      // Add joiner to session
      const joinerParticipant: Participant = {
        deviceId: 'qr_joiner_device_' + Date.now(),
        deviceName: 'QR Joiner Device',
        userName: userName,
        role: role,
        isReady: true,
        isConnected: true
      };
      
      session.participants.push(joinerParticipant);
      
      dispatch({ type: 'SET_USER_NAME', payload: userName });
      dispatch({ type: 'SET_HOST', payload: false });
      dispatch({ type: 'SET_ROLE', payload: role });
      dispatch({ type: 'SET_SESSION', payload: session });
      
      logger.info('🔗 Successfully joined session from QR code');
      logger.info('🔗 Session participants:', session.participants);
      return true;
    } catch (error) {
      logger.error('🔴 Error joining session from QR code:', error);
      return false;
    }
  }, []);

  const leaveSession = useCallback(async (): Promise<void> => {
    try {
      logger.info('🔌 Leaving QR code session...');
      
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_HOST', payload: false });
      dispatch({ type: 'SET_ROLE', payload: null });
      dispatch({ type: 'SET_AVAILABLE_ROLES', payload: [] });
      
      logger.info('🔌 Successfully left QR code session');
    } catch (error) {
      logger.error('🔴 Error leaving QR code session:', error);
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

  // Role Management Functions
  const getAvailableRoles = useCallback((hostRole: Role): Role[] => {
    return qrCodeDiscoveryManager.getAvailableRoles(hostRole);
  }, []);

  const calculateRemainingRoles = useCallback((hostRole: Role, takenRoles: Role[]): Role[] => {
    return qrCodeDiscoveryManager.calculateRemainingRoles(hostRole, takenRoles);
  }, []);

  const updateParticipantRole = useCallback((deviceId: string, newRole: Role): void => {
    dispatch({
      type: 'UPDATE_PARTICIPANT',
      payload: { deviceId, updates: { role: newRole } }
    });
  }, []);

  const isSessionValid = useCallback((): boolean => {
    if (!state.currentSession) return false;
    
    // Check if session has expired
    if (state.currentSession.expiresAt < Date.now()) {
      logger.info('⏰ Session expired, clearing...');
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_HOST', payload: false });
      dispatch({ type: 'SET_ROLE', payload: null });
      dispatch({ type: 'SET_AVAILABLE_ROLES', payload: [] });
      return false;
    }
    
    return true;
  }, [state.currentSession]);

  // QR Code Generation Functions
  const generateSessionQRCode = useCallback(async (hostRole: Role): Promise<string> => {
    // Get the current session from state directly to avoid stale closure issues
    const currentSession = state.currentSession;
    
    if (!currentSession) {
      throw new Error('No active session to generate QR code for');
    }
    
    // Check if session is still valid
    if (!isSessionValid()) {
      throw new Error('Session has expired or is invalid');
    }
    
    try {
      logger.info('📱 Generating session QR code...');
      logger.info(`📱 Generating QR code for session: ${currentSession.id}`);
      logger.info(`📱 Host role: ${hostRole}`);
      
      const qrCodeData = await qrCodeDiscoveryManager.generateSessionQRCode(currentSession, hostRole);
      logger.info('📱 QR code data generated:', qrCodeData.substring(0, 100) + '...');
      logger.info('📱 Session info:', {
        host: currentSession.hostUserName,
        hostRole: hostRole,
        reference: currentSession.scriptureReference,
        story: currentSession.storyTitle
      });
      logger.info('📱 QR code generated successfully');
      return qrCodeData;
    } catch (error) {
      logger.error('🔴 Error generating QR code:', error);
      throw error;
    }
  }, [state.currentSession, isSessionValid]); // Add isSessionValid dependency

  // Generate QR code for a specific session (bypasses state timing issues)
  const generateSessionQRCodeWithSession = useCallback(async (session: GroupSession, hostRole: Role): Promise<string> => {
    try {
      logger.info('📱 Generating session QR code with provided session...');
      logger.info(`📱 Generating QR code for session: ${session.id}`);
      logger.info(`📱 Host role: ${hostRole}`);
      
      const qrCodeData = await qrCodeDiscoveryManager.generateSessionQRCode(session, hostRole);
      logger.info('📱 QR code data generated:', qrCodeData.substring(0, 100) + '...');
      logger.info('📱 Session info:', {
        host: session.hostUserName,
        hostRole: hostRole,
        reference: session.scriptureReference,
        story: session.storyTitle
      });
      logger.info('📱 Session QR code generated successfully');
      return qrCodeData;
    } catch (error) {
      logger.error('🔴 Error generating session QR code:', error);
      throw error;
    }
  }, []);

  const generateCompletionQRCode = useCallback(async (): Promise<string> => {
    // Get the current session from state directly to avoid stale closure issues
    const currentSession = state.currentSession;
    
    if (!currentSession) {
      throw new Error('No active session to generate completion QR code for');
    }
    
    // Check if session is still valid
    if (!isSessionValid()) {
      throw new Error('Session has expired or is invalid');
    }
    
    try {
      logger.info('✅ Generating completion QR code...');
      logger.info(`✅ Generating completion QR for session: ${currentSession.id}`);
      
      const qrCodeData = await qrCodeDiscoveryManager.generateCompletionQRCode(currentSession);
      logger.info('✅ Completion QR code generated successfully');
      return qrCodeData;
    } catch (error) {
      logger.error('🔴 Error generating completion QR code:', error);
      throw error;
    }
  }, [state.currentSession, isSessionValid]); // Add isSessionValid dependency

  const refreshSessionFromDatabase = useCallback(async (): Promise<void> => {
    try {
      logger.info('🔄 Refreshing session from database...');
      const session = await loadSessionFromDatabase();
      if (session) {
        logger.info('💾 Session refreshed from database:', session.id);
        dispatch({ type: 'SET_SESSION', payload: session });
        const hostParticipant = session.participants.find(p => p.deviceId === session.hostDeviceId);
        if (hostParticipant) {
          dispatch({ type: 'SET_HOST', payload: true });
          dispatch({ type: 'SET_ROLE', payload: hostParticipant.role });
          dispatch({ type: 'SET_USER_NAME', payload: hostParticipant.userName });
        }
        const availableRoles = qrCodeDiscoveryManager.getAvailableRoles(hostParticipant?.role || 'narrator');
        dispatch({ type: 'SET_AVAILABLE_ROLES', payload: availableRoles });
      } else {
        logger.info('💾 No session found in database to refresh.');
        dispatch({ type: 'SET_SESSION', payload: null });
        dispatch({ type: 'SET_HOST', payload: false });
        dispatch({ type: 'SET_ROLE', payload: null });
        dispatch({ type: 'SET_AVAILABLE_ROLES', payload: [] });
      }
    } catch (error) {
      logger.error('🔴 Error refreshing session from database:', error);
    }
  }, []);

  const contextValue: GroupReadingContextType = {
    currentSession: state.currentSession,
    isHost: state.isHost,
    currentRole: state.currentRole,
    currentUserName: state.currentUserName,
    availableRoles: state.availableRoles,
    startHostSession,
    stopSession,
    joinSession,
    joinSessionFromQR,
    leaveSession,
    setUserName,
    startReading,
    getAvailableRoles,
    calculateRemainingRoles,
    updateParticipantRole,
    generateSessionQRCode,
    generateSessionQRCodeWithSession,
    generateCompletionQRCode,
    refreshSessionFromDatabase,
    isSessionValid,
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