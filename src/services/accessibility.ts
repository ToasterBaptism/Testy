/**
 * Accessibility Service
 * Provides accessibility features and TalkBack integration
 */

import {AccessibilityInfo, Alert} from 'react-native';
import {logger} from './logging';

export interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  audioFeedbackEnabled: boolean;
}

class AccessibilityService {
  private settings: AccessibilitySettings = {
    screenReaderEnabled: false,
    highContrastEnabled: false,
    largeTextEnabled: false,
    hapticFeedbackEnabled: true,
    audioFeedbackEnabled: true,
  };

  private listeners: Array<() => void> = [];

  async initialize(): Promise<void> {
    try {
      // Check if screen reader is enabled
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      this.settings.screenReaderEnabled = screenReaderEnabled;

      // Listen for screen reader changes
      const listener = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        (isEnabled: boolean) => {
          this.settings.screenReaderEnabled = isEnabled;
          logger.info(`Screen reader ${isEnabled ? 'enabled' : 'disabled'}`);
        }
      );

      this.listeners.push(() => listener?.remove());

      logger.info('Accessibility service initialized', {
        screenReaderEnabled: this.settings.screenReaderEnabled,
      });
    } catch (error) {
      logger.error('Failed to initialize accessibility service', error);
    }
  }

  getSettings(): AccessibilitySettings {
    return {...this.settings};
  }

  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = {...this.settings, ...newSettings};
    logger.info('Accessibility settings updated', newSettings);
  }

  announceForScreenReader(message: string): void {
    if (this.settings.screenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  setAccessibilityFocus(reactTag: number): void {
    if (this.settings.screenReaderEnabled) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  }

  async checkAccessibilityPermissions(): Promise<boolean> {
    try {
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      return screenReaderEnabled;
    } catch (error) {
      logger.error('Failed to check accessibility permissions', error);
      return false;
    }
  }

  showAccessibilityAlert(title: string, message: string): void {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            this.announceForScreenReader(`${title}. ${message}. OK button pressed.`);
          },
        },
      ],
      {
        cancelable: false,
      }
    );
  }

  cleanup(): void {
    this.listeners.forEach(removeListener => removeListener());
    this.listeners = [];
    logger.info('Accessibility service cleaned up');
  }
}

export const accessibilityService = new AccessibilityService();

export const setupAccessibility = async (): Promise<void> => {
  await accessibilityService.initialize();
};

export default accessibilityService;