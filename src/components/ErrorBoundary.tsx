/**
 * Error Boundary Component
 * Catches and handles React errors gracefully with accessibility support
 */

import React, {Component, ReactNode} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import AccessibleButton from './AccessibleButton';
import {announceToUser} from '@/services/audio';
import logger from '@/services/logging';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    logger.e('ErrorBoundary', 'React Error Boundary caught an error:', error);
    logger.e('ErrorBoundary', 'Error Info:', errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo: errorInfo?.componentStack || null,
    });

    // Announce error to screen readers
    announceToUser('An error occurred in the application. Please check the error details and try again.');
  }

  handleRestart = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Announce recovery attempt
    announceToUser('Attempting to restart the application.');
  };

  handleReportError = () => {
    const {error, errorInfo} = this.state;
    
    // In a real app, this would send error reports to a crash reporting service
    // For now, we'll just log it
    logger.e('ErrorBoundary', 'User requested error report:', {
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo,
      timestamp: new Date().toISOString(),
    });

    announceToUser('Error report has been logged. Thank you for helping improve FortniteAssist.');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          accessibilityRole="none">
          
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            
            <Text
              style={styles.title}
              accessibilityRole="header"
              accessibilityLabel="Application Error">
              Oops! Something went wrong
            </Text>
            
            <Text
              style={styles.subtitle}
              accessible={true}
              accessibilityRole="text">
              FortniteAssist encountered an unexpected error. Don't worry - your data is safe.
            </Text>
          </View>

          <View style={styles.actionsContainer}>
            <AccessibleButton
              title="Restart App"
              onPress={this.handleRestart}
              variant="primary"
              size="large"
              style={styles.actionButton}
              accessibilityHint="Attempts to restart the application and clear the error"
            />

            <AccessibleButton
              title="Report Error"
              onPress={this.handleReportError}
              variant="secondary"
              size="medium"
              style={styles.actionButton}
              accessibilityHint="Sends error details to help improve the app"
            />
          </View>

          {/* Error Details (for debugging) */}
          {__DEV__ && this.state.error && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Information:</Text>
              
              <View style={styles.errorDetails}>
                <Text style={styles.errorLabel}>Error:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>

              {this.state.error.stack && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorLabel}>Stack Trace:</Text>
                  <Text style={styles.errorText}>
                    {this.state.error.stack}
                  </Text>
                </View>
              )}

              {this.state.errorInfo && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorLabel}>Component Stack:</Text>
                  <Text style={styles.errorText}>
                    {this.state.errorInfo}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Accessibility Information */}
          <View style={styles.accessibilityInfo}>
            <Text style={styles.accessibilityTitle}>
              Accessibility Support
            </Text>
            <Text style={styles.accessibilityText}>
              If you're using a screen reader and need assistance, the "Restart App" button should restore normal functionality. 
              If problems persist, please contact support through your device's accessibility settings.
            </Text>
          </View>

          {/* Ethics Notice */}
          <View style={styles.ethicsNotice}>
            <Text style={styles.ethicsText}>
              FortniteAssist is an assistive technology designed to help players with disabilities. 
              All processing occurs on your device to protect your privacy.
            </Text>
          </View>
        </ScrollView>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  actionsContainer: {
    marginBottom: 40,
  },
  actionButton: {
    marginBottom: 16,
  },
  debugContainer: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 12,
  },
  errorDetails: {
    marginBottom: 16,
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'monospace',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  accessibilityInfo: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  accessibilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  accessibilityText: {
    fontSize: 14,
    color: '#0D47A1',
    lineHeight: 20,
  },
  ethicsNotice: {
    padding: 16,
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  ethicsText: {
    fontSize: 12,
    color: '#4A148C',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default ErrorBoundary;