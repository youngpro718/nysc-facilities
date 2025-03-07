
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { createLighting, createEnvironment } from '../utils/threeDUtils';

export function SceneLighting() {
  const { scene } = useThree();
  const lightingRef = useRef<any>(null);
  
  useEffect(() => {
    // Add lighting to the scene
    lightingRef.current = createLighting(scene);
    
    // Set scene background
    const { skyColor, groundColor } = createEnvironment();
    scene.background = new THREE.Color(skyColor);
    
    // Create fog for distance fading
    scene.fog = new THREE.Fog(skyColor, 800, 2500);
    
    return () => {
      // Clean up lights when component unmounts
      if (lightingRef.current) {
        Object.values(lightingRef.current).forEach((light: any) => {
          if (light instanceof THREE.Light) {
            scene.remove(light);
          }
        });
      }
      
      // Reset scene background and fog
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);
  
  return null;
}
