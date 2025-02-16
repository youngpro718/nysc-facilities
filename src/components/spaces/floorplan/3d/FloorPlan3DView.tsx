
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useFloorPlanData } from "../hooks/useFloorPlanData";
import { useLightingFixtures } from "../../lighting/hooks/useLightingFixtures";
import { useState } from "react";

interface FloorPlan3DViewProps {
  floorId: string | null;
}

export function FloorPlan3DView({ floorId }: FloorPlan3DViewProps) {
  const { objects, isLoading: floorPlanLoading } = useFloorPlanData(floorId);
  const { data: fixtures = [], isLoading: fixturesLoading } = useLightingFixtures({
    selectedBuilding: 'all',
    selectedFloor: floorId || 'all'
  });

  console.log('Floor ID:', floorId);
  console.log('Floor plan objects:', objects);
  console.log('Lighting fixtures:', fixtures);

  if (floorPlanLoading || fixturesLoading) {
    return <div>Loading...</div>;
  }

  if (!floorId) {
    return <div>Please select a floor to view the floor plan</div>;
  }

  if (!objects || objects.length === 0) {
    return <div>No floor plan objects found for this floor</div>;
  }

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Canvas camera={{ position: [0, 50, 100], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />
        <OrbitControls makeDefault />
        
        {/* Grid Helper */}
        <gridHelper args={[100, 100]} />
        
        {/* Floor Plan Objects */}
        <group>
          {objects.map((obj, index) => {
            if (!obj.position || !obj.data?.size) {
              console.warn('Invalid object data:', obj);
              return null;
            }
            
            const width = obj.data.size.width || 10;
            const height = obj.data.size.height || 10;
            const depth = 10;
            
            return (
              <mesh 
                key={obj.id || index}
                position={[
                  obj.position.x || 0,
                  depth / 2, // Half height to place on ground
                  obj.position.y || 0
                ]}
                rotation={[0, obj.rotation || 0, 0]}
              >
                <boxGeometry args={[width, depth, height]} />
                <meshStandardMaterial 
                  color={obj.data?.style?.backgroundColor || '#e2e8f0'}
                  opacity={0.8}
                  transparent={true}
                />
              </mesh>
            );
          })}
        </group>
        
        {/* Lighting Fixtures */}
        <group>
          {fixtures.map((fixture, index) => (
            <mesh
              key={fixture.id}
              position={[
                fixture.coordinates?.x || index * 20,
                10,
                fixture.coordinates?.y || index * 20
              ]}
            >
              <sphereGeometry args={[2, 32, 32]} />
              <meshStandardMaterial 
                color={fixture.status === 'functional' ? '#4ade80' : '#ef4444'}
                emissive={fixture.status === 'functional' ? '#4ade80' : '#ef4444'}
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
        </group>
      </Canvas>
    </div>
  );
}
