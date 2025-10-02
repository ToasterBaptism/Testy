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
import {useFocusEffect} from '@react-navigation/native';

const {PermissionsModule} = NativeModules;

interface PermissionStatus {
  [key: string]: boolean;
}

const PermissionsScreen: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({});
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    checkAllPermissions();
  }, []);

  // Refresh permissions when screen comes into focus (user returns from settings)
  useFocusEffect(
    React.useCallback(() => {
      checkAllPermissions();
    }, [])
  );

  const checkAllPermissions = async () => {
    try {
      // Get the required permissions for this Android version
      const requiredPermissions = await PermissionsModule.getRequiredPermissions();
      
      const status: PermissionStatus = {};
      for (const permission of requiredPermissions) {
        status[permission] = await PermissionsModule.checkPermission(permission);
      }

      setPermissionStatus(status);

      // Check accessibility service status
      try {
        const {AccessibilityModule} = NativeModules;
        const accessibilityStatus = await AccessibilityModule.isServiceEnabled();
        setAccessibilityEnabled(accessibilityStatus);
      } catch (error) {
        console.error('Failed to check accessibility status:', error);
        setAccessibilityEnabled(false);
      }

      // Check overlay permission status
      try {
        const overlayStatus = await PermissionsModule.checkOverlayPermission();
        setOverlayEnabled(overlayStatus);
      } catch (error) {
        console.error('Failed to check overlay status:', error);
        setOverlayEnabled(false);
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  };

  const handleRequestStandardPermissions = async () => {
    try {
      setLoading('standard');
      
      // Get the required permissions for this Android version
      const requiredPermissions = await PermissionsModule.getRequiredPermissions();
      
      // Filter out POST_NOTIFICATIONS as it needs special handling
      const standardPermissions = requiredPermissions.filter(
        (permission: string) => permission !== 'android.permission.POST_NOTIFICATIONS'
      );
      
      const results = await PermissionsModule.requestPermissions(standardPermissions);
      
      // Handle notification permission separately
      if (requiredPermissions.includes('android.permission.POST_NOTIFICATIONS')) {
        try {
          const notificationGranted = await PermissionsModule.requestNotificationPermission();
          results['android.permission.POST_NOTIFICATIONS'] = notificationGranted;
        } catch (notificationError) {
          console.error('Failed to request notification permission:', notificationError);
          results['android.permission.POST_NOTIFICATIONS'] = false;
        }
      }
      
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
          'Please enable "Display over other apps" permission for FortniteAssist in the settings that just opened. Return to this screen to refresh the status.',
          [{text: 'OK', onPress: () => checkAllPermissions()}]
        );
      } else {
        Alert.alert('Success', 'Overlay permission is already granted!');
        setOverlayEnabled(true);
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
        'Please enable FortniteAssist in the Accessibility settings that just opened. Look for "FortniteAssist" in the list and turn it on. Return to this screen to refresh the status.',
        [{text: 'OK', onPress: () => checkAllPermissions()}]
      );
    } catch (error) {
      console.error('Failed to request accessibility permission:', error);
      Alert.alert('Error', 'Failed to request accessibility permission');
    } finally {
      setLoading(null);
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      console.log('Requesting notification permission...');
      setLoading('notification');
      const granted = await PermissionsModule.requestNotificationPermission();
      console.log('Notification permission result:', granted);
      
      // Update the permission status
      setPermissionStatus(prev => ({
        ...prev,
        'android.permission.POST_NOTIFICATIONS': granted
      }));
      
      if (granted) {
        Alert.alert('Success', 'Notification permission granted!');
      } else {
        Alert.alert(
          'Permission Required',
          'Please allow notifications when prompted to receive important updates from FortniteAssist.',
          [{text: 'OK'}]
        );
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      Alert.alert('Error', `Failed to request notification permission: ${error.message || error}`);
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
          Audio recording and media access for AI processing. Required permissions vary by Android version.
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

      {/* Show notification permission section only on Android 13+ */}
      {permissionStatus['android.permission.POST_NOTIFICATIONS'] !== undefined && (
        <View style={styles.permissionItem}>
          <Text style={styles.permissionTitle}>Notification Permission</Text>
          <Text style={styles.permissionDescription}>
            Required to show important updates and status notifications from FortniteAssist.
          </Text>
          <TouchableOpacity
            style={[styles.button, loading === 'notification' && styles.buttonDisabled]}
            onPress={handleRequestNotificationPermission}
            disabled={loading === 'notification'}
            accessibilityRole="button"
            accessibilityLabel="Request notification permission"
          >
            <Text style={styles.buttonText}>
              {loading === 'notification' ? 'Requesting...' : 'Allow Notifications'}
            </Text>
          </TouchableOpacity>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, permissionStatus['android.permission.POST_NOTIFICATIONS'] ? styles.granted : styles.denied]}>
              POST_NOTIFICATIONS: {permissionStatus['android.permission.POST_NOTIFICATIONS'] ? '✓ Granted' : '✗ Denied'}
            </Text>
          </View>
        </View>
      )}

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
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, accessibilityEnabled ? styles.granted : styles.denied]}>
            ACCESSIBILITY_SERVICE: {accessibilityEnabled ? '✓ Enabled' : '✗ Disabled'}
          </Text>
        </View>
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
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, overlayEnabled ? styles.granted : styles.denied]}>
            OVERLAY_PERMISSION: {overlayEnabled ? '✓ Enabled' : '✗ Disabled'}
          </Text>
        </View>
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