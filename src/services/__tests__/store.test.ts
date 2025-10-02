/**
 * Redux Store Tests
 * Comprehensive testing of the application state management
 */

import {configureStore} from '@reduxjs/toolkit';
import {
  updateSettings,
  resetSettings,
  updateServiceState,
  updatePermissionState,
  updatePerformanceMetrics,
  updateDetectionResult,
  setAssistanceActive,
  addError,
  clearErrors,
  selectSettings,
  selectServices,
  selectPermissions,
  selectAllPermissionsGranted,
  selectCanStartAssistance,
} from '../store';
import {ServiceStatus, PermissionStatus} from '@/types';

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      app: require('../store').appSlice.reducer,
    },
  });
};

describe('Redux Store', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Settings Actions', () => {
    it('should update settings', () => {
      const newSettings = {
        aimSensitivity: 0.8,
        audioCuesEnabled: false,
      };

      store.dispatch(updateSettings(newSettings));
      const state = store.getState();
      
      expect(selectSettings(state).aimSensitivity).toBe(0.8);
      expect(selectSettings(state).audioCuesEnabled).toBe(false);
      // Other settings should remain unchanged
      expect(selectSettings(state).fpsLimit).toBe(30); // default value
    });

    it('should reset settings to defaults', () => {
      // First modify settings
      store.dispatch(updateSettings({aimSensitivity: 0.9}));
      
      // Then reset
      store.dispatch(resetSettings());
      const state = store.getState();
      
      expect(selectSettings(state).aimSensitivity).toBe(0.5); // default value
    });
  });

  describe('Service State Actions', () => {
    it('should update individual service state', () => {
      store.dispatch(updateServiceState({
        service: 'screenCapture',
        status: ServiceStatus.RUNNING,
      }));

      const state = store.getState();
      expect(selectServices(state).screenCapture).toBe(ServiceStatus.RUNNING);
    });

    it('should update all service states', () => {
      const newServiceStates = {
        screenCapture: ServiceStatus.RUNNING,
        aiInference: ServiceStatus.RUNNING,
        inputSimulation: ServiceStatus.RUNNING,
        accessibility: ServiceStatus.RUNNING,
      };

      store.dispatch(updateAllServiceStates(newServiceStates));
      const state = store.getState();
      
      expect(selectServices(state)).toEqual(newServiceStates);
    });
  });

  describe('Permission Actions', () => {
    it('should update individual permission state', () => {
      store.dispatch(updatePermissionState({
        permission: 'accessibility',
        status: PermissionStatus.GRANTED,
      }));

      const state = store.getState();
      expect(selectPermissions(state).accessibility).toBe(PermissionStatus.GRANTED);
    });

    it('should check if all permissions are granted', () => {
      // Initially no permissions granted
      let state = store.getState();
      expect(selectAllPermissionsGranted(state)).toBe(false);

      // Grant all permissions
      store.dispatch(updatePermissionState({
        permission: 'screenCapture',
        status: PermissionStatus.GRANTED,
      }));
      store.dispatch(updatePermissionState({
        permission: 'accessibility',
        status: PermissionStatus.GRANTED,
      }));
      store.dispatch(updatePermissionState({
        permission: 'systemAlertWindow',
        status: PermissionStatus.GRANTED,
      }));
      store.dispatch(updatePermissionState({
        permission: 'recordAudio',
        status: PermissionStatus.GRANTED,
      }));

      state = store.getState();
      expect(selectAllPermissionsGranted(state)).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should update performance metrics', () => {
      const metrics = {
        fps: 25.5,
        latency: 85,
        cpuUsage: 45,
      };

      store.dispatch(updatePerformanceMetrics(metrics));
      const state = store.getState();
      
      expect(state.app.performance.fps).toBe(25.5);
      expect(state.app.performance.latency).toBe(85);
      expect(state.app.performance.cpuUsage).toBe(45);
    });
  });

  describe('Detection Results', () => {
    it('should update detection result', () => {
      const detectionResult = {
        enemies: [],
        weapons: [],
        aimGuidance: null,
        timestamp: Date.now(),
        confidence: 0.8,
        frameWidth: 1920,
        frameHeight: 1080,
      };

      store.dispatch(updateDetectionResult(detectionResult));
      const state = store.getState();
      
      expect(state.app.lastDetection).toEqual(detectionResult);
    });
  });

  describe('Assistance State', () => {
    it('should set assistance active state', () => {
      store.dispatch(setAssistanceActive(true));
      let state = store.getState();
      expect(state.app.isAssistanceActive).toBe(true);

      store.dispatch(setAssistanceActive(false));
      state = store.getState();
      expect(state.app.isAssistanceActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should add and clear errors', () => {
      store.dispatch(addError('Test error 1'));
      store.dispatch(addError('Test error 2'));
      
      let state = store.getState();
      expect(state.app.errors).toHaveLength(2);
      expect(state.app.errors[0]).toBe('Test error 1');

      store.dispatch(clearErrors());
      state = store.getState();
      expect(state.app.errors).toHaveLength(0);
    });

    it('should limit error queue size', () => {
      // Add more than 10 errors
      for (let i = 0; i < 15; i++) {
        store.dispatch(addError(`Error ${i}`));
      }

      const state = store.getState();
      expect(state.app.errors).toHaveLength(10);
      // Should keep the last 10 errors
      expect(state.app.errors[0]).toBe('Error 5');
      expect(state.app.errors[9]).toBe('Error 14');
    });
  });

  describe('Selectors', () => {
    it('should select if assistance can be started', () => {
      // Initially should not be able to start (no permissions)
      let state = store.getState();
      expect(selectCanStartAssistance(state)).toBe(false);

      // Grant all permissions
      store.dispatch(updatePermissionState({
        permission: 'accessibility',
        status: PermissionStatus.GRANTED,
      }));
      store.dispatch(updatePermissionState({
        permission: 'systemAlertWindow',
        status: PermissionStatus.GRANTED,
      }));
      store.dispatch(updatePermissionState({
        permission: 'screenCapture',
        status: PermissionStatus.GRANTED,
      }));
      store.dispatch(updatePermissionState({
        permission: 'recordAudio',
        status: PermissionStatus.GRANTED,
      }));

      state = store.getState();
      expect(selectCanStartAssistance(state)).toBe(true);

      // Should not be able to start if assistance is already active
      store.dispatch(setAssistanceActive(true));
      state = store.getState();
      expect(selectCanStartAssistance(state)).toBe(false);

      // Should not be able to start if there are errors
      store.dispatch(setAssistanceActive(false));
      store.dispatch(addError('Test error'));
      state = store.getState();
      expect(selectCanStartAssistance(state)).toBe(false);
    });
  });

  describe('State Persistence', () => {
    it('should have correct initial state', () => {
      const state = store.getState();
      
      // Check default settings
      expect(selectSettings(state).aimSensitivity).toBe(0.5);
      expect(selectSettings(state).fpsLimit).toBe(30);
      expect(selectSettings(state).audioCuesEnabled).toBe(true);
      
      // Check initial service states
      expect(selectServices(state).screenCapture).toBe(ServiceStatus.STOPPED);
      
      // Check initial permission states
      expect(selectPermissions(state).accessibility).toBe(PermissionStatus.DENIED);
    });
  });
});