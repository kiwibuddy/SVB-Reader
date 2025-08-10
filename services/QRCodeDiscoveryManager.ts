import { GroupSession, Role, Participant } from '@/types';
import logger from '@/utils/logger';
// QR Code Session Data Interface
interface QRCodeSessionData {
  type: "SVB_SESSION";
  sessionId: string;
  storyId: string;
  storyTitle: string;
  scriptureReference: string;
  hostRole: Role; // Host's selected role
  hostUserName: string;
  timestamp: number;
  expiresAt: number;
  planId?: string;
  challengeId?: string;
}

// QR Code Completion Data Interface
interface QRCodeCompletionData {
  type: "SVB_COMPLETION";
  sessionId: string;
  storyId: string;
  hostDeviceId: string;
  timestamp: number;
  signature: string; // Hash for validation
}

export interface QRCodeDiscoveryManager {
  // QR Code Generation
  generateSessionQRCode(session: GroupSession, hostRole: Role): Promise<string>;
  generateCompletionQRCode(session: GroupSession): Promise<string>;
  
  // QR Code Parsing
  parseSessionFromQRCode(qrCodeData: string): GroupSession | null;
  parseCompletionFromQRCode(qrCodeData: string): QRCodeCompletionData | null;
  
  // Session Validation
  validateSessionData(sessionData: QRCodeSessionData): boolean;
  validateCompletionData(completionData: QRCodeCompletionData): boolean;
  
  // Role Management
  getAvailableRoles(hostRole: Role): Role[];
  calculateRemainingRoles(hostRole: Role, takenRoles: Role[]): Role[];
  
  // Testing
  generateTestQRCode(): Promise<string>;
  generateTestCompletionQRCode(): Promise<string>;
  simulateQRCodeScan(): Promise<GroupSession>;
}

class QRCodeDiscoveryManagerImpl implements QRCodeDiscoveryManager {
  
  // Generate QR code for a session
  async generateSessionQRCode(session: GroupSession, hostRole: Role): Promise<string> {
    try {
      logger.info('📱 Generating QR code for session:', session.id);
      logger.info('📱 Host role:', hostRole);
      
      // Create session data for QR code
      const qrSessionData: QRCodeSessionData = {
        type: "SVB_SESSION",
        sessionId: session.id,
        storyId: session.storyId,
        storyTitle: session.storyTitle,
        scriptureReference: session.scriptureReference,
        hostRole: hostRole,
        hostUserName: session.hostUserName,
        timestamp: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
        planId: session.planId,
        challengeId: session.challengeId
      };
      
      // Convert to JSON string
      const sessionDataString = JSON.stringify(qrSessionData);
      
      logger.info('📱 QR code data generated:', sessionDataString.substring(0, 100) + '...');
      logger.info('📱 Session info:', {
        story: session.storyTitle,
        reference: session.scriptureReference,
        host: session.hostUserName,
        hostRole: hostRole
      });
      
      return sessionDataString;
      
    } catch (error) {
      logger.error('🔴 Error generating QR code:', error);
      throw error;
    }
  }

  // Generate QR code for completion
  async generateCompletionQRCode(session: GroupSession): Promise<string> {
    try {
      logger.info('✅ Generating completion QR code for session:', session.id);
      
      // Create completion signature (simple hash for now)
      const signature = this.generateCompletionSignature(session);
      
      // Create completion data for QR code
      const qrCompletionData: QRCodeCompletionData = {
        type: "SVB_COMPLETION",
        sessionId: session.id,
        storyId: session.storyId,
        hostDeviceId: session.hostDeviceId,
        timestamp: Date.now(),
        signature: signature
      };
      
      // Convert to JSON string
      const completionDataString = JSON.stringify(qrCompletionData);
      
      logger.info('✅ Completion QR code generated:', completionDataString.substring(0, 100) + '...');
      
      return completionDataString;
      
    } catch (error) {
      logger.error('🔴 Error generating completion QR code:', error);
      throw error;
    }
  }
  
  // Parse session data from QR code
  parseSessionFromQRCode(qrCodeData: string): GroupSession | null {
    try {
      logger.info('📱 Parsing QR code data:', qrCodeData.substring(0, 50) + '...');
      
      // Parse JSON data
      const qrSessionData: QRCodeSessionData = JSON.parse(qrCodeData);
      
      // Validate QR code type
      if (qrSessionData.type !== "SVB_SESSION") {
        logger.error('🔴 Invalid QR code type:', qrSessionData.type);
        return null;
      }
      
      // Validate session data
      if (!this.validateSessionData(qrSessionData)) {
        logger.error('🔴 Invalid session data');
        return null;
      }
      
      // Check if session is expired
      if (qrSessionData.expiresAt < Date.now()) {
        logger.error('🔴 Session has expired');
        return null;
      }
      
      // Create GroupSession object
      const session: GroupSession = {
        id: qrSessionData.sessionId,
        storyId: qrSessionData.storyId,
        storyTitle: qrSessionData.storyTitle,
        scriptureReference: qrSessionData.scriptureReference,
        hostDeviceId: 'qr_host_device', // Will be updated when connected
        hostUserName: qrSessionData.hostUserName,
        participants: [{
          deviceId: 'qr_host_device',
          deviceName: 'QR Host Device',
          userName: qrSessionData.hostUserName,
          role: qrSessionData.hostRole,
          isReady: true,
          isConnected: false // Will be updated when connected
        }],
        status: 'forming',
        createdAt: qrSessionData.timestamp,
        expiresAt: qrSessionData.expiresAt,
        planId: qrSessionData.planId,
        challengeId: qrSessionData.challengeId
      };
      
      logger.info('📱 Session parsed successfully:', {
        id: session.id,
        story: session.storyTitle,
        host: session.hostUserName,
        hostRole: qrSessionData.hostRole
      });
      
      return session;
      
    } catch (error) {
      logger.error('🔴 Error parsing QR code:', error);
      return null;
    }
  }

  // Parse completion data from QR code
  parseCompletionFromQRCode(qrCodeData: string): QRCodeCompletionData | null {
    try {
      logger.info('✅ Parsing completion QR code data:', qrCodeData.substring(0, 50) + '...');
      
      // Parse JSON data
      const qrCompletionData: QRCodeCompletionData = JSON.parse(qrCodeData);
      
      // Validate QR code type
      if (qrCompletionData.type !== "SVB_COMPLETION") {
        logger.error('🔴 Invalid completion QR code type:', qrCompletionData.type);
        return null;
      }
      
      // Validate completion data
      if (!this.validateCompletionData(qrCompletionData)) {
        logger.error('🔴 Invalid completion data');
        return null;
      }
      
      logger.info('✅ Completion QR code parsed successfully:', {
        sessionId: qrCompletionData.sessionId,
        storyId: qrCompletionData.storyId,
        timestamp: qrCompletionData.timestamp
      });
      
      return qrCompletionData;
      
    } catch (error) {
      logger.error('🔴 Error parsing completion QR code:', error);
      return null;
    }
  }
  
  // Validate session data
  validateSessionData(sessionData: QRCodeSessionData): boolean {
    try {
      // Check required fields
      if (!sessionData.sessionId || !sessionData.storyId || !sessionData.storyTitle) {
        logger.error('🔴 Missing required session data fields');
        return false;
      }
      
      // Check host role
      if (!sessionData.hostRole || !this.isValidRole(sessionData.hostRole)) {
        logger.error('🔴 Invalid host role:', sessionData.hostRole);
        return false;
      }
      
      // Check timestamp
      if (!sessionData.timestamp || sessionData.timestamp > Date.now()) {
        logger.error('🔴 Invalid timestamp');
        return false;
      }
      
      // Check expiration
      if (!sessionData.expiresAt || sessionData.expiresAt <= Date.now()) {
        logger.error('🔴 Session has expired');
        return false;
      }
      
      // Check session ID format
      if (!sessionData.sessionId.startsWith('session_')) {
        logger.error('🔴 Invalid session ID format');
        return false;
      }
      
      return true;
      
    } catch (error) {
      logger.error('🔴 Error validating session data:', error);
      return false;
    }
  }

  // Validate completion data
  validateCompletionData(completionData: QRCodeCompletionData): boolean {
    try {
      // Check required fields
      if (!completionData.sessionId || !completionData.storyId || !completionData.hostDeviceId) {
        logger.error('🔴 Missing required completion data fields');
        return false;
      }
      
      // Check timestamp (completion should be recent)
      if (!completionData.timestamp || completionData.timestamp > Date.now()) {
        logger.error('🔴 Invalid completion timestamp');
        return false;
      }
      
      // Check if completion is too old (within last 15 minutes)
      const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
      if (completionData.timestamp < fifteenMinutesAgo) {
        logger.error('🔴 Completion QR code is too old');
        return false;
      }
      
      // Check signature presence (length can vary depending on device/time bucket)
      if (!completionData.signature || completionData.signature.length < 6) {
        logger.error('🔴 Invalid completion signature');
        return false;
      }
      
      return true;
      
    } catch (error) {
      logger.error('🔴 Error validating completion data:', error);
      return false;
    }
  }

  // Get all available roles
  getAvailableRoles(hostRole: Role): Role[] {
    const allRoles: Role[] = ['narrator', 'god', 'main_character', 'other_voices'];
    return allRoles.filter(role => role !== hostRole);
  }

  // Calculate remaining roles based on host role and already taken roles
  calculateRemainingRoles(hostRole: Role, takenRoles: Role[]): Role[] {
    const allRoles: Role[] = ['narrator', 'god', 'main_character', 'other_voices'];
    const unavailableRoles = [hostRole, ...takenRoles];
    return allRoles.filter(role => !unavailableRoles.includes(role));
  }

  // Check if role is valid
  private isValidRole(role: string): role is Role {
    return ['narrator', 'god', 'main_character', 'other_voices'].includes(role);
  }

  // Generate completion signature
  private generateCompletionSignature(session: GroupSession): string {
    const nowBucket = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-min time bucket
    const seed1 = `${session.id}|${session.storyId}|${session.hostDeviceId}|${nowBucket}`;
    const seed2 = `${session.storyTitle}|${session.scriptureReference}|${nowBucket}`;
    // Lightweight, deterministic hash -> concatenate two base36 strings for >= 12 chars
    const hashFn = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
      }
      return Math.abs(h).toString(36);
    };
    const sig = `${hashFn(seed1)}${hashFn(seed2)}`;
    return sig.length < 12 ? (sig + '000000000000').slice(0, 12) : sig;
  }
  
  // Generate test QR code for development
  async generateTestQRCode(): Promise<string> {
    try {
      logger.info('🧪 Generating test QR code...');
      
      const testSession: GroupSession = {
        id: 'test_session_' + Date.now(),
        storyId: 'S001',
        storyTitle: 'God Creates',
        scriptureReference: 'Genesis 1:1-2:25',
        hostDeviceId: 'test_host_device',
        hostUserName: 'Test Host',
        participants: [{
          deviceId: 'test_host_device',
          deviceName: 'Test Host Device',
          userName: 'Test Host',
          role: 'narrator',
          isReady: true,
          isConnected: true
        }],
        status: 'forming',
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000)
      };
      
      const qrCodeData = await this.generateSessionQRCode(testSession, 'narrator');
      
      logger.info('🧪 Test QR code generated successfully');
      logger.info('🧪 QR code data:', qrCodeData);
      
      return qrCodeData;
      
    } catch (error) {
      logger.error('🔴 Error generating test QR code:', error);
      throw error;
    }
  }

  // Generate test completion QR code for development
  async generateTestCompletionQRCode(): Promise<string> {
    try {
      logger.info('🧪 Generating test completion QR code...');
      
      const testSession: GroupSession = {
        id: 'test_session_' + Date.now(),
        storyId: 'S001',
        storyTitle: 'God Creates',
        scriptureReference: 'Genesis 1:1-2:25',
        hostDeviceId: 'test_host_device',
        hostUserName: 'Test Host',
        participants: [{
          deviceId: 'test_host_device',
          deviceName: 'Test Host Device',
          userName: 'Test Host',
          role: 'narrator',
          isReady: true,
          isConnected: true
        }],
        status: 'reading',
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000)
      };
      
      const qrCodeData = await this.generateCompletionQRCode(testSession);
      
      logger.info('🧪 Test completion QR code generated successfully');
      logger.info('🧪 Completion QR code data:', qrCodeData);
      
      return qrCodeData;
      
    } catch (error) {
      logger.error('🔴 Error generating test completion QR code:', error);
      throw error;
    }
  }
  
  // Simulate QR code scanning for testing
  async simulateQRCodeScan(): Promise<GroupSession> {
    try {
      logger.info('🧪 Simulating QR code scan...');
      
      // Generate a test QR code
      const qrCodeData = await this.generateTestQRCode();
      
      // Parse the QR code data
      const session = this.parseSessionFromQRCode(qrCodeData);
      
      if (!session) {
        throw new Error('Failed to parse test QR code');
      }
      
      logger.info('🧪 QR code scan simulation successful');
      logger.info('🧪 Discovered session:', {
        id: session.id,
        story: session.storyTitle,
        host: session.hostUserName,
        hostRole: session.participants[0].role
      });
      
      return session;
      
    } catch (error) {
      logger.error('🔴 Error simulating QR code scan:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const qrCodeDiscoveryManager = new QRCodeDiscoveryManagerImpl();
export default qrCodeDiscoveryManager;
