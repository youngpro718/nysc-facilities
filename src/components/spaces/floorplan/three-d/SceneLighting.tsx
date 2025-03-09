
import React from 'react';

export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[300, 300, 300]} 
        intensity={0.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={2000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
      />
      <directionalLight 
        position={[-300, 200, -300]} 
        intensity={0.4}
        castShadow
      />
      <hemisphereLight 
        args={['#b1e1ff', '#b97a20', 0.5]}
      />
    </>
  );
}
