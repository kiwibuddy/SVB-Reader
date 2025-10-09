# 📱 Install Development Build on iPhone

## Quick Steps

### 1️⃣ Wait for Build to Complete (~15-30 minutes)

Check if your build is ready:
```bash
eas build:list --platform ios --limit 1 --non-interactive
```

Look for: **Status: finished** ✅

---

### 2️⃣ Get Install Link + QR Code

Run this script to get your install link and QR code:

```bash
./get-install-link.sh
```

Or manually:
```bash
cd /Users/nathanielb/Documents/GitHub/sourceview-together
eas build:list --platform ios --limit 1 --non-interactive
```

Copy the **build ID** and visit:
```
https://expo.dev/accounts/kiwibuddy/projects/SVB-Youth/builds/[BUILD_ID]
```

---

### 3️⃣ Install on Your iPhone

**Option A: Scan QR Code** (from `get-install-link.sh` output)
- Open iPhone Camera app
- Point at QR code
- Tap notification to open in Safari
- Tap "Install"

**Option B: Direct Link**
- AirDrop the link to your iPhone
- Or email it to yourself
- Open on iPhone
- Tap "Install"

**Option C: Via Xcode** (if device is connected)
- Download the `.ipa` file from the build page
- Connect iPhone via USB
- Open Xcode → Window → Devices and Simulators
- Drag `.ipa` onto your device

---

### 4️⃣ Run Your App

After installation, you have **two ways** to use it:

#### **A) Standalone Mode** (just test the app)
- Tap the app icon on your iPhone
- App runs with current code
- No dev server needed

#### **B) Development Mode** (connect to live reload)
- Start dev server on your Mac:
  ```bash
  npx expo start --dev-client
  ```
- Scan the QR code that appears
- App connects and live-reloads as you code! 🔥

---

## 🎯 Development Workflow

### Daily Development:

1. **Start dev server:**
   ```bash
   cd /Users/nathanielb/Documents/GitHub/sourceview-together
   npx expo start --dev-client
   ```

2. **Scan QR code** with your iPhone camera

3. **Code changes auto-reload** in your app! 🚀

### When to Rebuild:

Only rebuild when:
- ✅ Adding new native modules (e.g., expo-clipboard)
- ✅ Changing native configuration (app.json, AndroidManifest.xml)
- ✅ Updating Expo SDK

You **don't need to rebuild** for:
- ❌ JavaScript/TypeScript changes
- ❌ UI changes
- ❌ API changes
- ❌ Database schema changes (migrations run automatically)

---

## 🔧 Troubleshooting

### "Unable to Download App"
- Make sure your device UDID is registered
- Register device: `eas device:create`
- Rebuild after registering

### "Untrusted Enterprise Developer"
- Go to: Settings → General → VPN & Device Management
- Tap your developer profile
- Tap "Trust"

### "Cannot connect to Metro bundler"
- Make sure iPhone and Mac are on **same WiFi**
- Check firewall settings
- Try running: `npx expo start --dev-client --tunnel`

### Build Failed
- View logs: `eas build:view [BUILD_ID] --logs`
- Rebuild with clean cache: `eas build --profile development --platform ios --clear-cache`

---

## 📊 Check Build Status Anytime

```bash
# Terminal
eas build:list --platform ios --non-interactive

# Web Dashboard
open https://expo.dev/accounts/kiwibuddy/projects/SVB-Youth/builds
```

---

## 🎉 You're All Set!

Once your build completes:
1. Run `./get-install-link.sh`
2. Scan QR code or open link on iPhone
3. Install the app
4. Run `npx expo start --dev-client`
5. Start coding! 🚀

