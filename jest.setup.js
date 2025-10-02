import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
      ScreenCaptureModule: {
        startCapture: jest.fn(),
        stopCapture: jest.fn(),
        isCapturing: jest.fn(() => Promise.resolve(false)),
      },
      AIInferenceModule: {
        loadModel: jest.fn(),
        runInference: jest.fn(),
        isModelLoaded: jest.fn(() => Promise.resolve(false)),
      },
      InputSimulationModule: {
        performAction: jest.fn(),
        queueAction: jest.fn(),
        clearQueue: jest.fn(),
      },
      AccessibilityModule: {
        isServiceEnabled: jest.fn(() => Promise.resolve(false)),
        requestServiceEnable: jest.fn(),
      },
      SettingsModule: {
        getSetting: jest.fn(),
        setSetting: jest.fn(),
        getAllSettings: jest.fn(() => Promise.resolve({})),
      },
      PermissionsModule: {
        checkPermission: jest.fn(() => Promise.resolve('granted')),
        requestPermission: jest.fn(() => Promise.resolve('granted')),
      },
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    ANDROID: {
      RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
      SYSTEM_ALERT_WINDOW: 'android.permission.SYSTEM_ALERT_WINDOW',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
  },
}));

// Mock react-native-tts
jest.mock('react-native-tts', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Mock react-native-sound
jest.mock('react-native-sound', () => {
  const mockSound = {
    play: jest.fn(),
    stop: jest.fn(),
    release: jest.fn(),
    setVolume: jest.fn(),
  };
  
  return jest.fn(() => mockSound);
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};