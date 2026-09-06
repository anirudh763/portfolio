'use client';
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import { useAppStore } from '../../../store/useAppStore';
import * as THREE from 'three';

function DroneModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { uavTrueState, uavSecurityState, reduceMotion } = useAppStore();
  const trailRef = useRef<THREE.Vector3[]>([]);
  const lineGeometryRef = useRef<any>(null);

  useFrame(() => {
    if (meshRef.current && uavTrueState) {
      // Smooth interpolation in a real app, direct assign here since worker runs at 100Hz
      meshRef.current.position.set(uavTrueState.position.x, uavTrueState.position.y, uavTrueState.position.z);
      meshRef.current.quaternion.set(uavTrueState.attitude.x, uavTrueState.attitude.y, uavTrueState.attitude.z, uavTrueState.attitude.w);
      
      if (!reduceMotion) {
        trailRef.current.push(new THREE.Vector3(uavTrueState.position.x, uavTrueState.position.y, uavTrueState.position.z));
        if (trailRef.current.length > 200) trailRef.current.shift();
      }
    }
  });

  const color = uavSecurityState.underAttack ? '#ef4444' : '#22c55e'; // Red if attacked, Green if safe

  return (
    <group>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[1, 1, 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {!reduceMotion && trailRef.current.length > 1 && (
        <Line
          points={trailRef.current}
          color={color}
          lineWidth={2}
          transparent
          opacity={0.5}
        />
      )}
    </group>
  );
}

export function DroneSimulationScene() {
  const { setUAVState, activeAttack, targetAltitude } = useAppStore();
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // In a real NextJS app, worker would be loaded via URL/loader
    // Simulating the worker message loop for the component lifecycle
    workerRef.current = new Worker(new URL('../../../lib/uav-simulation/uav.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'STATE_UPDATE') {
        const { trueState, sensorState, securityState } = e.data.payload;
        setUAVState(trueState, sensorState, securityState);
      }
    };
    
    workerRef.current.postMessage({ type: 'START' });
    
    return () => {
      workerRef.current?.postMessage({ type: 'STOP' });
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({ type: 'SET_ATTACK', payload: activeAttack });
  }, [activeAttack]);

  useEffect(() => {
    workerRef.current?.postMessage({ type: 'SET_TARGET_ALTITUDE', payload: targetAltitude });
  }, [targetAltitude]);

  return (
    <div className="w-full h-[600px] bg-zinc-950 relative" aria-hidden="true" data-testid="3d-canvas">
      <div className="absolute top-4 left-4 z-10 text-white font-mono bg-black/50 p-2 rounded">
        WebGL 6-DOF Simulation Engine
      </div>
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
        <Grid infiniteGrid fadeDistance={50} sectionColor="#444" cellColor="#222" />
        <DroneModel />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
