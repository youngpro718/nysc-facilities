
import React, { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

interface FirstPersonControlsProps {
  enabled?: boolean;
  eyeHeight?: number;
  moveSpeed?: number;
  startPosition?: [number, number, number];
  onExit?: () => void;
}

const FirstPersonControls: React.FC<FirstPersonControlsProps> = ({
  enabled = true,
  eyeHeight = 16,
  moveSpeed = 120,
  startPosition = [0, 16, 100],
  onExit
}) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  // Set initial camera position at eye level
  useEffect(() => {
    if (enabled) {
      camera.position.set(startPosition[0], eyeHeight, startPosition[2]);
      camera.lookAt(startPosition[0], eyeHeight, startPosition[2] - 10);
    }
  }, [enabled, camera, eyeHeight, startPosition]);

  // Keyboard input
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      keysPressed.current.clear();
    };
  }, [enabled]);

  // Movement loop
  useFrame((_, delta) => {
    if (!enabled || !controlsRef.current?.isLocked) return;

    const speed = moveSpeed * delta;
    const keys = keysPressed.current;

    // Get forward/right vectors (horizontal only)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    direction.current.set(0, 0, 0);

    if (keys.has('KeyW') || keys.has('ArrowUp')) direction.current.add(forward);
    if (keys.has('KeyS') || keys.has('ArrowDown')) direction.current.sub(forward);
    if (keys.has('KeyD') || keys.has('ArrowRight')) direction.current.add(right);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) direction.current.sub(right);

    if (direction.current.length() > 0) {
      direction.current.normalize();
      camera.position.addScaledVector(direction.current, speed);
    }

    // Lock Y to eye height
    camera.position.y = eyeHeight;
  });

  if (!enabled) return null;

  return (
    <PointerLockControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
    />
  );
};

export default FirstPersonControls;
