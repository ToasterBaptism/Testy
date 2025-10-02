package com.fortniteassist

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.fortniteassist.modules.*

/**
 * React Native package that registers all native modules
 */
class FortniteAssistPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(
            ScreenCaptureModule(reactContext),
            AIInferenceModule(reactContext),
            InputSimulationModule(reactContext),
            AccessibilityModule(reactContext),
            SettingsModule(reactContext),
            PermissionsModule(reactContext)
        )
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}