/**
 * Assistance Service
 * Main service that coordinates AI detection, aim guidance, and input simulation
 */

import logger from './logging';
import {announceToUser} from './audio';

export interface AssistanceState {
  isActive: boolean;
  isInitialized: boolean;
  lastError?: string;
}

class AssistanceService {
  private state: AssistanceState = {
    isActive: false,
    isInitialized: false,
  };

  private listeners: Array<(state: AssistanceState) => void> = [];

  async initialize(): Promise<void> {
    try {
      logger.i("Assistance", 'Initializing assistance service');
      
      // Initialize AI models, screen capture, etc.
      // This would normally load the AI model and set up services
      
      this.state.isInitialized = true;
      this.notifyListeners();
      
      logger.i("Assistance", 'Assistance service initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.state.lastError = errorMessage;
      logger.e("Assistance", 'Failed to initialize assistance service', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.state.isInitialized) {
      throw new Error('Assistance service not initialized');
    }

    if (this.state.isActive) {
      logger.warn('Assistance service already active');
      return;
    }

    try {
      logger.i("Assistance", 'Starting assistance service');
      
      // Start screen capture
      // Start AI inference
      // Enable input simulation
      
      this.state.isActive = true;
      this.state.lastError = undefined;
      this.notifyListeners();
      
      announceToUser('Assistance started');
      logger.i("Assistance", 'Assistance service started successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.state.lastError = errorMessage;
      this.notifyListeners();
      logger.e("Assistance", 'Failed to start assistance service', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.state.isActive) {
      logger.warn('Assistance service not active');
      return;
    }

    try {
      logger.i("Assistance", 'Stopping assistance service');
      
      // Stop screen capture
      // Stop AI inference
      // Disable input simulation
      
      this.state.isActive = false;
      this.state.lastError = undefined;
      this.notifyListeners();
      
      announceToUser('Assistance stopped');
      logger.i("Assistance", 'Assistance service stopped successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.state.lastError = errorMessage;
      this.notifyListeners();
      logger.e("Assistance", 'Failed to stop assistance service', error);
      throw error;
    }
  }

  getState(): AssistanceState {
    return {...this.state};
  }

  addListener(listener: (state: AssistanceState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        logger.e("Assistance", 'Error in assistance service listener', error);
      }
    });
  }

  cleanup(): void {
    if (this.state.isActive) {
      this.stop().catch(error => {
        logger.e("Assistance", 'Error stopping assistance service during cleanup', error);
      });
    }
    this.listeners = [];
    this.state.isInitialized = false;
    logger.i("Assistance", 'Assistance service cleaned up');
  }
}

export const assistanceService = new AssistanceService();

// Convenience functions for React components
export const startAssistance = async (): Promise<void> => {
  await assistanceService.start();
};

export const stopAssistance = async (): Promise<void> => {
  await assistanceService.stop();
};

export const initializeAssistance = async (): Promise<void> => {
  await assistanceService.initialize();
};

export default assistanceService;