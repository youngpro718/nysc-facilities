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
import { RoomNode } from './nodes/RoomNode';
import { DoorNode } from './nodes/DoorNode';
import { HallwayNode } from './nodes/HallwayNode';
import { toast } from "sonner";
import { FloorPlanNode, FloorPlanObjectData, FloorPlanObjectType } from './types/floorPlanTypes';

interface FloorPlanCanvasProps {
  floorId: string | null;
  zoom?: number;
  onObjectSelect?: (object: FloorPlanObjectData & { id: string }) => void;
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
          width: obj.type === 'door' ? 60 : 150,
          height: obj.type === 'door' ? 20 : 100
        };

      const node: FloorPlanNode = {
        id: obj.id,
        type: obj.type,
        position: position || { x: 0, y: 0 },
        draggable: true,
        selectable: true,
        data: {
          ...obj.data,
          label: obj.data?.label || 'Unnamed Room',
          type: obj.type as FloorPlanObjectType,
          size: size,
          isParent: obj.has_children || false,
          style: {
            ...obj.data?.style,
            backgroundColor: obj.type === 'door' ? '#94a3b8' : 
              obj.has_children ? '#f1f5f9' : '#e2e8f0',
            border: obj.type === 'door' ? '2px solid #475569' : 
              obj.has_children ? '2px solid #64748b' : '1px solid #cbd5e1',
            padding: obj.has_children ? '20px' : '0',
            zIndex: obj.has_children ? 0 : 1
          },
          properties: obj.data?.properties || {
            room_number: '',
            room_type: 'default',
            status: 'active'
          }
        }
      };

      console.log(`Created node ${obj.id}:`, {
        position: node.position,
        size: node.data.size,
        type: node.type
      });

      return node;
    });

    // Apply automatic layout for nodes without valid positions
    const nodesWithoutPosition = reactFlowNodes.filter(
      node => !node.position || (node.position.x === 0 && node.position.y === 0)
    );

    if (nodesWithoutPosition.length > 0) {
      console.log(`Applying automatic layout for ${nodesWithoutPosition.length} nodes`);
      
      nodesWithoutPosition.forEach((node, index) => {
        const padding = 50;
        const maxRoomsPerRow = 4;
        const size = node.data.size;
        
        node.position = {
          x: (index % maxRoomsPerRow) * (size.width + padding) + 100,
          y: Math.floor(index / maxRoomsPerRow) * (size.height + padding) + 100
        };

        console.log(`Auto-positioned node ${node.id}:`, node.position);
      });
    }

    console.log('Final node positions:', reactFlowNodes.map(n => ({ 
      id: n.id, 
      position: n.position,
      size: n.data.size,
      type: n.type
    })));
    
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

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<FloorPlanObjectData>) => {
    if (onObjectSelect) {
      onObjectSelect({
        ...node.data,
        id: node.id,
      });
    }
  }, [onObjectSelect]);

  const handleNodesChangeWrapper = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
      handleNodesChange(changes);
    },
    [onNodesChange, handleNodesChange]
  );

  const handleNodeDragStop = useCallback((event: any, node: Node<any>, nodes: Node<any>[]) => {
    console.log('Node dragged:', node.id, node.position);
  }, []);

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
      <div className="h-[600px] w-full bg-gray-50">
        <ReactFlowProvider>
          <FloorPlanFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChangeWrapper}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDragStop={handleNodeDragStop}
            nodeTypes={nodeTypes}
            defaultZoom={zoom}
          />
        </ReactFlowProvider>
      </div>
    </Card>
  );
}
