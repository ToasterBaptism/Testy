# ADB Debug Commands for FortniteAssist APK

## 1. Install and Monitor Installation
```bash
# Install the APK with verbose output
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Install with test flag (allows debugging)
adb install -r -t android/app/build/outputs/apk/debug/app-debug.apk

# Check if app is installed
adb shell pm list packages | grep com.fortniteassist
```

## 2. Real-time Log Monitoring
```bash
# Monitor all logs for FortniteAssist
adb logcat | grep -i fortnite

# Monitor React Native logs specifically
adb logcat | grep -E "(ReactNative|RN|Metro|JS)"

# Monitor system errors and crashes
adb logcat | grep -E "(FATAL|ERROR|AndroidRuntime)"

# Monitor specific tags
adb logcat -s ReactNativeJS:V ReactNative:V System.err:V

# Clear logs and start fresh monitoring
adb logcat -c && adb logcat | grep -i fortnite
```

## 3. App Launch and Activity Monitoring
```bash
# Launch the app
adb shell am start -n com.fortniteassist/.MainActivity

# Launch with debugging enabled
adb shell am start -D -n com.fortniteassist/.MainActivity

# Check current activity
adb shell dumpsys activity activities | grep -i fortnite

# Check if app is running
adb shell ps | grep fortnite
```

## 4. Permission and Service Debugging
```bash
# Check app permissions
adb shell dumpsys package com.fortniteassist | grep permission

# Check accessibility services
adb shell settings get secure enabled_accessibility_services

# Check if our accessibility service is enabled
adb shell settings get secure enabled_accessibility_services | grep fortnite
```

## 5. File System and APK Validation
```bash
# Check APK installation path
adb shell pm path com.fortniteassist

# Verify APK signature
adb shell pm dump com.fortniteassist | grep -A 5 -B 5 signature

# Check app data directory
adb shell ls -la /data/data/com.fortniteassist/

# Check if JavaScript bundle exists
adb shell ls -la /data/app/*/com.fortniteassist*/base.apk
```

## 6. Memory and Performance Monitoring
```bash
# Monitor memory usage
adb shell dumpsys meminfo com.fortniteassist

# Monitor CPU usage
adb shell top | grep fortnite

# Check battery usage
adb shell dumpsys batterystats | grep fortnite
```

## 7. Network and Connectivity
```bash
# Monitor network activity
adb shell netstat | grep fortnite

# Check network permissions
adb shell dumpsys package com.fortniteassist | grep -i network
```

## 8. Crash Analysis
```bash
# Check for tombstones (native crashes)
adb shell ls /data/tombstones/

# Get detailed crash info
adb shell dumpsys dropbox --print | grep -i fortnite

# Check ANR (Application Not Responding) logs
adb shell ls /data/anr/
```

## 9. React Native Specific Debugging
```bash
# Enable React Native debugging
adb shell input keyevent 82  # Opens dev menu in debug builds

# Check Metro bundler connection
adb logcat | grep -i metro

# Monitor JavaScript errors
adb logcat | grep -E "(JS ERROR|RedBox|YellowBox)"
```

## 10. Quick Error Detection Script
```bash
# Run this to get a comprehensive error overview
adb logcat -c  # Clear logs
adb shell am start -n com.fortniteassist/.MainActivity  # Launch app
sleep 5  # Wait for app to start
adb logcat -d | grep -E "(FATAL|ERROR|CRASH|Exception|ReactNative)" | tail -20
```

## Common Error Patterns to Look For:

1. **Installation Errors**: `INSTALL_FAILED_*`
2. **Permission Errors**: `SecurityException`, `Permission denied`
3. **React Native Errors**: `Unable to load script`, `Metro connection failed`
4. **Native Module Errors**: `No implementation found`, `Method not found`
5. **Accessibility Errors**: `AccessibilityService not enabled`
6. **Memory Errors**: `OutOfMemoryError`, `Native heap`
7. **File System Errors**: `FileNotFoundException`, `Permission denied`

## Usage Example:
```bash
# Terminal 1: Start log monitoring
adb logcat -c && adb logcat | grep -E "(FortniteAssist|ReactNative|ERROR|FATAL)"

# Terminal 2: Install and launch
adb install -r -t android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.fortniteassist/.MainActivity
```