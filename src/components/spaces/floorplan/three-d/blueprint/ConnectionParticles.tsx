// @ts-nocheck
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONNECTION_COLORS } from './blueprintMaterials';

interface ConnectionParticlesProps {
  from: [number, number, number];
  to: [number, number, number];
  particleCount?: number;
  color?: string;
  speed?: number;
  size?: number;
}

const ConnectionParticles: React.FC<ConnectionParticlesProps> = ({
  from,
  to,
  particleCount = 8,
  color = CONNECTION_COLORS.standard,
  speed = 1,
  size = 3
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Create bezier curve
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    mid.y += 20;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to]);

  // Create particle geometry
  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [particleCount]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
  }, [color, size]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = Date.now() * 0.001 * speed;

    for (let i = 0; i < particleCount; i++) {
      const t = ((time * 0.2 + i / particleCount) % 1);
      const point = curve.getPoint(t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
};

export default ConnectionParticles;
