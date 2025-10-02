package com.fortniteassist.capture

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Handler
import android.os.HandlerThread
import android.util.DisplayMetrics
import android.view.WindowManager
import kotlinx.coroutines.*
import timber.log.Timber
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong

/**
 * Service responsible for capturing screen content using MediaProjection API
 * Optimized for performance and memory efficiency
 */
class ScreenCaptureService(private val context: Context) {

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var backgroundThread: HandlerThread? = null
    private var backgroundHandler: Handler? = null
    
    private val isCapturing = AtomicBoolean(false)
    private val frameCount = AtomicInteger(0)
    private val droppedFrames = AtomicInteger(0)
    private val lastFrameTime = AtomicLong(0)
    
    private var captureSettings = CaptureSettings()
    private var mediaProjectionManager: MediaProjectionManager? = null
    private var resultCode: Int = 0
    private var resultData: Intent? = null
    
    // Performance monitoring
    private val fpsCalculator = FpsCalculator()
    private val memoryMonitor = MemoryMonitor()
    
    // Frame buffer for AI processing
    private val frameBuffer = FrameBuffer(3) // Triple buffering
    
    companion object {
        private const val VIRTUAL_DISPLAY_NAME = "FortniteAssist_Capture"
        private const val CAPTURE_THREAD_NAME = "ScreenCapture"
    }

    init {
        mediaProjectionManager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        setupBackgroundThread()
    }

    /**
     * Data class for capture settings
     */
    data class CaptureSettings(
        val targetFps: Int = 30,
        val quality: Int = 80,
        val enableGpu: Boolean = true,
        val bufferSize: Int = 3
    )

    /**
     * Data class for capture statistics
     */
    data class CaptureStatistics(
        val fps: Double,
        val frameCount: Int,
        val averageLatency: Double,
        val droppedFrames: Int,
        val memoryUsage: Double
    )

    /**
     * Set media projection data from permission result
     */
    fun setMediaProjectionData(resultCode: Int, data: Intent) {
        context.resultCode = resultCode
        context.resultData = data
        Timber.d("Media projection data set")
    }

    /**
     * Start screen capture
     */
    suspend fun startCapture(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            if (isCapturing.get()) {
                return@withContext Result.failure(IllegalStateException("Capture already in progress"))
            }

            val projectionManager = mediaProjectionManager
                ?: return@withContext Result.failure(IllegalStateException("MediaProjectionManager not available"))

            val data = resultData
                ?: return@withContext Result.failure(IllegalStateException("No media projection data available"))

            // Create media projection
            mediaProjection = projectionManager.getMediaProjection(resultCode, data)
            
            // Setup virtual display and image reader
            setupImageReader()
            setupVirtualDisplay()
            
            isCapturing.set(true)
            frameCount.set(0)
            droppedFrames.set(0)
            fpsCalculator.reset()
            
            Timber.i("Screen capture started successfully")
            Result.success(Unit)
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to start screen capture")
            cleanup()
            Result.failure(e)
        }
    }

    /**
     * Stop screen capture
     */
    suspend fun stopCapture(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            if (!isCapturing.get()) {
                return@withContext Result.failure(IllegalStateException("Capture not in progress"))
            }

            isCapturing.set(false)
            cleanup()
            
            Timber.i("Screen capture stopped successfully")
            Result.success(Unit)
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to stop screen capture")
            Result.failure(e)
        }
    }

    /**
     * Check if currently capturing
     */
    fun isCapturing(): Boolean = isCapturing.get()

    /**
     * Get the latest captured frame
     */
    fun getLatestFrame(): Bitmap? = frameBuffer.getLatestFrame()

    /**
     * Get capture statistics
     */
    fun getCaptureStatistics(): CaptureStatistics {
        return CaptureStatistics(
            fps = fpsCalculator.getCurrentFps(),
            frameCount = frameCount.get(),
            averageLatency = fpsCalculator.getAverageLatency(),
            droppedFrames = droppedFrames.get(),
            memoryUsage = memoryMonitor.getCurrentUsage()
        )
    }

    /**
     * Update capture settings
     */
    fun updateSettings(settings: CaptureSettings) {
        context.captureSettings = settings
        
        // Apply settings if currently capturing
        if (isCapturing.get()) {
            // Restart capture with new settings
            GlobalScope.launch {
                stopCapture()
                delay(100) // Brief delay to ensure cleanup
                startCapture()
            }
        }
    }

    /**
     * Setup background thread for capture operations
     */
    private fun setupBackgroundThread() {
        backgroundThread = HandlerThread(CAPTURE_THREAD_NAME).apply {
            start()
            backgroundHandler = Handler(looper)
        }
    }

    /**
     * Setup image reader for frame capture
     */
    private fun setupImageReader() {
        val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val displayMetrics = DisplayMetrics()
        windowManager.defaultDisplay.getMetrics(displayMetrics)
        
        val width = displayMetrics.widthPixels
        val height = displayMetrics.heightPixels
        val density = displayMetrics.densityDpi
        
        imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, captureSettings.bufferSize)
        
        imageReader?.setOnImageAvailableListener({ reader ->
            handleNewFrame(reader)
        }, backgroundHandler)
        
        Timber.d("ImageReader setup: ${width}x${height}, density: $density")
    }

    /**
     * Setup virtual display for screen mirroring
     */
    private fun setupVirtualDisplay() {
        val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val displayMetrics = DisplayMetrics()
        windowManager.defaultDisplay.getMetrics(displayMetrics)
        
        virtualDisplay = mediaProjection?.createVirtualDisplay(
            VIRTUAL_DISPLAY_NAME,
            displayMetrics.widthPixels,
            displayMetrics.heightPixels,
            displayMetrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            backgroundHandler
        )
        
        Timber.d("Virtual display created")
    }

    /**
     * Handle new frame from image reader
     */
    private fun handleNewFrame(reader: ImageReader) {
        try {
            val image = reader.acquireLatestImage() ?: return
            
            val currentTime = System.currentTimeMillis()
            val lastTime = lastFrameTime.getAndSet(currentTime)
            
            // Calculate FPS and latency
            if (lastTime > 0) {
                val deltaTime = currentTime - lastTime
                fpsCalculator.addFrame(deltaTime)
            }
            
            // Convert image to bitmap
            val bitmap = imageToBitmap(image)
            image.close()
            
            if (bitmap != null) {
                // Add to frame buffer for AI processing
                val wasAdded = frameBuffer.addFrame(bitmap)
                if (wasAdded) {
                    frameCount.incrementAndGet()
                } else {
                    droppedFrames.incrementAndGet()
                    Timber.w("Frame dropped due to full buffer")
                }
            }
            
        } catch (e: Exception) {
            Timber.e(e, "Error handling new frame")
            droppedFrames.incrementAndGet()
        }
    }

    /**
     * Convert Image to Bitmap
     */
    private fun imageToBitmap(image: Image): Bitmap? {
        try {
            val planes = image.planes
            val buffer = planes[0].buffer
            val pixelStride = planes[0].pixelStride
            val rowStride = planes[0].rowStride
            val rowPadding = rowStride - pixelStride * image.width
            
            val bitmap = Bitmap.createBitmap(
                image.width + rowPadding / pixelStride,
                image.height,
                Bitmap.Config.ARGB_8888
            )
            
            bitmap.copyPixelsFromBuffer(buffer)
            
            // Crop if there's row padding
            return if (rowPadding == 0) {
                bitmap
            } else {
                val croppedBitmap = Bitmap.createBitmap(bitmap, 0, 0, image.width, image.height)
                bitmap.recycle()
                croppedBitmap
            }
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to convert image to bitmap")
            return null
        }
    }

    /**
     * Cleanup resources
     */
    fun cleanup() {
        virtualDisplay?.release()
        virtualDisplay = null
        
        imageReader?.close()
        imageReader = null
        
        mediaProjection?.stop()
        mediaProjection = null
        
        frameBuffer.clear()
        
        backgroundThread?.quitSafely()
        backgroundThread = null
        backgroundHandler = null
        
        Timber.d("Screen capture resources cleaned up")
    }

    /**
     * FPS Calculator for performance monitoring
     */
    private class FpsCalculator {
        private val frameTimes = mutableListOf<Long>()
        private val maxSamples = 30
        
        fun addFrame(deltaTime: Long) {
            synchronized(frameTimes) {
                frameTimes.add(deltaTime)
                if (frameTimes.size > maxSamples) {
                    frameTimes.removeAt(0)
                }
            }
        }
        
        fun getCurrentFps(): Double {
            synchronized(frameTimes) {
                if (frameTimes.isEmpty()) return 0.0
                val averageDelta = frameTimes.average()
                return if (averageDelta > 0) 1000.0 / averageDelta else 0.0
            }
        }
        
        fun getAverageLatency(): Double {
            synchronized(frameTimes) {
                return if (frameTimes.isEmpty()) 0.0 else frameTimes.average()
            }
        }
        
        fun reset() {
            synchronized(frameTimes) {
                frameTimes.clear()
            }
        }
    }

    /**
     * Memory Monitor for tracking memory usage
     */
    private class MemoryMonitor {
        fun getCurrentUsage(): Double {
            val runtime = Runtime.getRuntime()
            val usedMemory = runtime.totalMemory() - runtime.freeMemory()
            return usedMemory / (1024.0 * 1024.0) // Convert to MB
        }
    }

    /**
     * Frame Buffer for storing captured frames
     */
    private class FrameBuffer(private val capacity: Int) {
        private val frames = mutableListOf<Bitmap>()
        private var currentIndex = 0
        
        @Synchronized
        fun addFrame(bitmap: Bitmap): Boolean {
            return try {
                if (frames.size < capacity) {
                    frames.add(bitmap)
                } else {
                    // Recycle old bitmap and replace
                    frames[currentIndex].recycle()
                    frames[currentIndex] = bitmap
                    currentIndex = (currentIndex + 1) % capacity
                }
                true
            } catch (e: Exception) {
                Timber.e(e, "Failed to add frame to buffer")
                false
            }
        }
        
        @Synchronized
        fun getLatestFrame(): Bitmap? {
            return if (frames.isNotEmpty()) {
                val latestIndex = if (frames.size < capacity) frames.size - 1 else (currentIndex - 1 + capacity) % capacity
                frames[latestIndex]
            } else {
                null
            }
        }
        
        @Synchronized
        fun clear() {
            frames.forEach { it.recycle() }
            frames.clear()
            currentIndex = 0
        }
    }
}