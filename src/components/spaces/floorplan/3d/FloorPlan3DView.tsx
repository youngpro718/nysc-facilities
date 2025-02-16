
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
        
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={0.5}
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
              // Calculate color based on room type or status
              const baseColor = obj.data.properties.room_type === "courtroom" 
                ? "#dbeafe" 
                : obj.data.properties.room_type === "office"
                ? "#e2e8f0"
                : obj.data.properties.room_type === "storage"
                ? "#f1f5f9"
                : obj.data.properties.room_type === "conference"
                ? "#fef3c7"
                : "#e2e8f0";

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
                  {/* Room walls */}
                  <boxGeometry 
                    args={[
                      obj.data.size.width / 10,
                      3,
                      obj.data.size.height / 10
                    ]} 
                  />
                  <meshStandardMaterial 
                    color={baseColor}
                    transparent
                    opacity={0.8}
                  />

                  {/* Room ceiling */}
                  <mesh
                    position={[0, 1.5, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                  >
                    <planeGeometry 
                      args={[
                        obj.data.size.width / 10,
                        obj.data.size.height / 10
                      ]} 
                    />
                    <meshStandardMaterial
                      color={baseColor}
                      transparent
                      opacity={0.9}
                      side={2}
                    />
                  </mesh>
                </mesh>
              );
            }
            return null;
          })}
        </group>

        {/* Lighting fixtures */}
        {fixtures?.map((fixture) => {
          if (!fixture.position) return null;

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
