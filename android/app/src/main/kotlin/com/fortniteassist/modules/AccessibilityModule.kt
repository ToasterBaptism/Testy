package com.fortniteassist.modules

import android.content.Context
import android.provider.Settings
import com.facebook.react.bridge.*
import timber.log.Timber

/**
 * React Native module for accessibility service management
 */
class AccessibilityModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AccessibilityModule"

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val accessibilityEnabled = Settings.Secure.getInt(
                context.contentResolver,
                Settings.Secure.ACCESSIBILITY_ENABLED,
                0
            ) == 1

            if (accessibilityEnabled) {
                val services = Settings.Secure.getString(
                    context.contentResolver,
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                )
                val isOurServiceEnabled = services?.contains("com.fortniteassist/.accessibility.FortniteAssistAccessibilityService") == true
                promise.resolve(isOurServiceEnabled)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to check accessibility service status")
            promise.reject("CHECK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        // Alias for backward compatibility
        isAccessibilityServiceEnabled(promise)
    }

    @ReactMethod
    fun requestAccessibilityPermission(promise: Promise) {
        try {
            val intent = android.content.Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            Timber.e(e, "Failed to open accessibility settings")
            promise.reject("PERMISSION_ERROR", e.message)
        }
    }
}