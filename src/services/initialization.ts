/**
 * Service initialization for FortniteAssist
 * Handles startup sequence and service dependencies
 */

import {NativeModules, DeviceEventEmitter} from 'react-native';
import {store} from './store';
import {
  updateServiceState,
  updatePermissionState,
  updatePerformanceMetrics,
  updateDetectionResult,
  addError,
} from './store';
import {ServiceStatus, PermissionStatus} from '@/types';
import {checkPermissions} from './permissions';
import {setupAudioFeedback} from './audio';
import {setupHapticFeedback} from './haptics';
import logger from './logging';

const {
  ScreenCaptureModule,
  AIInferenceModule,
  InputSimulationModule,
  AccessibilityModule,
  SettingsModule,
  PermissionsModule,
} = NativeModules;

/**
 * Initialize all core services
 */
export async function initializeServices(): Promise<void> {
  try {
    logger.i("Init", '🚀 Initializing FortniteAssist services...');

    // 1. Initialize logging
    await initializeLogging();

    // 2. Check and request permissions
    await initializePermissions();

    // 3. Setup event listeners
    setupEventListeners();

    // 4. Initialize native modules
    await initializeNativeModules();

    // 5. Setup audio and haptic feedback
    await setupFeedbackSystems();

    // 6. Load AI model
    await loadAIModel();

    // 7. Validate system readiness
    await validateSystemReadiness();

    logger.i("Init", '✅ All services initialized successfully');
  } catch (error) {
    logger.e("Init", '❌ Service initialization failed:', error);
    store.dispatch(addError(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`));
    throw error;
  }
}

/**
 * Initialize logging system
 */
async function initializeLogging(): Promise<void> {
  logger.i("Init", '📝 Initializing logging system...');
  // Logging is already initialized by importing Timber
}

/**
 * Initialize permissions
 */
async function initializePermissions(): Promise<void> {
  logger.i("Init", '🔐 Checking permissions...');

  try {
    const permissions = await checkPermissions();
    
    // Update store with current permission states
    Object.entries(permissions).forEach(([permission, status]) => {
      store.dispatch(
        updatePermissionState({
          permission: permission as keyof typeof permissions,
          status: status as PermissionStatus,
        }),
      );
    });

    logger.i("Init", 'Permissions checked:', permissions);
  } catch (error) {
    logger.e("Init", 'Failed to check permissions:', error);
    throw error;
  }
}

/**
 * Setup event listeners for native modules
 */
function setupEventListeners(): void {
  logger.i("Init", '📡 Setting up event listeners...');

  // Screen capture events
  DeviceEventEmitter.addListener(
    ScreenCaptureModule.EVENTS.CAPTURE_STARTED,
    () => {
      store.dispatch(
        updateServiceState({
          service: 'screenCapture',
          status: ServiceStatus.RUNNING,
        }),
      );
      logger.i("Init", 'Screen capture started');
    },
  );

  DeviceEventEmitter.addListener(
    ScreenCaptureModule.EVENTS.CAPTURE_STOPPED,
    () => {
      store.dispatch(
        updateServiceState({
          service: 'screenCapture',
          status: ServiceStatus.STOPPED,
        }),
      );
      logger.i("Init", 'Screen capture stopped');
    },
  );

  DeviceEventEmitter.addListener(
    ScreenCaptureModule.EVENTS.CAPTURE_ERROR,
    (error: any) => {
      store.dispatch(
        updateServiceState({
          service: 'screenCapture',
          status: ServiceStatus.ERROR,
        }),
      );
      store.dispatch(addError(`Screen capture error: ${error.message}`));
      logger.e("Init", 'Screen capture error:', error);
    },
  );

  // AI inference events
  DeviceEventEmitter.addListener(
    AIInferenceModule.EVENTS.MODEL_LOADED,
    (data: any) => {
      store.dispatch(
        updateServiceState({
          service: 'aiInference',
          status: ServiceStatus.RUNNING,
        }),
      );
      logger.i("Init", 'AI model loaded:', data.modelName);
    },
  );

  DeviceEventEmitter.addListener(
    AIInferenceModule.EVENTS.MODEL_ERROR,
    (error: any) => {
      store.dispatch(
        updateServiceState({
          service: 'aiInference',
          status: ServiceStatus.ERROR,
        }),
      );
      store.dispatch(addError(`AI model error: ${error.error}`));
      logger.e("Init", 'AI model error:', error);
    },
  );

  DeviceEventEmitter.addListener(
    AIInferenceModule.EVENTS.INFERENCE_RESULT,
    (result: any) => {
      store.dispatch(updateDetectionResult(result));
      // Update performance metrics if available
      if (result.performance) {
        store.dispatch(updatePerformanceMetrics(result.performance));
      }
    },
  );

  DeviceEventEmitter.addListener(
    AIInferenceModule.EVENTS.PERFORMANCE_UPDATE,
    (metrics: any) => {
      store.dispatch(updatePerformanceMetrics(metrics));
    },
  );

  logger.i("Init", 'Event listeners setup complete');
}

/**
 * Initialize native modules
 */
async function initializeNativeModules(): Promise<void> {
  logger.i("Init", '🔧 Initializing native modules...');

  try {
    // Check if modules are available
    if (!ScreenCaptureModule) {
      throw new Error('ScreenCaptureModule not available');
    }
    if (!AIInferenceModule) {
      throw new Error('AIInferenceModule not available');
    }
    if (!InputSimulationModule) {
      throw new Error('InputSimulationModule not available');
    }
    if (!AccessibilityModule) {
      throw new Error('AccessibilityModule not available');
    }

    // Initialize each module
    await Promise.all([
      initializeScreenCapture(),
      initializeAIInference(),
      initializeInputSimulation(),
      initializeAccessibility(),
    ]);

    logger.i("Init", 'Native modules initialized successfully');
  } catch (error) {
    logger.e("Init", 'Failed to initialize native modules:', error);
    throw error;
  }
}

/**
 * Initialize screen capture module
 */
async function initializeScreenCapture(): Promise<void> {
  try {
    store.dispatch(
      updateServiceState({
        service: 'screenCapture',
        status: ServiceStatus.STARTING,
      }),
    );

    const isCapturing = await ScreenCaptureModule.isCapturing();
    const status = isCapturing ? ServiceStatus.RUNNING : ServiceStatus.STOPPED;
    
    store.dispatch(
      updateServiceState({
        service: 'screenCapture',
        status,
      }),
    );

    logger.i("Init", 'Screen capture module initialized');
  } catch (error) {
    store.dispatch(
      updateServiceState({
        service: 'screenCapture',
        status: ServiceStatus.ERROR,
      }),
    );
    throw error;
  }
}

/**
 * Initialize AI inference module
 */
async function initializeAIInference(): Promise<void> {
  try {
    store.dispatch(
      updateServiceState({
        service: 'aiInference',
        status: ServiceStatus.STARTING,
      }),
    );

    const isModelLoaded = await AIInferenceModule.isModelLoaded();
    const status = isModelLoaded ? ServiceStatus.RUNNING : ServiceStatus.STOPPED;
    
    store.dispatch(
      updateServiceState({
        service: 'aiInference',
        status,
      }),
    );

    logger.i("Init", 'AI inference module initialized');
  } catch (error) {
    store.dispatch(
      updateServiceState({
        service: 'aiInference',
        status: ServiceStatus.ERROR,
      }),
    );
    throw error;
  }
}

/**
 * Initialize input simulation module
 */
async function initializeInputSimulation(): Promise<void> {
  try {
    store.dispatch(
      updateServiceState({
        service: 'inputSimulation',
        status: ServiceStatus.STARTING,
      }),
    );

    // Check if accessibility service is enabled
    const isEnabled = await AccessibilityModule.isServiceEnabled();
    const status = isEnabled ? ServiceStatus.RUNNING : ServiceStatus.STOPPED;
    
    store.dispatch(
      updateServiceState({
        service: 'inputSimulation',
        status,
      }),
    );

    logger.i("Init", 'Input simulation module initialized');
  } catch (error) {
    store.dispatch(
      updateServiceState({
        service: 'inputSimulation',
        status: ServiceStatus.ERROR,
      }),
    );
    throw error;
  }
}

/**
 * Initialize accessibility module
 */
async function initializeAccessibility(): Promise<void> {
  try {
    store.dispatch(
      updateServiceState({
        service: 'accessibility',
        status: ServiceStatus.STARTING,
      }),
    );

    const isEnabled = await AccessibilityModule.isServiceEnabled();
    const status = isEnabled ? ServiceStatus.RUNNING : ServiceStatus.STOPPED;
    
    store.dispatch(
      updateServiceState({
        service: 'accessibility',
        status,
      }),
    );

    logger.i("Init", 'Accessibility module initialized');
  } catch (error) {
    store.dispatch(
      updateServiceState({
        service: 'accessibility',
        status: ServiceStatus.ERROR,
      }),
    );
    throw error;
  }
}

/**
 * Setup feedback systems
 */
async function setupFeedbackSystems(): Promise<void> {
  logger.i("Init", '🔊 Setting up feedback systems...');

  try {
    await Promise.all([setupAudioFeedback(), setupHapticFeedback()]);
    logger.i("Init", 'Feedback systems setup complete');
  } catch (error) {
    logger.e("Init", 'Failed to setup feedback systems:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Load AI model
 */
async function loadAIModel(): Promise<void> {
  logger.i("Init", '🤖 Loading AI model...');

  try {
    const modelName = 'fortnite_detection_v1.tflite';
    await AIInferenceModule.loadModel(modelName);
    logger.i("Init", 'AI model loaded successfully');
  } catch (error) {
    logger.e("Init", 'Failed to load AI model:', error);
    store.dispatch(addError(`Failed to load AI model: ${error instanceof Error ? error.message : String(error)}`));
    // Don't throw - app can still function without AI
  }
}

/**
 * Validate system readiness
 */
async function validateSystemReadiness(): Promise<void> {
  logger.i("Init", '✅ Validating system readiness...');

  const state = store.getState();
  const {services, permissions} = state.app;

  // Check critical services
  const criticalServices = ['screenCapture', 'accessibility'];
  const failedServices = criticalServices.filter(
    service => services[service as keyof typeof services] === ServiceStatus.ERROR,
  );

  if (failedServices.length > 0) {
    throw new Error(`Critical services failed: ${failedServices.join(', ')}`);
  }

  // Check critical permissions
  const criticalPermissions = ['accessibility', 'systemAlertWindow'];
  const missingPermissions = criticalPermissions.filter(
    permission =>
      permissions[permission as keyof typeof permissions] !==
      PermissionStatus.GRANTED,
  );

  if (missingPermissions.length > 0) {
    logger.w("Init", `Missing permissions: ${missingPermissions.join(', ')}`);
    // Don't throw - user can grant permissions later
  }

  logger.i("Init", 'System readiness validation complete');
}

/**
 * Cleanup services on app shutdown
 */
export async function cleanupServices(): Promise<void> {
  logger.i("Init", '🧹 Cleaning up services...');

  try {
    // Stop all services
    await Promise.allSettled([
      ScreenCaptureModule.stopCapture(),
      AIInferenceModule.stopContinuousInference(),
    ]);

    // Remove event listeners
    DeviceEventEmitter.removeAllListeners();

    logger.i("Init", 'Services cleanup complete');
  } catch (error) {
    logger.e("Init", 'Error during cleanup:', error);
  }
}