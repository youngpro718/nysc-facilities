/**
 * FloorPlanViewer Component
 * A clean, modern floor plan visualization
 * Designed for clarity, usability, and reliability
 */

import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  NodeChange,
  applyNodeChanges,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Save, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Search,
  X,
  Building2,
  DoorOpen,
  LayoutGrid,
  Eye,
  EyeOff,
  Filter,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { useFloors, useFloorPlan, FloorPlanSpace } from './hooks/useFloorPlan';
import { cn } from '@/lib/utils';
import debounce from 'lodash/debounce';

// ============================================================================
// Custom Node Components - Clean, minimal design
// ============================================================================

const RoomNodeComponent = ({ data, selected }: { data: any; selected: boolean }) => {
  const statusColors: Record<string, string> = {
    active: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950',
    inactive: 'border-slate-400 bg-slate-50 dark:bg-slate-800',
    maintenance: 'border-amber-500 bg-amber-50 dark:bg-amber-950',
  };
  const status = data.properties?.status || 'active';
  const colorClass = statusColors[status] || statusColors.active;

  return (
    <div
      className={cn(
        'rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center p-3 shadow-sm',
        colorClass,
        selected && 'ring-2 ring-blue-500 ring-offset-2 shadow-lg scale-105'
      )}
      style={{
        width: data.size?.width || 140,
        height: data.size?.height || 100,
      }}
    >
      <span className="text-sm font-semibold text-foreground truncate max-w-full text-center leading-tight">
        {data.label || 'Room'}
      </span>
      {data.properties?.room_number && (
        <Badge variant="secondary" className="mt-1 text-[10px] h-5">
          #{data.properties.room_number}
        </Badge>
      )}
    </div>
  );
};

const HallwayNodeComponent = ({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={cn(
        'rounded border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800',
        'flex items-center justify-center transition-all duration-200',
        selected && 'ring-2 ring-blue-500 ring-offset-1 border-slate-500'
      )}
      style={{
        width: data.size?.width || 250,
        height: data.size?.height || 50,
      }}
    >
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate px-2">
        {data.label || 'Hallway'}
      </span>
    </div>
  );
};

const DoorNodeComponent = ({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={cn(
        'rounded border-2 border-amber-500 bg-amber-400 dark:bg-amber-600',
        'flex items-center justify-center transition-all duration-200',
        selected && 'ring-2 ring-blue-500 ring-offset-1'
      )}
      style={{
        width: data.size?.width || 50,
        height: data.size?.height || 20,
      }}
    >
      <DoorOpen className="h-3 w-3 text-white" />
    </div>
  );
};

const nodeTypes = {
  room: RoomNodeComponent,
  hallway: HallwayNodeComponent,
  door: DoorNodeComponent,
};

// ============================================================================
// Space Details Sidebar
// ============================================================================

function SpaceDetails({ space, onClose }: { space: FloorPlanSpace | null; onClose: () => void }) {
  if (!space) return null;

  const typeIcons: Record<string, React.ReactNode> = {
    room: <Home className="h-5 w-5 text-emerald-500" />,
    hallway: <LayoutGrid className="h-5 w-5 text-slate-500" />,
    door: <DoorOpen className="h-5 w-5 text-amber-500" />,
  };

  const statusBadge: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-emerald-500', label: 'Active' },
    inactive: { color: 'bg-slate-400', label: 'Inactive' },
    maintenance: { color: 'bg-amber-500', label: 'Maintenance' },
  };

  const status = statusBadge[space.status] || statusBadge.active;

  return (
    <div className="w-72 border-l bg-card flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          {typeIcons[space.type]}
          <span className="font-semibold capitalize">{space.type} Details</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-lg font-bold">{space.name}</h3>
            {space.room_number && (
              <p className="text-sm text-muted-foreground">Room #{space.room_number}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className={cn('w-2.5 h-2.5 rounded-full', status.color)} />
            <span className="text-sm">{status.label}</span>
          </div>

          <Separator />

          {space.room_type && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Type</label>
              <p className="text-sm font-medium capitalize">{space.room_type.replace(/_/g, ' ')}</p>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Position</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-muted rounded-md p-2 text-center">
                <span className="text-xs text-muted-foreground">X</span>
                <p className="text-sm font-mono font-medium">{Math.round(space.position.x)}</p>
              </div>
              <div className="bg-muted rounded-md p-2 text-center">
                <span className="text-xs text-muted-foreground">Y</span>
                <p className="text-sm font-mono font-medium">{Math.round(space.position.y)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Size</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-muted rounded-md p-2 text-center">
                <span className="text-xs text-muted-foreground">Width</span>
                <p className="text-sm font-mono font-medium">{space.size.width}px</p>
              </div>
              <div className="bg-muted rounded-md p-2 text-center">
                <span className="text-xs text-muted-foreground">Height</span>
                <p className="text-sm font-mono font-medium">{space.size.height}px</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Floor Plan Canvas (Inner Component)
// ============================================================================

interface CanvasProps {
  floorId: string | null;
  onSpaceSelect: (space: FloorPlanSpace | null) => void;
  searchQuery: string;
  filterType: 'all' | 'room' | 'hallway' | 'door';
}

function FloorPlanCanvas({ floorId, onSpaceSelect, searchQuery, filterType }: CanvasProps) {
  const { fitView } = useReactFlow();
  const {
    nodes: initialNodes,
    edges,
    spaces,
    isLoading,
    error,
    refetch,
    handlePositionChange,
    saveAllPositions,
    isSaving,
  } = useFloorPlan(floorId);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Sync nodes from hook
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  // Filter nodes based on search and type
  const filteredNodes = useMemo(() => {
    let result = nodes;
    
    if (filterType !== 'all') {
      result = result.filter(n => n.type === filterType);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => {
        const label = (n.data?.label || '').toLowerCase();
        const roomNum = (n.data?.properties?.room_number || '').toLowerCase();
        return label.includes(q) || roomNum.includes(q);
      });
    }
    
    return result;
  }, [nodes, filterType, searchQuery]);

  // Debounced save
  const debouncedSave = useRef(
    debounce((nodeId: string, position: { x: number; y: number }) => {
      handlePositionChange(nodeId, position);
    }, 500)
  ).current;

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
    
    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        debouncedSave(change.id, change.position);
      }
    });
  }, [debouncedSave]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    const space = spaces.find(s => s.id === node.id);
    onSpaceSelect(space || null);
  }, [spaces, onSpaceSelect]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    onSpaceSelect(null);
  }, [onSpaceSelect]);

  // Fit view on load
  useEffect(() => {
    if (filteredNodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 150);
    }
  }, [floorId, filteredNodes.length, fitView]);

  // Loading state
  if (!floorId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Building2 className="h-16 w-16 opacity-20" />
        <p className="text-lg font-medium">Select a floor to view</p>
        <p className="text-sm">Choose a floor from the dropdown above</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading floor plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-destructive font-medium">Failed to load floor plan</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (filteredNodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Search className="h-12 w-12 opacity-20" />
        <p className="font-medium">No spaces found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Floating toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-lg border shadow-sm p-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => fitView({ padding: 0.2 })}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button 
          size="sm" 
          variant="default" 
          className="h-8"
          onClick={() => saveAllPositions(nodes)}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Save
        </Button>
      </div>

      {/* Stats badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge variant="secondary" className="shadow-sm">
          {filteredNodes.length} {filteredNodes.length === 1 ? 'space' : 'spaces'}
        </Badge>
      </div>

      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={3}
        snapToGrid
        snapGrid={[20, 20]}
        nodesDraggable
        nodesConnectable={false}
        selectNodesOnDrag={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        className="bg-slate-50 dark:bg-slate-950"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="hsl(var(--muted-foreground) / 0.15)" />
        <Controls showInteractive={false} className="!bg-background !border-border !shadow-md !rounded-lg" />
        <MiniMap
          nodeColor={node => {
            if (node.id === selectedNodeId) return '#3b82f6';
            if (node.type === 'hallway') return '#94a3b8';
            if (node.type === 'door') return '#f59e0b';
            return '#10b981';
          }}
          maskColor="rgba(0,0,0,0.08)"
          className="!bg-background/90 !border !border-border !rounded-lg !shadow-md"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface FloorPlanViewerProps {
  className?: string;
}

export function FloorPlanViewer({ className }: FloorPlanViewerProps) {
  const { data: floors, isLoading: floorsLoading } = useFloors();
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<FloorPlanSpace | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'room' | 'hallway' | 'door'>('all');
  const [showLabels, setShowLabels] = useState(true);

  // Auto-select first floor
  useEffect(() => {
    if (floors?.length && !selectedFloorId) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  const selectedFloor = floors?.find(f => f.id === selectedFloorId);

  const handleSpaceSelect = useCallback((space: FloorPlanSpace | null) => {
    setSelectedSpace(space);
  }, []);

  const counts = useMemo(() => {
    if (!floors) return { rooms: 0, hallways: 0, doors: 0 };
    return { rooms: 14, hallways: 5, doors: 0 }; // Placeholder - would come from actual data
  }, [floors]);

  return (
    <Card className={cn('h-full flex flex-col overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b bg-muted/30">
        {/* Top row - Floor selector and info */}
        <div className="flex items-center justify-between p-3 gap-4">
          <div className="flex items-center gap-3">
            <Select
              value={selectedFloorId || ''}
              onValueChange={setSelectedFloorId}
              disabled={floorsLoading}
            >
              <SelectTrigger className="w-[280px] bg-background">
                <SelectValue placeholder="Select a floor..." />
              </SelectTrigger>
              <SelectContent>
                {floors?.map(floor => (
                  <SelectItem key={floor.id} value={floor.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{floor.building_name}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{floor.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedFloor && (
              <Badge variant="outline" className="hidden sm:flex">
                Floor {selectedFloor.floor_number}
              </Badge>
            )}
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search spaces..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 px-3 pb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-1">
            {(['all', 'room', 'hallway', 'door'] as const).map(type => (
              <Button
                key={type}
                size="sm"
                variant={filterType === type ? 'default' : 'ghost'}
                className="h-7 text-xs"
                onClick={() => setFilterType(type)}
              >
                {type === 'all' ? 'All' : type === 'room' ? 'Rooms' : type === 'hallway' ? 'Hallways' : 'Doors'}
              </Button>
            ))}
          </div>
          
          <Separator orientation="vertical" className="h-5 mx-2" />
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setShowLabels(!showLabels)}
          >
            {showLabels ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
            Labels
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas */}
        <div className="flex-1 min-w-0">
          <ReactFlowProvider>
            <FloorPlanCanvas
              floorId={selectedFloorId}
              onSpaceSelect={handleSpaceSelect}
              searchQuery={searchQuery}
              filterType={filterType}
            />
          </ReactFlowProvider>
        </div>

        {/* Details sidebar */}
        {selectedSpace && (
          <SpaceDetails space={selectedSpace} onClose={() => setSelectedSpace(null)} />
        )}
      </div>
    </Card>
  );
}

export default FloorPlanViewer;
