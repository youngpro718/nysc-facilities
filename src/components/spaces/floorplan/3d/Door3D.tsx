
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createMaterial } from '../utils/threeDUtils';

interface Door3DProps {
  id: string;
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  properties?: any;
}

export function Door3D({ 
  id, 
  position, 
  size, 
  rotation = 0, 
  color, 
  onClick, 
  isSelected = false,
  properties
}: Door3DProps) {
  const doorHeight = 80;
  const doorWidth = Math.max(size.width, 40); // Ensure minimum door width
  const doorThickness = Math.min(size.height, 15); // Door thickness (depth)
  
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const material = createMaterial('door', isSelected, color);
  
  useEffect(() => {
    if (meshRef.current && isSelected) {
      // Animate selected door (subtle rotation to imply opening)
      const startRotationY = meshRef.current.rotation.y;
      const targetRotationY = isSelected ? Math.PI * 0.15 : 0;
      
      let startTime: number | null = null;
      const duration = 300; // ms
      
      const animateDoor = (time: number) => {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (meshRef.current) {
          meshRef.current.rotation.y = startRotationY + (targetRotationY - startRotationY) * progress;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateDoor);
        }
      };
      
      requestAnimationFrame(animateDoor);
    }
  }, [isSelected]);
  
  const isDoorActive = properties?.status !== 'inactive';
  
  return (
    <group
      ref={groupRef}
      position={[position.x, doorHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick({ id, type: 'door', position, size, rotation, properties });
      }}
    >
      {/* Door frame */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[doorWidth + 5, doorHeight + 5, doorThickness + 2]} />
        <meshStandardMaterial 
          color="#64748b" 
          roughness={0.7}
          metalness={0.3}
          opacity={0.3}
          transparent={true}
        />
      </mesh>
      
      {/* Door */}
      <mesh 
        ref={meshRef}
        castShadow 
        receiveShadow 
        position={[-doorWidth/4, 0, 0]}
      >
        <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
        <primitive object={material} attach="material" />
      </mesh>
      
      {/* Door handle */}
      <mesh position={[doorWidth/2 - 5, 0, doorThickness/2 + 1]} castShadow>
        <sphereGeometry args={[3, 12, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Status indicator */}
      <mesh position={[doorWidth/2 - 5, doorHeight/3, doorThickness/2 + 1]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshStandardMaterial 
          color={isDoorActive ? "#10b981" : "#ef4444"} 
          emissive={isDoorActive ? "#10b981" : "#ef4444"}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}
