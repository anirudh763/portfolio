import { UAVPhysicsEngine } from './physics';
import { MAVLinkDefender } from './telemetry';
import { ControlInput, SpoofingAttackType } from './types';

const params = {
  mass: 1.0,
  gravity: 9.81,
  timeStep: 0.01, // 10ms
  dragCoefficient: 0.1
};

let physics = new UAVPhysicsEngine(params);
let defender = new MAVLinkDefender();
let isRunning = false;
let currentAttack: SpoofingAttackType = 'NONE';
let targetAltitude = 10;

let controlInput: ControlInput = {
  thrust: params.mass * params.gravity, // Hover thrust
  rollCmd: 0,
  pitchCmd: 0,
  yawCmd: 0
};

// Simple PID altitude controller
function calculateControl(state: any, mitigationActive: boolean) {
  const kp = 2.0;
  const kd = 1.0;
  
  let target = targetAltitude;
  
  if (mitigationActive) {
    // Return to launch / Safe descent
    target = 0; 
  }
  
  const error = target - state.position.z;
  const dError = -state.velocity.z; 
  
  const hoverThrust = params.mass * params.gravity;
  const thrustCmd = hoverThrust + (error * kp) + (dError * kd);
  
  return {
    thrust: Math.max(0, thrustCmd),
    rollCmd: -state.attitude.x * 5.0 - state.angularVelocity.x * 1.0, 
    pitchCmd: -state.attitude.y * 5.0 - state.angularVelocity.y * 1.0,
    yawCmd: -state.attitude.z * 1.0 - state.angularVelocity.z * 0.1
  };
}

function simulationLoop() {
  if (!isRunning) return;
  
  // 1. Get true state
  const trueState = physics.getState();
  
  // 2. Predict next state internally (assuming ideal control)
  const predictedState = physics.step(controlInput, params.timeStep);
  
  // 3. Sensor reads (possibly spoofed)
  const sensorState = defender.spoofTelemetry(trueState, currentAttack);
  
  // 4. Defender EKF analyzes
  const securityState = defender.detectAnomalies(sensorState, predictedState);
  
  // 5. Calculate new control based on sensor state (if mitigation active, override target)
  controlInput = calculateControl(sensorState, securityState.mitigationActive);
  
  if (currentAttack === 'ACTUATOR_DOS') {
    controlInput.thrust = 0;
  }
  
  // Post data to main thread
  postMessage({
    type: 'STATE_UPDATE',
    payload: {
      trueState,
      sensorState,
      securityState
    }
  });
  
  setTimeout(simulationLoop, params.timeStep * 1000);
}

self.onmessage = (e) => {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'START':
      isRunning = true;
      simulationLoop();
      break;
    case 'STOP':
      isRunning = false;
      break;
    case 'SET_ATTACK':
      currentAttack = payload as SpoofingAttackType;
      break;
    case 'SET_TARGET_ALTITUDE':
      targetAltitude = payload;
      break;
    case 'RESET':
      physics = new UAVPhysicsEngine(params);
      defender = new MAVLinkDefender();
      break;
  }
};
