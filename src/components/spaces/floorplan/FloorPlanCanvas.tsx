
import { useCallback, useEffect, useRef, useLayoutEffect, useState } from 'react';
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

function FloorPlanCanvasInner({ 
  floorId, 
  zoom = 1, 
  drawingMode, 
  onObjectSelect 
}: FloorPlanCanvasProps) {
  const { objects, isLoading } = useFloorPlanData(floorId);
  const flowWrapper = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Initialize container size
  useLayoutEffect(() => {
    if (flowWrapper.current) {
      setIsReady(true);
    }
    return () => setIsReady(false);
  }, []);

  // Update nodes when objects change
  useEffect(() => {
    if (!objects || !isReady) return;
    
    const reactFlowNodes = objects.map((obj, index) => ({
      id: obj.id || `node-${index}`,
      type: 'room',
      position: {
        x: (index % 3) * 250,
        y: Math.floor(index / 3) * 200
      },
      data: {
        label: obj.data?.label || 'Unnamed Room',
        type: 'room',
        size: {
          width: 150,
          height: 100
        },
        style: {
          backgroundColor: '#e2e8f0',
          border: '1px solid #cbd5e1'
        },
        properties: {
          room_number: obj.data?.properties?.room_number || '',
          room_type: obj.data?.properties?.room_type || 'default',
          status: obj.data?.properties?.status || 'active'
        }
      }
    }));

    // Batch node updates
    requestAnimationFrame(() => {
      setNodes(reactFlowNodes);
    });
  }, [objects, setNodes, isReady]);

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
      <div className="h-[600px] w-full flex items-center justify-center bg-gray-50">
        Select a floor to view the floor plan
      </div>
    );
  }

  if (isLoading || !isReady) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-gray-50">
        Loading floor plan...
      </div>
    );
  }

  return (
    <div 
      ref={flowWrapper} 
      className="relative w-full h-[600px]"
      style={{ overflow: 'hidden' }}
    >
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
        fitViewOptions={{ 
          padding: 0.2,
          includeHiddenNodes: false,
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
    </div>
  );
}

export function FloorPlanCanvas(props: FloorPlanCanvasProps) {
  return (
    <Card className="p-4">
      <ReactFlowProvider>
        <FloorPlanCanvasInner {...props} />
      </ReactFlowProvider>
    </Card>
  );
}
