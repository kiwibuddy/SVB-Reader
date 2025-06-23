import { BleManager, Device, Characteristic, Service } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GroupSession, Participant, Role, type BluetoothSessionManager } from '@/types';

// Service and Characteristic UUIDs for our Bible reading app
const SERVICE_UUID = 'A8B3C4D5-E6F7-8901-2345-6789ABCDEF00';
const SESSION_CHAR_UUID = 'A8B3C4D5-E6F7-8901-2345-6789ABCDEF01';
const PARTICIPANT_CHAR_UUID = 'A8B3C4D5-E6F7-8901-2345-6789ABCDEF02';
const SYNC_CHAR_UUID = 'A8B3C4D5-E6F7-8901-2345-6789ABCDEF03';

interface BleMessage {
  type: 'session_info' | 'join_request' | 'participant_update' | 'scroll_sync' | 'ready_check' | 'start_reading';
  data: any;
  timestamp: number;
}

class BluetoothSessionManagerImpl implements BluetoothSessionManager {
  private bleManager: BleManager;
  private currentSession: GroupSession | null = null;
  private isHost: boolean = false;
  private currentDeviceId: string = '';
  private connectedDevices: Map<string, Device> = new Map();
  private sessionCallbacks: ((session: GroupSession) => void)[] = [];
  private scrollCallbacks: ((position: number) => void)[] = [];
  private participantJoinedCallbacks: ((participant: Participant) => void)[] = [];
  private participantLeftCallbacks: ((deviceId: string) => void)[] = [];
  private isScanning: boolean = false;
  private broadcastTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.bleManager = new BleManager();
    this.setupBleManager();
  }

  private async setupBleManager(): Promise<void> {
    try {
      await this.requestPermissions();
      
      this.bleManager.onStateChange((state: any) => {
        if (state === 'PoweredOn') {
          console.log('BLE is ready');
          this.generateDeviceId();
        } else {
          console.log('BLE state:', state);
          if (state === 'PoweredOff') {
            Alert.alert(
              'Bluetooth Required',
              'Please enable Bluetooth to use group reading features.',
              [{ text: 'OK' }]
            );
          }
        }
      }, true);

      // Handle device disconnections  
      this.bleManager.onDeviceDisconnected('', (error: any, device: Device | null) => {
        if (device) {
          console.log('Device disconnected:', device.name);
          this.handleDeviceDisconnection(device.id);
        }
      });

    } catch (error) {
      console.error('Error setting up BLE manager:', error);
    }
  }

  private async generateDeviceId(): Promise<void> {
    try {
      const savedId = await AsyncStorage.getItem('deviceId');
      if (savedId) {
        this.currentDeviceId = savedId;
      } else {
        this.currentDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('deviceId', this.currentDeviceId);
      }
    } catch (error) {
      this.currentDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  // Host Functions
  async startBroadcasting(
    storyId: string,
    storyTitle: string,
    scriptureRef: string,
    hostRole: Role,
    hostUserName: string,
    planId?: string,
    challengeId?: string
  ): Promise<string> {
    try {
      await this.stopBroadcasting(); // Stop any existing session

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deviceName = await this.getDeviceName();

      this.currentSession = {
        id: sessionId,
        storyId,
        storyTitle,
        scriptureReference: scriptureRef,
        hostDeviceId: this.currentDeviceId,
        hostUserName,
        participants: [{
          deviceId: this.currentDeviceId,
          deviceName,
          userName: hostUserName,
          role: hostRole,
          isReady: true,
          isConnected: true
        }],
        status: 'forming',
        createdAt: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
        planId,
        challengeId
      };

      this.isHost = true;

      // Start advertising
      await this.bleManager.startDeviceScan(null, null, () => {}); // Required for some Android devices
      await this.bleManager.stopDeviceScan();

      // Setup service and start advertising
      // Note: Full BLE peripheral mode implementation would go here
      // For now, we'll use device scanning and custom service data
      
      this.notifySessionChange();
      this.startSessionTimer();

      return sessionId;
    } catch (error) {
      console.error('Error starting broadcast:', error);
      throw error;
    }
  }

  async stopBroadcasting(): Promise<void> {
    try {
      if (this.broadcastTimer) {
        clearTimeout(this.broadcastTimer);
        this.broadcastTimer = null;
      }

      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      await this.bleManager.stopDeviceScan();
      
      // Disconnect all connected devices
      for (const device of this.connectedDevices.values()) {
        try {
          await device.cancelConnection();
        } catch (error) {
          console.log('Error disconnecting device:', error);
        }
      }
      
      this.connectedDevices.clear();
      
      if (this.currentSession) {
        this.currentSession.status = 'ended';
        this.notifySessionChange();
      }

      this.currentSession = null;
      this.isHost = false;
    } catch (error) {
      console.error('Error stopping broadcast:', error);
    }
  }

  async acceptJoiner(deviceId: string, userName: string, requestedRole: Role): Promise<boolean> {
    if (!this.currentSession || !this.isHost) {
      return false;
    }

    // Check if role is already taken
    const roleAlreadyTaken = this.currentSession.participants.some(p => p.role === requestedRole);
    if (roleAlreadyTaken) {
      return false;
    }

    // Check if we have space (max 4 participants)
    if (this.currentSession.participants.length >= 4) {
      return false;
    }

    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      return false;
    }

    const newParticipant: Participant = {
      deviceId,
      deviceName: device.name || 'Unknown Device',
      userName,
      role: requestedRole,
      isReady: false,
      isConnected: true
    };

    this.currentSession.participants.push(newParticipant);
    this.notifySessionChange();
    this.notifyParticipantJoined(newParticipant);

    return true;
  }

  async syncScrollPosition(position: number): Promise<void> {
    if (!this.currentSession) return;

    const message: BleMessage = {
      type: 'scroll_sync',
      data: { position },
      timestamp: Date.now()
    };

    // Send to all connected devices
    for (const device of this.connectedDevices.values()) {
      try {
        await this.sendMessage(device, message);
      } catch (error) {
        console.log('Error syncing scroll to device:', error);
      }
    }
  }

  // Joiner Functions
  async discoverNearbyGroups(): Promise<GroupSession[]> {
    if (this.isScanning) {
      return [];
    }

    this.isScanning = true;
    const foundSessions: GroupSession[] = [];

    try {
      await this.bleManager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: false },
        async (error: any, device: any) => {
          if (error) {
            console.log('Scan error:', error);
            return;
          }

          if (device && device.serviceData && device.serviceData[SERVICE_UUID]) {
            try {
              const sessionData = JSON.parse(device.serviceData[SERVICE_UUID]);
              const session: GroupSession = {
                ...sessionData,
                hostDeviceId: device.id
              };
              
              // Check if session is still valid
              if (session.expiresAt > Date.now() && session.status === 'forming') {
                foundSessions.push(session);
              }
            } catch (error) {
              console.log('Error parsing session data:', error);
            }
          }
        }
      );

      // Scan for 3 seconds
      setTimeout(() => {
        this.bleManager.stopDeviceScan();
        this.isScanning = false;
      }, 3000);

      return foundSessions;
    } catch (error) {
      console.error('Error discovering groups:', error);
      this.isScanning = false;
      return [];
    }
  }

  async requestToJoin(sessionId: string, role: Role, userName: string): Promise<boolean> {
    try {
      // Find the session device
      const sessions = await this.discoverNearbyGroups();
      const targetSession = sessions.find(s => s.id === sessionId);
      
      if (!targetSession) {
        return false;
      }

      // Connect to host device
      const device = await this.bleManager.connectToDevice(targetSession.hostDeviceId);
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevices.set(device.id, device);

      // Send join request
      const message: BleMessage = {
        type: 'join_request',
        data: { role, userName, sessionId },
        timestamp: Date.now()
      };

      await this.sendMessage(device, message);
      return true;
    } catch (error) {
      console.error('Error requesting to join:', error);
      return false;
    }
  }

  async leaveGroup(): Promise<void> {
    try {
      if (this.currentSession && !this.isHost) {
        // Notify host that we're leaving
        const message: BleMessage = {
          type: 'participant_update',
          data: { action: 'leave' },
          timestamp: Date.now()
        };

        for (const device of this.connectedDevices.values()) {
          try {
            await this.sendMessage(device, message);
            await device.cancelConnection();
          } catch (error) {
            console.log('Error leaving group:', error);
          }
        }
      }

      this.connectedDevices.clear();
      this.currentSession = null;
      this.isHost = false;
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  }

  // Shared Functions
  onGroupStateChange(callback: (session: GroupSession) => void): void {
    this.sessionCallbacks.push(callback);
  }

  onScrollSync(callback: (position: number) => void): void {
    this.scrollCallbacks.push(callback);
  }

  onParticipantJoined(callback: (participant: Participant) => void): void {
    this.participantJoinedCallbacks.push(callback);
  }

  onParticipantLeft(callback: (deviceId: string) => void): void {
    this.participantLeftCallbacks.push(callback);
  }

  handleDisconnection(): void {
    // Implement reconnection logic
    console.log('Handling disconnection...');
  }

  getCurrentSession(): GroupSession | null {
    return this.currentSession;
  }

  isCurrentHost(): boolean {
    return this.isHost;
  }

  getCurrentRole(): Role | null {
    if (!this.currentSession) return null;
    
    const currentDevice = this.currentSession.participants.find(
      p => p.deviceId === this.currentDeviceId
    );
    
    return currentDevice?.role || null;
  }

  // Private Helper Methods
  private async getDeviceName(): Promise<string> {
    try {
      const savedName = await AsyncStorage.getItem('deviceName');
      if (savedName) return savedName;
      
      // Use system device name or fallback
      return Platform.OS === 'ios' ? 'iPhone' : 'Android Device';
    } catch (error) {
      return 'Unknown Device';
    }
  }

  private async sendMessage(device: Device, message: BleMessage): Promise<void> {
    try {
      const data = JSON.stringify(message);
      const base64Data = Buffer.from(data).toString('base64');
      
      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        SESSION_CHAR_UUID,
        base64Data
      );
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  private notifySessionChange(): void {
    if (this.currentSession) {
      this.sessionCallbacks.forEach(callback => callback(this.currentSession!));
    }
  }

  private notifyParticipantJoined(participant: Participant): void {
    this.participantJoinedCallbacks.forEach(callback => callback(participant));
  }

  private notifyParticipantLeft(deviceId: string): void {
    this.participantLeftCallbacks.forEach(callback => callback(deviceId));
  }

  private handleDeviceDisconnection(deviceId: string): void {
    this.connectedDevices.delete(deviceId);
    
    if (this.currentSession) {
      this.currentSession.participants = this.currentSession.participants.filter(
        p => p.deviceId !== deviceId
      );
      this.notifySessionChange();
      this.notifyParticipantLeft(deviceId);
    }
  }

  private startSessionTimer(): void {
    // 5-minute timeout for session formation
    this.sessionTimer = setTimeout(() => {
      if (this.currentSession && this.currentSession.status === 'forming') {
        Alert.alert(
          'Session Timeout',
          'Would you like to continue waiting for more readers to join?',
          [
            {
              text: 'End Session',
              onPress: () => this.stopBroadcasting(),
              style: 'destructive'
            },
            {
              text: 'Continue Waiting',
              onPress: () => {
                if (this.currentSession) {
                  this.currentSession.expiresAt = Date.now() + (5 * 60 * 1000);
                  this.startSessionTimer();
                }
              }
            }
          ]
        );
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

// Export singleton instance
export const bluetoothSessionManager = new BluetoothSessionManagerImpl(); 