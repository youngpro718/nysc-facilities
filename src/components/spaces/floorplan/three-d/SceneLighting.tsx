
import React from 'react';

export function SceneLighting() {
  return (
    <>
      {/* Increased ambient light for better overall visibility */}
      <ambientLight intensity={0.7} />
      
      {/* Main directional light with stronger shadows */}
      <directionalLight 
        position={[300, 400, 300]} 
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={2000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
      />
      
      {/* Secondary directional light from opposite side */}
      <directionalLight 
        position={[-300, 200, -300]} 
        intensity={0.5}
        castShadow
      />
      
      {/* Hemisphere light for more natural environment lighting */}
      <hemisphereLight 
        args={['#b1e1ff', '#b97a20', 0.6]}
      />
      
      {/* Additional soft light from below for better space definition */}
      <spotLight
        position={[0, -200, 0]}
        intensity={0.2}
        angle={Math.PI / 4}
        penumbra={0.8}
        decay={2}
      />
    </>
  );
}
