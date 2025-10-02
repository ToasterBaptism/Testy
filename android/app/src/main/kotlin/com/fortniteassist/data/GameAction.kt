package com.fortniteassist.data

import android.graphics.PointF

/**
 * Represents different types of game actions that can be performed
 */
sealed class GameAction {
    
    /**
     * Aim adjustment action
     */
    data class Aim(
        val targetPoint: PointF,
        val smoothing: Float = 0.5f,
        val speed: Float = 1.0f
    ) : GameAction()
    
    /**
     * Fire weapon action
     */
    data class Fire(
        val duration: Long = 100L,
        val burstCount: Int = 1
    ) : GameAction()
    
    /**
     * Reload weapon action
     */
    object Reload : GameAction()
    
    /**
     * Jump action
     */
    object Jump : GameAction()
    
    /**
     * Crouch action
     */
    data class Crouch(val toggle: Boolean = true) : GameAction()
    
    /**
     * Move action
     */
    data class Move(
        val direction: MoveDirection,
        val duration: Long = 500L
    ) : GameAction()
    
    /**
     * Scope/ADS action
     */
    data class Scope(val enable: Boolean) : GameAction()
    
    /**
     * Build action (for Fortnite building mechanics)
     */
    data class Build(
        val buildType: BuildType,
        val position: PointF
    ) : GameAction()
    
    /**
     * Interact action (pick up items, open doors, etc.)
     */
    data class Interact(val position: PointF) : GameAction()
    
    /**
     * Switch weapon action
     */
    data class SwitchWeapon(val weaponSlot: Int) : GameAction()
}

/**
 * Movement directions
 */
enum class MoveDirection {
    FORWARD,
    BACKWARD,
    LEFT,
    RIGHT,
    FORWARD_LEFT,
    FORWARD_RIGHT,
    BACKWARD_LEFT,
    BACKWARD_RIGHT
}

/**
 * Building types in Fortnite
 */
enum class BuildType {
    WALL,
    FLOOR,
    STAIRS,
    ROOF
}

