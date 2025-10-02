import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

interface DiagnosticItem {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'checking';
  message: string;
}

const DiagnosticsScreen: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([
    {name: 'Screen Capture Permission', status: 'checking', message: 'Checking...'},
    {name: 'Accessibility Service', status: 'checking', message: 'Checking...'},
    {name: 'Overlay Permission', status: 'checking', message: 'Checking...'},
    {name: 'AI Model Loading', status: 'checking', message: 'Checking...'},
    {name: 'Performance', status: 'checking', message: 'Checking...'},
    {name: 'Memory Usage', status: 'checking', message: 'Checking...'},
  ]);

  useEffect(() => {
    // Simulate diagnostic checks
    const timer = setTimeout(() => {
      setDiagnostics([
        {name: 'Screen Capture Permission', status: 'pass', message: 'Permission granted'},
        {name: 'Accessibility Service', status: 'warning', message: 'Service not enabled'},
        {name: 'Overlay Permission', status: 'pass', message: 'Permission granted'},
        {name: 'AI Model Loading', status: 'pass', message: 'Model loaded successfully'},
        {name: 'Performance', status: 'pass', message: 'Running at 30 FPS'},
        {name: 'Memory Usage', status: 'warning', message: '85% memory usage'},
      ]);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return '#00FF00';
      case 'fail': return '#FF0000';
      case 'warning': return '#FFA500';
      case 'checking': return '#CCCCCC';
      default: return '#CCCCCC';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✓';
      case 'fail': return '✗';
      case 'warning': return '⚠';
      case 'checking': return '...';
      default: return '?';
    }
  };

  const runDiagnostics = () => {
    Alert.alert(
      'Run Diagnostics',
      'This will check all system components and permissions.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Run', onPress: () => {
          setDiagnostics(prev => prev.map(item => ({...item, status: 'checking', message: 'Checking...'})));
          // Simulate re-running diagnostics
          setTimeout(() => {
            setDiagnostics([
              {name: 'Screen Capture Permission', status: 'pass', message: 'Permission granted'},
              {name: 'Accessibility Service', status: 'pass', message: 'Service enabled'},
              {name: 'Overlay Permission', status: 'pass', message: 'Permission granted'},
              {name: 'AI Model Loading', status: 'pass', message: 'Model loaded successfully'},
              {name: 'Performance', status: 'pass', message: 'Running at 30 FPS'},
              {name: 'Memory Usage', status: 'pass', message: '65% memory usage'},
            ]);
          }, 2000);
        }},
      ]
    );
  };

  return (
    <ScrollView style={styles.container} accessibilityLabel="Diagnostics screen">
      <Text style={styles.title} accessibilityRole="header">
        System Diagnostics
      </Text>
      
      <Text style={styles.description}>
        Check system status and troubleshoot issues
      </Text>

      <TouchableOpacity
        style={styles.runButton}
        onPress={runDiagnostics}
        accessibilityRole="button"
        accessibilityLabel="Run diagnostics"
      >
        <Text style={styles.runButtonText}>Run Diagnostics</Text>
      </TouchableOpacity>

      <View style={styles.diagnosticsList}>
        {diagnostics.map((item, index) => (
          <View key={index} style={styles.diagnosticItem}>
            <View style={styles.diagnosticHeader}>
              <Text style={styles.diagnosticName}>{item.name}</Text>
              <Text 
                style={[styles.statusIcon, {color: getStatusColor(item.status)}]}
                accessibilityLabel={`Status: ${item.status}`}
              >
                {getStatusIcon(item.status)}
              </Text>
            </View>
            <Text style={styles.diagnosticMessage}>{item.message}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>System Information</Text>
        <Text style={styles.infoText}>App Version: 1.0.0</Text>
        <Text style={styles.infoText}>React Native: 0.74.0</Text>
        <Text style={styles.infoText}>AI Model: YOLOv8n</Text>
        <Text style={styles.infoText}>Build: Debug</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  runButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  diagnosticsList: {
    marginBottom: 30,
  },
  diagnosticItem: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  diagnosticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  diagnosticName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  statusIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  diagnosticMessage: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  infoSection: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 5,
  },
});

export default DiagnosticsScreen;