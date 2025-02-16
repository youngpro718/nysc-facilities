
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
        {/* Camera setup with better default position */}
        <PerspectiveCamera 
          makeDefault 
          position={[20, 20, 20]} 
          fov={50}
        />
        
        {/* Enhanced lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* Grid helper */}
        <Grid
          args={[100, 100]}
          cellSize={1}
          cellThickness={1}
          cellColor="#6b7280"
          sectionSize={3}
          position={[0, -0.01, 0]}
          receiveShadow
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

        {/* Enhanced OrbitControls with constraints */}
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.1} // Slightly above horizontal to prevent seeing under the floor
          minPolarAngle={Math.PI / 8} // Limit how high the camera can go
          maxAzimuthAngle={Math.PI / 1.5} // Limit horizontal rotation
          minAzimuthAngle={-Math.PI / 1.5}
          minDistance={5} // Minimum zoom distance
          maxDistance={50} // Maximum zoom distance
          enablePan={true} // Allow panning
          enableZoom={true} // Allow zooming
          enableRotate={true} // Allow rotation
          dampingFactor={0.05} // Smooth camera movement
          enabled={true}
          rotateSpeed={0.5} // Slower rotation for more control
          zoomSpeed={0.8} // Slower zoom for more control
          panSpeed={0.8} // Slower pan for more control
          target={[0, 0, 0]} // Look at center
        />
      </Canvas>
    </div>
  );
}
