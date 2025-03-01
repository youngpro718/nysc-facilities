
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import * as THREE from 'three';

// Room 3D Component
function Room3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#e2e8f0', 
  onClick, 
  isSelected = false,
  id
}) {
  const roomMaterial = useRef();
  
  useEffect(() => {
    if (roomMaterial.current) {
      roomMaterial.current.color.set(color);
      roomMaterial.current.needsUpdate = true;
    }
  }, [color]);

  return (
    <mesh
      position={[position.x, 0, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick({ id, type: 'room', position, size, rotation });
      }}
      receiveShadow
      castShadow
    >
      <boxGeometry args={[size.width, 100, size.height]} />
      <meshStandardMaterial 
        ref={roomMaterial} 
        color={color} 
        transparent={true}
        opacity={0.8}
        emissive={isSelected ? '#ffffff' : undefined}
        emissiveIntensity={isSelected ? 0.2 : 0}
      />
    </mesh>
  );
}

// Hallway 3D Component
function Hallway3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#e5e7eb', 
  onClick, 
  isSelected = false,
  id
}) {
  return (
    <mesh
      position={[position.x, 0, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick({ id, type: 'hallway', position, size, rotation });
      }}
      receiveShadow
    >
      <boxGeometry args={[size.width, 20, size.height]} />
      <meshStandardMaterial 
        color={color} 
        emissive={isSelected ? '#ffffff' : undefined}
        emissiveIntensity={isSelected ? 0.2 : 0}
      />
    </mesh>
  );
}

// Door 3D Component
function Door3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#94a3b8', 
  onClick, 
  isSelected = false,
  id
}) {
  return (
    <mesh
      position={[position.x, 10, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick({ id, type: 'door', position, size, rotation });
      }}
      receiveShadow
      castShadow
    >
      <boxGeometry args={[size.width, 80, size.height]} />
      <meshStandardMaterial 
        color={color} 
        emissive={isSelected ? '#ffffff' : undefined}
        emissiveIntensity={isSelected ? 0.2 : 0}
      />
    </mesh>
  );
}

// Scene Initialization Component
function ThreeDScene({ 
  objects, 
  onObjectSelect, 
  selectedObjectId = null,
  previewData = null
}) {
  const { camera } = useThree();
  const controlsRef = useRef();

  // Initial camera setup
  useEffect(() => {
    if (camera && objects.length > 0) {
      // Find center of all objects
      let totalX = 0;
      let totalY = 0;
      
      objects.forEach(obj => {
        totalX += obj.position.x;
        totalY += obj.position.y;
      });
      
      const centerX = totalX / objects.length;
      const centerY = totalY / objects.length;
      
      // Position camera above the center
      camera.position.set(centerX, 500, centerY + 500);
      camera.lookAt(centerX, 0, centerY);
    }
  }, [camera, objects]);

  // Update orbit controls target when selection changes
  useEffect(() => {
    if (controlsRef.current && selectedObjectId) {
      const selectedObject = objects.find(obj => obj.id === selectedObjectId);
      if (selectedObject) {
        controlsRef.current.target.set(
          selectedObject.position.x, 
          0, 
          selectedObject.position.y
        );
      }
    }
  }, [selectedObjectId, objects]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[500, 500, 500]} 
        castShadow 
        intensity={0.8}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <OrbitControls 
        ref={controlsRef} 
        enableDamping={true}
        dampingFactor={0.1}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below the ground
      />
      
      {/* Grid floor */}
      <Grid 
        infiniteGrid 
        cellSize={20} 
        cellThickness={0.5} 
        cellColor="#999" 
        sectionSize={100}
        sectionThickness={1.5}
        sectionColor="#444"
        fadeDistance={1500}
        fadeStrength={1.5}
        position={[0, -1, 0]}
      />
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[5000, 5000]} />
        <meshStandardMaterial color="#f7f7f7" />
      </mesh>
      
      {/* Render all objects */}
      {objects.map(obj => {
        // Check if this object has preview data
        let objectData = obj;
        if (previewData && previewData.id === obj.id) {
          objectData = {
            ...obj,
            position: previewData.position || obj.position,
            rotation: previewData.rotation ?? obj.rotation,
            size: previewData.data?.size || obj.size
          };
        }
        
        const isSelected = selectedObjectId === obj.id;
        
        switch (obj.type) {
          case 'room':
            return (
              <Room3D 
                key={obj.id}
                id={obj.id}
                position={objectData.position}
                size={objectData.size}
                rotation={objectData.rotation || 0}
                color={obj.data?.style?.backgroundColor || '#e2e8f0'}
                onClick={onObjectSelect}
                isSelected={isSelected}
              />
            );
          case 'hallway':
            return (
              <Hallway3D
                key={obj.id}
                id={obj.id}
                position={objectData.position}
                size={objectData.size}
                rotation={objectData.rotation || 0}
                color={obj.data?.style?.backgroundColor || '#e5e7eb'}
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
                size={objectData.size || {width: 40, height: 15}}
                rotation={objectData.rotation || 0}
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
  const [, setError] = useState<Error | null>(null);

  const handleObjectSelect = (object: any) => {
    if (onObjectSelect) {
      const selectedObj = objects.find(obj => obj.id === object.id);
      if (selectedObj) {
        onObjectSelect({
          ...selectedObj,
          id: selectedObj.id,
          type: selectedObj.type,
          position: selectedObj.position,
          size: selectedObj.size,
          rotation: selectedObj.rotation || 0
        });
      }
    }
  };

  const handleCanvasError = (error: Error) => {
    console.error('ThreeDViewer error:', error);
    setError(error);
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
        <p className="text-gray-500">Loading 3D model...</p>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[600px] overflow-hidden">
      <Canvas
        shadows
        onError={handleCanvasError}
        gl={{ antialias: true }}
        camera={{ position: [0, 500, 500], fov: 50 }}
        style={{ background: '#f0f9ff' }}
      >
        <ThreeDScene 
          objects={objects} 
          onObjectSelect={handleObjectSelect} 
          selectedObjectId={selectedObjectId} 
          previewData={previewData}
        />
      </Canvas>
    </Card>
  );
}
