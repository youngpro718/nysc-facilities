/**
 * FloorPlan2DCanvas - Clean 2D floor plan renderer using ReactFlow
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';

interface FloorPlan2DCanvasProps {
  objects: any[];
  edges: any[];
  selectedObjectId: string | null;
  onObjectSelect: (id: string | null) => void;
  showLabels: boolean;
  showGrid: boolean;
  zoom: number;
}

// Custom Room Node
function RoomNode({ data, selected }: NodeProps) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 transition-all duration-200',
        'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
        selected && 'ring-2 ring-primary ring-offset-2 border-primary'
      )}
      style={{
        width: data.size?.width || 120,
        height: data.size?.height || 80,
        minWidth: 80,
        minHeight: 60,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-blue-400 !w-2 !h-2" />
      
      <div className="h-full flex flex-col items-center justify-center p-2 text-center">
        <span className="text-xs font-semibold text-blue-900 dark:text-blue-100 truncate max-w-full">
          {data.label || 'Room'}
        </span>
        {data.properties?.room_number && (
          <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
            #{data.properties.room_number}
          </span>
        )}
      </div>
    </div>
  );
}

// Custom Hallway Node
function HallwayNode({ data, selected }: NodeProps) {
  const isVertical = (data.size?.height || 50) > (data.size?.width || 200);
  
  return (
    <div
      className={cn(
        'rounded border-2 transition-all duration-200',
        'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
        selected && 'ring-2 ring-primary ring-offset-2 border-primary'
      )}
      style={{
        width: data.size?.width || 200,
        height: data.size?.height || 40,
        minWidth: 40,
        minHeight: 30,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
      
      <div className="h-full flex items-center justify-center p-1">
        <span className={cn(
          'text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate',
          isVertical && 'writing-mode-vertical'
        )}>
          {data.label || 'Hallway'}
        </span>
      </div>
    </div>
  );
}

// Custom Door Node
function DoorNode({ data, selected }: NodeProps) {
  return (
    <div
      className={cn(
        'rounded border-2 transition-all duration-200',
        'bg-amber-100 dark:bg-amber-900 border-amber-400 dark:border-amber-600',
        selected && 'ring-2 ring-primary ring-offset-2 border-primary'
      )}
      style={{
        width: data.size?.width || 30,
        height: data.size?.height || 10,
        minWidth: 20,
        minHeight: 8,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Right} className="!bg-amber-500 !w-1.5 !h-1.5" />
    </div>
  );
}

const nodeTypes = {
  room: RoomNode,
  hallway: HallwayNode,
  door: DoorNode,
};

export function FloorPlan2DCanvas({
  objects,
  edges: inputEdges,
  selectedObjectId,
  onObjectSelect,
  showLabels,
  showGrid,
  zoom,
}: FloorPlan2DCanvasProps) {
  const initialized = useRef(false);
  const lastObjectsRef = useRef<string>('');

  // Convert objects to ReactFlow nodes
  const initialNodes = useMemo(() => {
    return objects.map((obj, index) => ({
      id: obj.id,
      type: obj.type || 'room',
      position: {
        x: obj.position?.x ?? (index % 4) * 200 + 50,
        y: obj.position?.y ?? Math.floor(index / 4) * 150 + 50,
      },
      data: {
        label: showLabels ? (obj.data?.label || obj.name || `Object ${index + 1}`) : '',
        size: obj.data?.size || { width: 120, height: 80 },
        properties: obj.data?.properties || {},
        type: obj.type,
      },
      selected: obj.id === selectedObjectId,
    }));
  }, [objects, showLabels, selectedObjectId]);

  // Convert edges
  const initialEdges = useMemo(() => {
    if (!inputEdges) return [];
    return inputEdges.map((edge: any) => ({
      id: edge.id || `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    }));
  }, [inputEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when objects change
  useEffect(() => {
    const objectsKey = JSON.stringify(objects.map(o => o.id));
    if (objectsKey !== lastObjectsRef.current) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      lastObjectsRef.current = objectsKey;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges, objects]);

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onObjectSelect(node.id);
  }, [onObjectSelect]);

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    onObjectSelect(null);
  }, [onObjectSelect]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 500 }}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: zoom }}
        snapToGrid
        snapGrid={[10, 10]}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        className="bg-transparent"
      >
        {showGrid && (
          <Background 
            gap={20} 
            size={1} 
            color="hsl(var(--muted-foreground) / 0.1)"
          />
        )}
        <Controls 
          showInteractive={false}
          className="!bg-card !border !shadow-lg !rounded-lg"
        />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'room': return '#3b82f6';
              case 'hallway': return '#64748b';
              case 'door': return '#f59e0b';
              default: return '#94a3b8';
            }
          }}
          maskColor="hsl(var(--background) / 0.8)"
          className="!bg-card !border !shadow-lg !rounded-lg"
        />
      </ReactFlow>
    </div>
  );
}

export default FloorPlan2DCanvas;
