/**
 * Performance Display Component
 * Shows real-time performance metrics with accessibility support
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {selectSettings} from '@/services/store';
import {PerformanceMetrics} from '@/types';

interface PerformanceDisplayProps {
  metrics: PerformanceMetrics;
}

const PerformanceDisplay: React.FC<PerformanceDisplayProps> = ({metrics}) => {
  const settings = useSelector(selectSettings);

  const getPerformanceStatus = (): 'good' | 'fair' | 'poor' => {
    if (metrics.fps < 15 || metrics.latency > 200 || metrics.cpuUsage > 80) {
      return 'poor';
    } else if (metrics.fps < 25 || metrics.latency > 100 || metrics.cpuUsage > 60) {
      return 'fair';
    } else {
      return 'good';
    }
  };

  const getStatusColor = (): string => {
    const status = getPerformanceStatus();
    switch (status) {
      case 'good':
        return '#4CAF50';
      case 'fair':
        return '#FF9800';
      case 'poor':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const formatValue = (value: number, unit: string, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}${unit}`;
  };

  const getBatteryColor = (): string => {
    if (metrics.batteryLevel > 50) return '#4CAF50';
    if (metrics.batteryLevel > 20) return '#FF9800';
    return '#F44336';
  };

  const getAccessibilityLabel = (): string => {
    const status = getPerformanceStatus();
    return `Performance is ${status}. ${Math.round(metrics.fps)} frames per second, ${Math.round(metrics.latency)} milliseconds latency, ${Math.round(metrics.cpuUsage)} percent CPU usage, ${Math.round(metrics.batteryLevel)} percent battery remaining`;
  };

  return (
    <View
      style={[
        styles.container,
        settings.highContrastMode && styles.highContrastContainer,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={getAccessibilityLabel()}>
      
      {/* Overall Status */}
      <View style={styles.statusRow}>
        <Text
          style={[
            styles.statusLabel,
            settings.largeTextMode && styles.largeText,
            settings.highContrastMode && styles.highContrastText,
          ]}>
          Performance Status:
        </Text>
        <Text
          style={[
            styles.statusValue,
            {color: getStatusColor()},
            settings.largeTextMode && styles.largeText,
            settings.highContrastMode && styles.highContrastText,
          ]}>
          {getPerformanceStatus().toUpperCase()}
        </Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        
        {/* FPS */}
        <View style={styles.metricItem}>
          <Text
            style={[
              styles.metricLabel,
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            FPS
          </Text>
          <Text
            style={[
              styles.metricValue,
              {color: metrics.fps >= 25 ? '#4CAF50' : metrics.fps >= 15 ? '#FF9800' : '#F44336'},
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            {formatValue(metrics.fps, '', 0)}
          </Text>
        </View>

        {/* Latency */}
        <View style={styles.metricItem}>
          <Text
            style={[
              styles.metricLabel,
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            Latency
          </Text>
          <Text
            style={[
              styles.metricValue,
              {color: metrics.latency <= 100 ? '#4CAF50' : metrics.latency <= 200 ? '#FF9800' : '#F44336'},
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            {formatValue(metrics.latency, 'ms', 0)}
          </Text>
        </View>

        {/* CPU Usage */}
        <View style={styles.metricItem}>
          <Text
            style={[
              styles.metricLabel,
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            CPU
          </Text>
          <Text
            style={[
              styles.metricValue,
              {color: metrics.cpuUsage <= 60 ? '#4CAF50' : metrics.cpuUsage <= 80 ? '#FF9800' : '#F44336'},
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            {formatValue(metrics.cpuUsage, '%', 0)}
          </Text>
        </View>

        {/* Memory Usage */}
        <View style={styles.metricItem}>
          <Text
            style={[
              styles.metricLabel,
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            Memory
          </Text>
          <Text
            style={[
              styles.metricValue,
              {color: metrics.memoryUsage <= 70 ? '#4CAF50' : metrics.memoryUsage <= 85 ? '#FF9800' : '#F44336'},
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            {formatValue(metrics.memoryUsage, '%', 0)}
          </Text>
        </View>

        {/* Battery Level */}
        <View style={styles.metricItem}>
          <Text
            style={[
              styles.metricLabel,
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            Battery
          </Text>
          <Text
            style={[
              styles.metricValue,
              {color: getBatteryColor()},
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            {formatValue(metrics.batteryLevel, '%', 0)}
          </Text>
        </View>

        {/* Temperature */}
        <View style={styles.metricItem}>
          <Text
            style={[
              styles.metricLabel,
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            Temp
          </Text>
          <Text
            style={[
              styles.metricValue,
              {color: metrics.temperature <= 40 ? '#4CAF50' : metrics.temperature <= 50 ? '#FF9800' : '#F44336'},
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            {formatValue(metrics.temperature, '°C', 0)}
          </Text>
        </View>
      </View>

      {/* Performance Tips */}
      {getPerformanceStatus() !== 'good' && (
        <View style={styles.tipsContainer}>
          <Text
            style={[
              styles.tipsTitle,
              settings.largeTextMode && styles.largeText,
              settings.highContrastMode && styles.highContrastText,
            ]}>
            Performance Tips:
          </Text>
          {getPerformanceStatus() === 'poor' && (
            <Text
              style={[
                styles.tipText,
                settings.largeTextMode && styles.largeText,
                settings.highContrastMode && styles.highContrastText,
              ]}>
              • Lower FPS limit in settings{'\n'}
              • Close other apps{'\n'}
              • Reduce AI quality settings
            </Text>
          )}
          {getPerformanceStatus() === 'fair' && (
            <Text
              style={[
                styles.tipText,
                settings.largeTextMode && styles.largeText,
                settings.highContrastMode && styles.highContrastText,
              ]}>
              • Consider lowering FPS limit{'\n'}
              • Monitor battery level
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  highContrastContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  metricLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tipsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#BF360C',
    lineHeight: 18,
  },
  largeText: {
    fontSize: 18,
  },
  highContrastText: {
    color: '#000000',
    fontWeight: 'bold',
  },
});

export default PerformanceDisplay;