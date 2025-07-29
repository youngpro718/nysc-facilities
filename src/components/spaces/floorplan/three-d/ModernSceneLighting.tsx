import React from 'react';

interface ModernSceneLightingProps {
  intensity?: number;
  showAmbient?: boolean;
  showDirectional?: boolean;
}

export function ModernSceneLighting({ 
  intensity = 0.8, 
  showAmbient = true, 
  showDirectional = true 
}: ModernSceneLightingProps) {
  return (
    <>
      {showAmbient && (
        <ambientLight 
          intensity={intensity * 0.4} 
          color="#ffffff"
        />
      )}
      
      {showDirectional && (
        <>
          <directionalLight
            position={[300, 400, 300]}
            intensity={intensity}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={1000}
            shadow-camera-left={-500}
            shadow-camera-right={500}
            shadow-camera-top={500}
            shadow-camera-bottom={-500}
          />
          
          <directionalLight
            position={[-300, 200, -300]}
            intensity={intensity * 0.3}
            color="#e2e8f0"
          />
          
          <pointLight
            position={[0, 200, 0]}
            intensity={intensity * 0.2}
            color="#fbbf24"
            distance={500}
          />
        </>
      )}
    </>
  );
}
