import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { getStatusColor, getTypeColor } from './blueprintMaterials';
import { getIconTexture } from './iconTextures';

interface BlueprintRoomProps {
  id: string;
  position: [number, number, number];
  size?: [number, number, number];
  name?: string;
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
  size = [60, 30, 60],
  name = '',
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
  const edgesRef = useRef<THREE.LineSegments>(null);
  const iconRef = useRef<THREE.Sprite>(null);
  const dashOffsetRef = useRef(0);

  const statusColor = useMemo(() => getStatusColor(status), [status]);
  const typeColor = useMemo(() => getTypeColor(type), [type]);

  // Create wireframe geometry
  const { edgesGeometry, floorGeometry } = useMemo(() => {
    const boxGeom = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const edges = new THREE.EdgesGeometry(boxGeom);
    const floor = new THREE.PlaneGeometry(size[0], size[2]);
    boxGeom.dispose();
    return { edgesGeometry: edges, floorGeometry: floor };
  }, [size]);

  // Create materials
  const { edgeMaterial, floorMaterial, selectedMaterial } = useMemo(() => {
    const baseColor = isSelected ? '#6366f1' : isHovered ? '#f59e0b' : statusColor;
    
    const edge = new THREE.LineBasicMaterial({
      color: new THREE.Color(baseColor),
      linewidth: 2,
    });

    const floor = new THREE.MeshBasicMaterial({
      color: new THREE.Color(typeColor),
      opacity: isSelected ? 0.25 : isHovered ? 0.2 : 0.1,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const selected = new THREE.LineDashedMaterial({
      color: new THREE.Color('#6366f1'),
      dashSize: 4,
      gapSize: 2,
    });

    return { edgeMaterial: edge, floorMaterial: floor, selectedMaterial: selected };
  }, [statusColor, typeColor, isSelected, isHovered]);

  // Icon texture
  const iconTexture = useMemo(() => getIconTexture(type, statusColor), [type, statusColor]);

  // Compute line distances for dashed material
  useEffect(() => {
    if (edgesRef.current && isSelected) {
      edgesRef.current.computeLineDistances();
    }
  }, [isSelected, edgesGeometry]);

  // Animate dashed line when selected
  useFrame((_, delta) => {
    if (isSelected && edgesRef.current) {
      dashOffsetRef.current -= delta * 10;
      const mat = edgesRef.current.material as THREE.LineDashedMaterial;
      if ('dashSize' in mat) {
        (mat as any).dashOffset = dashOffsetRef.current;
        mat.needsUpdate = true;
      }
    }

    // Subtle icon bobbing
    if (iconRef.current && showIcon) {
      iconRef.current.position.y = size[1] + 25 + Math.sin(Date.now() * 0.002) * 2;
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

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Wireframe edges */}
      <lineSegments
        ref={edgesRef}
        geometry={edgesGeometry}
        material={isSelected ? selectedMaterial : edgeMaterial}
      />

      {/* Floor plane */}
      <mesh
        geometry={floorGeometry}
        material={floorMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -size[1] / 2 + 0.5, 0]}
      />

      {/* Room type icon */}
      {showIcon && (
        <sprite
          ref={iconRef}
          position={[0, size[1] + 25, 0]}
          scale={[20 * labelScale, 20 * labelScale, 1]}
        >
          <spriteMaterial
            map={iconTexture}
            transparent
            opacity={isHovered || isSelected ? 1 : 0.8}
          />
        </sprite>
      )}

      {/* Room label */}
      <Billboard position={[0, size[1] / 2 + 8, 0]}>
        <Text
          fontSize={8 * labelScale}
          color={isSelected ? '#6366f1' : isHovered ? '#f59e0b' : '#0f172a'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.5}
          outlineColor="#ffffff"
        >
          {name || id}
        </Text>
      </Billboard>

      {/* Status indicator dot */}
      <mesh position={[size[0] / 2 - 5, size[1] / 2 + 2, size[2] / 2 - 5]}>
        <sphereGeometry args={[3, 8, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
    </group>
  );
};

export default BlueprintRoom;
