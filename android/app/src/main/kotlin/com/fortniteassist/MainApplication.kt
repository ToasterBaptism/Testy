package com.fortniteassist

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.fortniteassist.capture.ScreenCaptureService
import timber.log.Timber

/**
 * Main Application class for FortniteAssist
 * Initializes React Native and core services
 */
class MainApplication : Application(), ReactApplication {

    // Core services
    private var screenCaptureService: ScreenCaptureService? = null

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Add custom native modules here
                    add(FortniteAssistPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = false

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        
        // Initialize logging
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
        
        Timber.i("FortniteAssist Application starting...")
        
        SoLoader.init(this, false)
        
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
        
        // Initialize core services
        initializeServices()
    }
    
    private fun initializeServices() {
        Timber.d("Initializing core services...")
        
        // Initialize screen capture service
        screenCaptureService = ScreenCaptureService(this)
        Timber.d("Screen capture service initialized")
    }
    
    /**
     * Get the screen capture service instance
     */
    fun getScreenCaptureService(): ScreenCaptureService? = screenCaptureService
}