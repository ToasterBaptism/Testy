/**
 * Audio service for FortniteAssist
 * Provides text-to-speech and audio feedback for accessibility
 */

import Tts from 'react-native-tts';
import Sound from 'react-native-sound';
import {useSelector} from 'react-redux';
import {selectSettings} from './store';
import Timber from './logging';

// Audio feedback types
export enum AudioFeedbackType {
  ENEMY_DETECTED = 'enemy_detected',
  WEAPON_FOUND = 'weapon_found',
  AIM_LOCKED = 'aim_locked',
  TARGET_LOST = 'target_lost',
  ASSISTANCE_STARTED = 'assistance_started',
  ASSISTANCE_STOPPED = 'assistance_stopped',
  ERROR = 'error',
  SUCCESS = 'success',
  WARNING = 'warning',
  INFO = 'info',
}

// Sound effect mappings
const SOUND_EFFECTS: {[key in AudioFeedbackType]: string} = {
  [AudioFeedbackType.ENEMY_DETECTED]: 'enemy_detected.wav',
  [AudioFeedbackType.WEAPON_FOUND]: 'weapon_found.wav',
  [AudioFeedbackType.AIM_LOCKED]: 'aim_locked.wav',
  [AudioFeedbackType.TARGET_LOST]: 'target_lost.wav',
  [AudioFeedbackType.ASSISTANCE_STARTED]: 'assistance_started.wav',
  [AudioFeedbackType.ASSISTANCE_STOPPED]: 'assistance_stopped.wav',
  [AudioFeedbackType.ERROR]: 'error.wav',
  [AudioFeedbackType.SUCCESS]: 'success.wav',
  [AudioFeedbackType.WARNING]: 'warning.wav',
  [AudioFeedbackType.INFO]: 'info.wav',
};

// Voice announcement messages
const VOICE_MESSAGES: {[key in AudioFeedbackType]: string} = {
  [AudioFeedbackType.ENEMY_DETECTED]: 'Enemy detected',
  [AudioFeedbackType.WEAPON_FOUND]: 'Weapon found',
  [AudioFeedbackType.AIM_LOCKED]: 'Aim locked on target',
  [AudioFeedbackType.TARGET_LOST]: 'Target lost',
  [AudioFeedbackType.ASSISTANCE_STARTED]: 'Assistance started',
  [AudioFeedbackType.ASSISTANCE_STOPPED]: 'Assistance stopped',
  [AudioFeedbackType.ERROR]: 'Error occurred',
  [AudioFeedbackType.SUCCESS]: 'Operation successful',
  [AudioFeedbackType.WARNING]: 'Warning',
  [AudioFeedbackType.INFO]: 'Information',
};

class AudioService {
  private isInitialized = false;
  private soundCache: {[key: string]: Sound} = {};
  private isSpeaking = false;
  private speechQueue: string[] = [];

  /**
   * Initialize audio service
   */
  async initialize(): Promise<void> {
    try {
      Timber.info('Initializing audio service...');

      // Initialize TTS
      await this.initializeTts();

      // Preload sound effects
      await this.preloadSounds();

      this.isInitialized = true;
      Timber.info('Audio service initialized successfully');
    } catch (error) {
      Timber.error('Failed to initialize audio service:', error);
      throw error;
    }
  }

  /**
   * Initialize text-to-speech
   */
  private async initializeTts(): Promise<void> {
    try {
      // Set TTS language
      await Tts.setDefaultLanguage('en-US');
      
      // Set speech rate (slightly slower for accessibility)
      await Tts.setDefaultRate(0.8);
      
      // Set pitch
      await Tts.setDefaultPitch(1.0);

      // Setup event listeners
      Tts.addEventListener('tts-start', () => {
        this.isSpeaking = true;
      });

      Tts.addEventListener('tts-finish', () => {
        this.isSpeaking = false;
        this.processNextSpeech();
      });

      Tts.addEventListener('tts-cancel', () => {
        this.isSpeaking = false;
        this.processNextSpeech();
      });

      Timber.debug('TTS initialized');
    } catch (error) {
      Timber.error('Failed to initialize TTS:', error);
      throw error;
    }
  }

  /**
   * Preload sound effects
   */
  private async preloadSounds(): Promise<void> {
    try {
      const soundPromises = Object.entries(SOUND_EFFECTS).map(([type, filename]) => {
        return new Promise<void>((resolve, reject) => {
          const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
              Timber.warn(`Failed to load sound ${filename}:`, error);
              resolve(); // Don't fail initialization for missing sounds
            } else {
              this.soundCache[type] = sound;
              resolve();
            }
          });
        });
      });

      await Promise.all(soundPromises);
      Timber.debug(`Preloaded ${Object.keys(this.soundCache).length} sound effects`);
    } catch (error) {
      Timber.error('Failed to preload sounds:', error);
      // Don't throw - app can work without sound effects
    }
  }

  /**
   * Play audio feedback
   */
  async playAudioFeedback(type: AudioFeedbackType, customMessage?: string): Promise<void> {
    if (!this.isInitialized) {
      Timber.warn('Audio service not initialized');
      return;
    }

    try {
      // Get current settings (this would need to be passed in or accessed differently in a real app)
      // For now, we'll assume audio cues are enabled
      const audioCuesEnabled = true;
      const voiceAnnouncementsEnabled = true;

      if (audioCuesEnabled) {
        await this.playSoundEffect(type);
      }

      if (voiceAnnouncementsEnabled) {
        const message = customMessage || VOICE_MESSAGES[type];
        await this.speak(message);
      }
    } catch (error) {
      Timber.error('Failed to play audio feedback:', error);
    }
  }

  /**
   * Play sound effect
   */
  private async playSoundEffect(type: AudioFeedbackType): Promise<void> {
    const sound = this.soundCache[type];
    if (!sound) {
      Timber.debug(`Sound effect not available for type: ${type}`);
      return;
    }

    return new Promise((resolve) => {
      sound.play((success) => {
        if (!success) {
          Timber.warn(`Failed to play sound effect: ${type}`);
        }
        resolve();
      });
    });
  }

  /**
   * Speak text using TTS
   */
  async speak(text: string, interrupt: boolean = false): Promise<void> {
    if (!this.isInitialized) {
      Timber.warn('Audio service not initialized');
      return;
    }

    try {
      if (interrupt) {
        await Tts.stop();
        this.speechQueue = [];
        this.isSpeaking = false;
      }

      if (this.isSpeaking) {
        this.speechQueue.push(text);
      } else {
        await Tts.speak(text);
      }
    } catch (error) {
      Timber.error('Failed to speak text:', error);
    }
  }

  /**
   * Process next speech in queue
   */
  private async processNextSpeech(): Promise<void> {
    if (this.speechQueue.length > 0 && !this.isSpeaking) {
      const nextText = this.speechQueue.shift();
      if (nextText) {
        try {
          await Tts.speak(nextText);
        } catch (error) {
          Timber.error('Failed to speak queued text:', error);
          this.processNextSpeech(); // Try next item
        }
      }
    }
  }

  /**
   * Stop all audio
   */
  async stopAll(): Promise<void> {
    try {
      await Tts.stop();
      this.speechQueue = [];
      this.isSpeaking = false;
      
      // Stop all sound effects
      Object.values(this.soundCache).forEach(sound => {
        sound.stop();
      });
    } catch (error) {
      Timber.error('Failed to stop audio:', error);
    }
  }

  /**
   * Announce detection result
   */
  async announceDetectionResult(enemyCount: number, weaponCount: number): Promise<void> {
    let message = '';
    
    if (enemyCount > 0) {
      message += `${enemyCount} ${enemyCount === 1 ? 'enemy' : 'enemies'} detected`;
      await this.playAudioFeedback(AudioFeedbackType.ENEMY_DETECTED);
    }
    
    if (weaponCount > 0) {
      if (message) message += ', ';
      message += `${weaponCount} ${weaponCount === 1 ? 'weapon' : 'weapons'} found`;
      await this.playAudioFeedback(AudioFeedbackType.WEAPON_FOUND);
    }
    
    if (message) {
      await this.speak(message);
    }
  }

  /**
   * Announce aim guidance
   */
  async announceAimGuidance(direction: string, distance: string): Promise<void> {
    const message = `Target ${direction}, ${distance}`;
    await this.speak(message);
    await this.playAudioFeedback(AudioFeedbackType.AIM_LOCKED);
  }

  /**
   * Announce performance status
   */
  async announcePerformanceStatus(fps: number, latency: number): Promise<void> {
    let status = 'good';
    if (fps < 15 || latency > 200) {
      status = 'poor';
    } else if (fps < 25 || latency > 100) {
      status = 'fair';
    }
    
    const message = `Performance is ${status}. ${Math.round(fps)} frames per second, ${Math.round(latency)} milliseconds latency`;
    await this.speak(message);
  }

  /**
   * Cleanup audio service
   */
  cleanup(): void {
    try {
      Tts.removeAllListeners();
      
      Object.values(this.soundCache).forEach(sound => {
        sound.release();
      });
      
      this.soundCache = {};
      this.speechQueue = [];
      this.isSpeaking = false;
      this.isInitialized = false;
      
      Timber.info('Audio service cleaned up');
    } catch (error) {
      Timber.error('Error during audio service cleanup:', error);
    }
  }
}

// Create singleton instance
const audioService = new AudioService();

// Export convenience functions
export const setupAudioFeedback = () => audioService.initialize();
export const playAudioFeedback = (type: AudioFeedbackType, customMessage?: string) => 
  audioService.playAudioFeedback(type, customMessage);
export const announceToUser = (text: string, interrupt?: boolean) => 
  audioService.speak(text, interrupt);
export const stopAllAudio = () => audioService.stopAll();
export const announceDetectionResult = (enemyCount: number, weaponCount: number) =>
  audioService.announceDetectionResult(enemyCount, weaponCount);
export const announceAimGuidance = (direction: string, distance: string) =>
  audioService.announceAimGuidance(direction, distance);
export const announcePerformanceStatus = (fps: number, latency: number) =>
  audioService.announcePerformanceStatus(fps, latency);
export const cleanupAudio = () => audioService.cleanup();

export default audioService;