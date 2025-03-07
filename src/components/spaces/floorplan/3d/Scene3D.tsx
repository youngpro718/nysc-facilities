
import { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { FloorPlanNode } from '../types/floorPlanTypes';
import { Room3D } from './Room3D';
import { Hallway3D } from './Hallway3D';
import { Door3D } from './Door3D';
import { Floor3D } from './Floor3D';
import { SceneLighting } from './SceneLighting';
import { EnhancedControls } from './EnhancedControls';

interface Scene3DProps {
  objects: FloorPlanNode[];
  onObjectSelect: (object: any) => void;
  selectedObjectId?: string | null;
  previewData?: any | null;
}

export function Scene3D({ 
  objects, 
  onObjectSelect, 
  selectedObjectId,
  previewData
}: Scene3DProps) {
  const { camera } = useThree();
  const [controlsInstance, setControlsInstance] = useState<any>(null);
  const [sceneBounds, setSceneBounds] = useState({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  const [initialized, setInitialized] = useState(false);

  // Calculate scene bounds when objects change
  useEffect(() => {
    if (objects.length > 0) {
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
      
      setSceneBounds({ minX, maxX, minY, maxY });
    }
  }, [objects]);

  // Initialize camera position
  useEffect(() => {
    if (!initialized && objects.length > 0 && camera) {
      const centerX = (sceneBounds.minX + sceneBounds.maxX) / 2;
      const centerY = (sceneBounds.minY + sceneBounds.maxY) / 2;
      
      const sceneWidth = sceneBounds.maxX - sceneBounds.minX;
      const sceneDepth = sceneBounds.maxY - sceneBounds.minY;
      const maxDimension = Math.max(sceneWidth, sceneDepth, 500);
      const cameraDistance = maxDimension * 1.2;
      
      camera.position.set(centerX, cameraDistance * 0.8, centerY + cameraDistance);
      camera.lookAt(centerX, 0, centerY);
      
      setInitialized(true);
    }
  }, [camera, objects, sceneBounds, initialized]);

  // Focus on selected object
  useEffect(() => {
    if (controlsInstance && selectedObjectId) {
      const selectedObject = objects.find(obj => obj.id === selectedObjectId);
      if (selectedObject) {
        const targetX = selectedObject.position.x;
        const targetY = selectedObject.position.y;
        const targetZ = 0;
        
        controlsInstance.target.set(targetX, targetZ, targetY);
        controlsInstance.update();
      }
    }
  }, [selectedObjectId, objects, controlsInstance]);

  const handleControlsChange = (controls: any) => {
    setControlsInstance(controls);
  };
  
  const sceneCenter: [number, number, number] = [
    (sceneBounds.minX + sceneBounds.maxX) / 2,
    0,
    (sceneBounds.minY + sceneBounds.maxY) / 2
  ];

  return (
    <>
      <SceneLighting />
      <EnhancedControls 
        target={sceneCenter}
        onControlsChange={handleControlsChange}
      />
      
      <Floor3D />
      
      {objects.map(obj => {
        let objectData = obj;
        
        // Apply preview data if available for this object
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
                color={obj.data?.style?.backgroundColor}
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
                color={obj.data?.style?.backgroundColor}
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
                color={obj.data?.style?.backgroundColor}
                onClick={onObjectSelect}
                isSelected={isSelected}
                properties={obj.data?.properties}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
