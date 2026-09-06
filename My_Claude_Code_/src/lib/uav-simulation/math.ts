import { Vector3, Quaternion } from './types';

export function addVectors(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function scaleVector(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function crossProduct(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function normalizeQuaternion(q: Quaternion): Quaternion {
  const norm = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
  if (norm === 0) return { w: 1, x: 0, y: 0, z: 0 };
  return { w: q.w / norm, x: q.x / norm, y: q.y / norm, z: q.z / norm };
}

export function multiplyQuaternions(q1: Quaternion, q2: Quaternion): Quaternion {
  return {
    w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z,
    x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
    y: q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
    z: q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w
  };
}

export function rotateVectorByQuaternion(v: Vector3, q: Quaternion): Vector3 {
  const vq: Quaternion = { w: 0, x: v.x, y: v.y, z: v.z };
  const qInv: Quaternion = { w: q.w, x: -q.x, y: -q.y, z: -q.z };
  
  const temp = multiplyQuaternions(q, vq);
  const result = multiplyQuaternions(temp, qInv);
  
  return { x: result.x, y: result.y, z: result.z };
}
