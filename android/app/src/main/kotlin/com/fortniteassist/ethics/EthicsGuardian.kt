package com.fortniteassist.ethics

import android.content.Context
import com.fortniteassist.data.DetectionResult
import com.fortniteassist.data.GameAction
import kotlinx.coroutines.*
import timber.log.Timber
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong

/**
 * Ethics Guardian - Monitors usage patterns to prevent abuse
 * Ensures FortniteAssist remains within ethical boundaries as assistive technology
 */
class EthicsGuardian(private val context: Context) {

    private val isMonitoring = AtomicBoolean(false)
    private val monitoringScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    
    // Usage tracking
    private val sessionStartTime = AtomicLong(0)
    private val totalActionsPerformed = AtomicInteger(0)
    private val suspiciousActivityCount = AtomicInteger(0)
    
    // Pattern detection
    private val recentActions = ConcurrentLinkedQueue<ActionRecord>()
    private val recentDetections = ConcurrentLinkedQueue<DetectionRecord>()
    private val performanceMetrics = PerformanceTracker()
    
    // Thresholds for suspicious behavior
    private val maxActionsPerMinute = 120 // 2 actions per second max
    private val maxContinuousUsage = 4 * 60 * 60 * 1000L // 4 hours
    private val minDetectionAccuracy = 0.3f // Below this suggests manipulation
    private val maxSuspiciousEvents = 10 // Before triggering warnings
    
    companion object {
        private const val TAG = "EthicsGuardian"
        private const val MAX_RECENT_ACTIONS = 1000
        private const val MAX_RECENT_DETECTIONS = 500
        private const val MONITORING_INTERVAL = 30000L // 30 seconds
    }

    /**
     * Data class for action records
     */
    data class ActionRecord(
        val timestamp: Long,
        val actionType: String,
        val confidence: Float,
        val wasSuccessful: Boolean
    )

    /**
     * Data class for detection records
     */
    data class DetectionRecord(
        val timestamp: Long,
        val enemyCount: Int,
        val weaponCount: Int,
        val averageConfidence: Float,
        val processingTime: Long
    )

    /**
     * Ethics violation types
     */
    enum class ViolationType {
        EXCESSIVE_USAGE,
        SUSPICIOUS_PATTERNS,
        MANIPULATION_DETECTED,
        PERFORMANCE_ANOMALY,
        RAPID_FIRE_ABUSE,
        INHUMAN_ACCURACY
    }

    /**
     * Ethics violation data
     */
    data class EthicsViolation(
        val type: ViolationType,
        val severity: Severity,
        val description: String,
        val timestamp: Long,
        val evidence: Map<String, Any>
    )

    /**
     * Violation severity levels
     */
    enum class Severity {
        LOW,      // Warning only
        MEDIUM,   // Temporary restrictions
        HIGH,     // Service suspension
        CRITICAL  // Permanent ban
    }

    /**
     * Performance tracking for anomaly detection
     */
    private class PerformanceTracker {
        private val accuracyHistory = mutableListOf<Float>()
        private val responseTimeHistory = mutableListOf<Long>()
        private val maxHistorySize = 100

        fun addAccuracy(accuracy: Float) {
            synchronized(accuracyHistory) {
                accuracyHistory.add(accuracy)
                if (accuracyHistory.size > maxHistorySize) {
                    accuracyHistory.removeAt(0)
                }
            }
        }

        fun addResponseTime(responseTime: Long) {
            synchronized(responseTimeHistory) {
                responseTimeHistory.add(responseTime)
                if (responseTimeHistory.size > maxHistorySize) {
                    responseTimeHistory.removeAt(0)
                }
            }
        }

        fun getAverageAccuracy(): Float {
            synchronized(accuracyHistory) {
                return if (accuracyHistory.isEmpty()) 0f else accuracyHistory.average().toFloat()
            }
        }

        fun getAverageResponseTime(): Long {
            synchronized(responseTimeHistory) {
                return if (responseTimeHistory.isEmpty()) 0L else responseTimeHistory.average().toLong()
            }
        }

        fun isPerformanceAnomalous(): Boolean {
            val avgAccuracy = getAverageAccuracy()
            val avgResponseTime = getAverageResponseTime()
            
            // Suspiciously high accuracy (>95%) or impossibly fast response times (<10ms)
            return avgAccuracy > 0.95f || avgResponseTime < 10L
        }
    }

    /**
     * Start ethics monitoring
     */
    fun startMonitoring() {
        if (isMonitoring.compareAndSet(false, true)) {
            sessionStartTime.set(System.currentTimeMillis())
            
            monitoringScope.launch {
                monitoringLoop()
            }
            
            Timber.i("$TAG: Ethics monitoring started")
        }
    }

    /**
     * Stop ethics monitoring
     */
    fun stopMonitoring() {
        isMonitoring.set(false)
        Timber.i("$TAG: Ethics monitoring stopped")
    }

    /**
     * Record a game action for analysis
     */
    fun recordAction(action: GameAction, wasSuccessful: Boolean, confidence: Float = 0.5f) {
        if (!isMonitoring.get()) return

        val record = ActionRecord(
            timestamp = System.currentTimeMillis(),
            actionType = action.type.name,
            confidence = confidence,
            wasSuccessful = wasSuccessful
        )

        recentActions.offer(record)
        totalActionsPerformed.incrementAndGet()

        // Maintain queue size
        while (recentActions.size > MAX_RECENT_ACTIONS) {
            recentActions.poll()
        }

        // Update performance metrics
        performanceMetrics.addAccuracy(confidence)
    }

    /**
     * Record a detection result for analysis
     */
    fun recordDetection(detectionResult: DetectionResult, processingTime: Long) {
        if (!isMonitoring.get()) return

        val record = DetectionRecord(
            timestamp = detectionResult.timestamp,
            enemyCount = detectionResult.enemies.size,
            weaponCount = detectionResult.weapons.size,
            averageConfidence = detectionResult.confidence,
            processingTime = processingTime
        )

        recentDetections.offer(record)

        // Maintain queue size
        while (recentDetections.size > MAX_RECENT_DETECTIONS) {
            recentDetections.poll()
        }

        // Update performance metrics
        performanceMetrics.addResponseTime(processingTime)
    }

    /**
     * Check if current usage is within ethical bounds
     */
    fun isUsageEthical(): Boolean {
        if (!isMonitoring.get()) return true

        val violations = detectViolations()
        return violations.none { it.severity >= Severity.HIGH }
    }

    /**
     * Get current ethics status
     */
    fun getEthicsStatus(): EthicsStatus {
        val violations = detectViolations()
        val highSeverityViolations = violations.filter { it.severity >= Severity.HIGH }
        
        return EthicsStatus(
            isCompliant = highSeverityViolations.isEmpty(),
            violations = violations,
            sessionDuration = System.currentTimeMillis() - sessionStartTime.get(),
            totalActions = totalActionsPerformed.get(),
            suspiciousEvents = suspiciousActivityCount.get(),
            averageAccuracy = performanceMetrics.getAverageAccuracy(),
            averageResponseTime = performanceMetrics.getAverageResponseTime()
        )
    }

    /**
     * Main monitoring loop
     */
    private suspend fun monitoringLoop() {
        while (isMonitoring.get()) {
            try {
                performEthicsCheck()
                delay(MONITORING_INTERVAL)
            } catch (e: Exception) {
                Timber.e(e, "$TAG: Error in monitoring loop")
                delay(5000) // Brief delay before retrying
            }
        }
    }

    /**
     * Perform comprehensive ethics check
     */
    private fun performEthicsCheck() {
        val violations = detectViolations()
        
        violations.forEach { violation ->
            when (violation.severity) {
                Severity.LOW -> {
                    Timber.w("$TAG: Low severity ethics violation: ${violation.description}")
                }
                Severity.MEDIUM -> {
                    Timber.w("$TAG: Medium severity ethics violation: ${violation.description}")
                    suspiciousActivityCount.incrementAndGet()
                }
                Severity.HIGH -> {
                    Timber.e("$TAG: High severity ethics violation: ${violation.description}")
                    suspiciousActivityCount.incrementAndGet()
                    // Could trigger temporary service suspension
                }
                Severity.CRITICAL -> {
                    Timber.e("$TAG: Critical ethics violation: ${violation.description}")
                    suspiciousActivityCount.incrementAndGet()
                    // Could trigger permanent service ban
                }
            }
        }
    }

    /**
     * Detect various types of ethics violations
     */
    private fun detectViolations(): List<EthicsViolation> {
        val violations = mutableListOf<EthicsViolation>()
        val currentTime = System.currentTimeMillis()

        // Check for excessive usage
        val sessionDuration = currentTime - sessionStartTime.get()
        if (sessionDuration > maxContinuousUsage) {
            violations.add(EthicsViolation(
                type = ViolationType.EXCESSIVE_USAGE,
                severity = Severity.MEDIUM,
                description = "Continuous usage exceeds recommended limits (${sessionDuration / 1000 / 60} minutes)",
                timestamp = currentTime,
                evidence = mapOf("sessionDuration" to sessionDuration)
            ))
        }

        // Check for rapid-fire actions
        val recentActionsList = recentActions.toList()
        val actionsInLastMinute = recentActionsList.count { currentTime - it.timestamp < 60000 }
        if (actionsInLastMinute > maxActionsPerMinute) {
            violations.add(EthicsViolation(
                type = ViolationType.RAPID_FIRE_ABUSE,
                severity = Severity.HIGH,
                description = "Excessive actions per minute: $actionsInLastMinute (max: $maxActionsPerMinute)",
                timestamp = currentTime,
                evidence = mapOf("actionsPerMinute" to actionsInLastMinute)
            ))
        }

        // Check for inhuman accuracy
        val avgAccuracy = performanceMetrics.getAverageAccuracy()
        if (avgAccuracy > 0.95f && recentActionsList.size > 50) {
            violations.add(EthicsViolation(
                type = ViolationType.INHUMAN_ACCURACY,
                severity = Severity.HIGH,
                description = "Suspiciously high accuracy: ${(avgAccuracy * 100).toInt()}%",
                timestamp = currentTime,
                evidence = mapOf("accuracy" to avgAccuracy)
            ))
        }

        // Check for performance anomalies
        if (performanceMetrics.isPerformanceAnomalous()) {
            violations.add(EthicsViolation(
                type = ViolationType.PERFORMANCE_ANOMALY,
                severity = Severity.MEDIUM,
                description = "Performance metrics suggest possible manipulation",
                timestamp = currentTime,
                evidence = mapOf(
                    "avgAccuracy" to avgAccuracy,
                    "avgResponseTime" to performanceMetrics.getAverageResponseTime()
                )
            ))
        }

        // Check for suspicious detection patterns
        val recentDetectionsList = recentDetections.toList()
        if (recentDetectionsList.isNotEmpty()) {
            val avgDetectionAccuracy = recentDetectionsList.map { it.averageConfidence }.average().toFloat()
            if (avgDetectionAccuracy < minDetectionAccuracy) {
                violations.add(EthicsViolation(
                    type = ViolationType.MANIPULATION_DETECTED,
                    severity = Severity.MEDIUM,
                    description = "Detection accuracy below expected threshold: ${(avgDetectionAccuracy * 100).toInt()}%",
                    timestamp = currentTime,
                    evidence = mapOf("detectionAccuracy" to avgDetectionAccuracy)
                ))
            }
        }

        return violations
    }

    /**
     * Ethics status data class
     */
    data class EthicsStatus(
        val isCompliant: Boolean,
        val violations: List<EthicsViolation>,
        val sessionDuration: Long,
        val totalActions: Int,
        val suspiciousEvents: Int,
        val averageAccuracy: Float,
        val averageResponseTime: Long
    )

    /**
     * Cleanup resources
     */
    fun cleanup() {
        stopMonitoring()
        monitoringScope.cancel()
        recentActions.clear()
        recentDetections.clear()
        Timber.i("$TAG: Ethics guardian cleaned up")
    }
}