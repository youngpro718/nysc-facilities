
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';

interface BlueprintHallwayProps {
  id: string;
  position: [number, number, number];
  size?: [number, number, number]; // length, height(ignored), corridor width
  rotation?: number;
  name?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
}

const WALL_HEIGHT = 25;
const WALL_THICKNESS = 2;

const BlueprintHallway: React.FC<BlueprintHallwayProps> = ({
  id,
  position,
  size = [200, 35, 60],
  rotation = 0,
  name = 'Hallway',
  isSelected = false,
  isHovered = false,
  onClick,
  onHover
}) => {
  const [length, , corridorWidth] = size;
  const halfL = length / 2;
  const halfW = corridorWidth / 2;

  const floorMat = useMemo(() => new THREE.MeshPhongMaterial({
    color: new THREE.Color('#1e293b'),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  }), []);

  const wallMat = useMemo(() => new THREE.MeshPhongMaterial({
    color: new THREE.Color(isSelected ? '#6366f1' : isHovered ? '#f59e0b' : '#475569'),
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  }), [isSelected, isHovered]);

  const stripeMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#0ea5e9'),
    transparent: true,
    opacity: 0.15,
  }), []);

  return (
    <group
      position={position}
      rotation={[0, (rotation * Math.PI) / 180, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover?.(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); onHover?.(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <planeGeometry args={[length, corridorWidth]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Center line stripe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.6, 0]}>
        <planeGeometry args={[length - 10, 3]} />
        <primitive object={stripeMat} attach="material" />
      </mesh>

      {/* Left wall */}
      <mesh position={[0, WALL_HEIGHT / 2, -halfW]}>
        <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* Right wall */}
      <mesh position={[0, WALL_HEIGHT / 2, halfW]}>
        <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* Name label */}
      {name && (
        <Billboard position={[0, WALL_HEIGHT + 10, 0]}>
          <Text
            fontSize={8}
            color={isSelected ? '#a5b4fc' : '#94a3b8'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.5}
            outlineColor="#0f172a"
          >
            {name}
          </Text>
        </Billboard>
      )}

      {/* Direction arrows on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[halfL - 20, 0.7, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-halfL + 20, 0.7, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export default BlueprintHallway;
