import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  NativeModules,
} from 'react-native';

const {PermissionsModule} = NativeModules;

interface PermissionStatus {
  [key: string]: boolean;
}

const PermissionsScreen: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({});
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    try {
      // Check standard permissions
      const permissions = [
        'android.permission.RECORD_AUDIO',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_EXTERNAL_STORAGE',
      ];

      const status: PermissionStatus = {};
      for (const permission of permissions) {
        status[permission] = await PermissionsModule.checkPermission(permission);
      }

      setPermissionStatus(status);
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  };

  const handleRequestStandardPermissions = async () => {
    try {
      setLoading('standard');
      const permissions = [
        'android.permission.RECORD_AUDIO',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_EXTERNAL_STORAGE',
      ];

      const results = await PermissionsModule.requestPermissions(permissions);
      setPermissionStatus(prev => ({...prev, ...results}));
      
      Alert.alert(
        'Permissions Updated',
        'Standard permissions have been processed.',
        [{text: 'OK'}]
      );
    } catch (error) {
      console.error('Failed to request permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    } finally {
      setLoading(null);
    }
  };

  const handleRequestOverlayPermission = async () => {
    try {
      setLoading('overlay');
      const granted = await PermissionsModule.requestOverlayPermission();
      
      if (!granted) {
        Alert.alert(
          'Overlay Permission',
          'Please enable "Display over other apps" permission for FortniteAssist in the settings that just opened.',
          [{text: 'OK'}]
        );
      } else {
        Alert.alert('Success', 'Overlay permission is already granted!');
      }
    } catch (error) {
      console.error('Failed to request overlay permission:', error);
      Alert.alert('Error', 'Failed to request overlay permission');
    } finally {
      setLoading(null);
    }
  };

  const handleRequestAccessibilityPermission = async () => {
    try {
      setLoading('accessibility');
      await PermissionsModule.requestAccessibilityPermission();
      
      Alert.alert(
        'Accessibility Permission',
        'Please enable FortniteAssist in the Accessibility settings that just opened. Look for "FortniteAssist" in the list and turn it on.',
        [{text: 'OK'}]
      );
    } catch (error) {
      console.error('Failed to request accessibility permission:', error);
      Alert.alert('Error', 'Failed to request accessibility permission');
    } finally {
      setLoading(null);
    }
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
        <Text style={styles.permissionTitle}>Standard Permissions</Text>
        <Text style={styles.permissionDescription}>
          Audio recording, storage access, and notifications for core functionality.
        </Text>
        <TouchableOpacity
          style={[styles.button, loading === 'standard' && styles.buttonDisabled]}
          onPress={handleRequestStandardPermissions}
          disabled={loading === 'standard'}
          accessibilityRole="button"
          accessibilityLabel="Request standard permissions"
        >
          <Text style={styles.buttonText}>
            {loading === 'standard' ? 'Requesting...' : 'Grant Permissions'}
          </Text>
        </TouchableOpacity>
        {Object.keys(permissionStatus).length > 0 && (
          <View style={styles.statusContainer}>
            {Object.entries(permissionStatus).map(([permission, granted]) => (
              <Text key={permission} style={[styles.statusText, granted ? styles.granted : styles.denied]}>
                {permission.split('.').pop()}: {granted ? '✓ Granted' : '✗ Denied'}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.permissionItem}>
        <Text style={styles.permissionTitle}>Accessibility Service</Text>
        <Text style={styles.permissionDescription}>
          Required to simulate touch inputs for aim assistance and game actions.
        </Text>
        <TouchableOpacity
          style={[styles.button, loading === 'accessibility' && styles.buttonDisabled]}
          onPress={handleRequestAccessibilityPermission}
          disabled={loading === 'accessibility'}
          accessibilityRole="button"
          accessibilityLabel="Request accessibility service permission"
        >
          <Text style={styles.buttonText}>
            {loading === 'accessibility' ? 'Opening Settings...' : 'Enable Accessibility'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.permissionItem}>
        <Text style={styles.permissionTitle}>Overlay Permission</Text>
        <Text style={styles.permissionDescription}>
          Required to display debug information and aim guidance overlay.
        </Text>
        <TouchableOpacity
          style={[styles.button, loading === 'overlay' && styles.buttonDisabled]}
          onPress={handleRequestOverlayPermission}
          disabled={loading === 'overlay'}
          accessibilityRole="button"
          accessibilityLabel="Request overlay permission"
        >
          <Text style={styles.buttonText}>
            {loading === 'overlay' ? 'Opening Settings...' : 'Enable Overlay'}
          </Text>
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
  buttonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 5,
  },
  statusText: {
    fontSize: 12,
    marginBottom: 5,
  },
  granted: {
    color: '#4CAF50',
  },
  denied: {
    color: '#F44336',
  },
});

export default PermissionsScreen;