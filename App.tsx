/**
 * FortniteAssist - Main App Component
 * Assistive technology for Fortnite Mobile
 */

import React, {useEffect} from 'react';
import {StatusBar, LogBox} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// Store
import {store, persistor} from '@/services/store';

// Screens
import HomeScreen from '@/screens/HomeScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import PermissionsScreen from '@/screens/PermissionsScreen';
import HelpScreen from '@/screens/HelpScreen';
import AboutScreen from '@/screens/AboutScreen';
import DiagnosticsScreen from '@/screens/DiagnosticsScreen';

// Components
import LoadingScreen from '@/components/LoadingScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

// Services
import {initializeServices} from '@/services/initialization';
import {setupAccessibility} from '@/services/accessibility';

// Types
import type {RootStackParamList} from '@/types/navigation';

// Ignore specific warnings for development
if (__DEV__) {
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'VirtualizedLists should never be nested',
  ]);
}

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  useEffect(() => {
    // Initialize core services
    initializeServices()
      .then(() => {
        console.log('✅ FortniteAssist services initialized successfully');
      })
      .catch(error => {
        console.error('❌ Failed to initialize FortniteAssist services:', error);
      });

    // Setup accessibility features
    setupAccessibility();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <GestureHandlerRootView style={{flex: 1}}>
            <SafeAreaProvider>
              <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFFFFF"
                translucent={false}
              />
              <NavigationContainer
                theme={{
                  dark: false,
                  colors: {
                    primary: '#1976D2',
                    background: '#FFFFFF',
                    card: '#FFFFFF',
                    text: '#000000',
                    border: '#E0E0E0',
                    notification: '#FF5722',
                  },
                }}>
                <Stack.Navigator
                  initialRouteName="Home"
                  screenOptions={{
                    headerStyle: {
                      backgroundColor: '#1976D2',
                    },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: {
                      fontWeight: 'bold',
                      fontSize: 18,
                    },
                    // Accessibility improvements
                    headerTitleAccessibilityRole: 'header',
                    gestureEnabled: true,
                    cardStyleInterpolator: ({current, layouts}) => {
                      return {
                        cardStyle: {
                          transform: [
                            {
                              translateX: current.progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [layouts.screen.width, 0],
                              }),
                            },
                          ],
                        },
                      };
                    },
                  }}>
                  <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                      title: 'FortniteAssist',
                      headerAccessibilityLabel: 'FortniteAssist Home Screen',
                    }}
                  />
                  <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                      title: 'Settings',
                      headerAccessibilityLabel: 'Settings Screen',
                    }}
                  />
                  <Stack.Screen
                    name="Permissions"
                    component={PermissionsScreen}
                    options={{
                      title: 'Permissions',
                      headerAccessibilityLabel: 'Permissions Setup Screen',
                    }}
                  />
                  <Stack.Screen
                    name="Help"
                    component={HelpScreen}
                    options={{
                      title: 'Help & Tutorial',
                      headerAccessibilityLabel: 'Help and Tutorial Screen',
                    }}
                  />
                  <Stack.Screen
                    name="About"
                    component={AboutScreen}
                    options={{
                      title: 'About',
                      headerAccessibilityLabel: 'About FortniteAssist Screen',
                    }}
                  />
                  <Stack.Screen
                    name="Diagnostics"
                    component={DiagnosticsScreen}
                    options={{
                      title: 'Diagnostics',
                      headerAccessibilityLabel: 'System Diagnostics Screen',
                    }}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;