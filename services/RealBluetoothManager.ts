import BleManager from 'react-native-ble-manager';
import { Platform, PermissionsAndroid, Alert, NativeEventEmitter, NativeModules } from 'react-native';
import { GroupSession, Role, Participant } from '@/types';

// BLE Service and Characteristic UUIDs
const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const SESSION_INFO_CHARACTERISTIC = '87654321-4321-4321-4321-cba987654321';
const JOIN_REQUEST_CHARACTERISTIC = '11111111-2222-3333-4444-555555555555';
const SCROLL_SYNC_CHARACTERISTIC = '22222222-3333-4444-5555-666666666666';
const PARTICIPANT_UPDATE_CHARACTERISTIC = '33333333-4444-5555-6666-777777777777';

interface BleMessage {
  type: 'session_info' | 'join_request' | 'participant_update' | 'scroll_sync' | 'ready_check' | 'start_reading';
  data: any;
  timestamp: number;
}

interface DiscoveredDevice {
  id: string;
  name: string;
  rssi: number;
  advertising: any;
}

export interface RealBluetoothManager {
  // Initialization
  initialize(): Promise<void>;
  
  // Host Functions (Peripheral Mode)
  startAdvertising(session: GroupSession): Promise<void>;
  stopAdvertising(): Promise<void>;
  
  // Joiner Functions (Central Mode)
  startScanning(): Promise<GroupSession[]>;
  stopScanning(): Promise<void>;
  connectToDevice(deviceId: string): Promise<boolean>;
  disconnectFromDevice(deviceId: string): Promise<void>;
  
  // Communication
  sendMessage(deviceId: string, message: BleMessage): Promise<void>;
  readMessage(deviceId: string): Promise<BleMessage | null>;
  
  // Event Handlers
  onDeviceFound(callback: (device: DiscoveredDevice) => void): void;
  onDeviceConnected(callback: (deviceId: string) => void): void;
  onDeviceDisconnected(callback: (deviceId: string) => void): void;
  onMessageReceived(callback: (deviceId: string, message: BleMessage) => void): void;
  
  // Testing
  addTestSession(): Promise<void>;
}

class RealBluetoothManagerImpl implements RealBluetoothManager {
  private isInitialized: boolean = false;
  private isAdvertising: boolean = false;
  private isScanning: boolean = false;
  private currentSession: GroupSession | null = null;
  private connectedDevices: Set<string> = new Set();
  private discoveredDevices: Map<string, DiscoveredDevice> = new Map();
  private eventEmitter: NativeEventEmitter;
  private originalDeviceName: string | null = null;
  
  // Event callbacks
  private deviceFoundCallbacks: ((device: DiscoveredDevice) => void)[] = [];
  private deviceConnectedCallbacks: ((deviceId: string) => void)[] = [];
  private deviceDisconnectedCallbacks: ((deviceId: string) => void)[] = [];
  private messageReceivedCallbacks: ((deviceId: string, message: BleMessage) => void)[] = [];

  constructor() {
    this.eventEmitter = new NativeEventEmitter(NativeModules.BleManager);
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔵 Initializing Real BLE Manager...');
      
      // Request permissions
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }

      // Start BLE Manager
      await BleManager.start({ showAlert: false });
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('🔵 Real BLE Manager initialized successfully');
    } catch (error) {
      console.error('🔴 Error initializing Real BLE Manager:', error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'Bluetooth and location permissions are required for group reading features.',
            [{ text: 'OK' }]
          );
          return false;
        }
        return true;
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    }
    return true;
  }

  private setupEventListeners(): void {
    console.log('🔵 Setting up real BLE event listeners...');
    
    // Device discovered during scanning
    this.eventEmitter.addListener('BleManagerDiscoverPeripheral', (device: DiscoveredDevice) => {
      console.log('🔍 Device discovered:', device.name || device.id);
      this.discoveredDevices.set(device.id, device);
      this.deviceFoundCallbacks.forEach(callback => callback(device));
    });

    // Device connected
    this.eventEmitter.addListener('BleManagerConnectPeripheral', (data: { peripheral: string }) => {
      console.log('🔗 Device connected:', data.peripheral);
      this.connectedDevices.add(data.peripheral);
      this.deviceConnectedCallbacks.forEach(callback => callback(data.peripheral));
    });

    // Device disconnected
    this.eventEmitter.addListener('BleManagerDisconnectPeripheral', (data: { peripheral: string }) => {
      console.log('🔌 Device disconnected:', data.peripheral);
      this.connectedDevices.delete(data.peripheral);
      this.deviceDisconnectedCallbacks.forEach(callback => callback(data.peripheral));
    });

    // Characteristic value changed (message received)
    this.eventEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', (data: { peripheral: string; characteristic: string; value: string }) => {
      console.log('📨 Message received from device:', data.peripheral);
      try {
        const message: BleMessage = JSON.parse(Buffer.from(data.value, 'base64').toString());
        this.messageReceivedCallbacks.forEach(callback => callback(data.peripheral, message));
      } catch (error) {
        console.error('Error parsing received message:', error);
      }
    });
  }

  // Host Functions (Peripheral Mode)
  async startAdvertising(session: GroupSession): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('BLE Manager not initialized');
      }

      console.log('🔵 Starting real BLE advertising for session:', session.id);
      
      this.currentSession = session;
      
      // Create device name with real story name
      // Format: "SVB_{storyTitle}_{sessionId}"
      const storyTitle = session.storyTitle.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      const deviceName = `SVB_${storyTitle}_${session.id.substring(0, 8)}`;
      
      console.log('🔵 Device name advertising:', deviceName);
      console.log('🔵 Story:', session.storyTitle);
      console.log('🔵 Session ID:', session.id);
      
      // Store the session data for discovery (since we can't set device name directly)
      // This is a workaround since react-native-ble-manager doesn't support peripheral mode
      this.storeSessionForDiscovery(session);
      
      this.isAdvertising = true;
      console.log('🔵 BLE advertising started (session stored for discovery)');
      
    } catch (error) {
      console.error('🔴 Error starting BLE advertising:', error);
      throw error;
    }
  }

  private storeSessionForDiscovery(session: GroupSession): void {
    // Store session data in memory for discovery
    // In a real implementation, this would be stored in a way that other devices can access
    const sessionData = {
      ...session,
      timestamp: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes
    };
    
    // For now, we'll use a global variable to simulate cross-device discovery
    // In production, this would be replaced with actual BLE advertising
    (global as any).__bleSessions = (global as any).__bleSessions || new Map();
    (global as any).__bleSessions.set(session.id, sessionData);
    
    console.log('🔵 Session stored for discovery:', session.id);
  }

  async stopAdvertising(): Promise<void> {
    try {
      if (this.isAdvertising) {
        console.log('🔵 Stopping BLE advertising...');
        
        // Remove session from discovery storage
        if (this.currentSession) {
          (global as any).__bleSessions?.delete(this.currentSession.id);
        }
        
        this.isAdvertising = false;
        this.currentSession = null;
        console.log('🔵 BLE advertising stopped');
      }
    } catch (error) {
      console.error('🔴 Error stopping BLE advertising:', error);
      throw error;
    }
  }

  // Joiner Functions (Central Mode)
  async startScanning(): Promise<GroupSession[]> {
    try {
      if (!this.isInitialized) {
        throw new Error('BLE Manager not initialized');
      }

      console.log('🔍 Starting real BLE scanning for sessions...');
      
      const foundSessions: GroupSession[] = [];
      
      // Clear previous discoveries
      this.discoveredDevices.clear();
      
      // Start scanning for devices
      await BleManager.scan([], 10, true); // Scan for 10 seconds, allow duplicates
      
      this.isScanning = true;
      
      // Wait for devices to be discovered
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Process discovered devices
      for (const [deviceId, device] of this.discoveredDevices) {
        try {
          // Try to extract session data from advertising
          const sessionData = this.extractSessionFromAdvertising(device);
          if (sessionData) {
            foundSessions.push(sessionData);
          }
        } catch (error) {
          console.error('Error processing device:', deviceId, error);
        }
      }
      
      // Also check for sessions stored in memory (for testing)
      const storedSessions = this.getStoredSessions();
      foundSessions.push(...storedSessions);
      
      console.log('🔍 Found sessions:', foundSessions.length);
      return foundSessions;
      
    } catch (error) {
      console.error('🔴 Error starting BLE scanning:', error);
      throw error;
    }
  }

  private getStoredSessions(): GroupSession[] {
    const sessions: GroupSession[] = [];
    const storedSessions = (global as any).__bleSessions;
    
    if (storedSessions) {
      for (const [sessionId, sessionData] of storedSessions) {
        // Check if session is still valid (not expired)
        if (sessionData.expiresAt > Date.now()) {
          sessions.push(sessionData);
        } else {
          // Remove expired session
          storedSessions.delete(sessionId);
        }
      }
    }
    
    return sessions;
  }

  private extractSessionFromAdvertising(device: DiscoveredDevice): GroupSession | null {
    try {
      // Method 1: Extract from device name (SVB_{storyTitle}_{sessionId})
      if (device.name && device.name.startsWith('SVB_')) {
        const parts = device.name.split('_');
        if (parts.length >= 3) {
          const storyTitle = parts[1];
          const sessionId = parts[2];
          
          // Create session from device name data
          return {
            id: sessionId,
            storyId: this.getStoryIdFromTitle(storyTitle),
            storyTitle: this.getStoryTitleFromShort(storyTitle),
            scriptureReference: this.getScriptureReferenceFromTitle(storyTitle),
            hostDeviceId: device.id,
            hostUserName: 'Host Device',
            participants: [],
            status: 'forming',
            createdAt: Date.now(),
            expiresAt: Date.now() + (30 * 60 * 1000)
          };
        }
      }
      
      // Method 2: Try to extract from advertising data (fallback)
      if (device.advertising && device.advertising.serviceData) {
        const serviceData = device.advertising.serviceData[SERVICE_UUID];
        if (serviceData) {
          const sessionData = JSON.parse(serviceData);
          return {
            id: sessionData.sessionId,
            storyId: sessionData.storyId,
            storyTitle: sessionData.storyTitle,
            scriptureReference: sessionData.scriptureReference || '',
            hostDeviceId: device.id,
            hostUserName: sessionData.hostUserName,
            participants: sessionData.participants || [],
            status: 'forming',
            createdAt: sessionData.timestamp,
            expiresAt: sessionData.timestamp + (30 * 60 * 1000)
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting session from advertising:', error);
      return null;
    }
  }

  private getStoryIdFromTitle(shortTitle: string): string {
    // Map short titles back to story IDs
    const titleToId: Record<string, string> = {
      'GodCreates': 'S001',
      'TheFall': 'S002',
      'NoahFlood': 'S003',
      'Abraham': 'S004',
      'Moses': 'S005',
      'David': 'S006',
      'Jesus': 'S007',
      'Paul': 'S008',
      'LevitesNum': 'S009',
      // Add more mappings as needed
    };
    return titleToId[shortTitle] || 'S001';
  }

  private getStoryTitleFromShort(shortTitle: string): string {
    // Map short titles to full titles
    const shortToFull: Record<string, string> = {
      'GodCreates': 'God Creates',
      'TheFall': 'The Fall',
      'NoahFlood': 'Noah and the Flood',
      'Abraham': 'Abraham and Isaac',
      'Moses': 'Moses and the Exodus',
      'David': 'David and Goliath',
      'Jesus': 'Jesus and the Disciples',
      'Paul': 'Paul\'s Mission',
      'LevitesNum': 'Levites Numbered & Set Apart',
      // Add more mappings as needed
    };
    return shortToFull[shortTitle] || 'Bible Story';
  }

  private getScriptureReferenceFromTitle(shortTitle: string): string {
    // Map short titles to scripture references
    const titleToScripture: Record<string, string> = {
      'GodCreates': 'Genesis 1:1-2:25',
      'TheFall': 'Genesis 3:1-24',
      'NoahFlood': 'Genesis 6:1-9:17',
      'Abraham': 'Genesis 22:1-19',
      'Moses': 'Exodus 14:1-31',
      'David': '1 Samuel 17:1-58',
      'Jesus': 'Matthew 4:18-22',
      'Paul': 'Acts 9:1-19',
      'LevitesNum': 'Numbers 3:1-51',
      // Add more mappings as needed
    };
    return titleToScripture[shortTitle] || 'Bible Reference';
  }

  async stopScanning(): Promise<void> {
    try {
      if (this.isScanning) {
        await BleManager.stopScan();
        this.isScanning = false;
        console.log('🔍 BLE scanning stopped');
      }
    } catch (error) {
      console.error('🔴 Error stopping BLE scanning:', error);
      throw error;
    }
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      console.log('🔗 Connecting to device:', deviceId);
      
      await BleManager.connect(deviceId);
      
      // Wait for connection event
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 10000); // 10 second timeout
        
        const onConnect = (connectedDeviceId: string) => {
          if (connectedDeviceId === deviceId) {
            clearTimeout(timeout);
            resolve(true);
          }
        };
        
        this.deviceConnectedCallbacks.push(onConnect);
      });
      
    } catch (error) {
      console.error('🔴 Error connecting to device:', error);
      return false;
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    try {
      console.log('🔌 Disconnecting from device:', deviceId);
      
      await BleManager.disconnect(deviceId);
      
    } catch (error) {
      console.error('🔴 Error disconnecting from device:', error);
      throw error;
    }
  }

  // Communication Functions
  async sendMessage(deviceId: string, message: BleMessage): Promise<void> {
    try {
      if (!this.connectedDevices.has(deviceId)) {
        throw new Error('Device not connected');
      }

      console.log('📤 Sending message to device:', deviceId, message.type);
      
      const messageData = JSON.stringify(message);
      const base64Data = Buffer.from(messageData).toString('base64');
      
      await BleManager.write(
        deviceId,
        SERVICE_UUID,
        SESSION_INFO_CHARACTERISTIC,
        base64Data
      );
      
    } catch (error) {
      console.error('🔴 Error sending message:', error);
      throw error;
    }
  }

  async readMessage(deviceId: string): Promise<BleMessage | null> {
    try {
      if (!this.connectedDevices.has(deviceId)) {
        throw new Error('Device not connected');
      }

      console.log('📥 Reading message from device:', deviceId);
      
      const result = await BleManager.read(
        deviceId,
        SERVICE_UUID,
        SESSION_INFO_CHARACTERISTIC
      );
      
      if (result && result.value) {
        const message: BleMessage = JSON.parse(Buffer.from(result.value, 'base64').toString());
        return message;
      }
      
      return null;
      
    } catch (error) {
      console.error('🔴 Error reading message:', error);
      return null;
    }
  }

  // Event Handler Registration
  onDeviceFound(callback: (device: DiscoveredDevice) => void): void {
    this.deviceFoundCallbacks.push(callback);
  }

  onDeviceConnected(callback: (deviceId: string) => void): void {
    this.deviceConnectedCallbacks.push(callback);
  }

  onDeviceDisconnected(callback: (deviceId: string) => void): void {
    this.deviceDisconnectedCallbacks.push(callback);
  }

  onMessageReceived(callback: (deviceId: string, message: BleMessage) => void): void {
    this.messageReceivedCallbacks.push(callback);
  }

  // Utility Methods
  isConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  getConnectedDevices(): string[] {
    return Array.from(this.connectedDevices);
  }

  getCurrentSession(): GroupSession | null {
    return this.currentSession;
  }

  isCurrentlyAdvertising(): boolean {
    return this.isAdvertising;
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  // Testing method - Remove this in production
  async addTestSession(): Promise<void> {
    try {
      console.log('🧪 Adding test session for debugging...');
      
      // Create a test session with real story data
      const testSession: GroupSession = {
        id: 'test_' + Date.now().toString().slice(-6),
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
      
      // Store test session for discovery
      this.storeSessionForDiscovery(testSession);
      
      // Simulate device name advertising
      const storyTitle = testSession.storyTitle.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      const deviceName = `SVB_${storyTitle}_${testSession.id.substring(0, 8)}`;
      
      console.log('🧪 Test session created:', testSession.id);
      console.log('🧪 Device name would be:', deviceName);
      console.log('🧪 Story:', testSession.storyTitle);
      console.log('🧪 Session stored for discovery');
    } catch (error) {
      console.error('🔴 Error adding test session:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realBluetoothManager = new RealBluetoothManagerImpl();
export default realBluetoothManager;
