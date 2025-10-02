/**
 * Assistance Service
 * Main service that coordinates AI detection, aim guidance, and input simulation
 */

import {NativeModules} from 'react-native';
import logger from './logging';
import {announceToUser} from './audio';

const {ScreenCaptureModule, AIInferenceModule, InputSimulationModule} = NativeModules;

export interface AssistanceState {
  isActive: boolean;
  isInitialized: boolean;
  lastError?: string;
  detectionCount: number;
  averageFps: number;
  lastDetectionTime?: number;
}

export interface DetectionResult {
  enemies: Array<{
    boundingBox: {x: number; y: number; width: number; height: number};
    confidence: number;
    distance?: number;
  }>;
  weapons: Array<{
    boundingBox: {x: number; y: number; width: number; height: number};
    confidence: number;
    weaponType: string;
  }>;
  aimGuidance?: {
    targetPoint: {x: number; y: number};
    aimVector: {x: number; y: number};
    confidence: number;
    priority: string;
  };
  timestamp: number;
  frameWidth: number;
  frameHeight: number;
}

class AssistanceService {
  private state: AssistanceState = {
    isActive: false,
    isInitialized: false,
    detectionCount: 0,
    averageFps: 0,
  };

  private listeners: Array<(state: AssistanceState) => void> = [];
  private detectionListener?: (result: DetectionResult) => void;
  private performanceInterval?: NodeJS.Timeout;

  async initialize(): Promise<void> {
    try {
      logger.i("Assistance", 'Initializing assistance service');
      
      // Initialize AI model
      await AIInferenceModule.loadModel('fortnite_detection_demo.tflite');
      logger.i("Assistance", 'AI model loaded successfully');
      
      // Initialize screen capture service
      await ScreenCaptureModule.initialize();
      logger.i("Assistance", 'Screen capture service initialized');
      
      // Initialize input simulation
      await InputSimulationModule.initialize();
      logger.i("Assistance", 'Input simulation initialized');
      
      this.state.isInitialized = true;
      this.notifyListeners();
      
      logger.i("Assistance", 'Assistance service initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.state.lastError = errorMessage;
      logger.e("Assistance", 'Failed to initialize assistance service', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.state.isInitialized) {
      throw new Error('Assistance service not initialized');
    }

    if (this.state.isActive) {
      logger.warn('Assistance service already active');
      return;
    }

    try {
      logger.i("Assistance", 'Starting assistance service');
      
      // Request screen capture permission
      await ScreenCaptureModule.requestScreenCapturePermission();
      logger.i("Assistance", 'Screen capture permission granted');
      
      // Start screen capture
      await ScreenCaptureModule.startCapture();
      logger.i("Assistance", 'Screen capture started');
      
      // Set up detection callback
      this.setupDetectionCallback();
      
      // Start AI inference
      await AIInferenceModule.startContinuousInference();
      logger.i("Assistance", 'AI inference started');
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      this.state.isActive = true;
      this.state.lastError = undefined;
      this.state.detectionCount = 0;
      this.notifyListeners();
      
      announceToUser('Assistance started');
      logger.i("Assistance", 'Assistance service started successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.state.lastError = errorMessage;
      this.notifyListeners();
      logger.e("Assistance", 'Failed to start assistance service', error);
      
      // Cleanup on failure
      await this.cleanup();
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.state.isActive) {
      logger.warn('Assistance service not active');
      return;
    }

    try {
      logger.i("Assistance", 'Stopping assistance service');
      
      await this.cleanup();
      
      this.state.isActive = false;
      this.state.lastError = undefined;
      this.notifyListeners();
      
      announceToUser('Assistance stopped');
      logger.i("Assistance", 'Assistance service stopped successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.state.lastError = errorMessage;
      this.notifyListeners();
      logger.e("Assistance", 'Failed to stop assistance service', error);
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      // Stop performance monitoring
      if (this.performanceInterval) {
        clearInterval(this.performanceInterval);
        this.performanceInterval = undefined;
      }
      
      // Stop AI inference
      await AIInferenceModule.stopContinuousInference();
      logger.i("Assistance", 'AI inference stopped');
      
      // Stop screen capture
      await ScreenCaptureModule.stopCapture();
      logger.i("Assistance", 'Screen capture stopped');
      
      // Remove detection callback
      this.detectionListener = undefined;
      
    } catch (error) {
      logger.e("Assistance", 'Error during cleanup', error);
    }
  }

  private setupDetectionCallback(): void {
    this.detectionListener = (result: DetectionResult) => {
      try {
        this.state.detectionCount++;
        this.state.lastDetectionTime = result.timestamp;
        
        // Process detection result
        this.processDetectionResult(result);
        
        this.notifyListeners();
      } catch (error) {
        logger.e("Assistance", 'Error processing detection result', error);
      }
    };
    
    // Register callback with AI module
    AIInferenceModule.setDetectionCallback(this.detectionListener);
  }

  private async processDetectionResult(result: DetectionResult): Promise<void> {
    try {
      // Log detection info
      logger.d("Assistance", `Detected ${result.enemies.length} enemies, ${result.weapons.length} weapons`);
      
      // Process aim guidance if available
      if (result.aimGuidance && result.enemies.length > 0) {
        await this.executeAimGuidance(result.aimGuidance);
      }
      
      // Process weapon detection for pickup assistance
      if (result.weapons.length > 0) {
        await this.processWeaponDetection(result.weapons);
      }
      
    } catch (error) {
      logger.e("Assistance", 'Error processing detection result', error);
    }
  }

  private async executeAimGuidance(aimGuidance: DetectionResult['aimGuidance']): Promise<void> {
    if (!aimGuidance) return;
    
    try {
      // Calculate aim adjustment based on guidance
      const aimVector = aimGuidance.aimVector;
      const sensitivity = 0.5; // Configurable sensitivity
      
      // Apply smoothing to prevent jittery movements
      const smoothedVector = {
        x: aimVector.x * sensitivity,
        y: aimVector.y * sensitivity,
      };
      
      // Execute aim adjustment through input simulation
      await InputSimulationModule.performAimAdjustment(
        smoothedVector.x,
        smoothedVector.y,
        aimGuidance.confidence
      );
      
      logger.d("Assistance", `Aim adjustment: (${smoothedVector.x.toFixed(2)}, ${smoothedVector.y.toFixed(2)})`);
      
    } catch (error) {
      logger.e("Assistance", 'Error executing aim guidance', error);
    }
  }

  private async processWeaponDetection(weapons: DetectionResult['weapons']): Promise<void> {
    try {
      // Find the closest high-value weapon
      const priorityWeapon = weapons.find(weapon => 
        weapon.confidence > 0.7 && 
        ['ASSAULT_RIFLE', 'SNIPER_RIFLE', 'SHOTGUN'].includes(weapon.weaponType)
      );
      
      if (priorityWeapon) {
        logger.d("Assistance", `High-priority weapon detected: ${priorityWeapon.weaponType}`);
        // Could implement weapon pickup assistance here
      }
      
    } catch (error) {
      logger.e("Assistance", 'Error processing weapon detection', error);
    }
  }

  private startPerformanceMonitoring(): void {
    this.performanceInterval = setInterval(async () => {
      try {
        const metrics = await AIInferenceModule.getPerformanceMetrics();
        this.state.averageFps = metrics.averageFps || 0;
        this.notifyListeners();
      } catch (error) {
        logger.e("Assistance", 'Error getting performance metrics', error);
      }
    }, 1000); // Update every second
  }

  getState(): AssistanceState {
    return {...this.state};
  }

  addListener(listener: (state: AssistanceState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        logger.e("Assistance", 'Error in assistance service listener', error);
      }
    });
  }

  cleanup(): void {
    if (this.state.isActive) {
      this.stop().catch(error => {
        logger.e("Assistance", 'Error stopping assistance service during cleanup', error);
      });
    }
    this.listeners = [];
    this.state.isInitialized = false;
    logger.i("Assistance", 'Assistance service cleaned up');
  }
}

export const assistanceService = new AssistanceService();

// Convenience functions for React components
export const startAssistance = async (): Promise<void> => {
  await assistanceService.start();
};

export const stopAssistance = async (): Promise<void> => {
  await assistanceService.stop();
};

export const initializeAssistance = async (): Promise<void> => {
  await assistanceService.initialize();
};

export default assistanceService;