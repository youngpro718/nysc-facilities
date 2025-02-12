
import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import { useDrawingState } from "./hooks/useDrawingState";
import { RoomNode } from './nodes/RoomNode';
import { DoorNode } from './nodes/DoorNode';
import { toast } from "sonner";
import { DrawingPreview } from './components/DrawingPreview';

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
  onPaneClick,
  onPaneMouseMove,
  nodeTypes,
  drawingState
}: any) {
  const defaultViewport = useMemo(() => ({ x: 50, y: 50, zoom: 0.8 }), []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onPaneMouseMove={onPaneMouseMove}
      nodeTypes={nodeTypes}
      defaultViewport={defaultViewport}
      minZoom={0.1}
      maxZoom={4}
      fitView
      fitViewOptions={{ 
        padding: 0.2,
        duration: 800,
        includeHiddenNodes: true
      }}
    >
      <Panel position="top-left">
        <div style={panelStyle} className="text-gray-700">
          {drawingState.operation !== 'none' ? (
            <>Drawing: {drawingState.mode} - {drawingState.operation}</>
          ) : (
            <>Rooms: {nodes.length}</>
          )}
        </div>
      </Panel>
      <DrawingPreview drawingState={drawingState} />
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
  const { objects, edges: graphEdges, isLoading } = useFloorPlanData(floorId);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const initialized = useRef(false);
  const { drawingState, startDrawing, updateDrawing, completeDrawing, cancelDrawing, setMode } = useDrawingState(drawingMode);

  useEffect(() => {
    setMode(drawingMode);
  }, [drawingMode, setMode]);

  useEffect(() => {
    if (floorId) {
      initialized.current = false;
    }
  }, [floorId]);

  useEffect(() => {
    if (!objects || initialized.current) return;

    const reactFlowNodes = objects.map((obj, index) => {
      const defaultPosition = {
        x: (index % 3) * 250 + 100,
        y: Math.floor(index / 3) * 200 + 100
      };

      const position = obj.position && 
        typeof obj.position.x === 'number' && 
        typeof obj.position.y === 'number' && 
        (obj.position.x !== 0 || obj.position.y !== 0) ? 
        obj.position : defaultPosition;

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
        },
        dragHandle: '.drag-handle'
      };

      return node;
    });

    setNodes(reactFlowNodes);
    setEdges(graphEdges || []);
    initialized.current = true;
  }, [objects, graphEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onObjectSelect) {
      onObjectSelect(node.data);
    }
  }, [onObjectSelect]);

  const createRoom = useCallback((startPos: Position, dimensions: Size) => {
    const newNode: Node = {
      id: `room-${crypto.randomUUID()}`,
      type: 'room',
      position: { x: startPos.x, y: startPos.y },
      data: {
        label: 'New Room',
        type: 'room',
        size: dimensions,
        style: {
          backgroundColor: '#e2e8f0',
          border: '1px solid #cbd5e1'
        },
        properties: {
          room_number: '',
          room_type: 'default',
          status: 'active'
        }
      },
      dragHandle: '.drag-handle'
    };

    setNodes(nodes => [...nodes, newNode]);
    toast.success('Room created successfully');
    return newNode;
  }, [setNodes]);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    const bounds = (event.target as HTMLElement).getBoundingClientRect();
    const position = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };

    if (drawingState.operation === 'none' && drawingMode !== 'view') {
      startDrawing(position);
    } else if (drawingState.operation === 'drawing') {
      const result = completeDrawing();
      if (result && result.startPosition && result.dimensions) {
        if (drawingMode === 'draw') {
          const newRoom = createRoom(result.startPosition, result.dimensions);
          if (onObjectSelect) {
            onObjectSelect(newRoom.data);
          }
        }
        // Additional modes (door, hallway) will be handled here
      }
    }
  }, [drawingState, drawingMode, startDrawing, completeDrawing, createRoom, onObjectSelect]);

  const onPaneMouseMove = useCallback((event: React.MouseEvent) => {
    if (drawingState.operation === 'start' || drawingState.operation === 'drawing') {
      const bounds = (event.target as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      };
      updateDrawing(position);
    }
  }, [drawingState.operation, updateDrawing]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && drawingState.operation !== 'none') {
        cancelDrawing();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingState.operation, cancelDrawing]);

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
            onPaneClick={onPaneClick}
            onPaneMouseMove={onPaneMouseMove}
            nodeTypes={nodeTypes}
            drawingState={drawingState}
          />
        </ReactFlowProvider>
      </div>
    </Card>
  );
}
