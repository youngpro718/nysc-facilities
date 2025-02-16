
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useFloorPlanData } from "../hooks/useFloorPlanData";
import { useLightingFixtures } from "../../lighting/hooks/useLightingFixtures";
import { Suspense } from "react";

interface FloorPlan3DViewProps {
  floorId: string | null;
}

// Separate components for better error handling
function FloorPlanObjects({ objects }: { objects: any[] }) {
  return (
    <group>
      {objects.map((obj, index) => {
        if (!obj?.position || !obj?.data?.size) {
          console.warn('Invalid object data:', obj);
          return null;
        }
        
        const width = Number(obj.data.size.width) || 10;
        const height = Number(obj.data.size.height) || 10;
        const depth = 10;
        const posX = Number(obj.position.x) || 0;
        const posY = Number(obj.position.y) || 0;
        const rotation = Number(obj.rotation) || 0;
        
        return (
          <mesh 
            key={obj.id || index}
            position={[posX, depth / 2, posY]}
            rotation={[0, rotation, 0]}
          >
            <boxGeometry args={[width, depth, height]} />
            <meshStandardMaterial 
              color={obj.data?.style?.backgroundColor || '#e2e8f0'}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function LightingFixtures({ fixtures }: { fixtures: any[] }) {
  return (
    <group>
      {fixtures.map((fixture, index) => {
        const posX = Number(fixture.coordinates?.x) || index * 20;
        const posY = Number(fixture.coordinates?.y) || index * 20;
        
        return (
          <mesh
            key={fixture.id}
            position={[posX, 10, posY]}
          >
            <sphereGeometry args={[2, 32, 32]} />
            <meshStandardMaterial 
              color={fixture.status === 'functional' ? '#4ade80' : '#ef4444'}
              emissive={fixture.status === 'functional' ? '#4ade80' : '#ef4444'}
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Scene({ objects, fixtures }: { objects: any[], fixtures: any[] }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={0.5} />
      <OrbitControls makeDefault />
      <gridHelper args={[100, 100]} />
      <Suspense fallback={null}>
        <FloorPlanObjects objects={objects} />
        <LightingFixtures fixtures={fixtures} />
      </Suspense>
    </>
  );
}

export function FloorPlan3DView({ floorId }: FloorPlan3DViewProps) {
  const { objects = [], isLoading: floorPlanLoading } = useFloorPlanData(floorId);
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
      <Canvas
        camera={{
          position: [0, 50, 100],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
      >
        <Scene objects={objects} fixtures={fixtures} />
      </Canvas>
    </div>
  );
}
