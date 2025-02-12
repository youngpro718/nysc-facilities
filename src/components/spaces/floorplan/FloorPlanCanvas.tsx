
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
  // Initialize viewport with more space to see nodes
  const defaultViewport = useMemo(() => ({ x: 50, y: 50, zoom: 0.8 }), []);

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

    console.log('Transforming floor plan objects:', objects); // Debug log

    const reactFlowNodes = objects.map((obj, index) => {
      // Calculate grid-based position with more spacing
      const defaultPosition = {
        x: (index % 3) * 250 + 100, // Increased horizontal spacing
        y: Math.floor(index / 3) * 200 + 100 // Increased vertical spacing
      };

      // Check if position exists and has valid coordinates
      const position = obj.position && 
        typeof obj.position.x === 'number' && 
        typeof obj.position.y === 'number' && 
        (obj.position.x !== 0 || obj.position.y !== 0) ? // Only use if not at origin
        obj.position : defaultPosition;

      console.log(`Node ${obj.id} final position:`, position); // Debug log

      const node: Node = {
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

      return node;
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
