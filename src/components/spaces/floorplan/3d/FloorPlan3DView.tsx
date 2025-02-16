
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useFloorPlanData } from "../hooks/useFloorPlanData";
import { useLightingFixtures } from "../../lighting/hooks/useLightingFixtures";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface FloorPlan3DViewProps {
  floorId: string | null;
}

function FloorPlanObjects({ objects }: { objects: any[] }) {
  return (
    <group>
      {objects.map((obj, index) => {
        if (!obj?.position || !obj?.data?.size) {
          console.warn('Invalid object data:', obj);
          return null;
        }
        
        const width = Math.max(Number(obj.data.size.width) || 10, 1);
        const height = Math.max(Number(obj.data.size.height) || 10, 1);
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
              opacity={0.8}
              transparent={true}
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
        if (!fixture) return null;
        
        const posX = Number(fixture.coordinates?.x) || index * 20;
        const posY = Number(fixture.coordinates?.y) || index * 20;
        const color = fixture.status === 'functional' ? '#4ade80' : '#ef4444';
        
        return (
          <mesh
            key={fixture.id || `fixture-${index}`}
            position={[posX, 10, posY]}
          >
            <sphereGeometry args={[2, 16, 16]} />
            <meshStandardMaterial 
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Scene({ objects, fixtures }: { objects: any[], fixtures: any[] }) {
  return (
    <ErrorBoundary>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={0.5} />
      <OrbitControls makeDefault enableDamping={false} />
      <gridHelper args={[100, 100]} />
      <FloorPlanObjects objects={objects || []} />
      <LightingFixtures fixtures={fixtures || []} />
    </ErrorBoundary>
  );
}

export function FloorPlan3DView({ floorId }: FloorPlan3DViewProps) {
  const { objects = [], isLoading: floorPlanLoading } = useFloorPlanData(floorId);
  const { data: fixtures = [], isLoading: fixturesLoading } = useLightingFixtures({
    selectedBuilding: 'all',
    selectedFloor: floorId || 'all'
  });

  if (floorPlanLoading || fixturesLoading) {
    return <div>Loading...</div>;
  }

  if (!floorId) {
    return <div>Please select a floor to view the floor plan</div>;
  }

  if (!objects?.length) {
    return <div>No floor plan objects found for this floor</div>;
  }

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <ErrorBoundary>
        <Canvas
          camera={{
            position: [0, 50, 100],
            fov: 50,
            near: 0.1,
            far: 1000
          }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <Scene objects={objects} fixtures={fixtures} />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
