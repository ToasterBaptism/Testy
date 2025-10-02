package com.fortniteassist.modules

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import timber.log.Timber

/**
 * React Native module for permissions management
 */
class PermissionsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PermissionsModule"

    @ReactMethod
    fun checkPermission(permission: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val granted = ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
            promise.resolve(granted)
        } catch (e: Exception) {
            Timber.e(e, "Failed to check permission: $permission")
            promise.reject("CHECK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun checkMediaProjectionPermission(promise: Promise) {
        try {
            // Media projection permission is handled differently
            // This would need to be checked through MediaProjectionManager
            promise.resolve(false) // Placeholder
        } catch (e: Exception) {
            Timber.e(e, "Failed to check media projection permission")
            promise.reject("CHECK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestPermissions(permissions: ReadableArray, promise: Promise) {
        try {
            val permissionsList = mutableListOf<String>()
            for (i in 0 until permissions.size()) {
                permissions.getString(i)?.let { permissionsList.add(it) }
            }
            
            // This would typically trigger a permission request dialog
            // For now, just return the current status
            val results = WritableNativeMap()
            for (permission in permissionsList) {
                val granted = ContextCompat.checkSelfPermission(
                    reactApplicationContext, 
                    permission
                ) == PackageManager.PERMISSION_GRANTED
                results.putBoolean(permission, granted)
            }
            
            promise.resolve(results)
        } catch (e: Exception) {
            Timber.e(e, "Failed to request permissions")
            promise.reject("REQUEST_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getRequiredPermissions(promise: Promise) {
        try {
            val permissions = WritableNativeArray()
            permissions.pushString(Manifest.permission.RECORD_AUDIO)
            permissions.pushString(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            permissions.pushString(Manifest.permission.READ_EXTERNAL_STORAGE)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permissions.pushString(Manifest.permission.POST_NOTIFICATIONS)
            }
            
            promise.resolve(permissions)
        } catch (e: Exception) {
            Timber.e(e, "Failed to get required permissions")
            promise.reject("GET_ERROR", e.message)
        }
    }
}