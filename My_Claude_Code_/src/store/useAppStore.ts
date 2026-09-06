import { create } from 'zustand';
import { UAVState, SecurityState, SpoofingAttackType } from '../lib/uav-simulation';

interface AppState {
  uavTrueState: UAVState | null;
  uavSensorState: UAVState | null;
  uavSecurityState: SecurityState;
  
  targetAltitude: number;
  activeAttack: SpoofingAttackType;
  
  memoryCapacity: number;
  memorySize: number;
  
  reduceMotion: boolean;
  
  setUAVState: (trueState: UAVState, sensorState: UAVState, securityState: SecurityState) => void;
  setTargetAltitude: (alt: number) => void;
  setActiveAttack: (attack: SpoofingAttackType) => void;
  setMemoryStats: (capacity: number, size: number) => void;
  setReduceMotion: (reduce: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  uavTrueState: null,
  uavSensorState: null,
  uavSecurityState: { underAttack: false, attackType: 'NONE', anomalyScore: 0, mitigationActive: false },
  
  targetAltitude: 10,
  activeAttack: 'NONE',
  
  memoryCapacity: 4,
  memorySize: 0,
  
  reduceMotion: false,
  
  setUAVState: (trueState, sensorState, securityState) => set({ uavTrueState: trueState, uavSensorState: sensorState, uavSecurityState: securityState }),
  setTargetAltitude: (alt) => set({ targetAltitude: alt }),
  setActiveAttack: (attack) => set({ activeAttack: attack }),
  setMemoryStats: (capacity, size) => set({ memoryCapacity: capacity, memorySize: size }),
  setReduceMotion: (reduce) => set({ reduceMotion: reduce })
}));
