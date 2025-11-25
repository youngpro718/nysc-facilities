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
  SelectionMode,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';

interface FloorPlan2DCanvasProps {
  objects: any[];
  edges: any[];
  selectedObjectId: string | null;
  onObjectSelect: (id: string | null) => void;
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
  showLabels: boolean;
  showGrid: boolean;
  zoom: number;
}

// Room type colors matching database enum
const ROOM_TYPE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  courtroom: { bg: 'bg-amber-100 dark:bg-amber-900', border: 'border-amber-500', text: 'text-amber-900 dark:text-amber-100' },
  office: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-300', text: 'text-blue-900 dark:text-blue-100' },
  conference: { bg: 'bg-indigo-50 dark:bg-indigo-950', border: 'border-indigo-300', text: 'text-indigo-900 dark:text-indigo-100' },
  storage: { bg: 'bg-stone-100 dark:bg-stone-800', border: 'border-stone-400', text: 'text-stone-900 dark:text-stone-100' },
  restroom: { bg: 'bg-cyan-50 dark:bg-cyan-950', border: 'border-cyan-400', text: 'text-cyan-900 dark:text-cyan-100' },
  lobby: { bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-400', text: 'text-amber-900 dark:text-amber-100' },
  utility: { bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-400', text: 'text-zinc-900 dark:text-zinc-100' },
  mechanical: { bg: 'bg-neutral-200 dark:bg-neutral-800', border: 'border-neutral-500', text: 'text-neutral-900 dark:text-neutral-100' },
  jury_room: { bg: 'bg-violet-50 dark:bg-violet-950', border: 'border-violet-400', text: 'text-violet-900 dark:text-violet-100' },
  chamber: { bg: 'bg-teal-50 dark:bg-teal-950', border: 'border-teal-500', text: 'text-teal-900 dark:text-teal-100' },
  other: { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300', text: 'text-slate-900 dark:text-slate-100' },
  default: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200', text: 'text-blue-900 dark:text-blue-100' },
};

function getRoomTypeStyle(roomType: string | undefined) {
  if (!roomType) return ROOM_TYPE_STYLES.default;
  const normalized = roomType.toLowerCase().replace(/\s+/g, '_');
  return ROOM_TYPE_STYLES[normalized] || ROOM_TYPE_STYLES.default;
}

// Custom Room Node with room-type specific colors
function RoomNode({ data, selected }: NodeProps) {
  const roomType = data.properties?.room_type;
  const style = getRoomTypeStyle(roomType);
  
  return (
    <div
      className={cn(
        'rounded-lg border-2 transition-all duration-200',
        style.bg,
        style.border,
        selected && 'ring-2 ring-primary ring-offset-2 !border-primary'
      )}
      style={{
        width: data.size?.width || 120,
        height: data.size?.height || 80,
        minWidth: 80,
        minHeight: 60,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-current !w-2 !h-2 opacity-50" />
      <Handle type="source" position={Position.Bottom} className="!bg-current !w-2 !h-2 opacity-50" />
      <Handle type="target" position={Position.Left} className="!bg-current !w-2 !h-2 opacity-50" />
      <Handle type="source" position={Position.Right} className="!bg-current !w-2 !h-2 opacity-50" />
      
      <div className="h-full flex flex-col items-center justify-center p-1.5 text-center overflow-hidden">
        <span className={cn('text-[11px] font-semibold leading-tight', style.text)} style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
          maxWidth: '100%'
        }}>
          {data.label || 'Room'}
        </span>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap justify-center">
          {data.properties?.room_number && (
            <span className="text-[9px] opacity-70 bg-black/5 dark:bg-white/10 px-1 rounded">
              #{data.properties.room_number}
            </span>
          )}
          {roomType && (
            <span className="text-[8px] opacity-50 capitalize">
              {roomType.replace(/_/g, ' ')}
            </span>
          )}
        </div>
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
  onPositionChange,
  showLabels,
  showGrid,
  zoom,
}: FloorPlan2DCanvasProps) {
  const initialized = useRef(false);
  const lastObjectsRef = useRef<string>('');
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Handle node drag end - debounced to avoid too many updates
  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node, nodes: Node[]) => {
    if (!onPositionChange) return;
    
    // Clear any pending timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    // Get all selected nodes (for group drag)
    const selectedNodes = nodes.filter(n => n.selected);
    const nodesToUpdate = selectedNodes.length > 1 ? selectedNodes : [node];
    
    // Debounce the position updates
    dragTimeoutRef.current = setTimeout(() => {
      nodesToUpdate.forEach(n => {
        onPositionChange(n.id, { x: Math.round(n.position.x), y: Math.round(n.position.y) });
      });
    }, 300);
  }, [onPositionChange]);

  // Handle selection drag stop (for group selection box drag)
  const onSelectionDragStop = useCallback((_: React.MouseEvent, nodes: Node[]) => {
    if (!onPositionChange) return;
    
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    dragTimeoutRef.current = setTimeout(() => {
      nodes.forEach(node => {
        onPositionChange(node.id, { x: Math.round(node.position.x), y: Math.round(node.position.y) });
      });
    }, 300);
  }, [onPositionChange]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onSelectionDragStop={onSelectionDragStop}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 500 }}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: zoom }}
        snapToGrid
        snapGrid={[20, 20]}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        selectNodesOnDrag
        panOnDrag={[1, 2]}
        selectionKeyCode={null}
        multiSelectionKeyCode="Shift"
        className="bg-transparent"
      >
        {showGrid && (
          <Background 
            gap={20} 
            size={1}
            color="hsl(var(--muted-foreground) / 0.15)"
            style={{ opacity: 0.8 }}
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
