/**
 * Permissions service for FortniteAssist
 * Handles all permission requests and status checking
 */

import {NativeModules, Alert, Linking} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {PermissionStatus, PermissionState} from '@/types';
import Timber from './logging';

const {PermissionsModule, AccessibilityModule} = NativeModules;

/**
 * Check all required permissions
 */
export async function checkPermissions(): Promise<PermissionState> {
  try {
    const [
      screenCapture,
      accessibility,
      systemAlertWindow,
      recordAudio,
    ] = await Promise.all([
      checkScreenCapturePermission(),
      checkAccessibilityPermission(),
      checkSystemAlertWindowPermission(),
      checkRecordAudioPermission(),
    ]);

    return {
      screenCapture,
      accessibility,
      systemAlertWindow,
      recordAudio,
    };
  } catch (error) {
    Timber.error('Failed to check permissions:', error);
    throw error;
  }
}

/**
 * Request all required permissions
 */
export async function requestAllPermissions(): Promise<PermissionState> {
  try {
    Timber.info('Requesting all permissions...');

    // Request permissions in order of importance
    const recordAudio = await requestRecordAudioPermission();
    const systemAlertWindow = await requestSystemAlertWindowPermission();
    const screenCapture = await requestScreenCapturePermission();
    const accessibility = await requestAccessibilityPermission();

    const permissions = {
      screenCapture,
      accessibility,
      systemAlertWindow,
      recordAudio,
    };

    Timber.info('Permission request results:', permissions);
    return permissions;
  } catch (error) {
    Timber.error('Failed to request permissions:', error);
    throw error;
  }
}

/**
 * Check screen capture permission
 */
export async function checkScreenCapturePermission(): Promise<PermissionStatus> {
  try {
    // Screen capture permission is handled by MediaProjection API
    // We can't check it directly, so we assume it needs to be requested
    return PermissionStatus.DENIED;
  } catch (error) {
    Timber.error('Failed to check screen capture permission:', error);
    return PermissionStatus.DENIED;
  }
}

/**
 * Request screen capture permission
 */
export async function requestScreenCapturePermission(): Promise<PermissionStatus> {
  try {
    // This will be handled by the ScreenCaptureModule when starting capture
    // For now, we return denied to indicate it needs to be requested
    return PermissionStatus.DENIED;
  } catch (error) {
    Timber.error('Failed to request screen capture permission:', error);
    return PermissionStatus.DENIED;
  }
}

/**
 * Check accessibility service permission
 */
export async function checkAccessibilityPermission(): Promise<PermissionStatus> {
  try {
    if (!AccessibilityModule) {
      return PermissionStatus.DENIED;
    }

    const isEnabled = await AccessibilityModule.isServiceEnabled();
    return isEnabled ? PermissionStatus.GRANTED : PermissionStatus.DENIED;
  } catch (error) {
    Timber.error('Failed to check accessibility permission:', error);
    return PermissionStatus.DENIED;
  }
}

/**
 * Request accessibility service permission
 */
export async function requestAccessibilityPermission(): Promise<PermissionStatus> {
  try {
    if (!AccessibilityModule) {
      return PermissionStatus.DENIED;
    }

    // Show explanation dialog first
    const userAccepted = await showAccessibilityPermissionDialog();
    if (!userAccepted) {
      return PermissionStatus.DENIED;
    }

    // Open accessibility settings
    await AccessibilityModule.requestServiceEnable();
    
    // Check if permission was granted
    // Note: This might return false immediately as the user needs to manually enable it
    const isEnabled = await AccessibilityModule.isServiceEnabled();
    return isEnabled ? PermissionStatus.GRANTED : PermissionStatus.DENIED;
  } catch (error) {
    Timber.error('Failed to request accessibility permission:', error);
    return PermissionStatus.DENIED;
  }
}

/**
 * Check system alert window permission
 */
export async function checkSystemAlertWindowPermission(): Promise<PermissionStatus> {
  try {
    if (!PermissionsModule) {
      return PermissionStatus.DENIED;
    }

    const result = await PermissionsModule.checkPermission('SYSTEM_ALERT_WINDOW');
    return mapNativePermissionResult(result);
  } catch (error) {
    Timber.error('Failed to check system alert window permission:', error);
    return PermissionStatus.DENIED;
  }
}

/**
 * Request system alert window permission
 */
export async function requestSystemAlertWindowPermission(): Promise<PermissionStatus> {
  try {
    if (!PermissionsModule) {
      return PermissionStatus.DENIED;
    }

    // Show explanation dialog first
    const userAccepted = await showSystemAlertWindowPermissionDialog();
    if (!userAccepted) {
      return PermissionStatus.DENIED;
    }

    const result = await PermissionsModule.requestPermission('SYSTEM_ALERT_WINDOW');
    return mapNativePermissionResult(result);
  } catch (error) {
    Timber.error('Failed to request system alert window permission:', error);
    return PermissionStatus.DENIED;
  }
}

/**
 * Check record audio permission
 */
export async function checkRecordAudioPermission(): Promise<PermissionStatus> {
  try {
    const result = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
    return mapPermissionResult(result);
  } catch (error) {
    Timber.error('Failed to check record audio permission:', error);
    return PermissionStatus.DENIED;
  }
}

/**
 * Request record audio permission
 */
export async function requestRecordAudioPermission(): Promise<PermissionStatus> {
  try {
    // Show explanation dialog first
    const userAccepted = await showRecordAudioPermissionDialog();
    if (!userAccepted) {
      return PermissionStatus.DENIED;
    }

    const result = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
    return mapPermissionResult(result);
  } catch (error) {
    Timber.error('Failed to request record audio permission:', error);
    return PermissionStatus.DENIED;
  }
}

/**
 * Show accessibility permission explanation dialog
 */
function showAccessibilityPermissionDialog(): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      'Accessibility Service Required',
      'FortniteAssist needs accessibility service permission to provide input assistance. This allows the app to simulate touch gestures based on AI detection results.\n\nThis is essential for the assistive technology to function.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Grant Permission',
          onPress: () => resolve(true),
        },
      ],
    );
  });
}

/**
 * Show system alert window permission explanation dialog
 */
function showSystemAlertWindowPermissionDialog(): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      'Display Over Other Apps',
      'FortniteAssist needs permission to display over other apps to show detection overlays and controls while you play.\n\nThis helps provide visual feedback about detected enemies and weapons.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Grant Permission',
          onPress: () => resolve(true),
        },
      ],
    );
  });
}

/**
 * Show record audio permission explanation dialog
 */
function showRecordAudioPermissionDialog(): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      'Microphone Access',
      'FortniteAssist may use microphone access for voice commands and audio feedback features.\n\nThis permission is optional but enhances the accessibility experience.',
      [
        {
          text: 'Skip',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Grant Permission',
          onPress: () => resolve(true),
        },
      ],
    );
  });
}

/**
 * Map react-native-permissions result to our PermissionStatus
 */
function mapPermissionResult(result: string): PermissionStatus {
  switch (result) {
    case RESULTS.GRANTED:
      return PermissionStatus.GRANTED;
    case RESULTS.DENIED:
      return PermissionStatus.DENIED;
    case RESULTS.BLOCKED:
    case RESULTS.UNAVAILABLE:
      return PermissionStatus.BLOCKED;
    default:
      return PermissionStatus.DENIED;
  }
}

/**
 * Map native module permission result to our PermissionStatus
 */
function mapNativePermissionResult(result: string): PermissionStatus {
  switch (result) {
    case 'granted':
      return PermissionStatus.GRANTED;
    case 'denied':
      return PermissionStatus.DENIED;
    case 'blocked':
    case 'never_ask_again':
      return PermissionStatus.BLOCKED;
    default:
      return PermissionStatus.DENIED;
  }
}

/**
 * Open app settings for manual permission management
 */
export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (error) {
    Timber.error('Failed to open app settings:', error);
    Alert.alert(
      'Error',
      'Could not open app settings. Please manually navigate to Settings > Apps > FortniteAssist > Permissions.',
    );
  }
}

/**
 * Check if all critical permissions are granted
 */
export function areAllCriticalPermissionsGranted(permissions: PermissionState): boolean {
  return (
    permissions.accessibility === PermissionStatus.GRANTED &&
    permissions.systemAlertWindow === PermissionStatus.GRANTED
  );
}

/**
 * Get permission status description for UI
 */
export function getPermissionStatusDescription(status: PermissionStatus): string {
  switch (status) {
    case PermissionStatus.GRANTED:
      return 'Granted';
    case PermissionStatus.DENIED:
      return 'Not granted';
    case PermissionStatus.BLOCKED:
      return 'Blocked - requires manual setup';
    case PermissionStatus.NEVER_ASK_AGAIN:
      return 'Permanently denied - requires manual setup';
    default:
      return 'Unknown';
  }
}

/**
 * Get permission importance level
 */
export function getPermissionImportance(permission: keyof PermissionState): 'critical' | 'important' | 'optional' {
  switch (permission) {
    case 'accessibility':
    case 'systemAlertWindow':
      return 'critical';
    case 'screenCapture':
      return 'important';
    case 'recordAudio':
      return 'optional';
    default:
      return 'optional';
  }
}