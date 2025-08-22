import logger from '@/utils/logger';
import { GroupSession, Role } from '@/types';
import { qrCodeDiscoveryManager } from './QRCodeDiscoveryManager';

export interface QRCodeGenerator {
  // Generate QR code data string for session
  generateSessionQRCodeData: (session: GroupSession, hostRole: Role) => Promise<string>;
  
  // Generate completion QR code data string
  generateCompletionQRCodeData: (session: GroupSession) => Promise<string>;
  
  // Test QR code generation
  generateTestQRCodeData: () => Promise<string>;
}

class QRCodeGeneratorImpl implements QRCodeGenerator {
  
  // Generate QR code data string for session
  async generateSessionQRCodeData(session: GroupSession, hostRole: Role): Promise<string> {
    try {
      logger.info('📱 Generating QR code data for session:', session.id);
      return await qrCodeDiscoveryManager.generateSessionQRCode(session, hostRole);
    } catch (error) {
      logger.error('🔴 Error generating QR code data:', error);
      throw error;
    }
  }

  // Generate QR code data string for completion
  async generateCompletionQRCodeData(session: GroupSession): Promise<string> {
    try {
      logger.info('✅ Generating completion QR code data for session:', session.id);
      return await qrCodeDiscoveryManager.generateCompletionQRCode(session);
    } catch (error) {
      logger.error('🔴 Error generating completion QR code data:', error);
      throw error;
    }
  }

  // Generate test QR code data
  async generateTestQRCodeData(): Promise<string> {
    try {
      logger.info('🧪 Generating test QR code data...');
      
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
      
      return await qrCodeDiscoveryManager.generateSessionQRCode(testSession, 'narrator');
    } catch (error) {
      logger.error('🔴 Error generating test QR code data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const qrCodeGenerator = new QRCodeGeneratorImpl();
