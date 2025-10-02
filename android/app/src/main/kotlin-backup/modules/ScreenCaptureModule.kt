package com.fortniteassist.modules

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.fortniteassist.capture.ScreenCaptureService
import kotlinx.coroutines.*
import timber.log.Timber

/**
 * React Native module for screen capture functionality
 * Provides bridge between React Native UI and native screen capture service
 */
class ScreenCaptureModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var screenCaptureService: ScreenCaptureService? = null
    private var mediaProjectionManager: MediaProjectionManager? = null
    
    companion object {
        private const val MODULE_NAME = "ScreenCaptureModule"
        private const val REQUEST_SCREEN_CAPTURE = 1001
        
        // Event names
        private const val EVENT_CAPTURE_STARTED = "onCaptureStarted"
        private const val EVENT_CAPTURE_STOPPED = "onCaptureStopped"
        private const val EVENT_CAPTURE_ERROR = "onCaptureError"
        private const val EVENT_FRAME_AVAILABLE = "onFrameAvailable"
    }

    override fun getName(): String = MODULE_NAME

    override fun initialize() {
        super.initialize()
        mediaProjectionManager = reactApplicationContext
            .getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        
        screenCaptureService = ScreenCaptureService(reactApplicationContext)
        Timber.d("ScreenCaptureModule initialized")
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        moduleScope.cancel()
        screenCaptureService?.cleanup()
        Timber.d("ScreenCaptureModule destroyed")
    }

    /**
     * Request screen capture permission from user
     */
    @ReactMethod
    fun requestScreenCapturePermission(promise: Promise) {
        try {
            val currentActivity = currentActivity
            if (currentActivity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available")
                return
            }

            val captureIntent = mediaProjectionManager?.createScreenCaptureIntent()
            if (captureIntent == null) {
                promise.reject("NO_INTENT", "Failed to create screen capture intent")
                return
            }

            // Store promise for later resolution
            screenCapturePermissionPromise = promise
            
            currentActivity.startActivityForResult(captureIntent, REQUEST_SCREEN_CAPTURE)
            Timber.d("Screen capture permission requested")
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to request screen capture permission")
            promise.reject("REQUEST_FAILED", e.message, e)
        }
    }

    /**
     * Start screen capture
     */
    @ReactMethod
    fun startCapture(promise: Promise) {
        moduleScope.launch {
            try {
                val service = screenCaptureService
                if (service == null) {
                    promise.reject("SERVICE_NULL", "Screen capture service not initialized")
                    return@launch
                }

                val result = service.startCapture()
                if (result.isSuccess) {
                    promise.resolve(true)
                    sendEvent(EVENT_CAPTURE_STARTED, null)
                    Timber.i("Screen capture started successfully")
                } else {
                    val error = result.exceptionOrNull()
                    promise.reject("START_FAILED", error?.message ?: "Unknown error", error)
                    Timber.e(error, "Failed to start screen capture")
                }
            } catch (e: Exception) {
                Timber.e(e, "Exception in startCapture")
                promise.reject("EXCEPTION", e.message, e)
            }
        }
    }

    /**
     * Stop screen capture
     */
    @ReactMethod
    fun stopCapture(promise: Promise) {
        moduleScope.launch {
            try {
                val service = screenCaptureService
                if (service == null) {
                    promise.reject("SERVICE_NULL", "Screen capture service not initialized")
                    return@launch
                }

                val result = service.stopCapture()
                if (result.isSuccess) {
                    promise.resolve(true)
                    sendEvent(EVENT_CAPTURE_STOPPED, null)
                    Timber.i("Screen capture stopped successfully")
                } else {
                    val error = result.exceptionOrNull()
                    promise.reject("STOP_FAILED", error?.message ?: "Unknown error", error)
                    Timber.e(error, "Failed to stop screen capture")
                }
            } catch (e: Exception) {
                Timber.e(e, "Exception in stopCapture")
                promise.reject("EXCEPTION", e.message, e)
            }
        }
    }

    /**
     * Check if screen capture is currently active
     */
    @ReactMethod
    fun isCapturing(promise: Promise) {
        try {
            val isCapturing = screenCaptureService?.isCapturing() ?: false
            promise.resolve(isCapturing)
        } catch (e: Exception) {
            Timber.e(e, "Exception in isCapturing")
            promise.reject("EXCEPTION", e.message, e)
        }
    }

    /**
     * Get current capture statistics
     */
    @ReactMethod
    fun getCaptureStats(promise: Promise) {
        try {
            val service = screenCaptureService
            if (service == null) {
                promise.reject("SERVICE_NULL", "Screen capture service not initialized")
                return
            }

            val stats = service.getCaptureStatistics()
            val statsMap = Arguments.createMap().apply {
                putDouble("fps", stats.fps)
                putInt("frameCount", stats.frameCount)
                putDouble("averageLatency", stats.averageLatency)
                putInt("droppedFrames", stats.droppedFrames)
                putDouble("memoryUsage", stats.memoryUsage)
            }
            
            promise.resolve(statsMap)
        } catch (e: Exception) {
            Timber.e(e, "Exception in getCaptureStats")
            promise.reject("EXCEPTION", e.message, e)
        }
    }

    /**
     * Update capture settings
     */
    @ReactMethod
    fun updateCaptureSettings(settings: ReadableMap, promise: Promise) {
        try {
            val service = screenCaptureService
            if (service == null) {
                promise.reject("SERVICE_NULL", "Screen capture service not initialized")
                return
            }

            val captureSettings = parseCaptureSettings(settings)
            service.updateSettings(captureSettings)
            promise.resolve(true)
            
            Timber.d("Capture settings updated: $captureSettings")
        } catch (e: Exception) {
            Timber.e(e, "Exception in updateCaptureSettings")
            promise.reject("EXCEPTION", e.message, e)
        }
    }

    /**
     * Handle activity result for screen capture permission
     */
    fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == REQUEST_SCREEN_CAPTURE) {
            val promise = screenCapturePermissionPromise
            screenCapturePermissionPromise = null
            
            if (promise == null) {
                Timber.w("No promise found for screen capture permission result")
                return
            }

            if (resultCode == Activity.RESULT_OK && data != null) {
                try {
                    screenCaptureService?.setMediaProjectionData(resultCode, data)
                    promise.resolve(true)
                    Timber.i("Screen capture permission granted")
                } catch (e: Exception) {
                    Timber.e(e, "Failed to set media projection data")
                    promise.reject("SETUP_FAILED", e.message, e)
                }
            } else {
                promise.reject("PERMISSION_DENIED", "User denied screen capture permission")
                Timber.w("Screen capture permission denied by user")
            }
        }
    }

    /**
     * Send event to React Native
     */
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    /**
     * Parse capture settings from React Native
     */
    private fun parseCaptureSettings(settings: ReadableMap): ScreenCaptureService.CaptureSettings {
        return ScreenCaptureService.CaptureSettings(
            targetFps = if (settings.hasKey("targetFps")) settings.getInt("targetFps") else 30,
            quality = if (settings.hasKey("quality")) settings.getInt("quality") else 80,
            enableGpu = if (settings.hasKey("enableGpu")) settings.getBoolean("enableGpu") else true,
            bufferSize = if (settings.hasKey("bufferSize")) settings.getInt("bufferSize") else 3
        )
    }

    // Store promise for permission request
    private var screenCapturePermissionPromise: Promise? = null

    /**
     * Export constants to React Native
     */
    override fun getConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "EVENTS" to mapOf(
                "CAPTURE_STARTED" to EVENT_CAPTURE_STARTED,
                "CAPTURE_STOPPED" to EVENT_CAPTURE_STOPPED,
                "CAPTURE_ERROR" to EVENT_CAPTURE_ERROR,
                "FRAME_AVAILABLE" to EVENT_FRAME_AVAILABLE
            )
        )
    }
}