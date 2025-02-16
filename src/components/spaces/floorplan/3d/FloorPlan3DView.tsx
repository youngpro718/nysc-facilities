
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid, SpotLight } from "@react-three/drei";
import { useFloorPlanData } from "../hooks/useFloorPlanData";
import { useLightingFixtures } from "../../lighting/hooks/useLightingFixtures";

interface FloorPlan3DViewProps {
  floorId: string | null;
}

export function FloorPlan3DView({ floorId }: FloorPlan3DViewProps) {
  const { objects, isLoading: floorPlanLoading } = useFloorPlanData(floorId);
  const { data: fixtures, isLoading: fixturesLoading } = useLightingFixtures({
    selectedBuilding: 'all',
    selectedFloor: floorId || 'all'
  });

  if (floorPlanLoading || fixturesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-[600px]">
      <Canvas shadows>
        <PerspectiveCamera 
          makeDefault 
          position={[20, 20, 20]} 
          fov={50}
        />
        
        <ambientLight intensity={0.2} /> {/* Reduced ambient light to make fixture lights more visible */}
        <directionalLight
          position={[10, 10, 10]}
          intensity={0.5} // Reduced intensity
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        <Grid
          args={[100, 100]}
          cellSize={1}
          cellThickness={1}
          cellColor="#6b7280"
          sectionSize={3}
          position={[0, -0.01, 0]}
          receiveShadow
        />

        {/* Room objects */}
        <group position={[-50, 0, -50]}>
          {objects.map((obj) => {
            if (obj.type === "room") {
              return (
                <mesh
                  key={obj.id}
                  position={[
                    obj.position.x / 10,
                    1.5,
                    obj.position.y / 10
                  ]}
                  rotation={[0, obj.rotation || 0, 0]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry 
                    args={[
                      obj.data.size.width / 10,
                      3,
                      obj.data.size.height / 10
                    ]} 
                  />
                  <meshStandardMaterial 
                    color={obj.data.style.backgroundColor || "#e2e8f0"}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              );
            }
            return null;
          })}
        </group>

        {/* Lighting fixtures */}
        {fixtures?.map((fixture) => {
          // Skip fixtures without position data
          if (!fixture.position) return null;

          // Convert position to match our scale
          const x = (fixture.space_id ? fixture.position === 'ceiling' ? 0 : -2 : 0) / 10;
          const y = fixture.position === 'ceiling' ? 3 : 1.5;
          const z = (fixture.space_id ? fixture.position === 'ceiling' ? 0 : -2 : 0) / 10;

          return (
            <group key={fixture.id}>
              {/* Fixture representation */}
              <mesh 
                position={[x, y, z]}
                scale={[0.2, 0.2, 0.2]}
              >
                <sphereGeometry />
                <meshStandardMaterial 
                  color={
                    fixture.status === 'functional' ? '#f7b955' :
                    fixture.status === 'maintenance_needed' ? '#f59e0b' :
                    '#ef4444'
                  }
                  emissive={
                    fixture.status === 'functional' ? '#f7b955' :
                    fixture.status === 'maintenance_needed' ? '#f59e0b' :
                    '#ef4444'
                  }
                  emissiveIntensity={0.5}
                />
              </mesh>

              {/* Light source */}
              {fixture.status === 'functional' && (
                <SpotLight
                  position={[x, y, z]}
                  angle={0.5}
                  penumbra={0.5}
                  intensity={0.8}
                  color="#f7b955"
                  distance={8}
                  castShadow
                />
              )}
            </group>
          );
        })}

        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 8}
          maxAzimuthAngle={Math.PI / 1.5}
          minAzimuthAngle={-Math.PI / 1.5}
          minDistance={5}
          maxDistance={50}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.05}
          enabled={true}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          panSpeed={0.8}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
