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