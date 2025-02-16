
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid, SpotLight } from "@react-three/drei";
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
        <PerspectiveCamera makeDefault position={[0, 50, 100]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <SpotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Grid args={[100, 100]} />
        
        {objects.map((obj, index) => (
          <mesh 
            key={obj.id || index}
            position={[obj.position.x, 0, obj.position.y]}
            rotation={[0, obj.rotation || 0, 0]}
          >
            <boxGeometry args={[obj.data.size.width, 10, obj.data.size.height]} />
            <meshStandardMaterial 
              color={obj.data.style.backgroundColor || '#e2e8f0'} 
              opacity={0.8}
              transparent
            />
          </mesh>
        ))}
        
        {fixtures.map((fixture, index) => (
          <mesh
            key={fixture.id}
            position={[
              fixture.coordinates?.x || index * 20, 
              10, 
              fixture.coordinates?.y || index * 20
            ]}
          >
            <sphereGeometry args={[5]} />
            <meshStandardMaterial 
              color={fixture.status === 'functional' ? '#4ade80' : '#ef4444'} 
              emissive={fixture.status === 'functional' ? '#4ade80' : '#ef4444'}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </Canvas>
    </div>
  );
}
