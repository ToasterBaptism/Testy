package com.fortniteassist.modules

import android.content.SharedPreferences
import com.facebook.react.bridge.*
import timber.log.Timber

/**
 * React Native module for settings management
 */
class SettingsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences by lazy {
        reactApplicationContext.getSharedPreferences("FortniteAssistSettings", 0)
    }

    override fun getName(): String = "SettingsModule"

    @ReactMethod
    fun getSetting(key: String, promise: Promise) {
        try {
            val value = prefs.getString(key, null)
            promise.resolve(value)
        } catch (e: Exception) {
            Timber.e(e, "Failed to get setting: $key")
            promise.reject("GET_ERROR", e.message)
        }
    }

    @ReactMethod
    fun setSetting(key: String, value: String, promise: Promise) {
        try {
            prefs.edit().putString(key, value).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            Timber.e(e, "Failed to set setting: $key")
            promise.reject("SET_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getAllSettings(promise: Promise) {
        try {
            val allSettings = prefs.all
            val settingsMap = WritableNativeMap()
            
            for ((key, value) in allSettings) {
                when (value) {
                    is String -> settingsMap.putString(key, value)
                    is Boolean -> settingsMap.putBoolean(key, value)
                    is Int -> settingsMap.putInt(key, value)
                    is Float -> settingsMap.putDouble(key, value.toDouble())
                    is Double -> settingsMap.putDouble(key, value)
                }
            }
            
            promise.resolve(settingsMap)
        } catch (e: Exception) {
            Timber.e(e, "Failed to get all settings")
            promise.reject("GET_ALL_ERROR", e.message)
        }
    }

    @ReactMethod
    fun clearAllSettings(promise: Promise) {
        try {
            prefs.edit().clear().apply()
            promise.resolve(true)
        } catch (e: Exception) {
            Timber.e(e, "Failed to clear settings")
            promise.reject("CLEAR_ERROR", e.message)
        }
    }
}