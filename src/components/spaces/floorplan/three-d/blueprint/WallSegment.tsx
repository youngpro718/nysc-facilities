
import React, { useMemo } from 'react';
import * as THREE from 'three';

interface WallSegmentProps {
  position: [number, number, number];
  size: [number, number, number];
  wallHeight?: number;
  wallThickness?: number;
  color?: string;
  opacity?: number;
  accentColor?: string;
  doorOpenings?: { wall: 'front' | 'back' | 'left' | 'right'; offset: number; width: number }[];
}

const WallSegment: React.FC<WallSegmentProps> = ({
  position,
  size,
  wallHeight = 30,
  wallThickness = 2,
  color = '#64748b',
  opacity = 0.5,
  accentColor = '#38bdf8',
  doorOpenings = []
}) => {
  const [w, , d] = size;
  const halfW = w / 2;
  const halfD = d / 2;
  const halfH = wallHeight / 2;
  const t = wallThickness;

  const material = useMemo(() => new THREE.MeshPhongMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  }), [color, opacity]);

  const topEdgeMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(accentColor),
    transparent: true,
    opacity: 0.65,
  }), [accentColor]);

  const hasDoor = (wall: string) => doorOpenings.some(d => d.wall === wall);

  return (
    <group position={position}>
      {!hasDoor('front') && (
        <mesh position={[0, halfH, halfD]}>
          <boxGeometry args={[w, wallHeight, t]} />
          <primitive object={material} attach="material" />
        </mesh>
      )}
      {!hasDoor('back') && (
        <mesh position={[0, halfH, -halfD]}>
          <boxGeometry args={[w, wallHeight, t]} />
          <primitive object={material} attach="material" />
        </mesh>
      )}
      {!hasDoor('left') && (
        <mesh position={[-halfW, halfH, 0]}>
          <boxGeometry args={[t, wallHeight, d]} />
          <primitive object={material} attach="material" />
        </mesh>
      )}
      {!hasDoor('right') && (
        <mesh position={[halfW, halfH, 0]}>
          <boxGeometry args={[t, wallHeight, d]} />
          <primitive object={material} attach="material" />
        </mesh>
      )}

      {/* Top edge glow — uses type accent color */}
      <mesh position={[0, wallHeight + 0.5, halfD]}>
        <boxGeometry args={[w, 1, 0.5]} />
        <primitive object={topEdgeMat} attach="material" />
      </mesh>
      <mesh position={[0, wallHeight + 0.5, -halfD]}>
        <boxGeometry args={[w, 1, 0.5]} />
        <primitive object={topEdgeMat} attach="material" />
      </mesh>
      <mesh position={[-halfW, wallHeight + 0.5, 0]}>
        <boxGeometry args={[0.5, 1, d]} />
        <primitive object={topEdgeMat} attach="material" />
      </mesh>
      <mesh position={[halfW, wallHeight + 0.5, 0]}>
        <boxGeometry args={[0.5, 1, d]} />
        <primitive object={topEdgeMat} attach="material" />
      </mesh>
    </group>
  );
};

export default WallSegment;
