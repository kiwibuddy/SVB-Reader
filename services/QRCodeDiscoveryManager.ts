import { GroupSession, Role, Participant } from '@/types';

// QR Code Session Data Interface
interface QRCodeSessionData {
  sessionId: string;
  storyId: string;
  storyTitle: string;
  scriptureReference: string;
  hostUserName: string;
  timestamp: number;
  expiresAt: number;
  // Add any other session data needed
}

export interface QRCodeDiscoveryManager {
  // QR Code Generation
  generateSessionQRCode(session: GroupSession): Promise<string>;
  
  // QR Code Parsing
  parseSessionFromQRCode(qrCodeData: string): GroupSession | null;
  
  // Session Validation
  validateSessionData(sessionData: QRCodeSessionData): boolean;
  
  // Testing
  generateTestQRCode(): Promise<string>;
  simulateQRCodeScan(): Promise<GroupSession>;
}

class QRCodeDiscoveryManagerImpl implements QRCodeDiscoveryManager {
  
  // Generate QR code for a session
  async generateSessionQRCode(session: GroupSession): Promise<string> {
    try {
      console.log('📱 Generating QR code for session:', session.id);
      
      // Create session data for QR code
      const qrSessionData: QRCodeSessionData = {
        sessionId: session.id,
        storyId: session.storyId,
        storyTitle: session.storyTitle,
        scriptureReference: session.scriptureReference,
        hostUserName: session.hostUserName,
        timestamp: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes
      };
      
      // Convert to JSON string
      const sessionDataString = JSON.stringify(qrSessionData);
      
      // Create QR code data with prefix for validation
      const qrCodeData = `SVB_SESSION:${sessionDataString}`;
      
      console.log('📱 QR code data generated:', qrCodeData.substring(0, 50) + '...');
      console.log('📱 Session info:', {
        story: session.storyTitle,
        reference: session.scriptureReference,
        host: session.hostUserName
      });
      
      return qrCodeData;
      
    } catch (error) {
      console.error('🔴 Error generating QR code:', error);
      throw error;
    }
  }
  
  // Parse session data from QR code
  parseSessionFromQRCode(qrCodeData: string): GroupSession | null {
    try {
      console.log('📱 Parsing QR code data:', qrCodeData.substring(0, 50) + '...');
      
      // Validate QR code format
      if (!qrCodeData.startsWith('SVB_SESSION:')) {
        console.error('🔴 Invalid QR code format');
        return null;
      }
      
      // Extract session data
      const sessionDataString = qrCodeData.replace('SVB_SESSION:', '');
      const qrSessionData: QRCodeSessionData = JSON.parse(sessionDataString);
      
      // Validate session data
      if (!this.validateSessionData(qrSessionData)) {
        console.error('🔴 Invalid session data');
        return null;
      }
      
      // Check if session is expired
      if (qrSessionData.expiresAt < Date.now()) {
        console.error('🔴 Session has expired');
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
          role: 'reader',
          isReady: true,
          isConnected: false // Will be updated when connected
        }],
        status: 'forming',
        createdAt: qrSessionData.timestamp,
        expiresAt: qrSessionData.expiresAt
      };
      
      console.log('📱 Session parsed successfully:', {
        id: session.id,
        story: session.storyTitle,
        host: session.hostUserName
      });
      
      return session;
      
    } catch (error) {
      console.error('🔴 Error parsing QR code:', error);
      return null;
    }
  }
  
  // Validate session data
  validateSessionData(sessionData: QRCodeSessionData): boolean {
    try {
      // Check required fields
      if (!sessionData.sessionId || !sessionData.storyId || !sessionData.storyTitle) {
        console.error('🔴 Missing required session data fields');
        return false;
      }
      
      // Check timestamp
      if (!sessionData.timestamp || sessionData.timestamp > Date.now()) {
        console.error('🔴 Invalid timestamp');
        return false;
      }
      
      // Check expiration
      if (!sessionData.expiresAt || sessionData.expiresAt <= Date.now()) {
        console.error('🔴 Session has expired');
        return false;
      }
      
      // Check session ID format
      if (!sessionData.sessionId.startsWith('session_')) {
        console.error('🔴 Invalid session ID format');
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('🔴 Error validating session data:', error);
      return false;
    }
  }
  
  // Generate test QR code for development
  async generateTestQRCode(): Promise<string> {
    try {
      console.log('🧪 Generating test QR code...');
      
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
          role: 'reader',
          isReady: true,
          isConnected: true
        }],
        status: 'forming',
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000)
      };
      
      const qrCodeData = await this.generateSessionQRCode(testSession);
      
      console.log('🧪 Test QR code generated successfully');
      console.log('🧪 QR code data:', qrCodeData);
      
      return qrCodeData;
      
    } catch (error) {
      console.error('🔴 Error generating test QR code:', error);
      throw error;
    }
  }
  
  // Simulate QR code scanning for testing
  async simulateQRCodeScan(): Promise<GroupSession> {
    try {
      console.log('🧪 Simulating QR code scan...');
      
      // Generate a test QR code
      const qrCodeData = await this.generateTestQRCode();
      
      // Parse the QR code data
      const session = this.parseSessionFromQRCode(qrCodeData);
      
      if (!session) {
        throw new Error('Failed to parse test QR code');
      }
      
      console.log('🧪 QR code scan simulation successful');
      console.log('🧪 Discovered session:', {
        id: session.id,
        story: session.storyTitle,
        host: session.hostUserName
      });
      
      return session;
      
    } catch (error) {
      console.error('🔴 Error simulating QR code scan:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const qrCodeDiscoveryManager = new QRCodeDiscoveryManagerImpl();
export default qrCodeDiscoveryManager;
