# BLE Migration Guide: From react-native-ble-plx to react-native-ble-manager

## Overview

This guide documents the migration from `react-native-ble-plx` to `react-native-ble-manager` to enable **real BLE communication** with both Central and Peripheral modes.

## Why This Migration?

### Problems with react-native-ble-plx:
- ❌ **No Peripheral Mode Support**: Cannot advertise services
- ❌ **Device-Specific Storage**: AsyncStorage simulation doesn't work across devices
- ❌ **No Real Cross-Device Communication**: Limited to same-device simulation

### Benefits of react-native-ble-manager:
- ✅ **Full BLE Support**: Both Central AND Peripheral modes
- ✅ **Real Cross-Device Communication**: True BLE advertising and scanning
- ✅ **Active Development**: Regular updates and community support
- ✅ **Better Performance**: Native BLE implementation

## Migration Steps

### Step 1: Install New Library
```bash
npm install react-native-ble-manager
```

### Step 2: Update App Configuration
```json
// app.json
{
  "plugins": [
    [
      "react-native-ble-manager",
      {
        "isBackgroundEnabled": true,
        "modes": ["peripheral", "central"],
        "bluetoothAlwaysPermission": "This app uses Bluetooth to connect with nearby readers for group Bible reading sessions."
      }
    ]
  ]
}
```

### Step 3: Update Permissions
```json
// app.json - Android permissions
"permissions": [
  "android.permission.BLUETOOTH",
  "android.permission.BLUETOOTH_ADMIN",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.BLUETOOTH_SCAN",
  "android.permission.BLUETOOTH_ADVERTISE",
  "android.permission.BLUETOOTH_CONNECT"
]
```

### Step 4: API Changes

#### Old (react-native-ble-plx):
```javascript
import { BleManager } from 'react-native-ble-plx';

const bleManager = new BleManager();
await bleManager.startDeviceScan(null, null, (error, device) => {
  // Scan callback
});
```

#### New (react-native-ble-manager):
```javascript
import BleManager from 'react-native-ble-manager';

BleManager.start({ showAlert: false });
await BleManager.scan([SERVICE_UUID], 10, true);
```

### Step 5: Event Handling Changes

#### Old (react-native-ble-plx):
```javascript
bleManager.onStateChange((state) => {
  console.log('BLE state:', state);
}, true);
```

#### New (react-native-ble-manager):
```javascript
BleManager.addListener('BleManagerDiscoverPeripheral', (device) => {
  console.log('Device found:', device);
});
```

## Implementation Status

### ✅ Completed:
- [x] New BLE manager implementation (`RealBluetoothManager.ts`)
- [x] Service and characteristic UUIDs defined
- [x] Peripheral mode advertising
- [x] Central mode scanning
- [x] Device connection management
- [x] Message sending/receiving
- [x] Event handling

### 🔄 In Progress:
- [ ] Integration with existing GroupReadingContext
- [ ] Migration of existing components
- [ ] Testing on real devices

### ❌ Not Started:
- [ ] Remove old react-native-ble-plx code
- [ ] Remove AsyncStorage simulation
- [ ] End-to-end testing
- [ ] Performance optimization

## Testing Checklist

### Host Device (Peripheral Mode):
- [ ] Initialize BLE manager
- [ ] Start advertising session
- [ ] Verify service is discoverable
- [ ] Accept joiner connections
- [ ] Send/receive messages

### Joiner Device (Central Mode):
- [ ] Initialize BLE manager
- [ ] Scan for nearby sessions
- [ ] Discover host device
- [ ] Connect to host
- [ ] Send join request
- [ ] Receive session updates

### Cross-Device Communication:
- [ ] Host advertises session
- [ ] Joiner discovers session
- [ ] Joiner connects to host
- [ ] Real-time message exchange
- [ ] Session synchronization

## Troubleshooting

### Common Issues:

1. **Permission Denied**
   - Ensure all Bluetooth permissions are granted
   - Check Android manifest for correct permissions

2. **Device Not Found**
   - Verify both devices have Bluetooth enabled
   - Check service UUID matches
   - Ensure devices are within range

3. **Connection Failed**
   - Check if device is already connected
   - Verify device is advertising
   - Check for interference

4. **Message Not Received**
   - Verify characteristic UUID matches
   - Check message format
   - Ensure devices are connected

## Next Steps

1. **Complete Integration**: Update GroupReadingContext to use new BLE manager
2. **Remove Old Code**: Clean up react-native-ble-plx dependencies
3. **Testing**: Test on multiple devices
4. **Optimization**: Improve performance and reliability
5. **Documentation**: Update user documentation

## Resources

- [react-native-ble-manager Documentation](https://innoveit.github.io/react-native-ble-manager/)
- [BLE Best Practices](https://developer.android.com/guide/topics/connectivity/bluetooth-le)
- [iOS BLE Guidelines](https://developer.apple.com/design/human-interface-guidelines/bluetooth)
