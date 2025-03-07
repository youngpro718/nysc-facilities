
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
import { FloorPlanFlow } from './components/FloorPlanFlow';
import { useFloorPlanData } from "./hooks/useFloorPlanData";
import { useFloorPlanNodes } from "./hooks/useFloorPlanNodes";
import { RoomNode } from './nodes/RoomNode';
import { DoorNode } from './nodes/DoorNode';
import { HallwayNode } from './nodes/HallwayNode';
import { toast } from "sonner";
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
