export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

export interface UAVState {
  position: Vector3;
  velocity: Vector3;
  attitude: Quaternion;
  angularVelocity: Vector3;
  timestamp: number;
}

export interface SimulationParams {
  mass: number;
  gravity: number;
  timeStep: number;
  dragCoefficient: number;
}

export interface ControlInput {
  thrust: number;    // Collective thrust (N)
  rollCmd: number;   // Roll torque command
  pitchCmd: number;  // Pitch torque command
  yawCmd: number;    // Yaw torque command
}

export type SpoofingAttackType = 'NONE' | 'GPS_DRIFT' | 'GYRO_BIAS' | 'ACTUATOR_DOS';

export interface SecurityState {
  underAttack: boolean;
  attackType: SpoofingAttackType;
  anomalyScore: number;
  mitigationActive: boolean;
}
