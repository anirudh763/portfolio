import { describe, it, expect } from 'vitest';
import { UAVPhysicsEngine } from '../src/lib/uav-simulation/physics';
import { MAVLinkDefender } from '../src/lib/uav-simulation/telemetry';
import { normalizeQuaternion } from '../src/lib/uav-simulation/math';

describe('UAV Physics: RK4 Integration', () => {
  const params = {
    mass: 1.0,
    gravity: 9.81,
    timeStep: 0.1,
    dragCoefficient: 0
  };

  it('freefalls correctly under zero thrust', () => {
    const engine = new UAVPhysicsEngine(params, {
      position: { x: 0, y: 0, z: 100 },
      velocity: { x: 0, y: 0, z: 0 },
      attitude: { w: 1, x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      timestamp: 0
    });

    const control = { thrust: 0, rollCmd: 0, pitchCmd: 0, yawCmd: 0 };
    
    // Simulate 1 second of freefall
    for(let i=0; i<10; i++) {
        engine.step(control, 0.1);
    }
    
    const state = engine.getState();
    
    // v = u + at -> v = 0 + (-9.81)*1 = -9.81
    expect(state.velocity.z).toBeCloseTo(-9.81, 1);
    
    // s = ut + 0.5at^2 -> s = 100 + 0 + 0.5*(-9.81)*1 = 95.095
    expect(state.position.z).toBeCloseTo(95.095, 1);
  });

  it('maintains perfectly hovering equilibrium', () => {
    const engine = new UAVPhysicsEngine(params, {
      position: { x: 0, y: 0, z: 10 },
      velocity: { x: 0, y: 0, z: 0 },
      attitude: { w: 1, x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      timestamp: 0
    });

    // Thrust = mass * gravity
    const control = { thrust: 9.81, rollCmd: 0, pitchCmd: 0, yawCmd: 0 };
    engine.step(control, 0.1);
    
    const state = engine.getState();
    expect(state.velocity.z).toBeCloseTo(0, 5);
    expect(state.position.z).toBeCloseTo(10, 5);
  });
});

describe('UAV Defense: Spoofing detection', () => {
  it('detects GPS Drift anomaly', () => {
    const defender = new MAVLinkDefender();
    
    const trueState = {
      position: { x: 0, y: 0, z: 10 },
      velocity: { x: 0, y: 0, z: 0 },
      attitude: { w: 1, x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      timestamp: 0
    };
    
    const spoofedState = {
      position: { x: 10, y: 10, z: 10 }, // Large jump
      velocity: { x: 0, y: 0, z: 0 },
      attitude: { w: 1, x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      timestamp: 0
    };
    
    const security = defender.detectAnomalies(spoofedState, trueState);
    expect(security.underAttack).toBe(true);
    expect(security.anomalyScore).toBeGreaterThan(5.0);
  });
});
