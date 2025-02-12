
import { useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  NodeTypes,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from "@/components/ui/card";
import { DrawingMode, FloorPlanNode, FloorPlanEdge } from "./types/floorPlanTypes";
import { useFloorPlanData } from "./hooks/useFloorPlanData";
import { RoomNode } from './nodes/RoomNode';
import { DoorNode } from './nodes/DoorNode';
import { toast } from "sonner";

interface FloorPlanCanvasProps {
  floorId: string | null;
  zoom?: number;
  drawingMode: DrawingMode;
  onObjectSelect?: (object: any | null) => void;
}

const nodeTypes: NodeTypes = {
  room: RoomNode,
  door: DoorNode,
};

export function FloorPlanCanvas({ 
  floorId, 
  zoom = 1, 
  drawingMode, 
  onObjectSelect 
}: FloorPlanCanvasProps) {
  const { objects, isLoading } = useFloorPlanData(floorId);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onObjectSelect?.(node.data);
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
      <div style={{ width: '100%', height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background gap={20} size={1} />
        </ReactFlow>
      </div>
    </Card>
  );
}
