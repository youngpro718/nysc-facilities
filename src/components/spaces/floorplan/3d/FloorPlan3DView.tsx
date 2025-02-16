
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid, SpotLight } from "@react-three/drei";
import { useFloorPlanData } from "../hooks/useFloorPlanData";
import { useLightingFixtures } from "../../lighting/hooks/useLightingFixtures";
import { Vector3, Euler } from "three";

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
      <Canvas camera={{ position: [0, 50, 100], fov: 75 }}>
        <OrbitControls enableDamping={false} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <gridHelper args={[100, 100]} />
        
        {objects.map((obj, index) => {
          // Ensure all required properties exist before rendering
          const position: [number, number, number] = [
            obj.position?.x || 0,
            0,
            obj.position?.y || 0
          ];
          const rotation: [number, number, number] = [
            0,
            obj.rotation || 0,
            0
          ];
          const width = obj.data?.size?.width || 10;
          const height = obj.data?.size?.height || 10;
          const color = obj.data?.style?.backgroundColor || '#e2e8f0';

          return (
            <mesh 
              key={obj.id || index}
              position={position}
              rotation={rotation}
            >
              <boxGeometry args={[width, 10, height]} />
              <meshStandardMaterial 
                color={color}
                opacity={0.8}
                transparent={true}
              />
            </mesh>
          );
        })}
        
        {fixtures.map((fixture, index) => {
          // Calculate position with fallbacks
          const position: [number, number, number] = [
            fixture.coordinates?.x || index * 20,
            10,
            fixture.coordinates?.y || index * 20
          ];

          return (
            <mesh
              key={fixture.id}
              position={position}
            >
              <sphereGeometry args={[5, 32, 32]} />
              <meshStandardMaterial 
                color={fixture.status === 'functional' ? '#4ade80' : '#ef4444'}
                emissive={fixture.status === 'functional' ? '#4ade80' : '#ef4444'}
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })}
      </Canvas>
    </div>
  );
}
