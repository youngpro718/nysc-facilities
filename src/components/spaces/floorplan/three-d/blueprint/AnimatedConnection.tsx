// @ts-nocheck
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { CONNECTION_COLORS } from './blueprintMaterials';

interface AnimatedConnectionProps {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  type?: 'standard' | 'emergency' | 'highTraffic' | 'selected';
  isSelected?: boolean;
  animationSpeed?: number;
}

const AnimatedConnection: React.FC<AnimatedConnectionProps> = ({
  id,
  from,
  to,
  type = 'standard',
  isSelected = false,
  animationSpeed = 1
}) => {
  const particlesRef = useRef<THREE.Points>(null);

  const color = isSelected ? CONNECTION_COLORS.selected : CONNECTION_COLORS[type];

  // Create curved path between points
  const { curve, points } = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    
    // Create a slight arc for visual interest
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    mid.y += 15; // Lift middle point

    const curveObj = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = curveObj.getPoints(50);

    return { curve: curveObj, points: pts };
  }, [from, to]);

  // Create particle positions
  const particleCount = 5;

  const particleGeometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  const particleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 4,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
  }, [color]);

  // Animate particles along curve
  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const time = Date.now() * 0.001 * animationSpeed;

      for (let i = 0; i < particleCount; i++) {
        const t = ((time * 0.3 + i / particleCount) % 1);
        const point = curve.getPoint(t);
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Convert points to format for drei Line
  const linePoints = useMemo(() => {
    return points.map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, [points]);

  return (
    <group>
      {/* Dashed line using drei Line component */}
      <Line
        points={linePoints}
        color={color}
        lineWidth={2}
        dashed
        dashSize={5}
        gapSize={3}
        opacity={isSelected ? 1 : 0.7}
        transparent
      />

      {/* Flowing particles */}
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />
    </group>
  );
};

export default AnimatedConnection;
