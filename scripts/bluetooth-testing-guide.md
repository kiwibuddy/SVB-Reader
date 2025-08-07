# Bluetooth Group Reading Testing Guide

## **🔧 PREREQUISITES**

### **Hardware Requirements**
- 2+ iOS devices or 2+ Android devices
- Bluetooth enabled on all devices
- Devices within 10 meters of each other

### **App Setup**
- Latest development build installed on all devices
- Bluetooth permissions granted
- Location permissions granted (Android)

## **🧪 TESTING SCENARIOS**

### **SCENARIO 1: Basic Host Setup**
1. **Start Host Session**
   - Open app on Device A
   - Navigate to any story segment
   - Tap "Group Reading" button
   - Select role (Narrator, God, Main Character, Other Voices)
   - Enter username
   - Tap "Start Broadcasting"

2. **Expected Results**
   - ✅ Host waiting screen appears
   - ✅ QR code is generated
   - ✅ Bluetooth advertising starts
   - ✅ Session ID is created

### **SCENARIO 2: Joiner Discovery**
1. **Discover Groups**
   - Open app on Device B
   - Home screen should show nearby groups
   - Or manually scan for groups

2. **Expected Results**
   - ✅ Nearby groups appear in list
   - ✅ Group details show correctly
   - ✅ Join button is available

### **SCENARIO 3: Join Session**
1. **Join Group**
   - Tap on nearby group
   - Select available role
   - Enter username
   - Tap "Join Group"

2. **Expected Results**
   - ✅ Join request sent to host
   - ✅ Host receives join notification
   - ✅ Host can accept/decline
   - ✅ Joiner joins session successfully

### **SCENARIO 4: Session Management**
1. **Active Session**
   - Both devices show active session
   - Participants list updates
   - Ready status can be toggled

2. **Expected Results**
   - ✅ All participants visible
   - ✅ Role assignments correct
   - ✅ Ready status syncs
   - ✅ Session can start reading

### **SCENARIO 5: Reading Session**
1. **Start Reading**
   - Host starts reading session
   - All participants join reading
   - Test scroll synchronization

2. **Expected Results**
   - ✅ All devices show same content
   - ✅ Scroll position syncs
   - ✅ Role highlighting works
   - ✅ Reading progress tracks

## **🐛 COMMON ISSUES & SOLUTIONS**

### **Bluetooth Not Working**
- **Issue**: Bluetooth permissions denied
- **Solution**: Check device settings, grant permissions

### **No Nearby Groups**
- **Issue**: Devices not discovering each other
- **Solution**: 
  - Ensure Bluetooth is enabled
  - Check devices are within range
  - Restart Bluetooth on both devices
  - Check app permissions

### **Join Request Fails**
- **Issue**: Cannot join existing session
- **Solution**:
  - Verify session is still active
  - Check role availability
  - Ensure devices are connected

### **Session Drops**
- **Issue**: Connection lost during session
- **Solution**:
  - Check Bluetooth signal strength
  - Verify devices haven't moved apart
  - Restart session if needed

## **📱 DEVICE-SPECIFIC TESTING**

### **iOS Testing**
- Test with iPhone 12+ (BLE 5.0)
- Test with older iPhones (BLE 4.0)
- Test background app behavior
- Test with different iOS versions

### **Android Testing**
- Test with various Android versions
- Test permission handling
- Test background scanning
- Test with different manufacturers

### **Cross-Platform Testing**
- iOS host + Android joiner
- Android host + iOS joiner
- Multiple iOS devices
- Multiple Android devices

## **🔍 DEBUGGING TOOLS**

### **Console Logs**
Monitor these logs during testing:
```
[Bluetooth] Starting broadcast...
[Bluetooth] Device discovered: [device-id]
[Bluetooth] Join request received
[Bluetooth] Session state changed
```

### **Network Inspector**
- Check Bluetooth packet transmission
- Monitor connection stability
- Verify data synchronization

### **Device Logs**
- iOS: Xcode Console
- Android: Logcat
- Check for Bluetooth errors
- Monitor permission issues

## **✅ SUCCESS CRITERIA**

### **Functional Requirements**
- [ ] Host can create session
- [ ] Joiners can discover sessions
- [ ] Join requests work properly
- [ ] Session management functions
- [ ] Reading synchronization works
- [ ] Error handling is robust

### **Performance Requirements**
- [ ] Discovery time < 5 seconds
- [ ] Join time < 3 seconds
- [ ] Sync latency < 500ms
- [ ] Battery usage reasonable
- [ ] Memory usage stable

### **User Experience**
- [ ] Intuitive UI flow
- [ ] Clear error messages
- [ ] Loading states visible
- [ ] Responsive interactions
- [ ] Accessibility supported

## **📊 TESTING CHECKLIST**

### **Pre-Test Setup**
- [ ] Devices charged >50%
- [ ] Bluetooth enabled
- [ ] Permissions granted
- [ ] App installed and updated
- [ ] Test environment prepared

### **Test Execution**
- [ ] Run all scenarios above
- [ ] Document any issues
- [ ] Test error conditions
- [ ] Verify recovery mechanisms
- [ ] Test edge cases

### **Post-Test Analysis**
- [ ] Review console logs
- [ ] Check performance metrics
- [ ] Document findings
- [ ] Create bug reports
- [ ] Plan improvements

## **🚨 EMERGENCY PROCEDURES**

### **If Bluetooth Fails Completely**
1. Restart both devices
2. Clear app data/cache
3. Reinstall app
4. Test with different devices

### **If Session Gets Stuck**
1. Force close app on all devices
2. Restart Bluetooth
3. Clear session data
4. Start fresh session

### **If Permissions Issues**
1. Check device settings
2. Reset app permissions
3. Reinstall app
4. Test on different device
