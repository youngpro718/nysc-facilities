
import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface EnhancedControlsProps {
  target?: [number, number, number];
  enableDamping?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  maxPolarAngle?: number;
  minPolarAngle?: number;
  onControlsChange?: (controls: any) => void;
}

export function EnhancedControls({
  target = [0, 0, 0],
  enableDamping = true,
  dampingFactor = 0.1,
  minDistance = 100,
  maxDistance = 2000,
  maxPolarAngle = Math.PI / 2 - 0.1,
  minPolarAngle = 0,
  onControlsChange
}: EnhancedControlsProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
  useEffect(() => {
    if (controlsRef.current) {
      // Set target
      controlsRef.current.target.set(target[0], target[1], target[2]);
      controlsRef.current.update();
      
      // Notify parent when controls are ready
      if (onControlsChange) {
        onControlsChange(controlsRef.current);
      }
    }
  }, [target, onControlsChange]);

  return (
    <OrbitControls 
      ref={controlsRef}
      enableDamping={enableDamping}
      dampingFactor={dampingFactor}
      rotateSpeed={0.5}
      maxPolarAngle={maxPolarAngle}
      minPolarAngle={minPolarAngle}
      minDistance={minDistance}
      maxDistance={maxDistance}
      makeDefault
    />
  );
}
