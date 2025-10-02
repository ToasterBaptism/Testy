/**
 * Redux store configuration for FortniteAssist
 * Manages application state with persistence
 */

import {configureStore, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  ServiceState,
  PermissionState,
  PerformanceMetrics,
  DetectionResult,
  ServiceStatus,
  PermissionStatus,
} from '@/types';

// Initial state
const initialAppSettings: AppSettings = {
  aimSensitivity: 0.5,
  fpsLimit: 30,
  roiSize: 0.8,
  aimSmoothing: 0.3,
  audioCuesEnabled: true,
  hapticFeedbackEnabled: true,
  highContrastMode: false,
  largeTextMode: false,
  voiceAnnouncementsEnabled: true,
  debugOverlayEnabled: false,
};

const initialServiceState: ServiceState = {
  screenCapture: ServiceStatus.STOPPED,
  aiInference: ServiceStatus.STOPPED,
  inputSimulation: ServiceStatus.STOPPED,
  accessibility: ServiceStatus.STOPPED,
};

const initialPermissionState: PermissionState = {
  screenCapture: PermissionStatus.DENIED,
  accessibility: PermissionStatus.DENIED,
  systemAlertWindow: PermissionStatus.DENIED,
  recordAudio: PermissionStatus.DENIED,
};

const initialPerformanceMetrics: PerformanceMetrics = {
  fps: 0,
  latency: 0,
  cpuUsage: 0,
  memoryUsage: 0,
  batteryLevel: 100,
  temperature: 0,
};

interface AppState {
  settings: AppSettings;
  services: ServiceState;
  permissions: PermissionState;
  performance: PerformanceMetrics;
  lastDetection: DetectionResult | null;
  isAssistanceActive: boolean;
  errors: string[];
}

const initialState: AppState = {
  settings: initialAppSettings,
  services: initialServiceState,
  permissions: initialPermissionState,
  performance: initialPerformanceMetrics,
  lastDetection: null,
  isAssistanceActive: false,
  errors: [],
};

// App slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Settings actions
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.settings = {...state.settings, ...action.payload};
    },
    resetSettings: state => {
      state.settings = initialAppSettings;
    },

    // Service state actions
    updateServiceState: (
      state,
      action: PayloadAction<{service: keyof ServiceState; status: ServiceStatus}>,
    ) => {
      state.services[action.payload.service] = action.payload.status;
    },
    updateAllServiceStates: (state, action: PayloadAction<ServiceState>) => {
      state.services = action.payload;
    },

    // Permission actions
    updatePermissionState: (
      state,
      action: PayloadAction<{
        permission: keyof PermissionState;
        status: PermissionStatus;
      }>,
    ) => {
      state.permissions[action.payload.permission] = action.payload.status;
    },
    updateAllPermissions: (state, action: PayloadAction<PermissionState>) => {
      state.permissions = action.payload;
    },

    // Performance actions
    updatePerformanceMetrics: (
      state,
      action: PayloadAction<Partial<PerformanceMetrics>>,
    ) => {
      state.performance = {...state.performance, ...action.payload};
    },

    // Detection actions
    updateDetectionResult: (state, action: PayloadAction<DetectionResult>) => {
      state.lastDetection = action.payload;
    },
    clearDetectionResult: state => {
      state.lastDetection = null;
    },

    // Assistance state
    setAssistanceActive: (state, action: PayloadAction<boolean>) => {
      state.isAssistanceActive = action.payload;
    },

    // Error handling
    addError: (state, action: PayloadAction<string>) => {
      state.errors.push(action.payload);
      // Keep only last 10 errors
      if (state.errors.length > 10) {
        state.errors = state.errors.slice(-10);
      }
    },
    clearErrors: state => {
      state.errors = [];
    },
    removeError: (state, action: PayloadAction<number>) => {
      state.errors.splice(action.payload, 1);
    },
  },
});

// Export actions
export const {
  updateSettings,
  resetSettings,
  updateServiceState,
  updateAllServiceStates,
  updatePermissionState,
  updateAllPermissions,
  updatePerformanceMetrics,
  updateDetectionResult,
  clearDetectionResult,
  setAssistanceActive,
  addError,
  clearErrors,
  removeError,
} = appSlice.actions;

// Persist configuration
const persistConfig = {
  key: 'fortniteassist',
  storage: AsyncStorage,
  whitelist: ['settings', 'permissions'], // Only persist settings and permissions
  blacklist: ['services', 'performance', 'lastDetection', 'errors'], // Don't persist runtime state
};

const persistedReducer = persistReducer(persistConfig, appSlice.reducer);

// Configure store
export const store = configureStore({
  reducer: {
    app: persistedReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['app.lastDetection.timestamp'],
      },
    }),
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Selectors
export const selectSettings = (state: RootState) => state.app.settings;
export const selectServices = (state: RootState) => state.app.services;
export const selectPermissions = (state: RootState) => state.app.permissions;
export const selectPerformance = (state: RootState) => state.app.performance;
export const selectLastDetection = (state: RootState) => state.app.lastDetection;
export const selectIsAssistanceActive = (state: RootState) =>
  state.app.isAssistanceActive;
export const selectErrors = (state: RootState) => state.app.errors;

// Computed selectors
export const selectAllPermissionsGranted = (state: RootState) => {
  const permissions = state.app.permissions;
  return Object.values(permissions).every(
    status => status === PermissionStatus.GRANTED,
  );
};

export const selectAllServicesRunning = (state: RootState) => {
  const services = state.app.services;
  return Object.values(services).every(
    status => status === ServiceStatus.RUNNING,
  );
};

export const selectCanStartAssistance = (state: RootState) => {
  return (
    selectAllPermissionsGranted(state) &&
    !selectIsAssistanceActive(state) &&
    state.app.errors.length === 0
  );
};

export const selectPerformanceStatus = (state: RootState) => {
  const perf = state.app.performance;
  if (perf.fps < 15 || perf.latency > 200 || perf.cpuUsage > 80) {
    return 'poor';
  } else if (perf.fps < 25 || perf.latency > 100 || perf.cpuUsage > 60) {
    return 'fair';
  } else {
    return 'good';
  }
};