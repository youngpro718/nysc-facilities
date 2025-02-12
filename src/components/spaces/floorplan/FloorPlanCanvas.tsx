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
  addEdge,
  Panel,
  ReactFlowProvider,
  Node,
  NodeResizer,
  NodeResizeControl,
  OnNodesChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from "@/components/ui/card";
import { FloorPlanNode } from "./types/floorPlanTypes";
import { useFloorPlanData } from "./hooks/useFloorPlanData";
import { RoomNode } from './nodes/RoomNode';
import { DoorNode } from './nodes/DoorNode';
import { HallwayNode } from './nodes/HallwayNode';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FloorPlanCanvasProps {
  floorId: string | null;
  zoom?: number;
  onObjectSelect?: (object: any | null) => void;
}

const nodeTypes: NodeTypes = {
  room: RoomNode,
  door: DoorNode,
  hallway: HallwayNode,
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
  nodeTypes,
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
      snapGrid={[20, 20]}
      snapToGrid
    >
      <Panel position="top-left">
        <div style={panelStyle} className="text-gray-700">
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
  onObjectSelect 
}: FloorPlanCanvasProps) {
  const { objects, edges: graphEdges, isLoading } = useFloorPlanData(floorId);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (floorId) {
      initialized.current = false;
    }
  }, [floorId]);

  useEffect(() => {
    if (!objects || initialized.current) return;

    console.log('Initializing nodes with objects:', objects);

    const reactFlowNodes = objects.map((obj, index) => {
      const defaultPosition = {
        x: (index % 3) * 250 + 100,
        y: Math.floor(index / 3) * 200 + 100
      };

      const position = obj.position && 
        typeof obj.position.x === 'number' && 
        typeof obj.position.y === 'number' ? 
        obj.position : defaultPosition;

      console.log(`Node ${obj.id} position:`, position);

      const node = {
        id: obj.id,
        type: obj.type,
        position: position,
        draggable: true,
        selectable: true,
        resizable: true,
        rotatable: true,
        data: {
          ...obj.data,
          label: obj.data?.label || 'Unnamed Room',
          type: obj.data?.type || 'room',
          size: obj.data?.size || {
            width: obj.type === 'door' ? 60 : 150,
            height: obj.type === 'door' ? 20 : 100
          },
          style: obj.data?.style || {
            backgroundColor: obj.type === 'door' ? '#94a3b8' : '#e2e8f0',
            border: obj.type === 'door' ? '2px solid #475569' : '1px solid #cbd5e1'
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

    setNodes(reactFlowNodes);
    setEdges(graphEdges || []);
    initialized.current = true;
  }, [objects, graphEdges, setNodes, setEdges]);

  const handleNodesChange: OnNodesChange = useCallback(
    async (changes) => {
      onNodesChange(changes);
      
      // Save position changes to the database
      for (const change of changes) {
        if (change.type === 'position' && change.position && change.id) {
          try {
            console.log('Saving position for node:', change.id, change.position);
            
            const positionData = {
              x: change.position.x,
              y: change.position.y
            };

            const { data, error } = await supabase
              .from('floor_plan_objects')
              .update({ 
                position: positionData
              })
              .eq('id', change.id)
              .select();

            if (error) {
              console.error('Error saving position:', error);
              toast.error('Failed to save position');
            } else {
              console.log('Position saved successfully:', data);
              toast.success('Position updated');
            }
          } catch (err) {
            console.error('Error in position update:', err);
            toast.error('Failed to save position');
          }
        }
      }
    },
    [onNodesChange]
  );

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => addEdge(params, eds));
      toast.success('Connection created successfully');
    },
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<any>) => {
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
