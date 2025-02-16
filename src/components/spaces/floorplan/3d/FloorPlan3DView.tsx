
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei";
import { useFloorPlanData } from "../hooks/useFloorPlanData";

interface FloorPlan3DViewProps {
  floorId: string | null;
}

export function FloorPlan3DView({ floorId }: FloorPlan3DViewProps) {
  const { objects, isLoading } = useFloorPlanData(floorId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-[600px]">
      <Canvas shadows>
        {/* Default camera position */}
        <PerspectiveCamera makeDefault position={[0, 10, 10]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1}
          castShadow
        />
        
        {/* Grid helper */}
        <Grid
          args={[100, 100]}
          cellSize={1}
          cellThickness={1}
          cellColor="#6b7280"
          sectionSize={3}
        />

        {/* Objects from floor plan */}
        <group position={[-50, 0, -50]}>
          {objects.map((obj) => {
            if (obj.type === "room") {
              return (
                <mesh
                  key={obj.id}
                  position={[
                    obj.position.x / 10,
                    1.5, // Height
                    obj.position.y / 10
                  ]}
                  rotation={[0, obj.rotation || 0, 0]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry 
                    args={[
                      obj.data.size.width / 10,
                      3, // Height
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

        {/* Controls */}
        <OrbitControls
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
}
