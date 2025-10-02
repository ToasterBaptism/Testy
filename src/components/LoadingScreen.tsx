/**
 * Loading Screen Component
 * Accessible loading screen with progress indication
 */

import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {announceToUser} from '@/services/audio';

interface LoadingScreenProps {
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading FortniteAssist...',
  progress = 0,
  showProgress = false,
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Announce loading to screen readers
    announceToUser(message);

    // Animate dots for visual feedback
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [message]);

  const getProgressText = (): string => {
    if (!showProgress) return '';
    return `${Math.round(progress)}% complete`;
  };

  const getAccessibilityLabel = (): string => {
    let label = message;
    if (showProgress) {
      label += `. ${getProgressText()}`;
    }
    return label;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        
        {/* App Logo/Icon Area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>FA</Text>
          </View>
        </View>

        {/* Loading Indicator */}
        <ActivityIndicator
          size="large"
          color="#1976D2"
          style={styles.spinner}
          accessibilityLabel="Loading indicator"
        />

        {/* Loading Message */}
        <Text
          style={styles.message}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={getAccessibilityLabel()}>
          {message}{dots}
        </Text>

        {/* Progress Bar */}
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {width: `${Math.max(0, Math.min(100, progress))}%`},
                ]}
              />
            </View>
            <Text
              style={styles.progressText}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={getProgressText()}>
              {getProgressText()}
            </Text>
          </View>
        )}

        {/* Assistive Technology Notice */}
        <Text style={styles.notice}>
          Assistive Technology for Fortnite Mobile
        </Text>

        {/* Loading Steps (for detailed progress) */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Initializing:</Text>
          <Text style={styles.stepItem}>• Checking permissions</Text>
          <Text style={styles.stepItem}>• Loading AI model</Text>
          <Text style={styles.stepItem}>• Setting up services</Text>
          <Text style={styles.stepItem}>• Preparing interface</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
    width: '100%',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  spinner: {
    marginBottom: 24,
  },
  message: {
    fontSize: 18,
    fontWeight: '500',
    color: '#424242',
    textAlign: 'center',
    marginBottom: 20,
    minHeight: 25, // Prevent layout shift from dots animation
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1976D2',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  notice: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 30,
  },
  stepsContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 12,
  },
  stepItem: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 6,
    paddingLeft: 8,
  },
});

export default LoadingScreen;