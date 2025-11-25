/**
 * SimpleFloorPlan Component
 * A clean, reliable floor plan visualization using ReactFlow
 * Replaces the complex ModernFloorPlanView with a simpler implementation
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  NodeChange,
  applyNodeChanges,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFloors, useFloorPlan, FloorPlanSpace } from './hooks/useFloorPlan';
import { RoomNode } from './nodes/RoomNode';
import { DoorNode } from './nodes/DoorNode';
import { HallwayNode } from './nodes/HallwayNode';
import { cn } from '@/lib/utils';
import debounce from 'lodash/debounce';

// Node type registry
const nodeTypes = {
  room: RoomNode,
  door: DoorNode,
  hallway: HallwayNode,
};

interface FloorPlanInnerProps {
  floorId: string | null;
  onSpaceSelect?: (space: FloorPlanSpace | null) => void;
}

function FloorPlanInner({ floorId, onSpaceSelect }: FloorPlanInnerProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const {
    nodes: initialNodes,
    edges,
    spaces,
    isLoading,
    isSaving,
    error,
    refetch,
    handlePositionChange,
    saveAllPositions,
  } = useFloorPlan(floorId);

  // Local node state for smooth dragging
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const pendingUpdates = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Sync nodes when data changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  // Debounced position save
  const debouncedSave = useRef(
    debounce((nodeId: string, position: { x: number; y: number }) => {
      handlePositionChange(nodeId, position);
      pendingUpdates.current.delete(nodeId);
    }, 500)
  ).current;

  // Handle node changes (position, selection, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      // Track position changes for saving
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.dragging === false) {
          // Drag ended - save position
          pendingUpdates.current.set(change.id, change.position);
          debouncedSave(change.id, change.position);
        }
      });
    },
    [debouncedSave]
  );

  // Handle node click for selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      const space = spaces.find((s) => s.id === node.id);
      if (space && onSpaceSelect) {
        onSpaceSelect(space);
      }
    },
    [spaces, onSpaceSelect]
  );

  // Handle pane click to deselect
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    if (onSpaceSelect) {
      onSpaceSelect(null);
    }
  }, [onSpaceSelect]);

  // Fit view when nodes load
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 100);
    }
  }, [floorId, nodes.length, fitView]);

  if (!floorId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a floor to view the floor plan</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-destructive">
        <p>Failed to load floor plan</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => zoomIn()}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => zoomOut()}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fitView({ padding: 0.2, duration: 500 })}
          title="Fit View"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={() => saveAllPositions(nodes)}
          disabled={isSaving}
          title="Save Layout"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Save Layout</span>
        </Button>
      </div>

      {/* Stats Badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge variant="secondary" className="text-xs">
          {nodes.length} spaces
        </Badge>
      </div>

      {/* ReactFlow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        snapToGrid
        snapGrid={[10, 10]}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        selectNodesOnDrag={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        preventScrolling
      >
        <Background gap={20} size={1} color="hsl(var(--border))" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === selectedNodeId) return 'hsl(var(--primary))';
            switch (node.type) {
              case 'hallway':
                return 'hsl(var(--muted))';
              case 'door':
                return 'hsl(var(--secondary))';
              default:
                return 'hsl(var(--card))';
            }
          }}
          maskColor="hsl(var(--background) / 0.8)"
          className="!bg-background border border-border rounded-lg"
        />
      </ReactFlow>
    </div>
  );
}

interface SimpleFloorPlanProps {
  onSpaceSelect?: (space: FloorPlanSpace | null) => void;
  className?: string;
}

export function SimpleFloorPlan({ onSpaceSelect, className }: SimpleFloorPlanProps) {
  const { data: floors, isLoading: floorsLoading } = useFloors();
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);

  // Auto-select first floor when loaded
  useEffect(() => {
    if (floors && floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  const selectedFloor = floors?.find((f) => f.id === selectedFloorId);

  return (
    <Card className={cn('h-full flex flex-col overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Floor Plan</h2>
          
          {/* Floor Selector */}
          <Select
            value={selectedFloorId || ''}
            onValueChange={setSelectedFloorId}
            disabled={floorsLoading}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a floor..." />
            </SelectTrigger>
            <SelectContent>
              {floors?.map((floor) => (
                <SelectItem key={floor.id} value={floor.id}>
                  {floor.building_name} - {floor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFloor && (
          <div className="text-sm text-muted-foreground">
            {selectedFloor.building_name} • Floor {selectedFloor.floor_number}
          </div>
        )}
      </div>

      {/* Floor Plan Canvas */}
      <div className="flex-1 min-h-0">
        <ReactFlowProvider>
          <FloorPlanInner
            floorId={selectedFloorId}
            onSpaceSelect={onSpaceSelect}
          />
        </ReactFlowProvider>
      </div>
    </Card>
  );
}

export default SimpleFloorPlan;
