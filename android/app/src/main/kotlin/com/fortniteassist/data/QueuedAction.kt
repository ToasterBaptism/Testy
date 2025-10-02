package com.fortniteassist.data

/**
 * Represents a queued action with priority and timing information
 */
data class QueuedAction(
    val action: GameAction,
    val x: Float,
    val y: Float,
    val priority: ActionPriority,
    val timestamp: Long,
    val maxDelay: Long = 100L // Maximum delay in milliseconds
)

/**
 * Priority levels for actions
 */
enum class ActionPriority {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}