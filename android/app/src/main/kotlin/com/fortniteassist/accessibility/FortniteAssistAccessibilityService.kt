package com.fortniteassist.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.PointF
import android.view.accessibility.AccessibilityEvent
import com.fortniteassist.data.GameAction
import com.fortniteassist.data.QueuedAction
import com.fortniteassist.utils.GestureUtils
import kotlinx.coroutines.*
import timber.log.Timber
import java.util.concurrent.PriorityQueue

/**
 * Accessibility Service that provides input simulation for FortniteAssist
 * This service performs gestures based on AI detection results to assist players
 * with visual impairments or motor disabilities.
 */
class FortniteAssistAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val actionQueue = PriorityQueue<QueuedAction> { a, b ->
        // Higher priority actions come first, then by timestamp
        when {
            a.priority != b.priority -> b.priority.ordinal - a.priority.ordinal
            else -> (a.timestamp - b.timestamp).toInt()
        }
    }
    
    private var isProcessingActions = false
    private var currentGamePackage: String? = null
    
    companion object {
        private const val FORTNITE_PACKAGE = "com.epicgames.fortnite"
        private const val ACTION_PROCESSING_DELAY = 50L // ms between actions
        
        @Volatile
        private var instance: FortniteAssistAccessibilityService? = null
        
        fun getInstance(): FortniteAssistAccessibilityService? = instance
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        Timber.i("FortniteAssist Accessibility Service created")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        serviceScope.cancel()
        Timber.i("FortniteAssist Accessibility Service destroyed")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event?.let { accessibilityEvent ->
            // Track current app package
            accessibilityEvent.packageName?.toString()?.let { packageName ->
                if (packageName != currentGamePackage) {
                    currentGamePackage = packageName
                    Timber.d("Current app: $packageName")
                    
                    // Start action processing when Fortnite is active
                    if (packageName == FORTNITE_PACKAGE && !isProcessingActions) {
                        startActionProcessing()
                    } else if (packageName != FORTNITE_PACKAGE && isProcessingActions) {
                        stopActionProcessing()
                    }
                }
            }
        }
    }

    override fun onInterrupt() {
        Timber.w("Accessibility service interrupted")
        stopActionProcessing()
    }

    /**
     * Queue a game action to be performed
     */
    fun queueAction(action: QueuedAction) {
        synchronized(actionQueue) {
            // Remove expired actions
            val currentTime = System.currentTimeMillis()
            actionQueue.removeAll { it.timestamp + it.maxDelay < currentTime }
            
            actionQueue.offer(action)
            Timber.d("Queued action: ${action.action::class.simpleName}, priority: ${action.priority}")
        }
    }

    /**
     * Start processing queued actions
     */
    private fun startActionProcessing() {
        if (isProcessingActions) return
        
        isProcessingActions = true
        Timber.i("Started action processing")
        
        serviceScope.launch {
            while (isProcessingActions && currentGamePackage == FORTNITE_PACKAGE) {
                processNextAction()
                delay(ACTION_PROCESSING_DELAY)
            }
        }
    }

    /**
     * Stop processing actions
     */
    private fun stopActionProcessing() {
        isProcessingActions = false
        synchronized(actionQueue) {
            actionQueue.clear()
        }
        Timber.i("Stopped action processing")
    }

    /**
     * Process the next action in the queue
     */
    private suspend fun processNextAction() {
        val action = synchronized(actionQueue) {
            actionQueue.poll()
        } ?: return

        // Check if action has expired
        val currentTime = System.currentTimeMillis()
        if (currentTime - action.timestamp > action.maxDelay) {
            Timber.d("Action expired: ${action.action::class.simpleName}")
            return
        }

        try {
            performGameAction(action.action)
        } catch (e: Exception) {
            Timber.e(e, "Failed to perform action: ${action.action::class.simpleName}")
        }
    }

    /**
     * Perform a specific game action
     */
    private suspend fun performGameAction(action: GameAction) {
        when (action) {
            is GameAction.Aim -> performAimAction(action)
            is GameAction.Fire -> performFireAction(action)
            is GameAction.Reload -> performReloadAction()
            is GameAction.Jump -> performJumpAction()
            is GameAction.Crouch -> performCrouchAction(action)
            is GameAction.Move -> performMoveAction(action)
            is GameAction.Scope -> performScopeAction(action)
            is GameAction.Build -> performBuildAction(action)
            is GameAction.Interact -> performInteractAction(action)
            is GameAction.SwitchWeapon -> performSwitchWeaponAction(action)
        }
    }

    /**
     * Perform aim adjustment
     */
    private suspend fun performAimAction(action: GameAction.Aim) {
        val gesture = GestureUtils.createAimGesture(
            targetPoint = action.targetPoint,
            smoothing = action.smoothing,
            speed = action.speed
        )
        
        dispatchGesture(gesture, null, null)
        Timber.d("Performed aim action to (${action.targetPoint.x}, ${action.targetPoint.y})")
    }

    /**
     * Perform fire action
     */
    private suspend fun performFireAction(action: GameAction.Fire) {
        repeat(action.burstCount) {
            val gesture = GestureUtils.createTapGesture(
                point = GestureUtils.getFireButtonPosition(),
                duration = action.duration
            )
            
            dispatchGesture(gesture, null, null)
            
            if (action.burstCount > 1 && it < action.burstCount - 1) {
                delay(100) // Brief delay between burst shots
            }
        }
        
        Timber.d("Performed fire action (${action.burstCount} shots)")
    }

    /**
     * Perform reload action
     */
    private suspend fun performReloadAction() {
        val gesture = GestureUtils.createTapGesture(
            point = GestureUtils.getReloadButtonPosition(),
            duration = 100L
        )
        
        dispatchGesture(gesture, null, null)
        Timber.d("Performed reload action")
    }

    /**
     * Perform jump action
     */
    private suspend fun performJumpAction() {
        val gesture = GestureUtils.createTapGesture(
            point = GestureUtils.getJumpButtonPosition(),
            duration = 100L
        )
        
        dispatchGesture(gesture, null, null)
        Timber.d("Performed jump action")
    }

    /**
     * Perform crouch action
     */
    private suspend fun performCrouchAction(action: GameAction.Crouch) {
        val gesture = GestureUtils.createTapGesture(
            point = GestureUtils.getCrouchButtonPosition(),
            duration = if (action.toggle) 100L else 500L
        )
        
        dispatchGesture(gesture, null, null)
        Timber.d("Performed crouch action (toggle: ${action.toggle})")
    }

    /**
     * Perform movement action
     */
    private suspend fun performMoveAction(action: GameAction.Move) {
        val gesture = GestureUtils.createMoveGesture(
            direction = action.direction,
            duration = action.duration
        )
        
        dispatchGesture(gesture, null, null)
        Timber.d("Performed move action: ${action.direction}")
    }

    /**
     * Perform scope/ADS action
     */
    private suspend fun performScopeAction(action: GameAction.Scope) {
        val gesture = if (action.enable) {
            GestureUtils.createLongPressGesture(
                point = GestureUtils.getScopeButtonPosition(),
                duration = 2000L
            )
        } else {
            GestureUtils.createTapGesture(
                point = GestureUtils.getScopeButtonPosition(),
                duration = 100L
            )
        }
        
        dispatchGesture(gesture, null, null)
        Timber.d("Performed scope action (enable: ${action.enable})")
    }

    /**
     * Perform build action
     */
    private suspend fun performBuildAction(action: GameAction.Build) {
        // First select build type
        val buildSelectGesture = GestureUtils.createTapGesture(
            point = GestureUtils.getBuildButtonPosition(action.buildType),
            duration = 100L
        )
        
        dispatchGesture(buildSelectGesture, null, null)
        delay(200) // Wait for build mode to activate
        
        // Then place at position
        val placeGesture = GestureUtils.createTapGesture(
            point = action.position,
            duration = 100L
        )
        
        dispatchGesture(placeGesture, null, null)
        Timber.d("Performed build action: ${action.buildType}")
    }

    /**
     * Perform interact action
     */
    private suspend fun performInteractAction(action: GameAction.Interact) {
        val gesture = GestureUtils.createTapGesture(
            point = action.position,
            duration = 200L
        )
        
        dispatchGesture(gesture, null, null)
        Timber.d("Performed interact action at (${action.position.x}, ${action.position.y})")
    }

    /**
     * Perform weapon switch action
     */
    private suspend fun performSwitchWeaponAction(action: GameAction.SwitchWeapon) {
        val gesture = GestureUtils.createTapGesture(
            point = GestureUtils.getWeaponSlotPosition(action.weaponSlot),
            duration = 100L
        )
        
        dispatchGesture(gesture, null, null)
        Timber.d("Performed weapon switch to slot ${action.weaponSlot}")
    }
}