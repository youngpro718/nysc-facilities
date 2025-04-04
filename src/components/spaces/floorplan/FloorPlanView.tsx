import React, { useState, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils";

import { Building2, Eye, EyeOff, Layers2, Lock, LockOpen, Plus, RotateCcw, Save, Search, Trash2, Upload, X } from "lucide-react";
import { FloorPlanProperties } from "./components/FloorPlanProperties";
import { useToast } from "@/hooks/use-toast";
import { FloorPlanNode, FloorPlanEdge } from "./types/floorPlanTypes";
import { useFloorPlanData } from "./hooks/useFloorPlanData";
import { ThreeDViewer } from "./components/ThreeDViewer";

const initialNodes: FloorPlanNode[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Input Node' },
    position: { x: 250, y: 25 },
  },
];

const initialEdges: FloorPlanEdge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
];

interface FloorPlanViewProps {
  selectedFloor: string;
  onFloorChange: (floorId: string) => void;
  onObjectSelect?: (object: any) => void;
  selectedObjectId?: string;
  previewData?: any;
  editable?: boolean;
}

const FloorPlanView: React.FC<FloorPlanViewProps> = ({ 
  selectedFloor,
  onFloorChange,
  onObjectSelect,
  selectedObjectId,
  previewData,
  editable = false
}) => {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [zoom, setZoom] = useState(1);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const { setViewport } = useReactFlow();

  const {
    layers,
    spaces,
    isLoading,
    isError,
    error,
  } = useFloorPlanData(selectedFloor, previewData);

  // Update nodes when spaces change
  React.useEffect(() => {
    setNodes(spaces);
  }, [spaces, setNodes]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
    setViewport({ zoom: zoom + 0.1 });
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
    setViewport({ zoom: zoom - 0.1 });
  };

  const handleReset = () => {
    setZoom(1);
    setViewport({ zoom: 1 });
  };

  const handleFitView = () => {
    setViewport({ zoom: 1 });
  };

  const handleLockToggle = () => {
    setIsLocked(!isLocked);
  };

  const handleSave = () => {
    toast({
      title: "Saved",
      description: "Floor plan has been saved.",
    });
  };

  const handleUpload = () => {
    toast({
      title: "Uploaded",
      description: "Floor plan has been uploaded.",
    });
  };

  const handleDelete = () => {
    toast({
      title: "Deleted",
      description: "Floor plan has been deleted.",
    });
  };

  // Render the view
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="email">Select Floor</Label>
          <Select value={selectedFloor} onValueChange={onFloorChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              <SelectItem value="floor-1">Floor 1</SelectItem>
              <SelectItem value="floor-2">Floor 2</SelectItem>
              <SelectItem value="floor-3">Floor 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8"
          >
            <Search className="h-4 w-4 rotate-45" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleFitView}
            className="h-8 w-8"
          >
            <Building2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLockToggle}
            className="h-8 w-8"
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSave}
            className="h-8 w-8"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleUpload}
            className="h-8 w-8"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className={cn("grid flex-1 gap-4", editable ? "grid-cols-1 lg:grid-cols-3" : "")}>
        <div className={cn("h-full min-h-[300px]", editable ? "lg:col-span-2" : "")}>
          <ReactFlowProvider>
            <div className="h-full rounded-md border bg-card">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                zoomOnScroll={false}
                panOnScroll={false}
                minZoom={0.5}
                maxZoom={2}
                className="bg-background"
              >
                <Controls />
                <Background color="#aaa" gap={16} />
              </ReactFlow>
            </div>
          </ReactFlowProvider>
        </div>
        
        {editable && (
          <div className="h-full">
            <Tabs defaultValue="properties" className="h-full flex flex-col">
              <TabsList>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="3d">3D View</TabsTrigger>
              </TabsList>
              <TabsContent value="properties" className="flex-1">
                <FloorPlanProperties />
              </TabsContent>
              <TabsContent value="3d" className="flex-1">
                <ThreeDViewer 
                  key={selectedFloor}
                  floorId={selectedFloor}
                  selectedObjectId={selectedObjectId}
                  previewData={previewData}
                  onObjectSelect={onObjectSelect}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {!editable && (
          <div className="h-full">
            <ThreeDViewer 
              key={selectedFloor}
              floorId={selectedFloor}
              selectedObjectId={selectedObjectId}
              previewData={previewData}
              onObjectSelect={onObjectSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlanView;
