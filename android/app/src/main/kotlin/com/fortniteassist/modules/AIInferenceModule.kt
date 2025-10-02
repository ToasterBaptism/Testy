package com.fortniteassist.modules

import android.graphics.Bitmap
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.fortniteassist.ai.AIInferenceService
import com.fortniteassist.data.DetectionResult
import kotlinx.coroutines.*
import timber.log.Timber

/**
 * React Native module for AI inference functionality
 * Provides bridge between React Native UI and native AI inference service
 */
class AIInferenceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var aiInferenceService: AIInferenceService? = null
    
    companion object {
        private const val MODULE_NAME = "AIInferenceModule"
        
        // Event names
        private const val EVENT_MODEL_LOADED = "onModelLoaded"
        private const val EVENT_MODEL_ERROR = "onModelError"
        private const val EVENT_INFERENCE_RESULT = "onInferenceResult"
        private const val EVENT_PERFORMANCE_UPDATE = "onPerformanceUpdate"
    }

    override fun getName(): String = MODULE_NAME

    override fun initialize() {
        super.initialize()
        aiInferenceService = AIInferenceService(reactApplicationContext)
        Timber.d("AIInferenceModule initialized")
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        moduleScope.cancel()
        aiInferenceService?.cleanup()
        Timber.d("AIInferenceModule destroyed")
    }

    /**
     * Load AI model from assets
     */
    @ReactMethod
    fun loadModel(modelName: String, promise: Promise) {
        moduleScope.launch {
            try {
                val service = aiInferenceService
                if (service == null) {
                    promise.reject("SERVICE_NULL", "AI inference service not initialized")
                    return@launch
                }

                val result = service.loadModel(modelName)
                if (result.isSuccess) {
                    promise.resolve(true)
                    sendEvent(EVENT_MODEL_LOADED, Arguments.createMap().apply {
                        putString("modelName", modelName)
                    })
                    Timber.i("AI model loaded successfully: $modelName")
                } else {
                    val error = result.exceptionOrNull()
                    promise.reject("LOAD_FAILED", error?.message ?: "Unknown error", error)
                    sendEvent(EVENT_MODEL_ERROR, Arguments.createMap().apply {
                        putString("error", error?.message ?: "Unknown error")
                        putString("modelName", modelName)
                    })
                    Timber.e(error, "Failed to load AI model: $modelName")
                }
            } catch (e: Exception) {
                Timber.e(e, "Exception in loadModel")
                promise.reject("EXCEPTION", e.message, e)
            }
        }
    }

    /**
     * Check if model is loaded
     */
    @ReactMethod
    fun isModelLoaded(promise: Promise) {
        try {
            val isLoaded = aiInferenceService?.isModelLoaded() ?: false
            promise.resolve(isLoaded)
        } catch (e: Exception) {
            Timber.e(e, "Exception in isModelLoaded")
            promise.reject("EXCEPTION", e.message, e)
        }
    }

    /**
     * Get model information
     */
    @ReactMethod
    fun getModelInfo(promise: Promise) {
        try {
            val service = aiInferenceService
            if (service == null) {
                promise.reject("SERVICE_NULL", "AI inference service not initialized")
                return
            }

            val modelInfo = service.getModelInfo()
            val infoMap = Arguments.createMap().apply {
                putString("name", modelInfo.name)
                putString("version", modelInfo.version)
                putInt("inputWidth", modelInfo.inputWidth)
                putInt("inputHeight", modelInfo.inputHeight)
                putInt("numClasses", modelInfo.numClasses)
                putDouble("confidenceThreshold", modelInfo.confidenceThreshold)
                putBoolean("supportsGpu", modelInfo.supportsGpu)
            }
            
            promise.resolve(infoMap)
        } catch (e: Exception) {
            Timber.e(e, "Exception in getModelInfo")
            promise.reject("EXCEPTION", e.message, e)
        }
    }

    /**
     * Run inference on a frame (called internally by screen capture)
     */
    @ReactMethod
    fun runInference(promise: Promise) {
        moduleScope.launch {
            try {
                val service = aiInferenceService
                if (service == null) {
                    promise.reject("SERVICE_NULL", "AI inference service not initialized")
                    return@launch
                }

                // Get latest frame from screen capture service
                val screenCaptureService = getScreenCaptureService()
                val frame = screenCaptureService?.getLatestFrame()
                
                if (frame == null) {
                    promise.reject("NO_FRAME", "No frame available for inference")
                    return@launch
                }

                val result = service.runInference(frame)
                if (result.isSuccess) {
                    val detectionResult = result.getOrNull()
                    if (detectionResult != null) {
                        val resultMap = convertDetectionResultToMap(detectionResult)
                        promise.resolve(resultMap)
                        
                        // Send event for real-time updates
                        sendEvent(EVENT_INFERENCE_RESULT, resultMap)
                    } else {
                        promise.reject("NULL_RESULT", "Inference returned null result")
                    }
                } else {
                    val error = result.exceptionOrNull()
                    promise.reject("INFERENCE_FAILED", error?.message ?: "Unknown error", error)
                    Timber.e(error, "AI inference failed")
                }
            } catch (e: Exception) {
                Timber.e(e, "Exception in runInference")
                promise.reject("EXCEPTION", e.message, e)
            }
        }
    }

    /**
     * Start continuous inference mode
     */
    @ReactMethod
    fun startContinuousInference(promise: Promise) {
        moduleScope.launch {
            try {
                val service = aiInferenceService
                if (service == null) {
                    promise.reject("SERVICE_NULL", "AI inference service not initialized")
                    return@launch
                }

                service.startContinuousInference { detectionResult ->
                    // Send real-time detection results
                    val resultMap = convertDetectionResultToMap(detectionResult)
                    sendEvent(EVENT_INFERENCE_RESULT, resultMap)
                }
                
                promise.resolve(true)
                Timber.i("Continuous inference started")
            } catch (e: Exception) {
                Timber.e(e, "Exception in startContinuousInference")
                promise.reject("EXCEPTION", e.message, e)
            }
        }
    }

    /**
     * Stop continuous inference mode
     */
    @ReactMethod
    fun stopContinuousInference(promise: Promise) {
        try {
            val service = aiInferenceService
            if (service == null) {
                promise.reject("SERVICE_NULL", "AI inference service not initialized")
                return
            }

            service.stopContinuousInference()
            promise.resolve(true)
            Timber.i("Continuous inference stopped")
        } catch (e: Exception) {
            Timber.e(e, "Exception in stopContinuousInference")
            promise.reject("EXCEPTION", e.message, e)
        }
    }

    /**
     * Update inference settings
     */
    @ReactMethod
    fun updateInferenceSettings(settings: ReadableMap, promise: Promise) {
        try {
            val service = aiInferenceService
            if (service == null) {
                promise.reject("SERVICE_NULL", "AI inference service not initialized")
                return
            }

            val inferenceSettings = parseInferenceSettings(settings)
            service.updateSettings(inferenceSettings)
            promise.resolve(true)
            
            Timber.d("Inference settings updated: $inferenceSettings")
        } catch (e: Exception) {
            Timber.e(e, "Exception in updateInferenceSettings")
            promise.reject("EXCEPTION", e.message, e)
        }
    }

    /**
     * Get inference performance metrics
     */
    @ReactMethod
    fun getPerformanceMetrics(promise: Promise) {
        try {
            val service = aiInferenceService
            if (service == null) {
                promise.reject("SERVICE_NULL", "AI inference service not initialized")
                return
            }

            val metrics = service.getPerformanceMetrics()
            val metricsMap = Arguments.createMap().apply {
                putDouble("averageInferenceTime", metrics.averageInferenceTime)
                putDouble("fps", metrics.fps)
                putInt("totalInferences", metrics.totalInferences)
                putDouble("cpuUsage", metrics.cpuUsage)
                putDouble("memoryUsage", metrics.memoryUsage)
                putDouble("gpuUsage", metrics.gpuUsage)
                putBoolean("isUsingGpu", metrics.isUsingGpu)
            }
            
            promise.resolve(metricsMap)
        } catch (e: Exception) {
            Timber.e(e, "Exception in getPerformanceMetrics")
            promise.reject("EXCEPTION", e.message, e)
        }
    }

    /**
     * Convert DetectionResult to React Native map
     */
    private fun convertDetectionResultToMap(detectionResult: DetectionResult): WritableMap {
        return Arguments.createMap().apply {
            putArray("enemies", Arguments.createArray().apply {
                detectionResult.enemies.forEach { enemy ->
                    pushMap(Arguments.createMap().apply {
                        putMap("boundingBox", Arguments.createMap().apply {
                            putDouble("x", enemy.boundingBox.left.toDouble())
                            putDouble("y", enemy.boundingBox.top.toDouble())
                            putDouble("width", enemy.boundingBox.width().toDouble())
                            putDouble("height", enemy.boundingBox.height().toDouble())
                        })
                        putDouble("confidence", enemy.confidence.toDouble())
                        putDouble("distance", enemy.distance?.toDouble() ?: 0.0)
                        putBoolean("isVisible", enemy.isVisible)
                        putArray("bodyParts", Arguments.createArray().apply {
                            enemy.bodyParts.forEach { bodyPart ->
                                pushMap(Arguments.createMap().apply {
                                    putString("type", bodyPart.type.name)
                                    putMap("position", Arguments.createMap().apply {
                                        putDouble("x", bodyPart.position.x.toDouble())
                                        putDouble("y", bodyPart.position.y.toDouble())
                                    })
                                    putDouble("confidence", bodyPart.confidence.toDouble())
                                })
                            }
                        })
                    })
                }
            })
            
            putArray("weapons", Arguments.createArray().apply {
                detectionResult.weapons.forEach { weapon ->
                    pushMap(Arguments.createMap().apply {
                        putMap("boundingBox", Arguments.createMap().apply {
                            putDouble("x", weapon.boundingBox.left.toDouble())
                            putDouble("y", weapon.boundingBox.top.toDouble())
                            putDouble("width", weapon.boundingBox.width().toDouble())
                            putDouble("height", weapon.boundingBox.height().toDouble())
                        })
                        putDouble("confidence", weapon.confidence.toDouble())
                        putString("weaponType", weapon.weaponType.name)
                        putBoolean("isPickupable", weapon.isPickupable)
                    })
                }
            })
            
            detectionResult.aimGuidance?.let { aimGuidance ->
                putMap("aimGuidance", Arguments.createMap().apply {
                    putMap("targetPoint", Arguments.createMap().apply {
                        putDouble("x", aimGuidance.targetPoint.x.toDouble())
                        putDouble("y", aimGuidance.targetPoint.y.toDouble())
                    })
                    putMap("aimVector", Arguments.createMap().apply {
                        putDouble("x", aimGuidance.aimVector.x.toDouble())
                        putDouble("y", aimGuidance.aimVector.y.toDouble())
                    })
                    putDouble("confidence", aimGuidance.confidence.toDouble())
                    putString("priority", aimGuidance.priority.name)
                    
                    aimGuidance.predictedMovement?.let { movement ->
                        putMap("predictedMovement", Arguments.createMap().apply {
                            putDouble("x", movement.x.toDouble())
                            putDouble("y", movement.y.toDouble())
                        })
                    }
                    
                    aimGuidance.recoilCompensation?.let { recoil ->
                        putMap("recoilCompensation", Arguments.createMap().apply {
                            putDouble("x", recoil.x.toDouble())
                            putDouble("y", recoil.y.toDouble())
                        })
                    }
                })
            }
            
            putDouble("timestamp", detectionResult.timestamp.toDouble())
            putDouble("confidence", detectionResult.confidence.toDouble())
            putInt("frameWidth", detectionResult.frameWidth)
            putInt("frameHeight", detectionResult.frameHeight)
        }
    }

    /**
     * Parse inference settings from React Native
     */
    private fun parseInferenceSettings(settings: ReadableMap): AIInferenceService.InferenceSettings {
        return AIInferenceService.InferenceSettings(
            confidenceThreshold = if (settings.hasKey("confidenceThreshold")) 
                settings.getDouble("confidenceThreshold").toFloat() else 0.5f,
            nmsThreshold = if (settings.hasKey("nmsThreshold")) 
                settings.getDouble("nmsThreshold").toFloat() else 0.4f,
            maxDetections = if (settings.hasKey("maxDetections")) 
                settings.getInt("maxDetections") else 10,
            useGpu = if (settings.hasKey("useGpu")) 
                settings.getBoolean("useGpu") else true,
            numThreads = if (settings.hasKey("numThreads")) 
                settings.getInt("numThreads") else 4
        )
    }

    /**
     * Get screen capture service instance
     */
    private fun getScreenCaptureService(): com.fortniteassist.capture.ScreenCaptureService? {
        // This would be injected or retrieved from a service locator in a real implementation
        return null // Placeholder
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
     * Export constants to React Native
     */
    override fun getConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "EVENTS" to mapOf(
                "MODEL_LOADED" to EVENT_MODEL_LOADED,
                "MODEL_ERROR" to EVENT_MODEL_ERROR,
                "INFERENCE_RESULT" to EVENT_INFERENCE_RESULT,
                "PERFORMANCE_UPDATE" to EVENT_PERFORMANCE_UPDATE
            )
        )
    }
}