#!/bin/bash

# Test script to verify APK structure and contents
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

echo "=== APK Testing Script ==="
echo "Testing APK: $APK_PATH"
echo

# Check if APK exists
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK not found at $APK_PATH"
    exit 1
fi

echo "✅ APK exists"
echo "📦 APK size: $(du -h "$APK_PATH" | cut -f1)"
echo

# Check APK contents using unzip
echo "=== APK Contents ==="
echo "📋 Checking APK structure..."

# Check for JavaScript bundle
if unzip -l "$APK_PATH" | grep -q "assets/index.android.bundle"; then
    echo "✅ JavaScript bundle found in APK"
    BUNDLE_SIZE=$(unzip -l "$APK_PATH" | grep "assets/index.android.bundle" | awk '{print $1}')
    echo "   Bundle size: $BUNDLE_SIZE bytes"
else
    echo "❌ JavaScript bundle NOT found in APK"
fi

# Check for React Native libraries
if unzip -l "$APK_PATH" | grep -q "lib.*libreactnativejni.so"; then
    echo "✅ React Native native libraries found"
else
    echo "❌ React Native native libraries NOT found"
fi

# Check for main activity
if unzip -l "$APK_PATH" | grep -q "AndroidManifest.xml"; then
    echo "✅ AndroidManifest.xml found"
else
    echo "❌ AndroidManifest.xml NOT found"
fi

# Check for resources
if unzip -l "$APK_PATH" | grep -q "res/"; then
    echo "✅ Android resources found"
else
    echo "❌ Android resources NOT found"
fi

echo
echo "=== APK Analysis Complete ==="
echo "📱 APK should be ready for installation and testing"
echo "🚀 To install: adb install $APK_PATH"
echo