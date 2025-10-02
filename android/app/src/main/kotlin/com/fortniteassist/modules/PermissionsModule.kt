package com.fortniteassist.modules

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import timber.log.Timber

/**
 * React Native module for permissions management
 */
class PermissionsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), PermissionListener {

    companion object {
        private const val REQUEST_CODE_PERMISSIONS = 1001
        private const val REQUEST_CODE_OVERLAY = 1002
        private const val REQUEST_CODE_ACCESSIBILITY = 1003
    }

    private var permissionPromise: Promise? = null

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
            
            val activity = currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available")
                return
            }
            
            // Check which permissions are not granted
            val permissionsToRequest = permissionsList.filter { permission ->
                ContextCompat.checkSelfPermission(reactApplicationContext, permission) != PackageManager.PERMISSION_GRANTED
            }
            
            if (permissionsToRequest.isEmpty()) {
                // All permissions already granted
                val results = WritableNativeMap()
                for (permission in permissionsList) {
                    results.putBoolean(permission, true)
                }
                promise.resolve(results)
                return
            }
            
            // Store promise for callback
            permissionPromise = promise
            
            // Request permissions
            if (activity is PermissionAwareActivity) {
                activity.requestPermissions(
                    permissionsToRequest.toTypedArray(),
                    REQUEST_CODE_PERMISSIONS,
                    this
                )
            } else {
                ActivityCompat.requestPermissions(
                    activity,
                    permissionsToRequest.toTypedArray(),
                    REQUEST_CODE_PERMISSIONS
                )
            }
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to request permissions")
            promise.reject("REQUEST_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (Settings.canDrawOverlays(reactApplicationContext)) {
                    promise.resolve(true)
                    return
                }
                
                val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                    data = Uri.parse("package:${reactApplicationContext.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                
                reactApplicationContext.startActivity(intent)
                promise.resolve(false) // User needs to manually grant
            } else {
                promise.resolve(true) // Not needed on older versions
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to request overlay permission")
            promise.reject("OVERLAY_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun requestAccessibilityPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            reactApplicationContext.startActivity(intent)
            promise.resolve(false) // User needs to manually grant
        } catch (e: Exception) {
            Timber.e(e, "Failed to request accessibility permission")
            promise.reject("ACCESSIBILITY_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestNotificationPermission(promise: Promise) {
        try {
            Timber.d("Requesting notification permission, Android version: ${Build.VERSION.SDK_INT}")
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // Android 13+ requires runtime permission request
                val activity = currentActivity
                if (activity == null) {
                    Timber.e("No current activity available for notification permission")
                    promise.reject("NO_ACTIVITY", "No current activity available")
                    return
                }
                
                val permission = Manifest.permission.POST_NOTIFICATIONS
                val currentStatus = ContextCompat.checkSelfPermission(reactApplicationContext, permission)
                Timber.d("Current notification permission status: $currentStatus")
                
                if (currentStatus == PackageManager.PERMISSION_GRANTED) {
                    Timber.d("Notification permission already granted")
                    promise.resolve(true)
                    return
                }
                
                // Store promise for callback
                permissionPromise = promise
                
                Timber.d("Requesting notification permission via system dialog")
                
                // Request notification permission
                if (activity is PermissionAwareActivity) {
                    activity.requestPermissions(
                        arrayOf(permission),
                        REQUEST_CODE_PERMISSIONS,
                        this
                    )
                } else {
                    ActivityCompat.requestPermissions(
                        activity,
                        arrayOf(permission),
                        REQUEST_CODE_PERMISSIONS
                    )
                }
            } else {
                // Pre-Android 13, notifications are granted by default
                Timber.d("Pre-Android 13, notification permission granted by default")
                promise.resolve(true)
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to request notification permission")
            promise.reject("NOTIFICATION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getRequiredPermissions(promise: Promise) {
        try {
            val permissions = WritableNativeArray()
            permissions.pushString(Manifest.permission.RECORD_AUDIO)
            
            // Use appropriate storage permissions based on Android version
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // Android 13+ uses granular media permissions
                permissions.pushString(Manifest.permission.READ_MEDIA_IMAGES)
                permissions.pushString(Manifest.permission.READ_MEDIA_VIDEO)
                permissions.pushString(Manifest.permission.READ_MEDIA_AUDIO)
                permissions.pushString(Manifest.permission.POST_NOTIFICATIONS)
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // Android 11-12 uses scoped storage
                permissions.pushString(Manifest.permission.READ_EXTERNAL_STORAGE)
            } else {
                // Android 10 and below
                permissions.pushString(Manifest.permission.READ_EXTERNAL_STORAGE)
                permissions.pushString(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
            
            promise.resolve(permissions)
        } catch (e: Exception) {
            Timber.e(e, "Failed to get required permissions")
            promise.reject("GET_ERROR", e.message)
        }
    }
    
    // PermissionListener implementation
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ): Boolean {
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            val promise = permissionPromise
            if (promise != null) {
                try {
                    val results = WritableNativeMap()
                    for (i in permissions.indices) {
                        val granted = grantResults[i] == PackageManager.PERMISSION_GRANTED
                        results.putBoolean(permissions[i], granted)
                    }
                    promise.resolve(results)
                } catch (e: Exception) {
                    promise.reject("CALLBACK_ERROR", e.message)
                }
                permissionPromise = null
            }
            return true
        }
        return false
    }
}