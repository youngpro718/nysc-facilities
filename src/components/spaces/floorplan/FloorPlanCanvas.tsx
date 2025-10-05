
import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  useNodesState, 
  useEdgesState, 
  Connection, 
  Edge, 
  Node,
  addEdge,
  ReactFlowProvider,
  applyNodeChanges,
  NodeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FloorPlanFlow } from './components/FloorPlanFlow';
import { useFloorPlanData } from "./hooks/useFloorPlanData";
import { useFloorPlanNodes } from "./hooks/useFloorPlanNodes";
import { RoomNode } from './nodes/RoomNode';
import { DoorNode } from './nodes/DoorNode';
import { HallwayNode } from './nodes/HallwayNode';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { FloorPlanNode } from './types/floorPlanTypes';

interface FloorPlanCanvasProps {
  floorId: string | null;
  zoom?: number;
  onObjectSelect?: (object: any | null) => void;
  previewData?: any;
}

const nodeTypes = {
  room: RoomNode,
  door: DoorNode,
  hallway: HallwayNode,
};

function FloorPlanCanvasInner({ 
  floorId, 
  zoom = 1, 
  onObjectSelect,
  previewData
}: FloorPlanCanvasProps) {
  const { objects, edges: graphEdges, isLoading } = useFloorPlanData(floorId);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const lastFloorId = useRef<string | null>(null);
  const initialized = useRef<boolean>(false);
  const memoizedNodeTypes = useRef(nodeTypes);
  const handleNodesChange = useFloorPlanNodes(onNodesChange);
  const previewingNodeId = useRef<string | null>(null);
  const [attachMode, setAttachMode] = useState<boolean>(false);
  const [selectedHallwayId, setSelectedHallwayId] = useState<string | null>(null);
  const [attachSide, setAttachSide] = useState<'north'|'south'|'east'|'west'>('north');
  const [offsetPercent, setOffsetPercent] = useState<number>(50);

  const initializeNodes = useCallback((objects: any[]) => {
    if (!objects?.length) return [];

    const reactFlowNodes = objects.map((obj) => {
      // Ensure we have valid position and size
      const position = obj.position && 
        typeof obj.position.x === 'number' && 
        typeof obj.position.y === 'number' &&
        !isNaN(obj.position.x) && 
        !isNaN(obj.position.y) ? 
        obj.position : null;

      if (!position) {
        console.warn(`Invalid or missing position for node ${obj.id}:`, obj.position);
      }

      const size = obj.data?.size && 
        typeof obj.data.size.width === 'number' && 
        typeof obj.data.size.height === 'number' &&
        !isNaN(obj.data.size.width) && 
        !isNaN(obj.data.size.height) ? 
        obj.data.size : {
          width: obj.type === 'door' ? 60 : 150,
          height: obj.type === 'door' ? 20 : 100
        };

      return {
        id: obj.id,
        type: obj.type,
        position: position || { x: 0, y: 0 },
        draggable: true,
        selectable: true,
        resizable: true,
        rotatable: true,
        data: {
          ...obj.data,
          label: obj.data?.label || 'Unnamed Room',
          type: obj.data?.type || 'room',
          size: size,
          style: obj.data?.style || {
            backgroundColor: obj.type === 'door' ? '#94a3b8' : '#e2e8f0',
            border: obj.type === 'door' ? '2px solid #475569' : '1px solid #cbd5e1'
          },
          properties: obj.data?.properties || {
            room_number: '',
            room_type: 'default',
            status: 'active'
          },
          rotation: obj.rotation || 0
        }
      };
    });

    // Apply automatic layout for nodes without valid positions
    const nodesWithoutPosition = reactFlowNodes.filter(
      node => !node.position || (node.position.x === 0 && node.position.y === 0)
    );

    if (nodesWithoutPosition.length > 0) {
      nodesWithoutPosition.forEach((node, index) => {
        const padding = 50;
        const maxRoomsPerRow = 4;
        const size = node.data.size;
        
        node.position = {
          x: (index % maxRoomsPerRow) * (size.width + padding) + 100,
          y: Math.floor(index / maxRoomsPerRow) * (size.height + padding) + 100
        };
      });
    }

    return reactFlowNodes;
  }, []);

  // Apply preview data when it changes
  useEffect(() => {
    if (previewData && nodes.length > 0) {
      const { id, position, rotation, data } = previewData;
      previewingNodeId.current = id;
      
      setNodes(nodes => {
        return nodes.map(node => {
          if (node.id === id) {
            return {
              ...node,
              position: position || node.position,
              data: {
                ...node.data,
                ...data,
                rotation: rotation !== undefined ? rotation : (node.data?.rotation || 0)
              }
            };
          }
          return node;
        });
      });
    }
  }, [previewData, setNodes]);

  useEffect(() => {
    if (!objects || !floorId || isLoading) {
      return;
    }

    if (floorId !== lastFloorId.current) {
      initialized.current = false;
    }

    if (!initialized.current) {
      const reactFlowNodes = initializeNodes(objects);
      setNodes(reactFlowNodes);
      setEdges(graphEdges || []);
      lastFloorId.current = floorId;
      initialized.current = true;
    }
  }, [floorId, isLoading, initializeNodes, objects, graphEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => addEdge(params, eds));
      toast.success('Connection created successfully');
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Attach-to-hallway workflow
    if (attachMode) {
      if (node.type === 'hallway') {
        setSelectedHallwayId(node.id);
        toast.success('Hallway selected. Now click a room to attach.');
        return;
      }
      if (node.type === 'room' && selectedHallwayId) {
        const hallway = nodes.find(n => n.id === selectedHallwayId);
        if (!hallway) {
          toast.error('Selected hallway not found');
          return;
        }
        // Compute placement
        const hallSize = hallway.data?.size || { width: 300, height: 50 };
        const hallCenter = { x: hallway.position.x + hallSize.width/2, y: hallway.position.y + hallSize.height/2 };
        const roomSize = node.data?.size || { width: 150, height: 100 };
        const roomCenterInitial = { x: node.position.x + roomSize.width/2, y: node.position.y + roomSize.height/2 };
        const gap = 20;
        const isHorizontal = hallSize.width >= hallSize.height;
        let newCenter = { x: roomCenterInitial.x, y: roomCenterInitial.y };
        let newRotation = 0;
        if (isHorizontal) {
          // place along X using offset percent
          const minX = hallway.position.x + roomSize.width/2;
          const maxX = hallway.position.x + hallSize.width - roomSize.width/2;
          const targetX = hallway.position.x + (offsetPercent / 100) * hallSize.width;
          newCenter.x = Math.max(minX, Math.min(maxX, targetX));
          // perpendicular placement on Y
          const offsetY = hallSize.height/2 + roomSize.height/2 + gap;
          if (attachSide === 'north') newCenter.y = hallCenter.y - offsetY; else if (attachSide === 'south') newCenter.y = hallCenter.y + offsetY; else newCenter.y = hallCenter.y - offsetY;
          newRotation = 0; // face hallway (long edge along X)
        } else {
          const minY = hallway.position.y + roomSize.height/2;
          const maxY = hallway.position.y + hallSize.height - roomSize.height/2;
          const targetY = hallway.position.y + (offsetPercent / 100) * hallSize.height;
          newCenter.y = Math.max(minY, Math.min(maxY, targetY));
          const offsetX = hallSize.width/2 + roomSize.width/2 + gap;
          if (attachSide === 'west') newCenter.x = hallCenter.x - offsetX; else if (attachSide === 'east') newCenter.x = hallCenter.x + offsetX; else newCenter.x = hallCenter.x + offsetX;
          newRotation = 90;
        }
        const newTopLeft = { x: Math.round(newCenter.x - roomSize.width/2), y: Math.round(newCenter.y - roomSize.height/2) };
        // Persist to DB
        (async () => {
          const { error } = await supabase
            .from('rooms')
            .update({ position: newTopLeft, rotation: newRotation })
            .eq('id', node.id);
          if (error) {
            console.error('Failed to update room position', error);
            toast.error('Failed to attach room');
            return;
          }
          // Optimistic local update
          setNodes(nodes => nodes.map(n => n.id === node.id ? { ...n, position: newTopLeft, data: { ...n.data, rotation: newRotation } } : n));
          toast.success('Room attached to hallway');
        })();
        return;
      }
    }

    // Normal selection behavior
    if (onObjectSelect) {
      onObjectSelect({
        ...node.data,
        id: node.id,
        type: node.type,
        position: node.position,
        size: node.data?.size,
        rotation: node.data?.rotation || 0
      });
    }
  }, [onObjectSelect, attachMode, selectedHallwayId, attachSide, nodes, setNodes]);

  if (!floorId) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        Select a floor to view the floor plan
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        Loading floor plan...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Topology tools bar */}
      <div className="absolute top-2 left-2 z-10 flex flex-wrap items-center gap-1 bg-white/90 dark:bg-slate-800/90 rounded-md px-2 py-1 border border-slate-200 dark:border-slate-700 shadow-sm max-w-[calc(100vw-1rem)] md:max-w-none">
        <Button size="sm" variant={attachMode ? 'default' : 'outline'} onClick={() => setAttachMode(v => !v)} className="touch-target text-xs">
          {attachMode ? 'Attach On' : 'Attach Off'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="touch-target text-xs"
          onClick={async () => {
            if (!floorId) {
              toast.error('Select a floor first');
              return;
            }
            try {
              const center = { x: 400, y: 400 };
              const central = {
                name: 'Central Hallway',
                floor_id: floorId,
                position: { x: center.x - 400, y: center.y - 25 },
                size: { width: 800, height: 50 },
                rotation: 0,
                description: null,
                status: 'active',
                width_meters: 3,
                accessibility: 'fully_accessible',
                type: 'public_main',
                section: 'connector'
              } as any;
              const north = {
                name: 'North Hallway',
                floor_id: floorId,
                position: { x: center.x - 25, y: center.y - 300 - 50 },
                size: { width: 50, height: 300 },
                rotation: 0,
                description: null,
                status: 'active',
                width_meters: 3,
                accessibility: 'fully_accessible',
                type: 'public_main',
                section: 'connector'
              } as any;
              const south = {
                name: 'South Hallway',
                floor_id: floorId,
                position: { x: center.x - 25, y: center.y + 50 },
                size: { width: 50, height: 300 },
                rotation: 0,
                description: null,
                status: 'active',
                width_meters: 3,
                accessibility: 'fully_accessible',
                type: 'public_main',
                section: 'connector'
              } as any;
              const { error: e1 } = await supabase.from('hallways').insert(central);
              if (e1) throw e1;
              const { error: e2 } = await supabase.from('hallways').insert(north);
              if (e2) throw e2;
              const { error: e3 } = await supabase.from('hallways').insert(south);
              if (e3) throw e3;
              toast.success('Created central + north + south hallways');
            } catch (e:any) {
              console.error('Failed to create default hallways', e);
              toast.error(`Failed: ${e?.message || 'Unknown error'}`);
            }
          }}
        >
          Add Hallways
        </Button>
        {attachMode && (
          <>
            <span className="text-xs text-slate-600 dark:text-slate-300 hidden sm:inline">Side:</span>
            <Button size="sm" variant={attachSide==='north'?'default':'outline'} onClick={() => setAttachSide('north')} className="touch-target text-xs px-2">N</Button>
            <Button size="sm" variant={attachSide==='south'?'default':'outline'} onClick={() => setAttachSide('south')} className="touch-target text-xs px-2">S</Button>
            <Button size="sm" variant={attachSide==='east'?'default':'outline'} onClick={() => setAttachSide('east')} className="touch-target text-xs px-2">E</Button>
            <Button size="sm" variant={attachSide==='west'?'default':'outline'} onClick={() => setAttachSide('west')} className="touch-target text-xs px-2">W</Button>
            {selectedHallwayId && (
              <div className="flex items-center gap-1 w-full sm:w-auto mt-1 sm:mt-0 sm:ml-2">
                <span className="text-xs text-slate-600 dark:text-slate-300">Offset</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={offsetPercent}
                  onChange={(e) => setOffsetPercent(parseInt(e.target.value))}
                  className="flex-1 sm:flex-initial"
                />
                <span className="text-xs w-8 text-right">{offsetPercent}%</span>
              </div>
            )}
          </>
        )}
      </div>
      <FloorPlanFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={memoizedNodeTypes.current}
        zoom={zoom}
      />
    </div>
  );
}

export function FloorPlanCanvas(props: FloorPlanCanvasProps) {
  return (
    <Card className="h-full p-0 overflow-hidden">
      <ReactFlowProvider>
        <FloorPlanCanvasInner {...props} />
      </ReactFlowProvider>
    </Card>
  );
}
