
import { useCallback, useEffect, useRef } from 'react';
import { 
  useNodesState, 
  useEdgesState, 
  Connection, 
  Edge, 
  Node,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from "@/components/ui/card";
import { ReactFlowProvider } from 'reactflow';
import { FloorPlanFlow } from './components/FloorPlanFlow';
import { useFloorPlanData } from "./hooks/useFloorPlanData";
import { useFloorPlanNodes } from "./hooks/useFloorPlanNodes";
import { RoomNode } from './nodes/RoomNode';
import { DoorNode } from './nodes/DoorNode';
import { HallwayNode } from './nodes/HallwayNode';
import { toast } from "sonner";
import { FloorPlanNode, FloorPlanObjectType } from './types/floorPlanTypes';

interface FloorPlanCanvasProps {
  floorId: string | null;
  zoom?: number;
  onObjectSelect?: (object: any | null) => void;
}

const nodeTypes = {
  room: RoomNode,
  door: DoorNode,
  hallway: HallwayNode,
};

export function FloorPlanCanvas({ 
  floorId, 
  zoom = 1, 
  onObjectSelect 
}: FloorPlanCanvasProps) {
  const { objects, edges: graphEdges, isLoading } = useFloorPlanData(floorId);
  const [nodes, setNodes, onNodesChange] = useNodesState<FloorPlanNode>([]);
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

    const reactFlowNodes = objects.map((obj: FloorPlanNode) => {
      const defaultPosition = {
        x: Math.random() * 500,
        y: Math.random() * 500
      };

      return {
        id: obj.id,
        type: obj.type as FloorPlanObjectType,
        position: obj.position || defaultPosition,
        draggable: true,
        selectable: true,
        data: {
          ...obj.data,
          label: obj.data?.label || 'Unnamed Space',
          type: obj.data?.type || obj.type,
          size: obj.data?.size || {
            width: obj.type === 'door' ? 60 : 150,
            height: obj.type === 'door' ? 20 : 100
          },
          style: obj.data?.style || {
            backgroundColor: obj.type === 'door' ? '#94a3b8' : '#e2e8f0',
            border: obj.type === 'door' ? '2px solid #475569' : '1px solid #cbd5e1'
          },
          properties: obj.data?.properties || {}
        }
      };
    });

    setNodes(reactFlowNodes);
    setEdges(graphEdges || []);
    initialized.current = true;
  }, [objects, graphEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => addEdge(params, eds));
      toast.success('Connection created successfully');
    },
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
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
  }, [onObjectSelect]);

  if (!floorId) {
    return (
      <Card className="p-4">
        <div className="h-[600px] w-full flex items-center justify-center bg-gray-50">
          Select a floor to view the floor plan
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="h-[600px] w-full flex items-center justify-center bg-gray-50">
          Loading floor plan...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
        <ReactFlowProvider>
          <FloorPlanFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
          />
        </ReactFlowProvider>
      </div>
    </Card>
  );
}
