
export enum SludgeLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum SludgeHardness {
  SOFT = 'SOFT',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface SensorData {
  h2s: number; // hydrogen sulfide in ppm
  methane: number; // ppm
  motorCurrent: number; // Amps
  tilt: { x: number; y: number; z: number };
  timestamp: number;
  battery: number; // Percentage 0-100
  batteryVoltage: number; // Volts (24V nominal)
  temperature: number; // Celsius
  isOffline: boolean; // Simulator flag for sensor failure
  ultrasonicReading: number; // distance to sludge in cm
  tankDepth: number; // total depth of tank in cm
  vibrationFrequency: number; // Hz
  torqueFeedback: number; // Nm
  position: { x: number; y: number }; // Robot position in meters (0-10)
  distance_cm?: number;
  ir_left?: number;
  ir_right?: number;
  gas_raw?: number;
}

export interface VisionAnalysis {
  objects: string[];
  sludge_level: 'low' | 'medium' | 'high';
  environment: string;
  risk_level: 'low' | 'medium' | 'high';
}

export interface AIAnalysis {
  sludgeLevel: SludgeLevel;
  sludgeHardness: SludgeHardness;
  gasRisk: RiskLevel;
  isStuck: boolean;
  recommendation: string;
  targetZone?: string;
  predictedSludgeThickness: number; // Predicted thickness in cm
  sludgeVolumeEstimate: number; // Estimated volume in m3
  highDensityZones: string[]; // List of zones with high density
  targetVibrationFrequency: number; // Hz (Adaptive Control)
  targetVibrationAmplitude: number; // 0-100% (Adaptive Control)
  optimizedPath: { x: number; y: number }[]; // Optimized cleaning path
  coveragePercentage: number; // Percentage of tank covered
  estimatedTimeRemaining: number; // Minutes
  maintenanceScore: number; // 0-100 (Health score)
  predictedFailureDays: number; // Days until predicted failure
  anomalyDetected: boolean; // Flag for time-series anomaly
  confidence: number; // AI confidence percentage
  command?: {
    device: string;
    action: string;
    speed: number;
    angle?: number;
  };
  reason?: string;
  priority?: 'low' | 'medium' | 'high';
  vision?: VisionAnalysis;
}

export interface RobotStatus {
  connected: boolean;
  cleaning: boolean;
  brushSpeed: number;
  pumpActive: boolean;
  direction: 'forward' | 'backward' | 'left' | 'right' | 'stop';
  eStopActive: boolean;
  vibrationFrequency: number; // Current set frequency
  vibrationAmplitude: number; // Current set amplitude
  bucketPosition: number; // Servo position -1 to 1
  isAutonomous: boolean;
  cameraPan: number; // 0-180
  cameraTilt: number; // 0-180
  motorSpeed: number; // 0-100% (12V PWM)
}

export interface SafetyConfig {
  h2sLimit: number;
  methaneLimit: number;
  maxCurrent: number;
  tiltLimit: number;
  batteryCritical: number;
}

export const DEFAULTSAFETYCONFIG: SafetyConfig = {
  h2sLimit: 15.0,
  methaneLimit: 100.0,
  maxCurrent: 2.0,
  tiltLimit: 30.0,
  batteryCritical: 15.0,
};
