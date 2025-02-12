
import { useCallback, useEffect, useMemo } from 'react';
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
  PanelPosition,
  ReactFlowProvider
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

function FlowComponent({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onNodeClick,
  nodeTypes
}: any) {
  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 1 }), []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      defaultViewport={defaultViewport}
      minZoom={0.1}
      maxZoom={4}
      fitView
      fitViewOptions={{ 
        padding: 0.2,
        duration: 200 
      }}
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
  );
}

export function FloorPlanCanvas({ 
  floorId, 
  zoom = 1, 
  drawingMode, 
  onObjectSelect 
}: FloorPlanCanvasProps) {
  const { objects, isLoading } = useFloorPlanData(floorId);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!objects) return;

    const reactFlowNodes = objects.map((obj, index) => {
      // Generate a grid-based position if none exists
      const defaultPosition = {
        x: (index % 3) * 200 + 50, // 3 rooms per row, 200px apart
        y: Math.floor(index / 3) * 150 + 50 // New row every 3 rooms, 150px apart
      };

      const position = obj.position && 
        typeof obj.position.x === 'number' && 
        typeof obj.position.y === 'number' ? 
        obj.position : defaultPosition;

      console.log(`Node ${obj.id} position:`, position); // Debug log

      return {
        id: obj.id,
        type: obj.type,
        position: position,
        data: {
          ...obj.data,
          label: obj.data?.label || 'Unnamed Room',
          type: obj.data?.type || 'room',
          size: obj.data?.size || {
            width: 150,
            height: 100
          },
          style: obj.data?.style || {
            backgroundColor: '#e2e8f0',
            border: '1px solid #cbd5e1'
          },
          properties: obj.data?.properties || {
            room_number: '',
            room_type: 'default',
            status: 'active'
          }
        }
      };
    });

    console.log('Setting nodes:', reactFlowNodes); // Debug log
    setNodes(reactFlowNodes);
  }, [objects, setNodes]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onObjectSelect) {
      onObjectSelect(node.data);
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
          <FlowComponent
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
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
