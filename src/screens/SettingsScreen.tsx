/**
 * Settings Screen - User preferences and configuration
 * Fully accessible settings interface with voice guidance
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

// Components
import AccessibleButton from '@/components/AccessibleButton';

// Services
import {announceToUser} from '@/services/audio';
import {triggerHapticFeedback} from '@/services/haptics';

// Store
import {
  selectSettings,
  updateSettings,
  resetSettings,
} from '@/services/store';

// Types
import type {ScreenProps, AppSettings} from '@/types';
import {HapticType} from '@/services/haptics';

const SettingsScreen: React.FC<ScreenProps> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);

  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    announceToUser('Settings screen loaded. Adjust your preferences using the controls below.');
  }, []);

  useEffect(() => {
    // Check if settings have changed
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasChanges(changed);
  }, [localSettings, settings]);

  /**
   * Update a setting value
   */
  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setLocalSettings(prev => ({...prev, [key]: value}));
    
    // Provide haptic feedback for setting changes
    if (settings.hapticFeedbackEnabled) {
      triggerHapticFeedback(HapticType.SELECTION);
    }
  };

  /**
   * Save settings
   */
  const saveSettings = () => {
    dispatch(updateSettings(localSettings));
    setHasChanges(false);
    announceToUser('Settings saved successfully');
    
    if (localSettings.hapticFeedbackEnabled) {
      triggerHapticFeedback(HapticType.SUCCESS);
    }
  };

  /**
   * Reset to defaults
   */
  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to their default values?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            dispatch(resetSettings());
            setLocalSettings(settings);
            setHasChanges(false);
            announceToUser('Settings reset to defaults');
          },
        },
      ],
    );
  };

  /**
   * Render a setting section
   */
  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          localSettings.largeTextMode && styles.largeText,
          localSettings.highContrastMode && styles.highContrastText,
        ]}
        accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );

  /**
   * Render a switch setting
   */
  const renderSwitch = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    description?: string,
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text
          style={[
            styles.settingLabel,
            localSettings.largeTextMode && styles.largeText,
            localSettings.highContrastMode && styles.highContrastText,
          ]}>
          {label}
        </Text>
        {description && (
          <Text
            style={[
              styles.settingDescription,
              localSettings.largeTextMode && styles.largeDescriptionText,
              localSettings.highContrastMode && styles.highContrastText,
            ]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: '#E0E0E0', true: '#1976D2'}}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        accessible={true}
        accessibilityLabel={`${label}. Currently ${value ? 'enabled' : 'disabled'}`}
        accessibilityHint={`Double tap to ${value ? 'disable' : 'enable'} ${label.toLowerCase()}`}
        accessibilityRole="switch"
      />
    </View>
  );

  /**
   * Render a slider setting
   */
  const renderSlider = (
    label: string,
    value: number,
    onValueChange: (value: number) => void,
    minimumValue: number = 0,
    maximumValue: number = 1,
    step: number = 0.1,
    formatValue?: (value: number) => string,
    description?: string,
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text
          style={[
            styles.settingLabel,
            localSettings.largeTextMode && styles.largeText,
            localSettings.highContrastMode && styles.highContrastText,
          ]}>
          {label}
        </Text>
        {description && (
          <Text
            style={[
              styles.settingDescription,
              localSettings.largeTextMode && styles.largeDescriptionText,
              localSettings.highContrastMode && styles.highContrastText,
            ]}>
            {description}
          </Text>
        )}
        <Text
          style={[
            styles.settingValue,
            localSettings.largeTextMode && styles.largeText,
            localSettings.highContrastMode && styles.highContrastText,
          ]}>
          {formatValue ? formatValue(value) : value.toFixed(1)}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        value={value}
        onValueChange={onValueChange}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        minimumTrackTintColor="#1976D2"
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor="#1976D2"
        accessible={true}
        accessibilityLabel={`${label} slider. Current value: ${formatValue ? formatValue(value) : value.toFixed(1)}`}
        accessibilityHint="Slide to adjust the value"
        accessibilityRole="adjustable"
      />
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, {paddingTop: insets.top}]}
      contentContainerStyle={styles.contentContainer}
      accessibilityRole="none">

      {/* Performance Settings */}
      {renderSection(
        'Performance',
        <>
          {renderSlider(
            'Aim Sensitivity',
            localSettings.aimSensitivity,
            value => updateSetting('aimSensitivity', value),
            0.1,
            2.0,
            0.1,
            value => `${(value * 100).toFixed(0)}%`,
            'Controls how responsive aim assistance is to detected targets',
          )}

          {renderSlider(
            'FPS Limit',
            localSettings.fpsLimit,
            value => updateSetting('fpsLimit', Math.round(value)),
            15,
            60,
            5,
            value => `${value} FPS`,
            'Maximum frames per second for AI processing',
          )}

          {renderSlider(
            'Region of Interest',
            localSettings.roiSize,
            value => updateSetting('roiSize', value),
            0.5,
            1.0,
            0.1,
            value => `${(value * 100).toFixed(0)}%`,
            'Screen area to analyze for targets (smaller = better performance)',
          )}

          {renderSlider(
            'Aim Smoothing',
            localSettings.aimSmoothing,
            value => updateSetting('aimSmoothing', value),
            0.0,
            1.0,
            0.1,
            value => `${(value * 100).toFixed(0)}%`,
            'How smooth aim movements are (higher = smoother but slower)',
          )}
        </>,
      )}

      {/* Audio Settings */}
      {renderSection(
        'Audio Feedback',
        <>
          {renderSwitch(
            'Audio Cues',
            localSettings.audioCuesEnabled,
            value => updateSetting('audioCuesEnabled', value),
            'Play sound effects for important events',
          )}

          {renderSwitch(
            'Voice Announcements',
            localSettings.voiceAnnouncementsEnabled,
            value => updateSetting('voiceAnnouncementsEnabled', value),
            'Speak detection results and status updates',
          )}
        </>,
      )}

      {/* Haptic Settings */}
      {renderSection(
        'Haptic Feedback',
        <>
          {renderSwitch(
            'Haptic Feedback',
            localSettings.hapticFeedbackEnabled,
            value => updateSetting('hapticFeedbackEnabled', value),
            'Vibration feedback for interactions and events',
          )}
        </>,
      )}

      {/* Accessibility Settings */}
      {renderSection(
        'Accessibility',
        <>
          {renderSwitch(
            'High Contrast Mode',
            localSettings.highContrastMode,
            value => updateSetting('highContrastMode', value),
            'Increase contrast for better visibility',
          )}

          {renderSwitch(
            'Large Text Mode',
            localSettings.largeTextMode,
            value => updateSetting('largeTextMode', value),
            'Increase text size throughout the app',
          )}
        </>,
      )}

      {/* Debug Settings */}
      {renderSection(
        'Debug',
        <>
          {renderSwitch(
            'Debug Overlay',
            localSettings.debugOverlayEnabled,
            value => updateSetting('debugOverlayEnabled', value),
            'Show detection results and performance metrics',
          )}
        </>,
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {hasChanges && (
          <AccessibleButton
            title="Save Settings"
            onPress={saveSettings}
            variant="success"
            size="large"
            style={styles.actionButton}
            accessibilityHint="Save your current settings"
          />
        )}

        <AccessibleButton
          title="Reset to Defaults"
          onPress={resetToDefaults}
          variant="secondary"
          size="medium"
          style={styles.actionButton}
          accessibilityHint="Reset all settings to their default values"
        />
      </View>

      {/* Settings Info */}
      <View style={styles.infoContainer}>
        <Text
          style={[
            styles.infoText,
            localSettings.largeTextMode && styles.largeText,
            localSettings.highContrastMode && styles.highContrastText,
          ]}>
          Settings are automatically saved when you navigate away from this screen. 
          Adjust these settings to optimize FortniteAssist for your specific needs and device capabilities.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#757575',
    lineHeight: 16,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976D2',
    marginTop: 4,
  },
  slider: {
    width: 120,
    height: 40,
  },
  actionsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#0D47A1',
    lineHeight: 20,
  },
  largeText: {
    fontSize: 18,
  },
  largeDescriptionText: {
    fontSize: 14,
  },
  highContrastText: {
    color: '#000000',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;