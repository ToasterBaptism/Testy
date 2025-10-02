import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const PermissionsScreen: React.FC = () => {
  const handleRequestPermission = (permission: string) => {
    Alert.alert(
      'Permission Required',
      `This app needs ${permission} permission to function properly.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Grant', onPress: () => console.log(`Requesting ${permission}`)},
      ]
    );
  };

  return (
    <ScrollView style={styles.container} accessibilityLabel="Permissions screen">
      <Text style={styles.title} accessibilityRole="header">
        Permissions
      </Text>
      
      <Text style={styles.description}>
        FortniteAssist requires the following permissions to provide accessibility features:
      </Text>

      <View style={styles.permissionItem}>
        <Text style={styles.permissionTitle}>Screen Capture</Text>
        <Text style={styles.permissionDescription}>
          Required to analyze game screen for enemy detection and aim assistance.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleRequestPermission('Screen Capture')}
          accessibilityRole="button"
          accessibilityLabel="Request screen capture permission"
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.permissionItem}>
        <Text style={styles.permissionTitle}>Accessibility Service</Text>
        <Text style={styles.permissionDescription}>
          Required to simulate touch inputs for aim assistance and game actions.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleRequestPermission('Accessibility Service')}
          accessibilityRole="button"
          accessibilityLabel="Request accessibility service permission"
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.permissionItem}>
        <Text style={styles.permissionTitle}>Overlay Permission</Text>
        <Text style={styles.permissionDescription}>
          Required to display debug information and aim guidance overlay.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleRequestPermission('Overlay')}
          accessibilityRole="button"
          accessibilityLabel="Request overlay permission"
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionItem: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 15,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PermissionsScreen;