
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment, ContactShadows } from '@react-three/drei';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import * as THREE from 'three';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FloorPlanNode } from '../types/floorPlanTypes';
import { toast } from 'sonner';

// Room 3D Component with improved materials and appearance
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
  
  // Material setup with PBR properties
  const material = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color),
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85
  });

  // Selected state effect
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

  // Room name
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
        {/* Floor base */}
        <mesh position={[0, -wallHeight/2 + 2, 0]} receiveShadow>
          <boxGeometry args={[size.width, 4, size.height]} />
          <meshStandardMaterial 
            color="#d1d5db" 
            roughness={0.8}
          />
        </mesh>
      </mesh>
      
      {/* Room label - using simple Text from drei instead of TextGeometry */}
      {roomName && (
        <group position={[0, wallHeight/2 - 10, 0]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[size.width * 0.8, 15, 2]} />
            <meshStandardMaterial color="#1f2937" opacity={0} transparent={true} />
          </mesh>
          {/* We'll use HTML text overlay instead of 3D text */}
        </group>
      )}
    </group>
  );
}

// Hallway 3D Component with improved appearance
function Hallway3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#e5e7eb', 
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
  const hallwayHeight = 30; // Lower than rooms to differentiate
  
  return (
    <mesh
      position={[position.x, hallwayHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick({ id, type: 'hallway', position, size, rotation });
      }}
      receiveShadow
    >
      <boxGeometry args={[size.width, hallwayHeight, size.height]} />
      <meshStandardMaterial 
        color={color} 
        transparent={true}
        opacity={0.75}
        roughness={0.9}
        metalness={0.1}
        emissive={isSelected ? new THREE.Color(0x333333) : undefined}
        emissiveIntensity={isSelected ? 0.2 : 0}
      />
    </mesh>
  );
}

// Door 3D Component with improved appearance
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
  // Door is positioned half-way up the wall
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
      
      {/* Door handle */}
      <mesh position={[doorWidth/2 - 5, 0, doorThickness/2 + 1]} castShadow>
        <sphereGeometry args={[3, 8, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// Scene Lighting Component
function SceneLighting() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  
  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.6} />
      <directionalLight 
        ref={lightRef}
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

// Scene Initialization Component with improved controls and environment
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
  const { camera, scene } = useThree();
  const controlsRef = useRef<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Set up initial camera position based on objects
  useEffect(() => {
    if (camera && objects.length > 0 && !hasInitialized) {
      // Find overall bounds of all objects
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      objects.forEach(obj => {
        const x = obj.position.x;
        const y = obj.position.y;
        const width = obj.data?.size?.width || 100;
        const height = obj.data?.size?.height || 100;
        
        minX = Math.min(minX, x - width/2);
        maxX = Math.max(maxX, x + width/2);
        minY = Math.min(minY, y - height/2);
        maxY = Math.max(maxY, y + height/2);
      });
      
      // Center point of all objects
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Calculate scene size and suitable camera distance
      const sceneWidth = maxX - minX;
      const sceneDepth = maxY - minY;
      const maxDimension = Math.max(sceneWidth, sceneDepth);
      const cameraDistance = maxDimension * 1.2; // Give some padding
      
      // Position camera with a good viewing angle
      camera.position.set(centerX, cameraDistance * 0.8, centerY + cameraDistance);
      camera.lookAt(centerX, 0, centerY);
      
      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, 0, centerY);
        controlsRef.current.update();
      }
      
      setHasInitialized(true);
    }
  }, [camera, objects, hasInitialized]);

  // Update orbit controls target when selection changes for smooth transitions
  useEffect(() => {
    if (controlsRef.current && selectedObjectId) {
      const selectedObject = objects.find(obj => obj.id === selectedObjectId);
      if (selectedObject) {
        const targetX = selectedObject.position.x;
        const targetY = selectedObject.position.y;
        const targetZ = 0;
        
        // Create a smooth transition to the selected object
        const startPosition = new THREE.Vector3().copy(controlsRef.current.target);
        const endPosition = new THREE.Vector3(targetX, targetZ, targetY);
        const duration = 1000; // ms
        const startTime = Date.now();
        
        const animateCamera = () => {
          const elapsedTime = Date.now() - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          
          // Ease in-out function for smooth animation
          const easeProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          
          const newPosition = new THREE.Vector3().lerpVectors(
            startPosition, 
            endPosition, 
            easeProgress
          );
          
          controlsRef.current.target.copy(newPosition);
          controlsRef.current.update();
          
          if (progress < 1) {
            requestAnimationFrame(animateCamera);
          }
        };
        
        animateCamera();
      }
    }
  }, [selectedObjectId, objects]);

  const renderObject = (obj: FloorPlanNode) => {
    // Apply preview data if available
    let objectData = obj;
    if (previewData && previewData.id === obj.id) {
      objectData = {
        ...obj,
        position: previewData.position || obj.position,
        rotation: previewData.rotation ?? (obj.data?.rotation || 0),
        data: {
          ...obj.data,
          size: previewData.data?.size || obj.data?.size,
          properties: previewData.data?.properties || obj.data?.properties
        }
      };
    }
    
    const isSelected = selectedObjectId === obj.id;

    // Ensure all required properties exist
    if (!objectData.position || !objectData.data) {
      console.warn(`Invalid object data for ${obj.id}`, objectData);
      return null;
    }

    const size = objectData.data.size || { width: 100, height: 100 };
    const rotation = objectData.data.rotation || 0;
    const backgroundColor = objectData.data?.style?.backgroundColor;
    
    switch (obj.type) {
      case 'room':
        return (
          <Room3D 
            key={obj.id}
            id={obj.id}
            position={objectData.position}
            size={size}
            rotation={rotation}
            color={backgroundColor || '#e2e8f0'}
            onClick={onObjectSelect}
            isSelected={isSelected}
            properties={objectData.data?.properties}
          />
        );
      case 'hallway':
        return (
          <Hallway3D
            key={obj.id}
            id={obj.id}
            position={objectData.position}
            size={size}
            rotation={rotation}
            color={backgroundColor || '#e5e7eb'}
            onClick={onObjectSelect}
            isSelected={isSelected}
          />
        );
      case 'door':
        return (
          <Door3D
            key={obj.id}
            id={obj.id}
            position={objectData.position}
            size={size || {width: 40, height: 15}}
            rotation={rotation}
            color={backgroundColor || '#94a3b8'}
            onClick={onObjectSelect}
            isSelected={isSelected}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <SceneLighting />
      <OrbitControls 
        ref={controlsRef} 
        enableDamping={true}
        dampingFactor={0.1}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
        minDistance={100} // Prevent zooming too close
        maxDistance={2000} // Prevent zooming too far
      />
      
      {/* Environment and ground */}
      <group>
        {/* Ground plane with shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[5000, 5000]} />
          <meshStandardMaterial color="#f3f4f6" roughness={0.8} metalness={0.1} />
        </mesh>
        
        {/* Grid overlay with measurements */}
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
      
      {/* Render all objects with safety checks */}
      {objects.map(obj => renderObject(obj))}
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
  const [canvasKey, setCanvasKey] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Reset canvas when floor changes
  useEffect(() => {
    if (floorId) {
      setCanvasKey(prev => prev + 1);
    }
  }, [floorId]);

  const handleObjectSelect = (object: any) => {
    if (onObjectSelect) {
      const selectedObj = objects.find(obj => obj.id === object.id);
      if (selectedObj) {
        onObjectSelect({
          ...selectedObj,
          id: selectedObj.id,
          type: selectedObj.type,
          position: selectedObj.position,
          size: selectedObj.data?.size,
          rotation: selectedObj.data?.rotation || 0,
          properties: selectedObj.data?.properties
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
      <Card className="w-full h-[600px] flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a floor to view the 3D model</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-gray-500">Loading 3D model...</p>
        </div>
      </Card>
    );
  }

  if (viewerError) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <p className="text-red-500 font-medium">Error rendering 3D view</p>
          <p className="text-gray-500 mt-2">Please try refreshing the page</p>
        </div>
      </Card>
    );
  }

  // Check if we have valid objects to render
  const validObjects = Array.isArray(objects) ? objects.filter(obj => 
    obj && 
    obj.position && 
    typeof obj.position.x === 'number' && 
    typeof obj.position.y === 'number' &&
    !isNaN(obj.position.x) && 
    !isNaN(obj.position.y)
  ) : [];

  return (
    <Card className="w-full h-[600px] overflow-hidden relative">
      <ErrorBoundary>
        {isMounted && (
          <Canvas
            key={`three-canvas-${canvasKey}`}
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
              objects={validObjects} 
              onObjectSelect={handleObjectSelect} 
              selectedObjectId={selectedObjectId} 
              previewData={previewData}
            />
          </Canvas>
        )}
        
        {/* Interactive controls overlay */}
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
