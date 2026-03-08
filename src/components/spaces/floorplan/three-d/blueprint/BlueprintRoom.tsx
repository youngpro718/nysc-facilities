
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { getStatusColor, getTypeColor } from './blueprintMaterials';
import WallSegment from './WallSegment';

interface BlueprintRoomProps {
  id: string;
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: number;
  name?: string;
  roomNumber?: string;
  type?: string;
  status?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
  showIcon?: boolean;
  labelScale?: number;
}

const BlueprintRoom: React.FC<BlueprintRoomProps> = ({
  id,
  position,
  size = [100, 35, 80],
  rotation = 0,
  name = '',
  roomNumber = '',
  type = 'default',
  status = 'active',
  isSelected = false,
  isHovered = false,
  onClick,
  onHover,
  showIcon = true,
  labelScale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const statusColor = useMemo(() => getStatusColor(status), [status]);
  const typeColor = useMemo(() => getTypeColor(type), [type]);

  // Animate glow effect
  useFrame((state) => {
    if (glowRef.current && (isSelected || isHovered)) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.05 + 1;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation?.();
    onHover?.(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation?.();
    onHover?.(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: any) => {
    e.stopPropagation?.();
    onClick?.();
  };

  // Display text
  const displayNumber = roomNumber || '';
  const displayName = name && name !== roomNumber ? name : '';

  // Dynamic font sizes scaled to room width
  const numberFontSize = Math.min(18, Math.max(10, size[0] / 7)) * labelScale;
  const nameFontSize = Math.min(10, Math.max(6, size[0] / 14)) * labelScale;

  // Hover/select label lift
  const labelYOffset = isHovered ? 2 : 0;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, (rotation * Math.PI) / 180, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Selection outline ring on floor */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.4, 0]}>
          <ringGeometry args={[
            Math.min(size[0], size[2]) / 2 - 4,
            Math.min(size[0], size[2]) / 2 - 1,
            32
          ]} />
          <meshBasicMaterial color="#818cf8" opacity={0.7} transparent side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Glow effect for selected/hovered */}
      {(isSelected || isHovered) && (
        <mesh ref={glowRef} scale={1.05}>
          <boxGeometry args={[size[0], size[1], size[2]]} />
          <meshBasicMaterial
            color={isSelected ? '#818cf8' : '#fbbf24'}
            transparent
            opacity={isSelected ? 0.15 : 0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Floor plane — type-colored fill */}
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0] - 4, size[2] - 4]} />
        <meshPhongMaterial
          color={typeColor}
          opacity={isSelected ? 0.35 : isHovered ? 0.3 : 0.25}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Type-indicator stripe on floor (subtle accent bar) */}
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0] * 0.6, 3]} />
        <meshBasicMaterial color={typeColor} opacity={0.4} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Walls — with type-colored accent edges */}
      <WallSegment
        position={[0, 0, 0]}
        size={size}
        wallHeight={size[1]}
        color={isSelected ? '#818cf8' : isHovered ? '#fbbf24' : '#64748b'}
        opacity={isSelected ? 0.55 : isHovered ? 0.5 : 0.4}
        accentColor={typeColor}
      />

      {/* Status accent line */}
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0] - 4, size[2] - 4]} />
        <meshBasicMaterial 
          color={statusColor} 
          opacity={0.12} 
          transparent 
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === CENTERED FLOOR LABELS === */}

      {/* Room number — large, centered on floor */}
      {displayNumber && (
        <Billboard position={[0, size[1] + 8 + labelYOffset, 0]}>
          <Text
            fontSize={numberFontSize}
            color={isSelected ? '#e0e7ff' : isHovered ? '#fef3c7' : '#f8fafc'}
            anchorX="center"
            anchorY="middle"
            maxWidth={size[0] * 0.85}
            textAlign="center"
            outlineWidth={1.2}
            outlineColor="#0f172a"
            fontWeight={700}
          >
            {displayNumber}
          </Text>
        </Billboard>
      )}

      {/* Room name — smaller, below number */}
      {displayName && (
        <Billboard position={[0, size[1] + 8 + labelYOffset - numberFontSize * 0.9, 0]}>
          <Text
            fontSize={nameFontSize}
            color={isSelected ? '#c7d2fe' : isHovered ? '#fde68a' : '#cbd5e1'}
            anchorX="center"
            anchorY="middle"
            maxWidth={size[0] * 0.85}
            textAlign="center"
            outlineWidth={0.6}
            outlineColor="#0f172a"
          >
            {displayName}
          </Text>
        </Billboard>
      )}

      {/* === STATUS INDICATOR — top-edge center pill === */}
      <mesh position={[0, size[1] + 1, size[2] / 2]}>
        <boxGeometry args={[12, 4, 2]} />
        <meshBasicMaterial color={statusColor} opacity={0.9} transparent />
      </mesh>
      {/* Status pill glow */}
      <mesh position={[0, size[1] + 1, size[2] / 2 + 1]}>
        <boxGeometry args={[16, 6, 1]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

export default BlueprintRoom;
