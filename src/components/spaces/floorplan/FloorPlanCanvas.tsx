
import { useCallback, useEffect } from 'react';
import { 
  ReactFlow,
  Background, 
  Controls, 
  MiniMap,
  NodeTypes,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  addEdge,
  Panel,
  PanelPosition
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

const panelStyle = {
  position: 'absolute' as const,
  left: 10,
  top: 10,
  zIndex: 100,
  backgroundColor: 'white',
  padding: '8px',
  borderRadius: '4px',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)'
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

  // Update nodes when objects change
  useEffect(() => {
    if (objects && objects.length > 0) {
      console.log('Setting nodes:', objects);
      const reactFlowNodes = objects.map(obj => ({
        id: obj.id,
        type: obj.type,
        position: obj.position,
        data: obj.data,
        zIndex: obj.zIndex || 0,
        draggable: true,
        selectable: true
      }));
      setNodes(reactFlowNodes);
    }
  }, [objects, setNodes]);

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
      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.1}
          maxZoom={4}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Panel position="top-left">
            <div style={panelStyle}>
              Rooms: {nodes.length}
            </div>
          </Panel>
          <Controls />
          <MiniMap />
          <Background gap={20} size={1} />
        </ReactFlow>
      </div>
    </Card>
  );
}
