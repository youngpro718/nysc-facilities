import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getIconTexture } from './iconTextures';
import { getStatusColor } from './blueprintMaterials';

interface RoomTypeIcon3DProps {
  type: string;
  status?: string;
  position: [number, number, number];
  scale?: number;
  animate?: boolean;
}

const RoomTypeIcon3D: React.FC<RoomTypeIcon3DProps> = ({
  type,
  status = 'active',
  position,
  scale = 1,
  animate = true
}) => {
  const spriteRef = useRef<THREE.Sprite>(null);
  const baseY = position[1];

  const color = useMemo(() => getStatusColor(status), [status]);
  const texture = useMemo(() => getIconTexture(type, color), [type, color]);

  useFrame(() => {
    if (animate && spriteRef.current) {
      spriteRef.current.position.y = baseY + Math.sin(Date.now() * 0.002) * 2;
    }
  });

  return (
    <sprite
      ref={spriteRef}
      position={position}
      scale={[20 * scale, 20 * scale, 1]}
    >
      <spriteMaterial
        map={texture}
        transparent
        opacity={0.9}
      />
    </sprite>
  );
};

export default RoomTypeIcon3D;
