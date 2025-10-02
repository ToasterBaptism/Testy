package com.fortniteassist.modules

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.fortniteassist.data.GameAction
import com.fortniteassist.accessibility.FortniteAssistAccessibilityService
import timber.log.Timber

/**
 * React Native module for input simulation
 */
class InputSimulationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "InputSimulationModule"

    @ReactMethod
    fun simulateAction(actionType: String, x: Double, y: Double, promise: Promise) {
        try {
            val action = when (actionType) {
                "TAP" -> GameAction.Fire()
                "SWIPE" -> GameAction.Aim(android.graphics.PointF(x.toFloat(), y.toFloat()))
                "HOLD" -> GameAction.Scope(true)
                else -> {
                    promise.reject("INVALID_ACTION", "Unknown action type: $actionType")
                    return
                }
            }
            
            // Queue action for accessibility service
            // This would be handled by the accessibility service
            Timber.d("Simulating action: $action at ($x, $y)")
            promise.resolve(true)
        } catch (e: Exception) {
            Timber.e(e, "Failed to simulate action")
            promise.reject("SIMULATION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            // Initialize input simulation service
            Timber.d("Input simulation module initialized")
            promise.resolve(true)
        } catch (e: Exception) {
            Timber.e(e, "Failed to initialize input simulation")
            promise.reject("INIT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun performAimAdjustment(deltaX: Double, deltaY: Double, confidence: Double, promise: Promise) {
        try {
            // Convert screen coordinates to gesture
            val adjustmentX = deltaX.toFloat()
            val adjustmentY = deltaY.toFloat()
            
            // Apply confidence-based smoothing
            val smoothingFactor = (confidence * 0.8 + 0.2).toFloat() // Min 0.2, max 1.0
            val smoothedX = adjustmentX * smoothingFactor
            val smoothedY = adjustmentY * smoothingFactor
            
            // Create aim adjustment action
            val aimAction = GameAction.Aim(android.graphics.PointF(smoothedX, smoothedY))
            
            // Execute through accessibility service
            executeGameAction(aimAction)
            
            Timber.d("Aim adjustment: (${smoothedX}, ${smoothedY}) confidence: $confidence")
            promise.resolve(true)
        } catch (e: Exception) {
            Timber.e(e, "Failed to perform aim adjustment")
            promise.reject("AIM_ERROR", e.message)
        }
    }

    @ReactMethod
    fun performFireAction(promise: Promise) {
        try {
            val fireAction = GameAction.Fire()
            executeGameAction(fireAction)
            
            Timber.d("Fire action executed")
            promise.resolve(true)
        } catch (e: Exception) {
            Timber.e(e, "Failed to perform fire action")
            promise.reject("FIRE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun performScopeAction(enable: Boolean, promise: Promise) {
        try {
            val scopeAction = GameAction.Scope(enable)
            executeGameAction(scopeAction)
            
            Timber.d("Scope action: ${if (enable) "enabled" else "disabled"}")
            promise.resolve(true)
        } catch (e: Exception) {
            Timber.e(e, "Failed to perform scope action")
            promise.reject("SCOPE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            // Check if accessibility service is enabled
            val isEnabled = FortniteAssistAccessibilityService.isServiceEnabled(reactApplicationContext)
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.reject("CHECK_ERROR", e.message)
        }
    }

    /**
     * Execute game action through accessibility service
     */
    private fun executeGameAction(action: GameAction) {
        try {
            // Get the accessibility service instance
            val accessibilityService = FortniteAssistAccessibilityService.getInstance()
            
            if (accessibilityService != null) {
                // Queue the action for execution
                accessibilityService.queueAction(action)
            } else {
                Timber.w("Accessibility service not available, action not executed: $action")
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to execute game action: $action")
        }
    }
}