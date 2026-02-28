
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, RoundedBox } from '@react-three/drei';
import { getStatusColor, getTypeColor } from './blueprintMaterials';

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

  // Create materials
  const materials = useMemo(() => {
    const baseColor = isSelected ? '#6366f1' : isHovered ? '#f59e0b' : statusColor;
    
    // Main room material with gradient effect
    const main = new THREE.MeshPhongMaterial({
      color: new THREE.Color(typeColor),
      opacity: isSelected ? 0.4 : isHovered ? 0.3 : 0.15,
      transparent: true,
      side: THREE.DoubleSide,
      shininess: 50,
    });

    // Edge material
    const edge = new THREE.LineBasicMaterial({
      color: new THREE.Color(baseColor),
      linewidth: 2,
    });

    // Glow material for selected/hovered state
    const glow = new THREE.MeshBasicMaterial({
      color: new THREE.Color(baseColor),
      transparent: true,
      opacity: isSelected ? 0.15 : isHovered ? 0.1 : 0,
      side: THREE.DoubleSide,
    });

    return { main, edge, glow };
  }, [statusColor, typeColor, isSelected, isHovered]);

  // Create wireframe geometry
  const edgesGeometry = useMemo(() => {
    const boxGeom = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const edges = new THREE.EdgesGeometry(boxGeom);
    boxGeom.dispose();
    return edges;
  }, [size]);

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

  // Display name - prefer actual name over room number
  const displayName = name || roomNumber || '';
  const hasRoomNumber = roomNumber && name && roomNumber !== name;

  // Get type icon
  const getTypeIcon = (roomType: string): string => {
    const icons: Record<string, string> = {
      courtroom: '⚖️',
      office: '🏢',
      conference: '🤝',
      storage: '📦',
      hallway: '🚶',
      jury_room: '👥',
      judges_chambers: '👨‍⚖️',
      default: '🏠'
    };
    const normalized = roomType?.toLowerCase().replace(/[^a-z_]/g, '') || 'default';
    return icons[normalized] || icons.default;
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, (rotation * Math.PI) / 180, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Glow effect for selected/hovered */}
      {(isSelected || isHovered) && (
        <mesh ref={glowRef} scale={1.05}>
          <boxGeometry args={[size[0], size[1], size[2]]} />
          <primitive object={materials.glow} attach="material" />
        </mesh>
      )}

      {/* Main room box with rounded corners */}
      <RoundedBox
        args={[size[0], size[1], size[2]]}
        radius={3}
        smoothness={4}
        material={materials.main}
      />

      {/* Wireframe edges */}
      <lineSegments geometry={edgesGeometry} material={materials.edge} />

      {/* Floor accent line */}
      <mesh position={[0, -size[1] / 2 + 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0] - 4, size[2] - 4]} />
        <meshBasicMaterial 
          color={statusColor} 
          opacity={0.3} 
          transparent 
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Type icon */}
      {showIcon && (
        <Billboard position={[0, size[1] / 2 + 20, 0]}>
          <Text
            fontSize={16 * labelScale}
            anchorX="center"
            anchorY="middle"
          >
            {getTypeIcon(type)}
          </Text>
        </Billboard>
      )}

      {/* Room name label */}
      {displayName && (
        <Billboard position={[0, size[1] / 2 + 8, 0]}>
          <Text
            fontSize={Math.min(10, size[0] / 12) * labelScale}
            color={isSelected ? '#a5b4fc' : isHovered ? '#fcd34d' : '#e2e8f0'}
            anchorX="center"
            anchorY="middle"
            maxWidth={size[0] * 0.9}
            textAlign="center"
            outlineWidth={0.8}
            outlineColor="#0f172a"
          >
            {displayName}
          </Text>
        </Billboard>
      )}

      {/* Room number badge (if different from name) */}
      {hasRoomNumber && (
        <Billboard position={[size[0] / 2 - 10, size[1] / 2 + 3, size[2] / 2 - 10]}>
          <mesh>
            <planeGeometry args={[20, 10]} />
            <meshBasicMaterial color="#0f172a" opacity={0.9} transparent />
          </mesh>
          <Text
            fontSize={6 * labelScale}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            position={[0, 0, 0.1]}
          >
            {roomNumber}
          </Text>
        </Billboard>
      )}

      {/* Status indicator */}
      <mesh position={[size[0] / 2 - 6, size[1] / 2 - 6, size[2] / 2]}>
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Status glow */}
      <mesh position={[size[0] / 2 - 6, size[1] / 2 - 6, size[2] / 2]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default BlueprintRoom;
