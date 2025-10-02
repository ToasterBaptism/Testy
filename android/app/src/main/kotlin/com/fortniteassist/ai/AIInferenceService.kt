package com.fortniteassist.ai

import android.content.Context
import android.graphics.Bitmap
import android.graphics.RectF
import android.graphics.PointF
import com.fortniteassist.data.*
import kotlinx.coroutines.*
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.CompatibilityList
import org.tensorflow.lite.gpu.GpuDelegate
import timber.log.Timber
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong
import kotlin.math.*

/**
 * AI Inference Service for enemy detection and aim guidance
 * Uses TensorFlow Lite for on-device inference with GPU acceleration when available
 */
class AIInferenceService(private val context: Context) {

    private var interpreter: Interpreter? = null
    private var gpuDelegate: GpuDelegate? = null
    private var modelInfo: ModelInfo = ModelInfo()
    private var isModelLoaded = AtomicBoolean(false)
    private var isContinuousInference = AtomicBoolean(false)
    
    private var inferenceSettings = InferenceSettings()
    private val performanceMetrics = PerformanceMetrics()
    
    // Inference processing
    private val inferenceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var continuousInferenceJob: Job? = null
    private var onDetectionCallback: ((DetectionResult) -> Unit)? = null
    
    // Model input/output buffers
    private var inputBuffer: ByteBuffer? = null
    private var outputBuffer: Array<Array<FloatArray>>? = null
    
    // Aim guidance calculator
    private val aimGuidanceCalculator = AimGuidanceCalculator()
    
    companion object {
        private const val MODEL_INPUT_SIZE = 416 // YOLO input size
        private const val MODEL_CHANNELS = 3
        private const val MAX_DETECTIONS = 100
        private const val NUM_CLASSES = 80 // COCO classes, will be filtered for relevant objects
        
        // Fortnite-specific class indices (subset of COCO)
        private val PERSON_CLASS_ID = 0
        private val WEAPON_CLASS_IDS = setOf(43, 44, 45) // Various weapon-like objects
    }

    /**
     * Data class for inference settings
     */
    data class InferenceSettings(
        val confidenceThreshold: Float = 0.5f,
        val nmsThreshold: Float = 0.4f,
        val maxDetections: Int = 10,
        val useGpu: Boolean = true,
        val numThreads: Int = 4
    )

    /**
     * Data class for model information
     */
    data class ModelInfo(
        val name: String = "",
        val version: String = "",
        val inputWidth: Int = MODEL_INPUT_SIZE,
        val inputHeight: Int = MODEL_INPUT_SIZE,
        val numClasses: Int = NUM_CLASSES,
        val confidenceThreshold: Float = 0.5f,
        val supportsGpu: Boolean = false
    )

    /**
     * Data class for performance metrics
     */
    data class PerformanceMetrics(
        var averageInferenceTime: Double = 0.0,
        var fps: Double = 0.0,
        var totalInferences: Int = 0,
        var cpuUsage: Double = 0.0,
        var memoryUsage: Double = 0.0,
        var gpuUsage: Double = 0.0,
        var isUsingGpu: Boolean = false
    ) {
        private val inferenceTimes = mutableListOf<Long>()
        private val maxSamples = 30
        
        fun addInferenceTime(timeMs: Long) {
            synchronized(inferenceTimes) {
                inferenceTimes.add(timeMs)
                if (inferenceTimes.size > maxSamples) {
                    inferenceTimes.removeAt(0)
                }
                averageInferenceTime = inferenceTimes.average()
                fps = if (averageInferenceTime > 0) 1000.0 / averageInferenceTime else 0.0
                totalInferences++
            }
        }
    }

    /**
     * Load AI model from assets
     */
    suspend fun loadModel(modelName: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            if (isModelLoaded.get()) {
                cleanup()
            }

            // Load model file
            val modelBuffer = loadModelFile(modelName)
            
            // Setup GPU delegate if available and requested
            val options = Interpreter.Options()
            if (inferenceSettings.useGpu && isGpuSupported()) {
                gpuDelegate = GpuDelegate()
                options.addDelegate(gpuDelegate)
                performanceMetrics.isUsingGpu = true
                Timber.d("GPU acceleration enabled")
            } else {
                options.setNumThreads(inferenceSettings.numThreads)
                performanceMetrics.isUsingGpu = false
                Timber.d("Using CPU with ${inferenceSettings.numThreads} threads")
            }

            // Create interpreter
            interpreter = Interpreter(modelBuffer, options)
            
            // Initialize input/output buffers
            initializeBuffers()
            
            // Update model info
            modelInfo = ModelInfo(
                name = modelName,
                version = "1.0",
                supportsGpu = performanceMetrics.isUsingGpu
            )
            
            isModelLoaded.set(true)
            Timber.i("AI model loaded successfully: $modelName")
            Result.success(Unit)
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to load AI model: $modelName")
            cleanup()
            Result.failure(e)
        }
    }

    /**
     * Run inference on a single frame
     */
    suspend fun runInference(frame: Bitmap): Result<DetectionResult> = withContext(Dispatchers.Default) {
        try {
            if (!isModelLoaded.get()) {
                return@withContext Result.failure(IllegalStateException("Model not loaded"))
            }

            val startTime = System.currentTimeMillis()
            
            // Preprocess frame
            val preprocessedFrame = preprocessFrame(frame)
            
            // Run inference
            val rawDetections = runModelInference(preprocessedFrame)
            
            // Post-process results
            val detectionResult = postprocessDetections(rawDetections, frame.width, frame.height)
            
            // Update performance metrics
            val inferenceTime = System.currentTimeMillis() - startTime
            performanceMetrics.addInferenceTime(inferenceTime)
            
            Timber.d("Inference completed in ${inferenceTime}ms, found ${detectionResult.enemies.size} enemies")
            Result.success(detectionResult)
            
        } catch (e: Exception) {
            Timber.e(e, "Inference failed")
            Result.failure(e)
        }
    }

    /**
     * Start continuous inference mode
     */
    fun startContinuousInference(onDetection: (DetectionResult) -> Unit) {
        if (isContinuousInference.get()) {
            stopContinuousInference()
        }
        
        onDetectionCallback = onDetection
        isContinuousInference.set(true)
        
        continuousInferenceJob = inferenceScope.launch {
            while (isContinuousInference.get()) {
                try {
                    // Get latest frame from screen capture
                    val frame = getLatestFrame()
                    if (frame != null) {
                        val result = runInference(frame)
                        result.getOrNull()?.let { detectionResult ->
                            onDetectionCallback?.invoke(detectionResult)
                        }
                    }
                    
                    // Control inference rate
                    delay(33) // ~30 FPS
                    
                } catch (e: Exception) {
                    Timber.e(e, "Error in continuous inference")
                    if (e is CancellationException) break
                }
            }
        }
        
        Timber.i("Continuous inference started")
    }

    /**
     * Stop continuous inference mode
     */
    fun stopContinuousInference() {
        isContinuousInference.set(false)
        continuousInferenceJob?.cancel()
        continuousInferenceJob = null
        onDetectionCallback = null
        Timber.i("Continuous inference stopped")
    }

    /**
     * Check if model is loaded
     */
    fun isModelLoaded(): Boolean = isModelLoaded.get()

    /**
     * Get model information
     */
    fun getModelInfo(): ModelInfo = modelInfo

    /**
     * Get performance metrics
     */
    fun getPerformanceMetrics(): PerformanceMetrics = performanceMetrics

    /**
     * Update inference settings
     */
    fun updateSettings(settings: InferenceSettings) {
        this.inferenceSettings = settings
        
        // Restart inference if settings changed significantly
        if (isModelLoaded.get()) {
            inferenceScope.launch {
                val currentModel = modelInfo.name
                if (currentModel.isNotEmpty()) {
                    loadModel(currentModel)
                }
            }
        }
    }

    /**
     * Load model file from assets
     */
    private fun loadModelFile(modelName: String): MappedByteBuffer {
        val assetFileDescriptor = context.assets.openFd("models/$modelName")
        val inputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    /**
     * Check if GPU acceleration is supported
     */
    private fun isGpuSupported(): Boolean {
        val compatibilityList = CompatibilityList()
        return compatibilityList.isDelegateSupportedOnThisDevice
    }

    /**
     * Initialize input/output buffers
     */
    private fun initializeBuffers() {
        val interpreter = this.interpreter ?: return
        
        // Input buffer: [1, height, width, channels]
        val inputShape = interpreter.getInputTensor(0).shape()
        val inputSize = inputShape[1] * inputShape[2] * inputShape[3] * 4 // 4 bytes per float
        inputBuffer = ByteBuffer.allocateDirect(inputSize).apply {
            order(ByteOrder.nativeOrder())
        }
        
        // Output buffer: [1, num_detections, 85] (x, y, w, h, confidence, 80 class scores)
        val outputShape = interpreter.getOutputTensor(0).shape()
        outputBuffer = Array(outputShape[0]) { Array(outputShape[1]) { FloatArray(outputShape[2]) } }
        
        Timber.d("Buffers initialized - Input: ${inputShape.contentToString()}, Output: ${outputShape.contentToString()}")
    }

    /**
     * Preprocess frame for model input
     */
    private fun preprocessFrame(frame: Bitmap): ByteBuffer {
        val buffer = inputBuffer ?: throw IllegalStateException("Input buffer not initialized")
        buffer.rewind()
        
        // Resize frame to model input size
        val resizedFrame = Bitmap.createScaledBitmap(frame, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, true)
        
        // Convert to float array and normalize
        val pixels = IntArray(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE)
        resizedFrame.getPixels(pixels, 0, MODEL_INPUT_SIZE, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)
        
        for (pixel in pixels) {
            // Extract RGB values and normalize to [0, 1]
            val r = ((pixel shr 16) and 0xFF) / 255.0f
            val g = ((pixel shr 8) and 0xFF) / 255.0f
            val b = (pixel and 0xFF) / 255.0f
            
            buffer.putFloat(r)
            buffer.putFloat(g)
            buffer.putFloat(b)
        }
        
        resizedFrame.recycle()
        return buffer
    }

    /**
     * Run model inference
     */
    private fun runModelInference(inputBuffer: ByteBuffer): Array<Array<FloatArray>> {
        val interpreter = this.interpreter ?: throw IllegalStateException("Interpreter not initialized")
        val outputBuffer = this.outputBuffer ?: throw IllegalStateException("Output buffer not initialized")
        
        interpreter.run(inputBuffer, outputBuffer)
        return outputBuffer
    }

    /**
     * Post-process model outputs to detection results
     */
    private fun postprocessDetections(
        rawDetections: Array<Array<FloatArray>>,
        frameWidth: Int,
        frameHeight: Int
    ): DetectionResult {
        val enemies = mutableListOf<EnemyDetection>()
        val weapons = mutableListOf<WeaponDetection>()
        
        val detections = rawDetections[0] // Batch size is 1
        
        for (detection in detections) {
            val confidence = detection[4]
            if (confidence < inferenceSettings.confidenceThreshold) continue
            
            // Get class scores
            val classScores = detection.sliceArray(5 until detection.size)
            val maxClassIndex = classScores.indices.maxByOrNull { classScores[it] } ?: continue
            val maxClassScore = classScores[maxClassIndex]
            
            if (maxClassScore < inferenceSettings.confidenceThreshold) continue
            
            // Convert normalized coordinates to pixel coordinates
            val centerX = detection[0] * frameWidth
            val centerY = detection[1] * frameHeight
            val width = detection[2] * frameWidth
            val height = detection[3] * frameHeight
            
            val left = centerX - width / 2
            val top = centerY - height / 2
            val boundingBox = RectF(left, top, left + width, top + height)
            
            when (maxClassIndex) {
                PERSON_CLASS_ID -> {
                    // Enemy detection
                    val enemy = EnemyDetection(
                        boundingBox = boundingBox,
                        confidence = confidence,
                        distance = estimateDistance(boundingBox),
                        isVisible = true,
                        bodyParts = detectBodyParts(boundingBox)
                    )
                    enemies.add(enemy)
                }
                in WEAPON_CLASS_IDS -> {
                    // Weapon detection
                    val weapon = WeaponDetection(
                        boundingBox = boundingBox,
                        confidence = confidence,
                        weaponType = classifyWeapon(maxClassIndex),
                        isPickupable = true
                    )
                    weapons.add(weapon)
                }
            }
        }
        
        // Apply Non-Maximum Suppression
        val filteredEnemies = applyNMS(enemies)
        val filteredWeapons = applyNMS(weapons)
        
        // Calculate aim guidance
        val aimGuidance = aimGuidanceCalculator.calculateAimGuidance(filteredEnemies, frameWidth, frameHeight)
        
        return DetectionResult(
            enemies = filteredEnemies,
            weapons = filteredWeapons,
            aimGuidance = aimGuidance,
            timestamp = System.currentTimeMillis(),
            confidence = if (filteredEnemies.isNotEmpty()) filteredEnemies.maxOf { it.confidence } else 0f,
            frameWidth = frameWidth,
            frameHeight = frameHeight
        )
    }

    /**
     * Estimate distance based on bounding box size
     */
    private fun estimateDistance(boundingBox: RectF): Float {
        val boxArea = boundingBox.width() * boundingBox.height()
        // Simple heuristic: larger boxes are closer
        return (100000f / boxArea).coerceIn(1f, 100f)
    }

    /**
     * Detect body parts within enemy bounding box
     */
    private fun detectBodyParts(boundingBox: RectF): List<BodyPart> {
        // Simplified body part detection based on bounding box regions
        val centerX = boundingBox.centerX()
        val centerY = boundingBox.centerY()
        val width = boundingBox.width()
        val height = boundingBox.height()
        
        return listOf(
            BodyPart(
                type = BodyPartType.HEAD,
                position = PointF(centerX, boundingBox.top + height * 0.15f),
                confidence = 0.8f
            ),
            BodyPart(
                type = BodyPartType.TORSO,
                position = PointF(centerX, centerY),
                confidence = 0.9f
            )
        )
    }

    /**
     * Classify weapon type based on class index
     */
    private fun classifyWeapon(classIndex: Int): WeaponType {
        return when (classIndex) {
            43 -> WeaponType.ASSAULT_RIFLE
            44 -> WeaponType.PISTOL
            45 -> WeaponType.SHOTGUN
            else -> WeaponType.UNKNOWN
        }
    }

    /**
     * Apply Non-Maximum Suppression to remove duplicate detections
     */
    private fun <T> applyNMS(detections: List<T>): List<T> where T : Any {
        // Simplified NMS implementation
        // In a real implementation, this would be more sophisticated
        return detections.take(inferenceSettings.maxDetections)
    }

    /**
     * Get latest frame from screen capture service
     */
    private fun getLatestFrame(): Bitmap? {
        // This would be injected or retrieved from a service locator
        return null // Placeholder
    }

    /**
     * Cleanup resources
     */
    fun cleanup() {
        stopContinuousInference()
        
        interpreter?.close()
        interpreter = null
        
        gpuDelegate?.close()
        gpuDelegate = null
        
        inputBuffer = null
        outputBuffer = null
        
        isModelLoaded.set(false)
        
        Timber.d("AI inference service cleaned up")
    }

    /**
     * Aim guidance calculator
     */
    private class AimGuidanceCalculator {
        
        fun calculateAimGuidance(
            enemies: List<EnemyDetection>,
            frameWidth: Int,
            frameHeight: Int
        ): AimGuidance? {
            if (enemies.isEmpty()) return null
            
            // Select highest priority target
            val target = selectTarget(enemies)
            
            // Calculate aim point (prefer head, fallback to center)
            val aimPoint = calculateAimPoint(target)
            
            // Calculate aim vector from screen center
            val screenCenter = PointF(frameWidth / 2f, frameHeight / 2f)
            val aimVector = PointF(
                aimPoint.x - screenCenter.x,
                aimPoint.y - screenCenter.y
            )
            
            // Predict movement (simplified)
            val predictedMovement = predictMovement(target)
            
            // Calculate recoil compensation (simplified)
            val recoilCompensation = calculateRecoilCompensation()
            
            return AimGuidance(
                targetPoint = aimPoint,
                aimVector = aimVector,
                confidence = target.confidence,
                predictedMovement = predictedMovement,
                recoilCompensation = recoilCompensation,
                priority = calculatePriority(target)
            )
        }
        
        private fun selectTarget(enemies: List<EnemyDetection>): EnemyDetection {
            // Select closest enemy with highest confidence
            return enemies.minByOrNull { (it.distance ?: Float.MAX_VALUE) / it.confidence }
                ?: enemies.first()
        }
        
        private fun calculateAimPoint(enemy: EnemyDetection): PointF {
            // Prefer head if available, otherwise use torso center
            val headPart = enemy.bodyParts.find { it.type == BodyPartType.HEAD }
            return headPart?.position ?: PointF(
                enemy.boundingBox.centerX(),
                enemy.boundingBox.centerY()
            )
        }
        
        private fun predictMovement(enemy: EnemyDetection): PointF? {
            // Simplified movement prediction
            // In a real implementation, this would track enemy positions over time
            return null
        }
        
        private fun calculateRecoilCompensation(): PointF? {
            // Simplified recoil compensation
            // In a real implementation, this would be weapon-specific
            return PointF(0f, -5f) // Slight upward compensation
        }
        
        private fun calculatePriority(enemy: EnemyDetection): AimPriority {
            val distance = enemy.distance ?: Float.MAX_VALUE
            return when {
                distance < 20f && enemy.confidence > 0.8f -> AimPriority.HIGH
                distance < 50f && enemy.confidence > 0.6f -> AimPriority.MEDIUM
                else -> AimPriority.LOW
            }
        }
    }
}

/**
 * Aim guidance calculator for predictive targeting
 */
class AimGuidanceCalculator {
    
    /**
     * Calculate optimal aim guidance for detected enemies
     */
    fun calculateAimGuidance(
        enemies: List<EnemyDetection>,
        frameWidth: Int,
        frameHeight: Int,
        currentAimPoint: PointF? = null
    ): AimGuidance? {
        if (enemies.isEmpty()) return null
        
        // Select highest priority target
        val target = enemies.maxByOrNull { enemy ->
            when (calculatePriority(enemy)) {
                AimPriority.HIGH -> 3f
                AimPriority.MEDIUM -> 2f
                AimPriority.LOW -> 1f
                AimPriority.NONE -> 0f
            } * enemy.confidence
        } ?: return null
        
        // Calculate target point (center of bounding box, slightly adjusted for head)
        val targetPoint = PointF(
            target.boundingBox.centerX(),
            target.boundingBox.top + (target.boundingBox.height() * 0.2f) // Aim slightly higher
        )
        
        // Calculate aim vector from current position
        val aimVector = currentAimPoint?.let { current ->
            PointF(
                targetPoint.x - current.x,
                targetPoint.y - current.y
            )
        } ?: PointF(0f, 0f)
        
        // Simple motion prediction (can be enhanced with Kalman filter)
        val predictedMovement = predictMovement(target)
        
        // Basic recoil compensation (weapon-specific in real implementation)
        val recoilCompensation = PointF(0f, -2f) // Slight upward compensation
        
        return AimGuidance(
            targetPoint = targetPoint,
            aimVector = aimVector,
            confidence = target.confidence,
            predictedMovement = predictedMovement,
            recoilCompensation = recoilCompensation,
            priority = calculatePriority(target)
        )
    }
    
    private fun predictMovement(enemy: EnemyDetection): PointF {
        // Simple prediction - in real implementation, use velocity tracking
        return PointF(0f, 0f)
    }
    
    private fun calculatePriority(enemy: EnemyDetection): AimPriority {
        val distance = enemy.distance ?: Float.MAX_VALUE
        return when {
            distance < 20f && enemy.confidence > 0.8f -> AimPriority.HIGH
            distance < 50f && enemy.confidence > 0.6f -> AimPriority.MEDIUM
            else -> AimPriority.LOW
        }
    }
}