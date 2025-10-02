/**
 * Status Indicator Component
 * Shows service status with accessible visual and audio feedback
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {selectSettings} from '@/services/store';
import {ServiceStatus} from '@/types';

interface StatusIndicatorProps {
  label: string;
  status: ServiceStatus;
  accessibilityHint?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  label,
  status,
  accessibilityHint,
}) => {
  const settings = useSelector(selectSettings);

  const getStatusColor = (): string => {
    switch (status) {
      case ServiceStatus.RUNNING:
        return '#4CAF50'; // Green
      case ServiceStatus.STARTING:
      case ServiceStatus.STOPPING:
        return '#FF9800'; // Orange
      case ServiceStatus.ERROR:
        return '#F44336'; // Red
      case ServiceStatus.STOPPED:
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case ServiceStatus.RUNNING:
        return 'Running';
      case ServiceStatus.STARTING:
        return 'Starting...';
      case ServiceStatus.STOPPING:
        return 'Stopping...';
      case ServiceStatus.ERROR:
        return 'Error';
      case ServiceStatus.STOPPED:
      default:
        return 'Stopped';
    }
  };

  const getStatusIcon = (): string => {
    switch (status) {
      case ServiceStatus.RUNNING:
        return '●'; // Solid circle
      case ServiceStatus.STARTING:
      case ServiceStatus.STOPPING:
        return '◐'; // Half circle
      case ServiceStatus.ERROR:
        return '✕'; // X mark
      case ServiceStatus.STOPPED:
      default:
        return '○'; // Empty circle
    }
  };

  const getAccessibilityLabel = (): string => {
    return `${label}: ${getStatusText()}`;
  };

  return (
    <View
      style={[
        styles.container,
        settings.highContrastMode && styles.highContrastContainer,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={accessibilityHint}>
      
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.label,
            settings.largeTextMode && styles.largeText,
            settings.highContrastMode && styles.highContrastText,
          ]}>
          {label}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text
          style={[
            styles.statusIcon,
            {color: getStatusColor()},
            settings.largeTextMode && styles.largeIcon,
          ]}>
          {getStatusIcon()}
        </Text>
        
        <Text
          style={[
            styles.statusText,
            {color: getStatusColor()},
            settings.largeTextMode && styles.largeText,
            settings.highContrastMode && styles.highContrastText,
          ]}>
          {getStatusText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  highContrastContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: 2,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#424242',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    justifyContent: 'flex-end',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  largeText: {
    fontSize: 18,
  },
  largeIcon: {
    fontSize: 20,
  },
  highContrastText: {
    color: '#000000',
    fontWeight: 'bold',
  },
});

export default StatusIndicator;