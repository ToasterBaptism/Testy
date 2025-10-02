/**
 * Core TypeScript type definitions for FortniteAssist
 */

export interface DetectionResult {
  enemies: EnemyDetection[];
  weapons: WeaponDetection[];
  aimGuidance: AimGuidance | null;
  timestamp: number;
  confidence: number;
  frameWidth: number;
  frameHeight: number;
}

export interface EnemyDetection {
  boundingBox: BoundingBox;
  confidence: number;
  distance?: number;
  isVisible: boolean;
  bodyParts: BodyPart[];
}

export interface WeaponDetection {
  boundingBox: BoundingBox;
  confidence: number;
  weaponType: WeaponType;
  isPickupable: boolean;
}

export interface BodyPart {
  type: BodyPartType;
  position: Point;
  confidence: number;
}

export interface AimGuidance {
  targetPoint: Point;
  aimVector: Point;
  confidence: number;
  predictedMovement?: Point;
  recoilCompensation?: Point;
  priority: AimPriority;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export enum BodyPartType {
  HEAD = 'HEAD',
  TORSO = 'TORSO',
  ARMS = 'ARMS',
  LEGS = 'LEGS',
}

export enum WeaponType {
  ASSAULT_RIFLE = 'ASSAULT_RIFLE',
  SHOTGUN = 'SHOTGUN',
  SNIPER_RIFLE = 'SNIPER_RIFLE',
  PISTOL = 'PISTOL',
  SMG = 'SMG',
  EXPLOSIVE = 'EXPLOSIVE',
  HEALING_ITEM = 'HEALING_ITEM',
  SHIELD_ITEM = 'SHIELD_ITEM',
  UNKNOWN = 'UNKNOWN',
}

export enum AimPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  NONE = 'NONE',
}

export interface GameAction {
  type: GameActionType;
  data?: any;
  priority: ActionPriority;
  timestamp: number;
  maxDelay: number;
}

export enum GameActionType {
  AIM = 'AIM',
  FIRE = 'FIRE',
  RELOAD = 'RELOAD',
  JUMP = 'JUMP',
  CROUCH = 'CROUCH',
  MOVE = 'MOVE',
  SCOPE = 'SCOPE',
  BUILD = 'BUILD',
  INTERACT = 'INTERACT',
  SWITCH_WEAPON = 'SWITCH_WEAPON',
}

export enum ActionPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum MoveDirection {
  FORWARD = 'FORWARD',
  BACKWARD = 'BACKWARD',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  FORWARD_LEFT = 'FORWARD_LEFT',
  FORWARD_RIGHT = 'FORWARD_RIGHT',
  BACKWARD_LEFT = 'BACKWARD_LEFT',
  BACKWARD_RIGHT = 'BACKWARD_RIGHT',
}

export enum BuildType {
  WALL = 'WALL',
  FLOOR = 'FLOOR',
  STAIRS = 'STAIRS',
  ROOF = 'ROOF',
}

export interface AppSettings {
  aimSensitivity: number;
  fpsLimit: number;
  roiSize: number;
  aimSmoothing: number;
  audioCuesEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  highContrastMode: boolean;
  largeTextMode: boolean;
  voiceAnnouncementsEnabled: boolean;
  debugOverlayEnabled: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  latency: number;
  cpuUsage: number;
  memoryUsage: number;
  batteryLevel: number;
  temperature: number;
}

export interface AccessibilityState {
  isServiceEnabled: boolean;
  isTalkBackEnabled: boolean;
  isHighContrastEnabled: boolean;
  textScale: number;
  touchExplorationEnabled: boolean;
}

export interface PermissionState {
  screenCapture: PermissionStatus;
  accessibility: PermissionStatus;
  systemAlertWindow: PermissionStatus;
  recordAudio: PermissionStatus;
}

export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  BLOCKED = 'blocked',
  NEVER_ASK_AGAIN = 'never_ask_again',
}

export interface ServiceState {
  screenCapture: ServiceStatus;
  aiInference: ServiceStatus;
  inputSimulation: ServiceStatus;
  accessibility: ServiceStatus;
}

export enum ServiceStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error',
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface ScreenProps extends NavigationProps {
  // Additional screen-specific props can be added here
}

// Event types for the event system
export interface AppEvent {
  type: AppEventType;
  data?: any;
  timestamp: number;
}

export enum AppEventType {
  SERVICE_STATE_CHANGED = 'SERVICE_STATE_CHANGED',
  DETECTION_RESULT = 'DETECTION_RESULT',
  PERFORMANCE_UPDATE = 'PERFORMANCE_UPDATE',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  severity: ErrorSeverity;
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Feedback types
export interface UserFeedback {
  type: FeedbackType;
  rating: number;
  comment?: string;
  timestamp: number;
  sessionId: string;
}

export enum FeedbackType {
  AIM_ACCURACY = 'aim_accuracy',
  PERFORMANCE = 'performance',
  USABILITY = 'usability',
  GENERAL = 'general',
}