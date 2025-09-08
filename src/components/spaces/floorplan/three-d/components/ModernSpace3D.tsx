import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';

// More precise typing for properties and click payload
type SpaceStatus = 'active' | 'maintenance' | 'inactive' | string;
interface SpaceProperties {
  status?: SpaceStatus;
  [key: string]: unknown;
}

interface SpaceClickPayload {
  id: string;
  type: 'room' | 'hallway' | 'door';
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties?: SpaceProperties;
  label?: string;
}

interface ModernSpace3DProps {
  id: string;
  type: 'room' | 'hallway' | 'door';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  label?: string;
  properties?: SpaceProperties;
  isSelected?: boolean;
  isHovered?: boolean;
  isPreview?: boolean;
  showLabels?: boolean;
  fontUrl?: string;
  onClick?: (data?: SpaceClickPayload) => void;
  onHover?: () => void;
  onUnhover?: () => void;
}

// Enhanced material system with better visual hierarchy
const createMaterial = (type: string, isSelected: boolean, isHovered: boolean, isPreview: boolean) => {
  // Validate inputs
  if (typeof type !== 'string') {
    console.warn('createMaterial: Invalid type', type);
    type = 'default';
  }
  if (typeof isSelected !== 'boolean') isSelected = false;
  if (typeof isHovered !== 'boolean') isHovered = false;
  if (typeof isPreview !== 'boolean') isPreview = false;

  const baseColors = {
    room: '#3b82f6',
    hallway: '#8b5cf6',
    door: '#f59e0b',
    default: '#64748b'
  };

  const baseColor = baseColors[type as keyof typeof baseColors] || baseColors.default;
  
  // Create material with comprehensive error handling
  try {
    // Validate color values
    const safeBaseColor = baseColor || '#64748b';
    const safeEmissive = isSelected ? safeBaseColor : (isHovered ? '#ffffff' : '#000000');
    
    const material = new THREE.MeshStandardMaterial({
      color: safeBaseColor,
      transparent: true,
      opacity: Math.max(0.1, Math.min(1.0, isPreview ? 0.7 : (isSelected ? 0.9 : 0.8))),
      roughness: 0.4,
      metalness: 0.1,
      emissive: safeEmissive,
      emissiveIntensity: Math.max(0, Math.min(1.0, isSelected ? 0.2 : (isHovered ? 0.1 : 0))),
    });

    return material;
  } catch (error) {
    console.error('Error creating material:', error, { type, isSelected, isHovered, isPreview });
    // Return a very basic fallback material
    try {
      return new THREE.MeshStandardMaterial({
        color: '#64748b',
        transparent: true,
        opacity: 0.8
      });
    } catch (fallbackError) {
      console.error('Error creating fallback material:', fallbackError);
      return null;
    }
  }
};

// Safe geometry creation
const createGeometry = (width: number, height: number, type: string) => {
  try {
    // Validate inputs
    if (typeof width !== 'number' || isNaN(width)) {
      console.warn('createGeometry: Invalid width', width);
      width = 100;
    }
    if (typeof height !== 'number' || isNaN(height)) {
      console.warn('createGeometry: Invalid height', height);
      height = 100;
    }
    if (typeof type !== 'string') {
      console.warn('createGeometry: Invalid type', type);
      type = 'room';
    }

    const safeWidth = Math.max(width || 100, 10);
    const safeHeight = Math.max(height || 100, 10);

    switch (type) {
      case 'room':
        return new THREE.BoxGeometry(safeWidth, 60, safeHeight);
      case 'hallway':
        return new THREE.BoxGeometry(safeWidth, 30, safeHeight);
      case 'door':
        return new THREE.BoxGeometry(Math.min(safeWidth, 40), 15, Math.min(safeHeight, 15));
      default:
        return new THREE.BoxGeometry(safeWidth, 50, safeHeight);
    }
  } catch (error) {
    console.error('Error creating geometry:', error, { width, height, type });
    try {
      return new THREE.BoxGeometry(100, 50, 100);
    } catch (fallbackError) {
      console.error('Error creating fallback geometry:', fallbackError);
      return null;
    }
  }
};

export function ModernSpace3D({
  id,
  type,
  position,
  size,
  rotation = 0,
  label,
  properties,
  isSelected = false,
  isHovered = false,
  isPreview = false,
  showLabels = true,
  fontUrl = '/fonts/inter-v12-latin-regular.woff',
  onClick,
  onHover,
  onUnhover
}: ModernSpace3DProps) {
  // Hoist hooks before any early returns
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Prepare validity flags (checked after hooks)
  const hasEssentials = !!id && !!type && !!position && !!size;
  const positionValid = hasEssentials && typeof position.x === 'number' && typeof position.y === 'number';
  const sizeValid = hasEssentials && !!size.width && !!size.height && typeof size.width === 'number' && typeof size.height === 'number';

  // Safe dimension calculation
  const dimensions = useMemo(() => {
    const width = Math.max(size?.width || 150, 10);
    const height = Math.max(size?.height || 100, 10);
    
    return { width, height };
  }, [size]);

  // Safe position calculation
  const safePosition = useMemo(() => {
    return {
      x: position?.x || 0,
      y: position?.y || 0
    };
  }, [position]);

  // Create material with memoization
  const material = useMemo(() => 
    createMaterial(type, isSelected, isHovered, isPreview), 
    [type, isSelected, isHovered, isPreview]
  );

  // Create geometry with memoization
  const geometry = useMemo(() => 
    createGeometry(dimensions.width, dimensions.height, type), 
    [dimensions, type]
  );

  // Post-hook validity checks and early exits
  if (!hasEssentials) {
    console.warn('ModernSpace3D: Missing essential props', { id, type, position, size });
    return null;
  }
  if (!positionValid) {
    console.warn('ModernSpace3D: Invalid position', position);
    return null;
  }
  if (!sizeValid) {
    console.warn('ModernSpace3D: Invalid size', size);
    return null;
  }

  // Return null if material or geometry creation failed
  if (!material || !geometry) {
    console.warn('ModernSpace3D: Failed to create material or geometry', { id, type, material: !!material, geometry: !!geometry });
    return null;
  }

  // Safe label text (no hook needed)
  const displayLabel = !label ? (id || 'Unnamed') : (label.length > 20 ? label.substring(0, 20) + '...' : label);

  // Handle click safely
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (onClick) {
      onClick({
        id,
        type,
        position: safePosition,
        size: dimensions,
        properties,
        label: displayLabel
      });
    }
  };

  // Handle hover safely
  const handlePointerOver = () => {
    if (onHover) onHover();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    if (onUnhover) onUnhover();
    document.body.style.cursor = 'default';
  };

  return (
    <group
      ref={groupRef}
      position={[safePosition.x, 0, safePosition.y]}
      rotation={[0, (rotation || 0) * Math.PI / 180, 0]}
    >
      {/* Main space mesh */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <primitive object={geometry} attach="geometry" />
        <primitive object={material} attach="material" />
        {/* Selection indicator */}
        {isSelected && (
          <mesh position={[0, -2, 0]}>
            <boxGeometry args={[dimensions.width + 10, 2, dimensions.height + 10]} />
            <meshStandardMaterial color="#0ea5e9" transparent opacity={0.8} />
          </mesh>
        )}

        {/* Hover indicator */}
        {isHovered && !isSelected && (
          <mesh position={[0, -1, 0]}>
            <boxGeometry args={[dimensions.width + 5, 1, dimensions.height + 5]} />
            <meshStandardMaterial color="#fbbf24" transparent opacity={0.6} />
          </mesh>
        )}
      </mesh>

      {/* Label */}
      {showLabels && displayLabel && (
        <Text
          position={[0, 35, 0]}
          fontSize={12}
          color={isSelected ? '#0ea5e9' : '#374151'}
          anchorX="center"
          anchorY="middle"
          font={fontUrl}
          maxWidth={dimensions.width * 0.8}
          outlineWidth={0.5}
          outlineColor="#ffffff"
          outlineOpacity={0.8}
        >
          {displayLabel}
        </Text>
      )}

      {/* Type indicator badge */}
      {showLabels && (
        <Text
          position={[0, 25, 0]}
          fontSize={8}
          color="#6b7280"
          anchorX="center"
          anchorY="middle"
          font={fontUrl}
        >
          {type.toUpperCase()}
        </Text>
      )}

      {/* Status indicator */}
      {properties?.status && (
        <mesh position={[dimensions.width/2 - 5, 40, dimensions.height/2 - 5]}>
          <sphereGeometry args={[3, 16, 16]} />
          <meshStandardMaterial 
            color={properties.status === 'active' ? '#10b981' : 
                   properties.status === 'maintenance' ? '#f59e0b' : '#ef4444'} 
          />
        </mesh>
      )}
    </group>
  );
}
