package com.fortniteassist.utils

import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.PointF
import com.fortniteassist.data.BuildType
import com.fortniteassist.data.MoveDirection
import kotlin.math.*

/**
 * Utility class for creating gestures and managing screen coordinates
 * Handles the conversion from game coordinates to screen gestures
 */
object GestureUtils {
    
    // Screen dimensions (will be updated dynamically)
    private var screenWidth = 1080f
    private var screenHeight = 1920f
    
    // Fortnite Mobile UI button positions (relative to screen size)
    private const val FIRE_BUTTON_X_RATIO = 0.85f
    private const val FIRE_BUTTON_Y_RATIO = 0.7f
    
    private const val JUMP_BUTTON_X_RATIO = 0.9f
    private const val JUMP_BUTTON_Y_RATIO = 0.8f
    
    private const val CROUCH_BUTTON_X_RATIO = 0.8f
    private const val CROUCH_BUTTON_Y_RATIO = 0.8f
    
    private const val RELOAD_BUTTON_X_RATIO = 0.75f
    private const val RELOAD_BUTTON_Y_RATIO = 0.6f
    
    private const val SCOPE_BUTTON_X_RATIO = 0.9f
    private const val SCOPE_BUTTON_Y_RATIO = 0.6f
    
    private const val MOVE_JOYSTICK_X_RATIO = 0.15f
    private const val MOVE_JOYSTICK_Y_RATIO = 0.75f
    private const val JOYSTICK_RADIUS = 100f
    
    // Build button positions
    private val buildButtonPositions = mapOf(
        BuildType.WALL to Pair(0.1f, 0.3f),
        BuildType.FLOOR to Pair(0.2f, 0.3f),
        BuildType.STAIRS to Pair(0.3f, 0.3f),
        BuildType.ROOF to Pair(0.4f, 0.3f)
    )
    
    // Weapon slot positions
    private val weaponSlotPositions = listOf(
        Pair(0.1f, 0.9f),  // Slot 1
        Pair(0.2f, 0.9f),  // Slot 2
        Pair(0.3f, 0.9f),  // Slot 3
        Pair(0.4f, 0.9f),  // Slot 4
        Pair(0.5f, 0.9f)   // Slot 5
    )

    /**
     * Update screen dimensions
     */
    fun updateScreenDimensions(width: Int, height: Int) {
        screenWidth = width.toFloat()
        screenHeight = height.toFloat()
    }

    /**
     * Create a tap gesture at the specified point
     */
    fun createTapGesture(point: PointF, duration: Long = 100L): GestureDescription {
        val path = Path().apply {
            moveTo(point.x, point.y)
        }
        
        val stroke = GestureDescription.StrokeDescription(path, 0, duration)
        return GestureDescription.Builder().addStroke(stroke).build()
    }

    /**
     * Create a long press gesture
     */
    fun createLongPressGesture(point: PointF, duration: Long = 1000L): GestureDescription {
        return createTapGesture(point, duration)
    }

    /**
     * Create an aim gesture (smooth swipe from current position to target)
     */
    fun createAimGesture(
        targetPoint: PointF,
        smoothing: Float = 0.5f,
        speed: Float = 1.0f
    ): GestureDescription {
        // Get current aim position (center of screen for now)
        val currentPoint = PointF(screenWidth / 2, screenHeight / 2)
        
        // Calculate smooth path to target
        val path = createSmoothPath(currentPoint, targetPoint, smoothing)
        
        // Calculate duration based on distance and speed
        val distance = sqrt(
            (targetPoint.x - currentPoint.x).pow(2) + 
            (targetPoint.y - currentPoint.y).pow(2)
        )
        val duration = (distance / speed * 10).toLong().coerceIn(50L, 500L)
        
        val stroke = GestureDescription.StrokeDescription(path, 0, duration)
        return GestureDescription.Builder().addStroke(stroke).build()
    }

    /**
     * Create a movement gesture using the virtual joystick
     */
    fun createMoveGesture(direction: MoveDirection, duration: Long): GestureDescription {
        val joystickCenter = PointF(
            screenWidth * MOVE_JOYSTICK_X_RATIO,
            screenHeight * MOVE_JOYSTICK_Y_RATIO
        )
        
        val directionVector = when (direction) {
            MoveDirection.FORWARD -> PointF(0f, -1f)
            MoveDirection.BACKWARD -> PointF(0f, 1f)
            MoveDirection.LEFT -> PointF(-1f, 0f)
            MoveDirection.RIGHT -> PointF(1f, 0f)
            MoveDirection.FORWARD_LEFT -> PointF(-0.707f, -0.707f)
            MoveDirection.FORWARD_RIGHT -> PointF(0.707f, -0.707f)
            MoveDirection.BACKWARD_LEFT -> PointF(-0.707f, 0.707f)
            MoveDirection.BACKWARD_RIGHT -> PointF(0.707f, 0.707f)
        }
        
        val targetPoint = PointF(
            joystickCenter.x + directionVector.x * JOYSTICK_RADIUS,
            joystickCenter.y + directionVector.y * JOYSTICK_RADIUS
        )
        
        val path = Path().apply {
            moveTo(joystickCenter.x, joystickCenter.y)
            lineTo(targetPoint.x, targetPoint.y)
        }
        
        val stroke = GestureDescription.StrokeDescription(path, 0, duration)
        return GestureDescription.Builder().addStroke(stroke).build()
    }

    /**
     * Create a swipe gesture
     */
    fun createSwipeGesture(
        startPoint: PointF,
        endPoint: PointF,
        duration: Long = 300L
    ): GestureDescription {
        val path = Path().apply {
            moveTo(startPoint.x, startPoint.y)
            lineTo(endPoint.x, endPoint.y)
        }
        
        val stroke = GestureDescription.StrokeDescription(path, 0, duration)
        return GestureDescription.Builder().addStroke(stroke).build()
    }

    /**
     * Get fire button position
     */
    fun getFireButtonPosition(): PointF {
        return PointF(
            screenWidth * FIRE_BUTTON_X_RATIO,
            screenHeight * FIRE_BUTTON_Y_RATIO
        )
    }

    /**
     * Get jump button position
     */
    fun getJumpButtonPosition(): PointF {
        return PointF(
            screenWidth * JUMP_BUTTON_X_RATIO,
            screenHeight * JUMP_BUTTON_Y_RATIO
        )
    }

    /**
     * Get crouch button position
     */
    fun getCrouchButtonPosition(): PointF {
        return PointF(
            screenWidth * CROUCH_BUTTON_X_RATIO,
            screenHeight * CROUCH_BUTTON_Y_RATIO
        )
    }

    /**
     * Get reload button position
     */
    fun getReloadButtonPosition(): PointF {
        return PointF(
            screenWidth * RELOAD_BUTTON_X_RATIO,
            screenHeight * RELOAD_BUTTON_Y_RATIO
        )
    }

    /**
     * Get scope button position
     */
    fun getScopeButtonPosition(): PointF {
        return PointF(
            screenWidth * SCOPE_BUTTON_X_RATIO,
            screenHeight * SCOPE_BUTTON_Y_RATIO
        )
    }

    /**
     * Get build button position for specific build type
     */
    fun getBuildButtonPosition(buildType: BuildType): PointF {
        val (xRatio, yRatio) = buildButtonPositions[buildType] ?: Pair(0.1f, 0.3f)
        return PointF(
            screenWidth * xRatio,
            screenHeight * yRatio
        )
    }

    /**
     * Get weapon slot position
     */
    fun getWeaponSlotPosition(slot: Int): PointF {
        val index = (slot - 1).coerceIn(0, weaponSlotPositions.size - 1)
        val (xRatio, yRatio) = weaponSlotPositions[index]
        return PointF(
            screenWidth * xRatio,
            screenHeight * yRatio
        )
    }

    /**
     * Create a smooth path between two points using Bezier curves
     */
    private fun createSmoothPath(
        start: PointF,
        end: PointF,
        smoothing: Float
    ): Path {
        val path = Path()
        path.moveTo(start.x, start.y)
        
        if (smoothing > 0f) {
            // Create a smooth curve using quadratic Bezier
            val controlX = start.x + (end.x - start.x) * 0.5f
            val controlY = start.y + (end.y - start.y) * 0.3f * smoothing
            
            path.quadTo(controlX, controlY, end.x, end.y)
        } else {
            // Direct line
            path.lineTo(end.x, end.y)
        }
        
        return path
    }

    /**
     * Convert game coordinates to screen coordinates
     */
    fun gameToScreenCoordinates(gameX: Float, gameY: Float, gameWidth: Int, gameHeight: Int): PointF {
        val screenX = (gameX / gameWidth) * screenWidth
        val screenY = (gameY / gameHeight) * screenHeight
        return PointF(screenX, screenY)
    }

    /**
     * Check if a point is within screen bounds
     */
    fun isPointInBounds(point: PointF): Boolean {
        return point.x >= 0 && point.x <= screenWidth && 
               point.y >= 0 && point.y <= screenHeight
    }

    /**
     * Clamp a point to screen bounds
     */
    fun clampToScreen(point: PointF): PointF {
        return PointF(
            point.x.coerceIn(0f, screenWidth),
            point.y.coerceIn(0f, screenHeight)
        )
    }
}