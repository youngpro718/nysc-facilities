
import React, { useMemo } from 'react';
import * as THREE from 'three';

interface BlueprintDoorProps {
  id: string;
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: number;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
}

const DOOR_HEIGHT = 24;
const FRAME_THICKNESS = 3;

const BlueprintDoor: React.FC<BlueprintDoorProps> = ({
  id,
  position,
  size = [60, 20, 10],
  rotation = 0,
  isSelected = false,
  isHovered = false,
  onClick,
  onHover
}) => {
  const [doorWidth] = size;

  const frameMat = useMemo(() => new THREE.MeshPhongMaterial({
    color: new THREE.Color(isSelected ? '#6366f1' : isHovered ? '#f59e0b' : '#64748b'),
    transparent: true,
    opacity: 0.9,
  }), [isSelected, isHovered]);

  const doorMat = useMemo(() => new THREE.MeshPhongMaterial({
    color: new THREE.Color('#475569'),
    transparent: true,
    opacity: 0.4,
  }), []);

  const halfW = doorWidth / 2;

  return (
    <group
      position={position}
      rotation={[0, (rotation * Math.PI) / 180, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover?.(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); onHover?.(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Left frame post */}
      <mesh position={[-halfW, DOOR_HEIGHT / 2, 0]}>
        <boxGeometry args={[FRAME_THICKNESS, DOOR_HEIGHT, FRAME_THICKNESS]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Right frame post */}
      <mesh position={[halfW, DOOR_HEIGHT / 2, 0]}>
        <boxGeometry args={[FRAME_THICKNESS, DOOR_HEIGHT, FRAME_THICKNESS]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Top header */}
      <mesh position={[0, DOOR_HEIGHT, 0]}>
        <boxGeometry args={[doorWidth + FRAME_THICKNESS * 2, FRAME_THICKNESS, FRAME_THICKNESS]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Door panel (slightly ajar) */}
      <mesh position={[-halfW + doorWidth * 0.3, DOOR_HEIGHT / 2, 2]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[doorWidth * 0.9, DOOR_HEIGHT - 2, 1.5]} />
        <primitive object={doorMat} attach="material" />
      </mesh>

      {/* Floor threshold */}
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[doorWidth + 4, 6]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export default BlueprintDoor;
