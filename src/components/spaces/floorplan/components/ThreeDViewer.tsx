
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Html, Text, Line } from '@react-three/drei';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import * as THREE from 'three';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FloorPlanNode } from '../types/floorPlanTypes';
import { toast } from 'sonner';
import { InfoIcon, Maximize2Icon, StretchHorizontalIcon } from 'lucide-react';

// Interactive object label component that renders in 3D space
function ObjectLabel({ 
  position, 
  label, 
  color = '#1f2937', 
  backgroundColor = 'rgba(255, 255, 255, 0.85)',
  type,
  onHover 
}: { 
  position: [number, number, number]; 
  label: string; 
  color?: string;
  backgroundColor?: string;
  type: string;
  onHover?: (isHovered: boolean) => void;
}) {
  return (
    <Html
      position={position}
      center
      occlude
      distanceFactor={15}
      onPointerOver={() => onHover && onHover(true)}
      onPointerOut={() => onHover && onHover(false)}
    >
      <div 
        className="px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap select-none"
        style={{ 
          color, 
          backgroundColor,
          border: '1px solid rgba(209, 213, 219, 0.5)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transform: 'translateY(-100%)',
          marginBottom: '5px',
          pointerEvents: 'none'
        }}
      >
        <span className="text-xs opacity-70">{type}:</span> {label}
      </div>
    </Html>
  );
}

// Enhanced info card that appears when hovering/selecting objects
function SpaceInfoCard({
  data,
  position,
  visible,
  type
}: {
  data: any;
  position: [number, number, number];
  visible: boolean;
  type: string;
}) {
  if (!visible) return null;
  
  return (
    <Html position={position} center distanceFactor={10} occlude zIndexRange={[16, 100]}>
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 min-w-[160px] max-w-[200px] text-xs border border-gray-200">
        <div className="font-semibold border-b pb-1 mb-1 flex items-center">
          <span className={`w-2 h-2 rounded-full mr-1.5 ${
            type === 'room' ? 'bg-blue-500' : 
            type === 'hallway' ? 'bg-green-500' : 'bg-amber-500'
          }`}></span>
          {data.label || type}
        </div>
        
        {type === 'room' && (
          <div className="space-y-1">
            {data.properties?.room_number && (
              <div>Room #: <span className="font-medium">{data.properties.room_number}</span></div>
            )}
            {data.properties?.room_type && (
              <div>Type: <span className="font-medium capitalize">{data.properties.room_type.replace('_', ' ')}</span></div>
            )}
            {data.properties?.total_lights && (
              <div>Lighting: 
                <span className={`font-medium ml-1 ${
                  data.properties.lighting_status === 'all_functional' ? 'text-green-600' :
                  data.properties.lighting_status === 'partial_issues' ? 'text-amber-600' :
                  data.properties.lighting_status === 'all_non_functional' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {data.properties.functional_lights}/{data.properties.total_lights} functional
                </span>
              </div>
            )}
          </div>
        )}
        
        {type === 'hallway' && (
          <div className="space-y-1">
            {data.properties?.section && (
              <div>Section: <span className="font-medium capitalize">{data.properties.section.replace('_', ' ')}</span></div>
            )}
            {data.properties?.hallwayType && (
              <div>Type: <span className="font-medium capitalize">{data.properties.hallwayType.replace('_', ' ')}</span></div>
            )}
            {data.properties?.accessibility && (
              <div>Access: <span className="font-medium capitalize">{data.properties.accessibility.replace('_', ' ')}</span></div>
            )}
            {data.properties?.emergency_route && data.properties.emergency_route !== 'not_designated' && (
              <div className="text-red-600 font-medium">Emergency Route</div>
            )}
            {data.properties?.total_lights && (
              <div>Lighting: 
                <span className={`font-medium ml-1 ${
                  data.properties.lighting_status === 'all_functional' ? 'text-green-600' :
                  data.properties.lighting_status === 'partial_issues' ? 'text-amber-600' :
                  data.properties.lighting_status === 'all_non_functional' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {data.properties.functional_lights}/{data.properties.total_lights} functional
                </span>
              </div>
            )}
          </div>
        )}
        
        {type === 'door' && (
          <div className="space-y-1">
            {data.properties?.doorType && (
              <div>Type: <span className="font-medium capitalize">{data.properties.doorType.replace('_', ' ')}</span></div>
            )}
            {data.properties?.securityLevel && (
              <div>Security: <span className="font-medium capitalize">{data.properties.securityLevel.replace('_', ' ')}</span></div>
            )}
          </div>
        )}
        
        <div className="mt-1 pt-1 border-t text-gray-500 text-[10px] flex items-center justify-between">
          <div>ID: {data.id.substring(0, 6)}...</div>
          <div className="flex items-center">
            <StretchHorizontalIcon className="h-3 w-3 mr-0.5" />
            {data.size.width}×{data.size.height}
          </div>
        </div>
      </div>
    </Html>
  );
}

// Connection visualization between spaces
function SpaceConnection({ from, to, color = '#94a3b8' }: { from: any; to: any; color?: string }) {
  const points = [
    new THREE.Vector3(from.position.x, 10, from.position.y),
    new THREE.Vector3(to.position.x, 10, to.position.y)
  ];
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      dashed={true}
      dashSize={3}
      dashOffset={1}
      gapSize={3}
    />
  );
}

function Room3D({ 
  position, 
  size, 
  rotation = 0, 
  color = '#e2e8f0', 
  onClick, 
  isSelected = false,
  id,
  label,
  properties,
  showLabels
}: {
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  id: string;
  label: string;
  properties?: any;
  showLabels: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const material = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color),
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85
  });

  const wallHeight = 120; // Standard wall height 
  
  // Adjust appearance based on selection/hover state
  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1, 1.02, 1); // Slight scale up for selected rooms
        material.emissive = new THREE.Color(0x3b82f6);
        material.emissiveIntensity = 0.15;
      } else if (hovered) {
        meshRef.current.scale.set(1, 1.01, 1);
        material.emissive = new THREE.Color(0x3b82f6);
        material.emissiveIntensity = 0.05;
      } else {
        meshRef.current.scale.set(1, 1, 1);
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  }, [isSelected, hovered]);

  const roomType = properties?.room_type || 'default';
  const roomNumber = properties?.room_number || '';
  
  // Determine lighting color/status if available
  const hasTotalLights = properties?.total_lights && properties.total_lights > 0;
  const lightingColor = hasTotalLights 
    ? properties.lighting_status === 'all_functional' ? '#10b981'
      : properties.lighting_status === 'partial_issues' ? '#f59e0b'
      : properties.lighting_status === 'all_non_functional' ? '#ef4444'
      : '#94a3b8'
    : null;

  return (
    <group
      position={[position.x, 0, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
    >
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick({ id, type: 'room', position, size, rotation, properties, label });
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[size.width, wallHeight, size.height]} />
        <primitive object={material} attach="material" />
        
        {/* Floor */}
        <mesh position={[0, -wallHeight/2 + 2, 0]} receiveShadow>
          <boxGeometry args={[size.width, 4, size.height]} />
          <meshStandardMaterial 
            color="#d1d5db" 
            roughness={0.8}
          />
        </mesh>
      </mesh>

      {/* Lighting visualization if available */}
      {lightingColor && (
        <mesh position={[0, wallHeight - 10, 0]} receiveShadow>
          <boxGeometry args={[size.width * 0.6, 2, size.height * 0.6]} />
          <meshStandardMaterial 
            color={lightingColor}
            emissive={lightingColor}
            emissiveIntensity={0.2}
            transparent={true}
            opacity={0.3}
          />
        </mesh>
      )}
      
      {/* Room label */}
      {showLabels && (
        <ObjectLabel 
          position={[0, wallHeight + 20, 0]} 
          label={label || (roomNumber ? `Room ${roomNumber}` : `Room`)}
          type="Room"
          color="#1f2937"
          onHover={setHovered}
        />
      )}
      
      {/* Show info card on hover */}
      <SpaceInfoCard 
        data={{ 
          id, 
          label: label || (roomNumber ? `Room ${roomNumber}` : 'Room'),
          properties,
          size
        }}
        position={[0, wallHeight/2, 0]}
        visible={hovered || isSelected}
        type="room"
      />
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
  label,
  properties,
  showLabels,
  connectedSpaces = []
}: {
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  id: string;
  label: string;
  properties?: any;
  showLabels: boolean;
  connectedSpaces?: any[];
}) {
  const hallwayHeight = 30; // Lower than rooms to differentiate
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const material = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color), 
    transparent: true,
    opacity: 0.75,
    roughness: 0.9,
    metalness: 0.1
  });
  
  // Adjust appearance based on selection/hover state
  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1, 1.1, 1); // Slight scale up for selected hallways
        material.emissive = new THREE.Color(0x10b981);
        material.emissiveIntensity = 0.2;
      } else if (hovered) {
        meshRef.current.scale.set(1, 1.05, 1);
        material.emissive = new THREE.Color(0x10b981);
        material.emissiveIntensity = 0.1;
      } else {
        meshRef.current.scale.set(1, 1, 1);
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
        
        // Apply lighting status tint if available
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
    }
  }, [isSelected, hovered, properties?.lighting_status]);

  // Set hallway descriptive properties 
  const hallwayType = properties?.hallwayType || properties?.type || 'public_main';
  const isEmergencyRoute = properties?.emergency_route === 'designated' || properties?.emergencyRoute === 'designated';
  const section = properties?.section || 'main';
  
  // Total lighting fixtures count and status
  const hasTotalLights = properties?.total_lights && properties.total_lights > 0;
  
  return (
    <group
      position={[position.x, hallwayHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
    >
      <mesh
        ref={meshRef}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick({ id, type: 'hallway', position, size, rotation, properties, label });
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
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
      {showLabels && (
        <ObjectLabel 
          position={[0, hallwayHeight + 10, 0]} 
          label={label || `Hallway ${section}`}
          type="Hallway"
          color="#065f46"
          backgroundColor="rgba(240, 253, 244, 0.85)"
          onHover={setHovered}
        />
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
      
      {/* Show info card on hover */}
      <SpaceInfoCard 
        data={{ 
          id, 
          label: label || `Hallway ${section}`,
          properties,
          size
        }}
        position={[0, hallwayHeight/2, 0]}
        visible={hovered || isSelected}
        type="hallway"
      />
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
  id,
  label,
  properties,
  showLabels
}: {
  position: { x: number, y: number };
  size: { width: number, height: number };
  rotation?: number;
  color?: string;
  onClick: (data: any) => void;
  isSelected?: boolean;
  id: string;
  label?: string;
  properties?: any;
  showLabels: boolean;
}) {
  const doorHeight = 80;
  const doorWidth = Math.max(size.width, 40); // Ensure minimum door width
  const doorThickness = Math.min(size.height, 15); // Door thickness (depth)
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Door material with outlines for better visibility
  const material = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color), 
    roughness: 0.6,
    metalness: 0.3,
    transparent: isSelected || hovered,
    opacity: isSelected || hovered ? 0.9 : 0.7,
  });
  
  // Adjust appearance based on selection/hover state
  useEffect(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1.1, 1.1, 1.1);
        material.emissive = new THREE.Color(0xf59e0b);
        material.emissiveIntensity = 0.3;
      } else if (hovered) {
        meshRef.current.scale.set(1.05, 1.05, 1.05);
        material.emissive = new THREE.Color(0xf59e0b);
        material.emissiveIntensity = 0.2;
      } else {
        meshRef.current.scale.set(1, 1, 1);
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  }, [isSelected, hovered]);
  
  return (
    <group
      position={[position.x, doorHeight/2, position.y]}
      rotation={[0, rotation * Math.PI / 180, 0]}
    >
      <mesh 
        ref={meshRef}
        castShadow 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick({ id, type: 'door', position, size, rotation, properties, label });
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
        <primitive object={material} attach="material" />
      </mesh>
      
      {/* Door handle */}
      <mesh position={[doorWidth/2 - 5, 0, doorThickness/2 + 1]} castShadow>
        <sphereGeometry args={[3, 8, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Door label */}
      {showLabels && (
        <ObjectLabel 
          position={[0, doorHeight + 10, 0]} 
          label={label || 'Door'}
          type="Door"
          color="#854d0e"
          backgroundColor="rgba(254, 243, 199, 0.85)"
          onHover={setHovered}
        />
      )}
      
      {/* Show info card on hover */}
      <SpaceInfoCard 
        data={{ 
          id, 
          label: label || 'Door',
          properties,
          size
        }}
        position={[0, doorHeight/2, 0]}
        visible={hovered || isSelected}
        type="door"
      />
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
  connections,
  onObjectSelect, 
  selectedObjectId = null,
  previewData = null,
  showLabels = true
}: {
  objects: FloorPlanNode[];
  connections: any[];
  onObjectSelect: (object: any) => void;
  selectedObjectId?: string | null;
  previewData?: any | null;
  showLabels?: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Group objects by type for better rendering
  const roomObjects = objects.filter(obj => obj.type === 'room');
  const hallwayObjects = objects.filter(obj => obj.type === 'hallway');
  const doorObjects = objects.filter(obj => obj.type === 'door');
  
  // Find visible connections between spaces
  const visibleConnections = connections.filter(conn => {
    const sourceObj = objects.find(obj => obj.id === conn.source);
    const targetObj = objects.find(obj => obj.id === conn.target);
    return sourceObj && targetObj;
  });
  
  // Initialize camera position based on scene contents
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

  // Focus camera on selected object
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
        {/* Floor plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[5000, 5000]} />
          <meshStandardMaterial color="#f3f4f6" roughness={0.8} metalness={0.1} />
        </mesh>
        
        {/* Grid for better spatial awareness */}
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
        
        {/* Render connections between spaces */}
        {visibleConnections.map((conn, idx) => {
          const sourceObj = objects.find(obj => obj.id === conn.source);
          const targetObj = objects.find(obj => obj.id === conn.target);
          
          if (!sourceObj || !targetObj) return null;
          
          return (
            <SpaceConnection 
              key={`conn-${idx}`}
              from={sourceObj}
              to={targetObj}
              color={
                (sourceObj.type === 'hallway' || targetObj.type === 'hallway') 
                  ? '#22c55e' // Green for hallway connections
                  : '#94a3b8'  // Gray for other connections
              }
            />
          );
        })}
        
        {/* Render hallways first (lower) */}
        {hallwayObjects.map(obj => {
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
          
          // Find spaces connected to this hallway
          const connectedSpaces = objects.filter(otherObj => {
            const isConnected = connections.some(conn => 
              (conn.source === obj.id && conn.target === otherObj.id) ||
              (conn.target === obj.id && conn.source === otherObj.id)
            );
            return isConnected;
          });
          
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
              label={obj.data?.label || 'Hallway'}
              showLabels={showLabels}
              connectedSpaces={connectedSpaces}
            />
          );
        })}
        
        {/* Render doors */}
        {doorObjects.map(obj => {
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
              properties={obj.data?.properties}
              label={obj.data?.label}
              showLabels={showLabels}
            />
          );
        })}
        
        {/* Render rooms */}
        {roomObjects.map(obj => {
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
              label={obj.data?.label || ''}
              showLabels={showLabels}
            />
          );
        })}
      </group>
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
  const { objects, edges, isLoading } = useFloorPlanData(floorId);
  const [viewerError, setViewerError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);

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
          properties: selectedObj.data.properties,
          label: selectedObj.data.label
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
              connections={edges}
              onObjectSelect={handleObjectSelect} 
              selectedObjectId={selectedObjectId} 
              previewData={previewData}
              showLabels={showLabels}
            />
          </Canvas>
        )}
        
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-md">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Floor Plan Viewer</span>
            <button 
              onClick={() => setShowLabels(!showLabels)} 
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              title={showLabels ? "Hide labels" : "Show labels"}
            >
              <InfoIcon size={14} />
            </button>
          </div>
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
