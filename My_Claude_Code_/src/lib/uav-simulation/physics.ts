import { UAVState, ControlInput, SimulationParams, SecurityState, SpoofingAttackType } from './types';
import { addVectors, scaleVector, normalizeQuaternion, rotateVectorByQuaternion, crossProduct } from './math';

export class UAVPhysicsEngine {
  private params: SimulationParams;
  private state: UAVState;
  
  constructor(params: SimulationParams, initialState?: UAVState) {
    this.params = params;
    this.state = initialState || {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      attitude: { w: 1, x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      timestamp: 0
    };
  }
  
  public getState(): UAVState {
    return { ...this.state };
  }
  
  // RK4 Integration step
  public step(control: ControlInput, dt: number): UAVState {
    // k1
    const d1 = this.calculateDerivatives(this.state, control);
    
    // k2
    const s2 = this.applyDerivatives(this.state, d1, dt / 2);
    const d2 = this.calculateDerivatives(s2, control);
    
    // k3
    const s3 = this.applyDerivatives(this.state, d2, dt / 2);
    const d3 = this.calculateDerivatives(s3, control);
    
    // k4
    const s4 = this.applyDerivatives(this.state, d3, dt);
    const d4 = this.calculateDerivatives(s4, control);
    
    // Final state integration
    this.state = this.integrateRK4(this.state, d1, d2, d3, d4, dt);
    this.state.timestamp += dt;
    
    // Ground collision constraint
    if (this.state.position.z < 0) {
      this.state.position.z = 0;
      this.state.velocity.z = Math.max(0, this.state.velocity.z);
    }
    
    return this.state;
  }
  
  private calculateDerivatives(state: UAVState, control: ControlInput) {
    // 1. Translational dynamics
    
    // Thrust vector in body frame (Z-up)
    const thrustBody = { x: 0, y: 0, z: control.thrust };
    // Rotate thrust to inertial frame
    const thrustInertial = rotateVectorByQuaternion(thrustBody, state.attitude);
    
    // Gravity vector in inertial frame
    const gravity = { x: 0, y: 0, z: -this.params.gravity * this.params.mass };
    
    // Aerodynamic drag
    const drag = scaleVector(state.velocity, -this.params.dragCoefficient);
    
    // Total force
    const force = addVectors(addVectors(thrustInertial, gravity), drag);
    
    // Acceleration = F/m
    const acceleration = scaleVector(force, 1 / this.params.mass);
    
    // 2. Rotational dynamics (simplified rigid body)
    // Assuming diagonal inertia matrix for simplicity [Ixx, Iyy, Izz]
    const inertia = { x: 0.1, y: 0.1, z: 0.2 }; 
    const torque = { x: control.rollCmd, y: control.pitchCmd, z: control.yawCmd };
    
    // Euler equations: I*w_dot + w x (I*w) = T
    const iw = {
      x: inertia.x * state.angularVelocity.x,
      y: inertia.y * state.angularVelocity.y,
      z: inertia.z * state.angularVelocity.z
    };
    
    const w_x_iw = crossProduct(state.angularVelocity, iw);
    
    const angularAccel = {
      x: (torque.x - w_x_iw.x) / inertia.x,
      y: (torque.y - w_x_iw.y) / inertia.y,
      z: (torque.z - w_x_iw.z) / inertia.z
    };
    
    // 3. Attitude kinematics (Quaternion derivative)
    // q_dot = 0.5 * q * [0, w]
    const q = state.attitude;
    const w = state.angularVelocity;
    
    const qDot = {
      w: 0.5 * (-q.x*w.x - q.y*w.y - q.z*w.z),
      x: 0.5 * ( q.w*w.x + q.y*w.z - q.z*w.y),
      y: 0.5 * ( q.w*w.y - q.x*w.z + q.z*w.x),
      z: 0.5 * ( q.w*w.z + q.x*w.y - q.y*w.x)
    };
    
    return {
      posDot: state.velocity,
      velDot: acceleration,
      qDot: qDot,
      wDot: angularAccel
    };
  }
  
  private applyDerivatives(state: UAVState, derivatives: any, dt: number): UAVState {
    const nextQ = {
      w: state.attitude.w + derivatives.qDot.w * dt,
      x: state.attitude.x + derivatives.qDot.x * dt,
      y: state.attitude.y + derivatives.qDot.y * dt,
      z: state.attitude.z + derivatives.qDot.z * dt
    };
    
    return {
      position: addVectors(state.position, scaleVector(derivatives.posDot, dt)),
      velocity: addVectors(state.velocity, scaleVector(derivatives.velDot, dt)),
      attitude: normalizeQuaternion(nextQ),
      angularVelocity: addVectors(state.angularVelocity, scaleVector(derivatives.wDot, dt)),
      timestamp: state.timestamp
    };
  }
  
  private integrateRK4(state: UAVState, d1: any, d2: any, d3: any, d4: any, dt: number): UAVState {
    const combine = (a: any, b: any, c: any, d: any) => {
      // (a + 2b + 2c + d) / 6
      const mult = (val1: number, val2: number, val3: number, val4: number) => 
        (val1 + 2*val2 + 2*val3 + val4) / 6;
      
      const res: any = {};
      for (const key in a) {
        if (typeof a[key] === 'number') {
          res[key] = mult(a[key], b[key], c[key], d[key]);
        }
      }
      return res;
    };
    
    const posDot = { x: combine(d1.posDot, d2.posDot, d3.posDot, d4.posDot).x, y: combine(d1.posDot, d2.posDot, d3.posDot, d4.posDot).y, z: combine(d1.posDot, d2.posDot, d3.posDot, d4.posDot).z };
    const velDot = { x: combine(d1.velDot, d2.velDot, d3.velDot, d4.velDot).x, y: combine(d1.velDot, d2.velDot, d3.velDot, d4.velDot).y, z: combine(d1.velDot, d2.velDot, d3.velDot, d4.velDot).z };
    const wDot = { x: combine(d1.wDot, d2.wDot, d3.wDot, d4.wDot).x, y: combine(d1.wDot, d2.wDot, d3.wDot, d4.wDot).y, z: combine(d1.wDot, d2.wDot, d3.wDot, d4.wDot).z };
    
    const qDotComb = {
      w: (d1.qDot.w + 2*d2.qDot.w + 2*d3.qDot.w + d4.qDot.w)/6,
      x: (d1.qDot.x + 2*d2.qDot.x + 2*d3.qDot.x + d4.qDot.x)/6,
      y: (d1.qDot.y + 2*d2.qDot.y + 2*d3.qDot.y + d4.qDot.y)/6,
      z: (d1.qDot.z + 2*d2.qDot.z + 2*d3.qDot.z + d4.qDot.z)/6
    };
    
    const nextQ = {
      w: state.attitude.w + qDotComb.w * dt,
      x: state.attitude.x + qDotComb.x * dt,
      y: state.attitude.y + qDotComb.y * dt,
      z: state.attitude.z + qDotComb.z * dt
    };
    
    return {
      position: addVectors(state.position, scaleVector(posDot, dt)),
      velocity: addVectors(state.velocity, scaleVector(velDot, dt)),
      attitude: normalizeQuaternion(nextQ),
      angularVelocity: addVectors(state.angularVelocity, scaleVector(wDot, dt)),
      timestamp: state.timestamp
    };
  }
}
