import React from 'react';

interface SceneLightingProps {
  intensity?: number;
}

export function SceneLighting({ intensity = 0.8 }: SceneLightingProps) {
  // Scale all light intensities relative to the main intensity parameter
  const scaleIntensity = (baseIntensity: number) => baseIntensity * (intensity / 0.8);
  
  return (
    <>
      {/* Enhanced ambient light for better overall visibility */}
      <ambientLight intensity={scaleIntensity(0.8)} color="#f8fafc" />
      
      {/* Main directional light with softer shadows */}
      <directionalLight 
        position={[300, 500, 300]} 
        intensity={scaleIntensity(0.9)}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={2000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
        color="#ffffff"
      />
      
      {/* Secondary directional light from opposite side */}
      <directionalLight 
        position={[-300, 200, -300]} 
        intensity={scaleIntensity(0.4)}
        castShadow
        color="#e0f2fe"
      />
      
      {/* Hemisphere light for more natural environment lighting */}
      <hemisphereLight 
        color="#d1e5f0"
        groundColor="#f8eed4"
        intensity={scaleIntensity(0.6)}
      />
      
      {/* Soft spot light for highlighting objects from above */}
      <spotLight
        position={[0, 800, 0]}
        intensity={scaleIntensity(0.3)}
        angle={Math.PI / 3}
        penumbra={1}
        decay={2}
        distance={1500}
        color="#ffffff"
      />
      
      {/* Ground reflection light */}
      <spotLight
        position={[0, -200, 0]}
        intensity={scaleIntensity(0.15)}
        angle={Math.PI / 4}
        penumbra={0.8}
        decay={2}
        color="#f1f5f9"
      />
    </>
  );
}
