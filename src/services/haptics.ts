/**
 * Haptic feedback service for FortniteAssist
 * Provides tactile feedback for accessibility and user interaction
 */

import HapticFeedback from 'react-native-haptic-feedback';
import {Vibration} from 'react-native';
import Timber from './logging';

// Haptic feedback types
export enum HapticType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
  IMPACT_LIGHT = 'impactLight',
  IMPACT_MEDIUM = 'impactMedium',
  IMPACT_HEAVY = 'impactHeavy',
  NOTIFICATION_SUCCESS = 'notificationSuccess',
  NOTIFICATION_WARNING = 'notificationWarning',
  NOTIFICATION_ERROR = 'notificationError',
}

// Custom vibration patterns for different events
const VIBRATION_PATTERNS = {
  ENEMY_DETECTED: [0, 100, 50, 100],
  WEAPON_FOUND: [0, 50, 25, 50, 25, 50],
  AIM_LOCKED: [0, 200],
  TARGET_LOST: [0, 50, 50, 50, 50, 50],
  ASSISTANCE_STARTED: [0, 100, 100, 100],
  ASSISTANCE_STOPPED: [0, 300],
  ERROR: [0, 100, 100, 100, 100, 100],
  SUCCESS: [0, 50, 50, 200],
  WARNING: [0, 100, 50, 100, 50, 100],
  BUTTON_PRESS: [0, 25],
  NAVIGATION: [0, 50],
  FOCUS_CHANGE: [0, 10],
};

class HapticsService {
  private isInitialized = false;
  private isHapticsSupported = false;
  private isVibrationSupported = false;

  /**
   * Initialize haptics service
   */
  async initialize(): Promise<void> {
    try {
      Timber.info('Initializing haptics service...');

      // Check if haptic feedback is supported
      this.isHapticsSupported = await this.checkHapticSupport();
      
      // Check if vibration is supported
      this.isVibrationSupported = this.checkVibrationSupport();

      this.isInitialized = true;
      
      Timber.info('Haptics service initialized', {
        hapticsSupported: this.isHapticsSupported,
        vibrationSupported: this.isVibrationSupported,
      });
    } catch (error) {
      Timber.error('Failed to initialize haptics service:', error);
      // Don't throw - app can work without haptics
    }
  }

  /**
   * Check if haptic feedback is supported
   */
  private async checkHapticSupport(): Promise<boolean> {
    try {
      // Try to trigger a light haptic to test support
      HapticFeedback.trigger('impactLight', {
        enableVibrateFallback: false,
        ignoreAndroidSystemSettings: false,
      });
      return true;
    } catch (error) {
      Timber.debug('Haptic feedback not supported:', error);
      return false;
    }
  }

  /**
   * Check if vibration is supported
   */
  private checkVibrationSupport(): boolean {
    try {
      // Vibration is generally supported on Android
      return true;
    } catch (error) {
      Timber.debug('Vibration not supported:', error);
      return false;
    }
  }

  /**
   * Trigger haptic feedback
   */
  async triggerHaptic(type: HapticType): Promise<void> {
    if (!this.isInitialized) {
      Timber.warn('Haptics service not initialized');
      return;
    }

    try {
      if (this.isHapticsSupported) {
        const options = {
          enableVibrateFallback: this.isVibrationSupported,
          ignoreAndroidSystemSettings: false,
        };

        HapticFeedback.trigger(type, options);
        Timber.debug(`Triggered haptic feedback: ${type}`);
      } else if (this.isVibrationSupported) {
        // Fallback to basic vibration
        this.triggerVibration('BUTTON_PRESS');
      }
    } catch (error) {
      Timber.error('Failed to trigger haptic feedback:', error);
    }
  }

  /**
   * Trigger custom vibration pattern
   */
  async triggerVibration(patternName: keyof typeof VIBRATION_PATTERNS): Promise<void> {
    if (!this.isInitialized || !this.isVibrationSupported) {
      return;
    }

    try {
      const pattern = VIBRATION_PATTERNS[patternName];
      if (pattern) {
        Vibration.vibrate(pattern);
        Timber.debug(`Triggered vibration pattern: ${patternName}`);
      }
    } catch (error) {
      Timber.error('Failed to trigger vibration:', error);
    }
  }

  /**
   * Trigger feedback for enemy detection
   */
  async enemyDetected(count: number): Promise<void> {
    if (count === 1) {
      await this.triggerHaptic(HapticType.IMPACT_MEDIUM);
    } else if (count > 1) {
      await this.triggerVibration('ENEMY_DETECTED');
    }
  }

  /**
   * Trigger feedback for weapon found
   */
  async weaponFound(): Promise<void> {
    await this.triggerVibration('WEAPON_FOUND');
  }

  /**
   * Trigger feedback for aim locked
   */
  async aimLocked(): Promise<void> {
    await this.triggerHaptic(HapticType.SUCCESS);
    await this.triggerVibration('AIM_LOCKED');
  }

  /**
   * Trigger feedback for target lost
   */
  async targetLost(): Promise<void> {
    await this.triggerVibration('TARGET_LOST');
  }

  /**
   * Trigger feedback for assistance started
   */
  async assistanceStarted(): Promise<void> {
    await this.triggerHaptic(HapticType.NOTIFICATION_SUCCESS);
    await this.triggerVibration('ASSISTANCE_STARTED');
  }

  /**
   * Trigger feedback for assistance stopped
   */
  async assistanceStopped(): Promise<void> {
    await this.triggerHaptic(HapticType.NOTIFICATION_WARNING);
    await this.triggerVibration('ASSISTANCE_STOPPED');
  }

  /**
   * Trigger feedback for button press
   */
  async buttonPress(): Promise<void> {
    await this.triggerHaptic(HapticType.LIGHT);
  }

  /**
   * Trigger feedback for navigation
   */
  async navigation(): Promise<void> {
    await this.triggerHaptic(HapticType.SELECTION);
  }

  /**
   * Trigger feedback for focus change (accessibility)
   */
  async focusChange(): Promise<void> {
    await this.triggerVibration('FOCUS_CHANGE');
  }

  /**
   * Trigger feedback for error
   */
  async error(): Promise<void> {
    await this.triggerHaptic(HapticType.NOTIFICATION_ERROR);
    await this.triggerVibration('ERROR');
  }

  /**
   * Trigger feedback for success
   */
  async success(): Promise<void> {
    await this.triggerHaptic(HapticType.NOTIFICATION_SUCCESS);
    await this.triggerVibration('SUCCESS');
  }

  /**
   * Trigger feedback for warning
   */
  async warning(): Promise<void> {
    await this.triggerHaptic(HapticType.NOTIFICATION_WARNING);
    await this.triggerVibration('WARNING');
  }

  /**
   * Trigger feedback based on performance status
   */
  async performanceStatus(status: 'good' | 'fair' | 'poor'): Promise<void> {
    switch (status) {
      case 'good':
        await this.success();
        break;
      case 'fair':
        await this.warning();
        break;
      case 'poor':
        await this.error();
        break;
    }
  }

  /**
   * Trigger feedback for detection result
   */
  async detectionResult(enemyCount: number, weaponCount: number): Promise<void> {
    if (enemyCount > 0) {
      await this.enemyDetected(enemyCount);
      
      // Small delay between feedbacks
      if (weaponCount > 0) {
        setTimeout(() => {
          this.weaponFound();
        }, 200);
      }
    } else if (weaponCount > 0) {
      await this.weaponFound();
    }
  }

  /**
   * Stop all haptic feedback and vibrations
   */
  stopAll(): void {
    try {
      Vibration.cancel();
      Timber.debug('Stopped all haptic feedback');
    } catch (error) {
      Timber.error('Failed to stop haptic feedback:', error);
    }
  }

  /**
   * Check if haptics are available
   */
  isAvailable(): boolean {
    return this.isInitialized && (this.isHapticsSupported || this.isVibrationSupported);
  }

  /**
   * Get haptics capabilities
   */
  getCapabilities(): {haptics: boolean; vibration: boolean} {
    return {
      haptics: this.isHapticsSupported,
      vibration: this.isVibrationSupported,
    };
  }

  /**
   * Cleanup haptics service
   */
  cleanup(): void {
    try {
      this.stopAll();
      this.isInitialized = false;
      Timber.info('Haptics service cleaned up');
    } catch (error) {
      Timber.error('Error during haptics service cleanup:', error);
    }
  }
}

// Create singleton instance
const hapticsService = new HapticsService();

// Export convenience functions
export const setupHapticFeedback = () => hapticsService.initialize();
export const triggerHapticFeedback = (type: HapticType) => hapticsService.triggerHaptic(type);
export const triggerVibrationPattern = (pattern: keyof typeof VIBRATION_PATTERNS) => 
  hapticsService.triggerVibration(pattern);

// Specific feedback functions
export const hapticEnemyDetected = (count: number) => hapticsService.enemyDetected(count);
export const hapticWeaponFound = () => hapticsService.weaponFound();
export const hapticAimLocked = () => hapticsService.aimLocked();
export const hapticTargetLost = () => hapticsService.targetLost();
export const hapticAssistanceStarted = () => hapticsService.assistanceStarted();
export const hapticAssistanceStopped = () => hapticsService.assistanceStopped();
export const hapticButtonPress = () => hapticsService.buttonPress();
export const hapticNavigation = () => hapticsService.navigation();
export const hapticFocusChange = () => hapticsService.focusChange();
export const hapticError = () => hapticsService.error();
export const hapticSuccess = () => hapticsService.success();
export const hapticWarning = () => hapticsService.warning();
export const hapticPerformanceStatus = (status: 'good' | 'fair' | 'poor') => 
  hapticsService.performanceStatus(status);
export const hapticDetectionResult = (enemyCount: number, weaponCount: number) =>
  hapticsService.detectionResult(enemyCount, weaponCount);

export const stopAllHaptics = () => hapticsService.stopAll();
export const isHapticsAvailable = () => hapticsService.isAvailable();
export const getHapticsCapabilities = () => hapticsService.getCapabilities();
export const cleanupHaptics = () => hapticsService.cleanup();

export default hapticsService;