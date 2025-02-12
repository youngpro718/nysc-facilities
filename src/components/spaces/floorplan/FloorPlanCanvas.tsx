import { useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  useNodesState, 
  useEdgesState, 
  Connection, 
  Edge,
  Node,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from "@/components/ui/card";
import { ReactFlowProvider } from 'reactflow';
import { FloorPlanFlow } from './components/FloorPlanFlow';
import { useFloorPlanData } from "./hooks/useFloorPlanData";
import { useFloorPlanNodes } from "./hooks/useFloorPlanNodes";
import { RoomNode } from './components/nodes/RoomNode';
import { HallwayNode } from './components/nodes/HallwayNode';
import { toast } from "sonner";
import { FloorPlanNode, FloorPlanObjectData } from './types/floorPlanTypes';

interface FloorPlanCanvasProps {
  floorId: string | null;
  zoom?: number;
  onObjectSelect?: (object: FloorPlanObjectData & { id: string }) => void;
}

const nodeTypes = {
  room: RoomNode,
  hallway: HallwayNode,
};

export function FloorPlanCanvas({ 
  floorId, 
  zoom = 1, 
  onObjectSelect 
}: FloorPlanCanvasProps) {
  const { objects, edges: graphEdges, isLoading } = useFloorPlanData(floorId);
  const [nodes, setNodes, onNodesChange] = useNodesState<FloorPlanObjectData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const initialized = useRef(false);
  const { handleNodesChange } = useFloorPlanNodes(onNodesChange);

  useEffect(() => {
    if (floorId) {
      initialized.current = false;
    }
  }, [floorId]);

  useEffect(() => {
    if (!objects || initialized.current) return;

    console.log('Initializing nodes with objects:', objects);

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
          width: obj.type === 'hallway' ? 300 : 150,
          height: obj.type === 'hallway' ? 50 : 100
        };

      const node = {
        id: obj.id,
        type: obj.type,
        position: position || { x: 0, y: 0 },
        draggable: true,
        selectable: true,
        resizable: true,
        rotatable: true,
        parentNode: obj.parent_room_id || undefined,
        extent: obj.has_children ? undefined : 'parent' as const,
        data: {
          ...obj.data,
          label: obj.data?.label || 'Unnamed',
          type: obj.data?.type || obj.type,
          size: size,
          isParent: obj.has_children || false,
          style: {
            ...obj.data?.style,
            backgroundColor: obj.type === 'hallway' ? '#f1f5f9' : '#e2e8f0',
            border: obj.has_children ? '2px solid #64748b' : '1px solid #cbd5e1',
          }
        }
      } as FloorPlanNode;

      return node;
    });

    console.log('Setting nodes:', reactFlowNodes);
    setNodes(reactFlowNodes);
    setEdges(graphEdges);
    initialized.current = true;
  }, [objects, graphEdges, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  if (isLoading) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        Loading floor plan...
      </Card>
    );
  }

  return (
    <ReactFlowProvider>
      <Card className="w-full h-full">
        <FloorPlanFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          defaultZoom={zoom}
          onNodeClick={(_, node) => {
            onObjectSelect?.(node.data);
            toast.success(`Selected ${node.data.label}`);
          }}
        />
      </Card>
    </ReactFlowProvider>
  );
}
