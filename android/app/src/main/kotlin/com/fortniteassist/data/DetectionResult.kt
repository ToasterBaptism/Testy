package com.fortniteassist.data

import android.graphics.RectF

/**
 * Data class representing the result of AI detection
 */
data class DetectionResult(
    val enemies: List<EnemyDetection>,
    val weapons: List<WeaponDetection>,
    val aimGuidance: AimGuidance?,
    val timestamp: Long = System.currentTimeMillis(),
    val confidence: Float,
    val frameWidth: Int,
    val frameHeight: Int
)

/**
 * Represents a detected enemy in the game
 */
data class EnemyDetection(
    val boundingBox: RectF,
    val confidence: Float,
    val distance: Float?, // Estimated distance if available
    val isVisible: Boolean,
    val bodyParts: List<BodyPart> = emptyList()
)

/**
 * Represents a detected weapon in the game
 */
data class WeaponDetection(
    val boundingBox: RectF,
    val confidence: Float,
    val weaponType: WeaponType,
    val isPickupable: Boolean
)

/**
 * Represents a body part detection for more precise aiming
 */
data class BodyPart(
    val type: BodyPartType,
    val position: android.graphics.PointF,
    val confidence: Float
)

/**
 * Represents aim guidance calculation
 */
data class AimGuidance(
    val targetPoint: android.graphics.PointF,
    val aimVector: android.graphics.PointF,
    val confidence: Float,
    val predictedMovement: android.graphics.PointF?,
    val recoilCompensation: android.graphics.PointF?,
    val priority: AimPriority
)

/**
 * Types of body parts that can be detected
 */
enum class BodyPartType {
    HEAD,
    TORSO,
    ARMS,
    LEGS
}

/**
 * Types of weapons that can be detected
 */
enum class WeaponType {
    ASSAULT_RIFLE,
    SHOTGUN,
    SNIPER_RIFLE,
    PISTOL,
    SMG,
    EXPLOSIVE,
    HEALING_ITEM,
    SHIELD_ITEM,
    UNKNOWN
}

/**
 * Priority levels for aim guidance
 */
enum class AimPriority {
    HIGH,      // Close enemy, high threat
    MEDIUM,    // Medium distance enemy
    LOW,       // Far enemy or low threat
    NONE       // No valid target
}

/**
 * Model information and metadata
 */
data class ModelInfo(
    val name: String = "",
    val version: String = "1.0.0",
    val inputWidth: Int = 640,
    val inputHeight: Int = 640,
    val numClasses: Int = 80,
    val isLoaded: Boolean = false,
    val loadTime: Long = 0L,
    val modelSize: Long = 0L
)

/**
 * AI inference settings and configuration
 */
data class InferenceSettings(
    val confidenceThreshold: Float = 0.5f,
    val nmsThreshold: Float = 0.4f,
    val maxDetections: Int = 100,
    val useGpuAcceleration: Boolean = true,
    val numThreads: Int = 4,
    val enableQuantization: Boolean = true,
    val targetFps: Int = 30,
    val inputResolution: Pair<Int, Int> = Pair(640, 640)
)

/**
 * Performance metrics for monitoring
 */
data class PerformanceMetrics(
    val averageInferenceTime: Float = 0f,
    val averageFps: Float = 0f,
    val totalInferences: Long = 0L,
    val successfulInferences: Long = 0L,
    val failedInferences: Long = 0L,
    val memoryUsage: Long = 0L,
    val cpuUsage: Float = 0f,
    val gpuUsage: Float = 0f,
    val batteryDrain: Float = 0f,
    val lastUpdateTime: Long = System.currentTimeMillis()
)

/**
 * Screen capture settings
 */
data class CaptureSettings(
    val width: Int = 1920,
    val height: Int = 1080,
    val fps: Int = 30,
    val quality: Int = 80,
    val enableHardwareAcceleration: Boolean = true,
    val captureAudio: Boolean = false,
    val outputFormat: String = "MP4"
)