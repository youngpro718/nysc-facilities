import React, { useMemo } from 'react';
import * as THREE from 'three';
import { GRID_COLORS } from './blueprintMaterials';

interface BlueprintGridProps {
  size?: number;
  divisions?: number;
  majorDivisions?: number;
}

const BlueprintGrid: React.FC<BlueprintGridProps> = ({
  size = 1000,
  divisions = 50,
  majorDivisions = 10
}) => {
  // Create grid lines
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
      const isAxis = i === divisions / 2;

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

  // Materials
  const minorMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color(GRID_COLORS.minorLine),
    transparent: true,
    opacity: 0.4,
  }), []);

  const majorMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color(GRID_COLORS.majorLine),
    transparent: true,
    opacity: 0.6,
  }), []);

  const axisMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color(GRID_COLORS.axis),
    transparent: true,
    opacity: 0.8,
  }), []);

  return (
    <group position={[0, -0.5, 0]}>
      {/* Background plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial
          color={GRID_COLORS.background}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Minor grid lines */}
      <lineSegments geometry={minorLines} material={minorMaterial} />

      {/* Major grid lines */}
      <lineSegments geometry={majorLines} material={majorMaterial} />

      {/* Axis lines */}
      <lineSegments geometry={axisLines} material={axisMaterial} />
    </group>
  );
};

export default BlueprintGrid;
