
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useFloorPlanData } from "../hooks/useFloorPlanData";
import { useLightingFixtures } from "../../lighting/hooks/useLightingFixtures";

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
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />
        <OrbitControls makeDefault />
        
        {/* Grid Helper */}
        <group>
          <gridHelper args={[100, 100]} />
        </group>
        
        {/* Floor Plan Objects */}
        <group>
          {objects.map((obj, index) => {
            if (!obj.position || !obj.data?.size) return null;
            
            return (
              <mesh 
                key={obj.id || index}
                position-x={obj.position.x || 0}
                position-y={0}
                position-z={obj.position.y || 0}
                rotation-y={obj.rotation || 0}
              >
                <boxGeometry 
                  args={[
                    obj.data.size.width || 10,
                    10,
                    obj.data.size.height || 10
                  ]} 
                />
                <meshStandardMaterial 
                  color={obj.data?.style?.backgroundColor || '#e2e8f0'}
                  opacity={0.8}
                  transparent
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
              position-x={fixture.coordinates?.x || index * 20}
              position-y={10}
              position-z={fixture.coordinates?.y || index * 20}
            >
              <sphereGeometry args={[5, 32, 32]} />
              <meshStandardMaterial 
                color={fixture.status === 'functional' ? '#4ade80' : '#ef4444'}
                emissive={fixture.status === 'functional' ? '#4ade80' : '#ef4444'}
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
        </group>
        
        {/* Default Camera Position */}
        <group position={[0, 50, 100]}>
          <mesh visible={false}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
        </group>
      </Canvas>
    </div>
  );
}
