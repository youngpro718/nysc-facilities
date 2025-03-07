
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import * as THREE from 'three';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FloorPlanNode } from '../types/floorPlanTypes';
import { toast } from 'sonner';

function Room3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#e2e8f0', 
  onClick, 
  isSelected = false,
  id,
  properties
}: {
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  id: string;
  properties?: any;
}) {
  const wallHeight = 120; // Standard wall height 
  const meshRef = useRef<THREE.Mesh>(null);
  
  const material = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color),
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85
  });

  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1, 1.02, 1); // Slight scale up for selected rooms
        material.emissive = new THREE.Color(0x333333);
        material.emissiveIntensity = 0.2;
      } else {
        meshRef.current.scale.set(1, 1, 1);
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  }, [isSelected]);

  const roomName = properties?.room_number 
    ? `${properties.room_number}` 
    : '';

  return (
    <group
      position={[position.x, 0, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
    >
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick({ id, type: 'room', position, size, rotation, properties });
        }}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[size.width, wallHeight, size.height]} />
        <primitive object={material} attach="material" />
        <mesh position={[0, -wallHeight/2 + 2, 0]} receiveShadow>
          <boxGeometry args={[size.width, 4, size.height]} />
          <meshStandardMaterial 
            color="#d1d5db" 
            roughness={0.8}
          />
        </mesh>
      </mesh>
      
      {roomName && (
        <group position={[0, wallHeight/2 - 10, 0]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[size.width * 0.8, 15, 2]} />
            <meshStandardMaterial color="#1f2937" opacity={0} transparent={true} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Hallway3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#e5e7eb', 
  onClick, 
  isSelected = false,
  id,
  properties
}: {
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  id: string;
  properties?: any;
}) {
  const hallwayHeight = 30; // Lower than rooms to differentiate
  const meshRef = useRef<THREE.Mesh>(null);
  
  const material = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color), 
    transparent: true,
    opacity: 0.75,
    roughness: 0.9,
    metalness: 0.1,
    emissive: isSelected ? new THREE.Color(0x333333) : undefined,
    emissiveIntensity: isSelected ? 0.2 : 0
  });
  
  // Set hallway color based on lighting status if available
  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1, 1.02, 1); // Slight scale up for selected hallways
        material.emissive = new THREE.Color(0x333333);
        material.emissiveIntensity = 0.2;
      } else {
        meshRef.current.scale.set(1, 1, 1);
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
      
      // Check if lighting status is available and change color
      if (properties?.lighting_status === 'all_functional') {
        material.emissive = new THREE.Color(0x10b981); // Green tint for fully functional
        material.emissiveIntensity = 0.05;
      } else if (properties?.lighting_status === 'partial_issues') {
        material.emissive = new THREE.Color(0xf59e0b); // Amber tint for partial issues
        material.emissiveIntensity = 0.05;
      } else if (properties?.lighting_status === 'all_non_functional') {
        material.emissive = new THREE.Color(0xef4444); // Red tint for non-functional
        material.emissiveIntensity = 0.05;
      }
    }
  }, [isSelected, properties?.lighting_status]);

  // Add lighting fixtures visualization if available
  const hallwayType = properties?.hallwayType || properties?.type || 'public_main';
  const isEmergencyRoute = properties?.emergency_route === 'designated' || properties?.emergencyRoute === 'designated';
  
  return (
    <group
      position={[position.x, hallwayHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick({ id, type: 'hallway', position, size, rotation, properties });
      }}
    >
      <mesh
        ref={meshRef}
        receiveShadow
      >
        <boxGeometry args={[size.width, hallwayHeight, size.height]} />
        <primitive object={material} attach="material" />
      </mesh>
      
      {/* Floor marking for emergency routes */}
      {isEmergencyRoute && (
        <mesh
          position={[0, -hallwayHeight/2 + 0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[size.width * 0.9, size.height * 0.5]} />
          <meshStandardMaterial 
            color="#dc2626" 
            emissive="#ef4444"
            emissiveIntensity={0.2}
            opacity={0.7}
            transparent={true}
          />
        </mesh>
      )}
      
      {/* Hallway label */}
      {properties?.section && (
        <group position={[0, hallwayHeight/2 - 10, 0]} rotation={[0, 0, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[size.width * 0.8, 1, 2]} />
            <meshStandardMaterial color="#1f2937" opacity={0} transparent={true} />
          </mesh>
        </group>
      )}
      
      {/* Lighting fixtures visualization if data available */}
      {properties?.lighting_fixtures && Array.isArray(properties.lighting_fixtures) && 
        properties.lighting_fixtures.map((fixture: any, idx: number) => {
          // Calculate positions along hallway for fixtures
          const xOffset = (idx / (properties.lighting_fixtures.length + 1)) * size.width - size.width/2;
          
          return (
            <mesh 
              key={`light-${idx}`} 
              position={[xOffset, hallwayHeight - 2, 0]}
              scale={[1, 1, 1]}
            >
              <boxGeometry args={[8, 2, 8]} />
              <meshStandardMaterial 
                color={
                  fixture.status === 'functional' ? '#10b981' : 
                  fixture.status === 'maintenance_needed' ? '#f59e0b' : 
                  '#ef4444'
                }
                emissive={
                  fixture.status === 'functional' ? '#10b981' : 
                  fixture.status === 'maintenance_needed' ? '#f59e0b' : 
                  '#ef4444'
                }
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })
      }
    </group>
  );
}

function Door3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#94a3b8', 
  onClick, 
  isSelected = false,
  id
}: {
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  id: string;
}) {
  const doorHeight = 80;
  const doorWidth = Math.max(size.width, 40); // Ensure minimum door width
  const doorThickness = Math.min(size.height, 15); // Door thickness (depth)
  
  return (
    <group
      position={[position.x, doorHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick({ id, type: 'door', position, size, rotation });
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.6}
          metalness={0.3}
          emissive={isSelected ? new THREE.Color(0x555555) : undefined}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      
      <mesh position={[doorWidth/2 - 5, 0, doorThickness/2 + 1]} castShadow>
        <sphereGeometry args={[3, 8, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[300, 300, 300]} 
        intensity={0.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={2000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
      />
      <directionalLight 
        position={[-300, 200, -300]} 
        intensity={0.4}
        castShadow
      />
      <hemisphereLight 
        args={['#b1e1ff', '#b97a20', 0.5]}
      />
    </>
  );
}

function ThreeDScene({ 
  objects, 
  onObjectSelect, 
  selectedObjectId = null,
  previewData = null
}: {
  objects: FloorPlanNode[];
  onObjectSelect: (object: any) => void;
  selectedObjectId?: string | null;
  previewData?: any | null;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (camera && objects.length > 0 && !hasInitialized) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      objects.forEach(obj => {
        const x = obj.position.x;
        const y = obj.position.y;
        const width = obj.data.size?.width || 100;
        const height = obj.data.size?.height || 100;
        
        minX = Math.min(minX, x - width/2);
        maxX = Math.max(maxX, x + width/2);
        minY = Math.min(minY, y - height/2);
        maxY = Math.max(maxY, y + height/2);
      });
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      const sceneWidth = maxX - minX;
      const sceneDepth = maxY - minY;
      const maxDimension = Math.max(sceneWidth, sceneDepth, 500); // Minimum size for empty scenes
      const cameraDistance = maxDimension * 1.2;
      
      camera.position.set(centerX, cameraDistance * 0.8, centerY + cameraDistance);
      camera.lookAt(centerX, 0, centerY);
      
      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, 0, centerY);
        controlsRef.current.update();
      }
      
      setHasInitialized(true);
    }
  }, [camera, objects, hasInitialized]);

  useEffect(() => {
    if (controlsRef.current && selectedObjectId) {
      const selectedObject = objects.find(obj => obj.id === selectedObjectId);
      if (selectedObject) {
        const targetX = selectedObject.position.x;
        const targetY = selectedObject.position.y;
        const targetZ = 0;
        
        controlsRef.current.target.set(targetX, targetZ, targetY);
        controlsRef.current.update();
      }
    }
  }, [selectedObjectId, objects]);

  return (
    <>
      <SceneLighting />
      <OrbitControls 
        ref={controlsRef} 
        enableDamping={true}
        dampingFactor={0.1}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={100}
        maxDistance={2000}
      />
      
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[5000, 5000]} />
          <meshStandardMaterial color="#f3f4f6" roughness={0.8} metalness={0.1} />
        </mesh>
        
        <Grid 
          infiniteGrid 
          cellSize={20} 
          cellThickness={0.6} 
          cellColor="#94a3b8" 
          sectionSize={100}
          sectionThickness={1.5}
          sectionColor="#475569"
          fadeDistance={1500}
          fadeStrength={1.5}
          position={[0, -1, 0]}
        />
      </group>
      
      {objects.map(obj => {
        let objectData = obj;
        if (previewData && previewData.id === obj.id) {
          objectData = {
            ...obj,
            position: previewData.position || obj.position,
            rotation: previewData.rotation ?? obj.rotation,
            data: {
              ...obj.data,
              size: previewData.data?.size || obj.data.size,
              properties: previewData.data?.properties || obj.data.properties,
              rotation: previewData.data?.rotation ?? obj.data.rotation
            }
          };
        }
        
        const isSelected = selectedObjectId === obj.id;
        const rotation = objectData.data?.rotation !== undefined 
          ? objectData.data.rotation 
          : (objectData.rotation || 0);
        
        switch (obj.type) {
          case 'room':
            return (
              <Room3D 
                key={obj.id}
                id={obj.id}
                position={objectData.position}
                size={objectData.data.size}
                rotation={rotation}
                color={obj.data?.style?.backgroundColor || '#e2e8f0'}
                onClick={onObjectSelect}
                isSelected={isSelected}
                properties={obj.data?.properties}
              />
            );
          case 'hallway':
            return (
              <Hallway3D
                key={obj.id}
                id={obj.id}
                position={objectData.position}
                size={objectData.data.size}
                rotation={rotation}
                color={obj.data?.style?.backgroundColor || '#e5e7eb'}
                onClick={onObjectSelect}
                isSelected={isSelected}
                properties={obj.data?.properties}
              />
            );
          case 'door':
            return (
              <Door3D
                key={obj.id}
                id={obj.id}
                position={objectData.position}
                size={objectData.data.size || {width: 40, height: 15}}
                rotation={rotation}
                color={obj.data?.style?.backgroundColor || '#94a3b8'}
                onClick={onObjectSelect}
                isSelected={isSelected}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}

interface ThreeDViewerProps {
  floorId: string | null;
  onObjectSelect?: (object: any) => void;
  selectedObjectId?: string | null;
  previewData?: any;
}

export function ThreeDViewer({ 
  floorId, 
  onObjectSelect, 
  selectedObjectId,
  previewData
}: ThreeDViewerProps) {
  const { objects, isLoading } = useFloorPlanData(floorId);
  const [viewerError, setViewerError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleObjectSelect = (object: any) => {
    if (onObjectSelect) {
      const selectedObj = objects.find(obj => obj.id === object.id);
      if (selectedObj) {
        onObjectSelect({
          ...selectedObj,
          id: selectedObj.id,
          type: selectedObj.type,
          position: selectedObj.position,
          size: selectedObj.data.size,
          rotation: selectedObj.data.rotation || 0,
          properties: selectedObj.data.properties
        });
      }
    }
  };

  const handleCanvasError = (err: Error) => {
    console.error('ThreeDViewer error:', err);
    setViewerError(err);
    toast.error('Error rendering 3D view');
  };

  if (!floorId) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a floor to view the 3D model</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-gray-500">Loading 3D model...</p>
        </div>
      </Card>
    );
  }

  if (viewerError) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <p className="text-red-500 font-medium">Error rendering 3D view</p>
          <p className="text-gray-500 mt-2">Please try refreshing the page</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full overflow-hidden relative">
      <ErrorBoundary>
        {isMounted && (
          <Canvas
            shadows
            onError={handleCanvasError as any}
            gl={{ 
              antialias: true,
              alpha: false,
              preserveDrawingBuffer: true
            }}
            camera={{ 
              position: [0, 500, 500], 
              fov: 50,
              near: 0.1,
              far: 10000
            }}
            style={{ background: 'linear-gradient(to bottom, #e0f2fe, #f8fafc)' }}
          >
            <ThreeDScene 
              objects={objects} 
              onObjectSelect={handleObjectSelect} 
              selectedObjectId={selectedObjectId} 
              previewData={previewData}
            />
          </Canvas>
        )}
        
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-md">
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-4 h-4 rounded-full bg-blue-500"></span>
              <span>Left-click + drag: Rotate</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-4 h-4 rounded-full bg-green-500"></span>
              <span>Right-click + drag: Pan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500"></span>
              <span>Scroll: Zoom</span>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </Card>
  );
}
