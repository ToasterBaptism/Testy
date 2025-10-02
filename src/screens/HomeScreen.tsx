/**
 * Home Screen - Main control interface for FortniteAssist
 * Provides accessible controls for starting/stopping assistance
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NavigationProp} from '@react-navigation/native';
import type {RootStackParamList} from '@/types/navigation';

// Components
import AccessibleButton from '@/components/AccessibleButton';
import StatusIndicator from '@/components/StatusIndicator';
import PerformanceDisplay from '@/components/PerformanceDisplay';
import DetectionOverlay from '@/components/DetectionOverlay';

// Services
import {startAssistance, stopAssistance} from '@/services/assistance';
import {announceToUser} from '@/services/audio';

// Store
import {
  selectIsAssistanceActive,
  selectAllPermissionsGranted,
  selectCanStartAssistance,
  selectServices,
  selectPerformance,
  selectLastDetection,
  selectSettings,
  setAssistanceActive,
} from '@/services/store';

// Types
import type {ScreenProps} from '@/types';

const HomeScreen: React.FC<ScreenProps> = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  // State
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Selectors
  const isAssistanceActive = useSelector(selectIsAssistanceActive);
  const allPermissionsGranted = useSelector(selectAllPermissionsGranted);
  const canStartAssistance = useSelector(selectCanStartAssistance);
  const services = useSelector(selectServices);
  const performance = useSelector(selectPerformance);
  const lastDetection = useSelector(selectLastDetection);
  const settings = useSelector(selectSettings);

  useEffect(() => {
    // Announce screen when it loads
    announceToUser('FortniteAssist Home Screen loaded');

    // Check if TalkBack is enabled and provide additional guidance
    AccessibilityInfo.isScreenReaderEnabled().then(isEnabled => {
      if (isEnabled) {
        setTimeout(() => {
          announceToUser(
            'Welcome to FortniteAssist. Use the main control button to start or stop assistance. Navigate to settings to customize your experience.',
          );
        }, 1000);
      }
    });
  }, []);

  /**
   * Handle start assistance
   */
  const handleStartAssistance = async () => {
    if (!canStartAssistance) {
      if (!allPermissionsGranted) {
        Alert.alert(
          'Permissions Required',
          'Please grant all required permissions before starting assistance.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Go to Permissions',
              onPress: () => navigation.navigate('Permissions'),
            },
          ],
        );
        return;
      }
      return;
    }

    setIsStarting(true);
    announceToUser('Starting assistance...');

    try {
      await startAssistance();
      dispatch(setAssistanceActive(true));
      announceToUser('Assistance started successfully');
    } catch (error) {
      console.error('Failed to start assistance:', error);
      Alert.alert(
        'Error',
        `Failed to start assistance: ${error instanceof Error ? error.message : String(error)}`,
        [{text: 'OK'}],
      );
      announceToUser('Failed to start assistance');
    } finally {
      setIsStarting(false);
    }
  };

  /**
   * Handle stop assistance
   */
  const handleStopAssistance = async () => {
    setIsStopping(true);
    announceToUser('Stopping assistance...');

    try {
      await stopAssistance();
      dispatch(setAssistanceActive(false));
      announceToUser('Assistance stopped');
    } catch (error) {
      console.error('Failed to stop assistance:', error);
      Alert.alert(
        'Error',
        `Failed to stop assistance: ${error instanceof Error ? error.message : String(error)}`,
        [{text: 'OK'}],
      );
      announceToUser('Failed to stop assistance');
    } finally {
      setIsStopping(false);
    }
  };

  /**
   * Get main button text
   */
  const getMainButtonText = () => {
    if (isStarting) return 'Starting...';
    if (isStopping) return 'Stopping...';
    return isAssistanceActive ? 'Stop Assistance' : 'Start Assistance';
  };

  /**
   * Get main button accessibility label
   */
  const getMainButtonAccessibilityLabel = () => {
    const baseText = getMainButtonText();
    const status = isAssistanceActive ? 'currently active' : 'currently inactive';
    return `${baseText}. Assistance is ${status}`;
  };

  return (
    <ScrollView
      style={[styles.container, {paddingTop: insets.top}]}
      contentContainerStyle={styles.contentContainer}
      accessibilityRole="none">
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          FortniteAssist
        </Text>
        <Text style={styles.subtitle}>
          Assistive Technology for Fortnite Mobile
        </Text>
      </View>

      {/* Status Section */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          System Status
        </Text>
        
        <StatusIndicator
          label="Screen Capture"
          status={services.screenCapture}
          accessibilityHint="Shows the status of screen capture service"
        />
        
        <StatusIndicator
          label="AI Detection"
          status={services.aiInference}
          accessibilityHint="Shows the status of AI detection service"
        />
        
        <StatusIndicator
          label="Input Assistance"
          status={services.inputSimulation}
          accessibilityHint="Shows the status of input assistance service"
        />
        
        <StatusIndicator
          label="Accessibility Service"
          status={services.accessibility}
          accessibilityHint="Shows the status of accessibility service"
        />
      </View>

      {/* Main Control */}
      <View style={styles.controlSection}>
        <AccessibleButton
          title={getMainButtonText()}
          onPress={isAssistanceActive ? handleStopAssistance : handleStartAssistance}
          disabled={isStarting || isStopping || (!isAssistanceActive && !canStartAssistance)}
          style={[
            styles.mainButton,
            isAssistanceActive ? styles.stopButton : styles.startButton,
          ] as any}
          textStyle={styles.mainButtonText}
          accessibilityLabel={getMainButtonAccessibilityLabel()}
          accessibilityHint={
            isAssistanceActive
              ? 'Double tap to stop assistance'
              : 'Double tap to start assistance'
          }
        />

        {!canStartAssistance && !isAssistanceActive && (
          <Text style={styles.warningText} accessibilityRole="alert">
            {!allPermissionsGranted
              ? 'Please grant all required permissions to start assistance'
              : 'System not ready. Check status above.'}
          </Text>
        )}
      </View>

      {/* Performance Display */}
      {isAssistanceActive && (
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Performance
          </Text>
          <PerformanceDisplay metrics={performance} />
        </View>
      )}

      {/* Detection Display */}
      {isAssistanceActive && lastDetection && settings.debugOverlayEnabled && (
        <View style={styles.detectionSection}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Latest Detection
          </Text>
          <DetectionOverlay detections={[]} visible={true} />
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={styles.navigationSection}>
        <AccessibleButton
          title="Settings"
          onPress={() => navigation.navigate('Settings')}
          style={styles.navButton}
          accessibilityHint="Navigate to settings screen"
        />
        
        <AccessibleButton
          title="Permissions"
          onPress={() => navigation.navigate('Permissions')}
          style={styles.navButton}
          accessibilityHint="Navigate to permissions setup screen"
        />
        
        <AccessibleButton
          title="Help"
          onPress={() => navigation.navigate('Help')}
          style={styles.navButton}
          accessibilityHint="Navigate to help and tutorial screen"
        />
        
        <AccessibleButton
          title="About"
          onPress={() => navigation.navigate('About')}
          style={styles.navButton}
          accessibilityHint="Navigate to about screen"
        />
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
  },
  statusSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  controlSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mainButton: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
    minWidth: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  performanceSection: {
    marginBottom: 30,
  },
  detectionSection: {
    marginBottom: 30,
  },
  navigationSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  navButton: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    margin: 4,
  },
});

export default HomeScreen;