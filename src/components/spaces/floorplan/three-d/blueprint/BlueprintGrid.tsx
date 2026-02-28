
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface BlueprintGridProps {
  size?: number;
  divisions?: number;
  majorDivisions?: number;
}

// Dark theme grid colors
const GRID_COLORS = {
  background: '#0f172a',    // slate-900
  minorLine: '#1e3a5f',     // blue-tinted dark
  majorLine: '#0ea5e9',     // cyan-500
  axis: '#22d3ee',          // cyan-400
  glow: '#0891b2',          // cyan-600
};

const BlueprintGrid: React.FC<BlueprintGridProps> = ({
  size = 800,
  divisions = 40,
  majorDivisions = 8
}) => {
  // Create grid lines with fade effect
  const { minorLines, majorLines, axisLines } = useMemo(() => {
    const minorPoints: THREE.Vector3[] = [];
    const majorPoints: THREE.Vector3[] = [];
    const axisPoints: THREE.Vector3[] = [];

    const halfSize = size / 2;
    const step = size / divisions;
    const majorStep = divisions / majorDivisions;

    // Generate grid lines
    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;
      const isMajor = i % majorStep === 0;
      const isAxis = i === Math.floor(divisions / 2);

      const targetArray = isAxis ? axisPoints : isMajor ? majorPoints : minorPoints;

      // X-axis lines (parallel to Z)
      targetArray.push(new THREE.Vector3(pos, 0, -halfSize));
      targetArray.push(new THREE.Vector3(pos, 0, halfSize));

      // Z-axis lines (parallel to X)
      targetArray.push(new THREE.Vector3(-halfSize, 0, pos));
      targetArray.push(new THREE.Vector3(halfSize, 0, pos));
    }

    return {
      minorLines: new THREE.BufferGeometry().setFromPoints(minorPoints),
      majorLines: new THREE.BufferGeometry().setFromPoints(majorPoints),
      axisLines: new THREE.BufferGeometry().setFromPoints(axisPoints),
    };
  }, [size, divisions, majorDivisions]);

  // Materials with proper opacity
  const materials = useMemo(() => ({
    minor: new THREE.LineBasicMaterial({
      color: new THREE.Color(GRID_COLORS.minorLine),
      transparent: true,
      opacity: 0.3,
    }),
    major: new THREE.LineBasicMaterial({
      color: new THREE.Color(GRID_COLORS.majorLine),
      transparent: true,
      opacity: 0.5,
    }),
    axis: new THREE.LineBasicMaterial({
      color: new THREE.Color(GRID_COLORS.axis),
      transparent: true,
      opacity: 0.8,
    }),
  }), []);

  return (
    <group position={[0, -0.5, 0]}>
      {/* Background plane with gradient effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[size * 1.5, size * 1.5]} />
        <meshBasicMaterial
          color={GRID_COLORS.background}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Radial fade overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <circleGeometry args={[size * 0.7, 64]} />
        <meshBasicMaterial
          color="#1e293b"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Minor grid lines */}
      <lineSegments geometry={minorLines} material={materials.minor} />

      {/* Major grid lines */}
      <lineSegments geometry={majorLines} material={materials.major} />

      {/* Axis lines */}
      <lineSegments geometry={axisLines} material={materials.axis} />

      {/* Compass/Direction indicators */}
      <group position={[0, 1, -size / 2 + 30]}>
        <Text
          fontSize={12}
          color={GRID_COLORS.axis}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.5}
          outlineColor="#0f172a"
        >
          N
        </Text>
      </group>
      <group position={[0, 1, size / 2 - 30]}>
        <Text
          fontSize={10}
          color={GRID_COLORS.majorLine}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.5}
          outlineColor="#0f172a"
        >
          S
        </Text>
      </group>
      <group position={[size / 2 - 30, 1, 0]}>
        <Text
          fontSize={10}
          color={GRID_COLORS.majorLine}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.5}
          outlineColor="#0f172a"
        >
          E
        </Text>
      </group>
      <group position={[-size / 2 + 30, 1, 0]}>
        <Text
          fontSize={10}
          color={GRID_COLORS.majorLine}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.5}
          outlineColor="#0f172a"
        >
          W
        </Text>
      </group>

      {/* Center origin marker */}
      <mesh position={[0, 0.5, 0]}>
        <ringGeometry args={[8, 10, 32]} />
        <meshBasicMaterial 
          color={GRID_COLORS.axis} 
          transparent 
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8, 10, 32]} />
        <meshBasicMaterial 
          color={GRID_COLORS.axis} 
          transparent 
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default BlueprintGrid;
