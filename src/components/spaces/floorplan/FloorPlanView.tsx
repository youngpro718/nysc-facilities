import { useState, useCallback } from "react";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoomIn, ZoomOut, RotateCcw, Undo2, Redo2, Layers } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { VisualFloorSelector } from "./components/VisualFloorSelector";
import { useUndo } from "./hooks/useUndo";
import { toast } from "sonner";

/**
 * State interface for the floor plan view component.
 * Manages the current state of the floor plan including selected floor,
 * selected object, and zoom level.
 * @interface FloorPlanState
 * @property {string | null} selectedFloorId - ID of the currently selected floor
 * @property {any | null} selectedObject - Currently selected object in the floor plan
 * @property {number} zoom - Current zoom level of the floor plan view
 */
interface FloorPlanState {
  selectedFloorId: string | null;
  selectedObject: any | null;
  zoom: number;
}

/**
 * FloorPlanView Component
 * 
 * A comprehensive floor plan management interface that allows users to:
 * - View and select different floors across buildings
 * - Zoom and pan around the floor plan
 * - Select and modify floor plan objects (rooms, doors, hallways)
 * - Undo/redo changes to the floor plan state
 * 
 * Features:
 * - Visual floor selector with building grouping
 * - Zoom controls with min/max limits
 * - Undo/redo functionality for state changes
 * - Properties panel for selected objects
 * - Real-time updates with Supabase integration
 * 
 * @component
 * @example
 * ```tsx
 * <FloorPlanView />
 * ```
 */
export function FloorPlanView() {
  const { 
    state,
    canUndo,
    canRedo,
    undo,
    redo,
    setState
  } = useUndo<FloorPlanState>({
    selectedFloorId: null,
    selectedObject: null,
    zoom: 1
  });

  const { selectedFloorId, selectedObject, zoom } = state;
  const [isVisualSelectorOpen, setIsVisualSelectorOpen] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Fetches floor data from Supabase including building information
   * Orders floors by floor number in descending order
   */
  const { data: floors, isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select(`
          id,
          name,
          floor_number,
          buildings (
            name
          )
        `)
        .order('floor_number', { ascending: false });

      if (error) {
        console.error('Error fetching floors:', error);
        return [];
      }

      return data || [];
    }
  });

  // Local state setters
  const setSelectedFloorId = useCallback((id: string | null) => {
    setState({
      selectedFloorId: id,
      selectedObject: null, // Clear selection when changing floors
      zoom
    });
  }, [setState, zoom]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 0.1, 2);
    setState({
      selectedFloorId,
      selectedObject,
      zoom: newZoom
    });
  }, [selectedFloorId, selectedObject, zoom, setState]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 0.1, 0.5);
    setState({
      selectedFloorId,
      selectedObject,
      zoom: newZoom
    });
  }, [selectedFloorId, selectedObject, zoom, setState]);

  const handleReset = useCallback(() => {
    setState({
      selectedFloorId,
      selectedObject,
      zoom: 1
    });
  }, [selectedFloorId, selectedObject, setState]);

  const handleObjectSelect = useCallback((obj: any) => {
    setState({
      selectedFloorId,
      selectedObject: obj,
      zoom
    });
  }, [selectedFloorId, zoom, setState]);

  const handleFloorSelect = useCallback((floorId: string) => {
    setState({
      selectedFloorId: floorId,
      selectedObject: null,
      zoom
    });
    setIsVisualSelectorOpen(false);
  }, [zoom, setState]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undo();
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    redo();
  }, [canRedo, redo]);

  /**
   * Handles property updates
   * Clears the selected object and invalidates the floor plan data queries
   */
  const handlePropertyUpdate = useCallback(async () => {
    try {
      // Clear the selected object
      setState({
        selectedFloorId,
        selectedObject: null,
        zoom
      });
      
      // Invalidate the floor plan data queries to trigger a refresh
      await queryClient.invalidateQueries({
        queryKey: ['floorplan-objects', selectedFloorId]
      });
      
      console.log('Floor plan data invalidated for refresh');
      toast.success('Floor plan updated successfully');
    } catch (err) {
      console.error('Error refreshing floor plan:', err);
      toast.error('Failed to refresh floor plan');
    }
  }, [selectedFloorId, zoom, setState, queryClient]);

  /**
   * Renders the floor plan interface with:
   * - Top control bar containing:
   *   - Floor selector dropdown with visual selector option
   *   - Zoom controls (in, out, reset)
   *   - Undo/redo buttons
   * - Main content area with:
   *   - Interactive floor plan canvas
   *   - Properties panel for selected objects
   * 
   * @returns {JSX.Element} The rendered floor plan interface
   */
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Floor Selector */}
          <div className="relative">
            <Select
              value={selectedFloorId || ''}
              onValueChange={setSelectedFloorId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a floor" />
              </SelectTrigger>
              <SelectContent>
                {floors?.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.buildings?.name} - {floor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Visual Floor Selector Toggle */}
            <Button
              variant="outline"
              size="sm"
              className="absolute right-8 top-1/2 -translate-y-1/2"
              onClick={() => setIsVisualSelectorOpen(true)}
            >
              <Layers className="h-4 w-4" />
            </Button>

            {/* Visual Floor Selector Dropdown */}
            {isVisualSelectorOpen && (
              <Card className="absolute z-50 top-full mt-2 left-0 w-[300px] bg-background">
                <VisualFloorSelector
                  floors={floors || []}
                  selectedFloorId={selectedFloorId}
                  onFloorSelect={(floorId) => {
                    handleFloorSelect(floorId);
                    setIsVisualSelectorOpen(false);
                  }}
                />
              </Card>
            )}
          </div>

          {/* Control Buttons */}
          <div className="space-x-2">
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleUndo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRedo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <FloorPlanCanvas 
          floorId={selectedFloorId} 
          zoom={zoom}
          onObjectSelect={handleObjectSelect}
        />
        
        <PropertiesPanel 
          selectedObject={selectedObject}
          onUpdate={handlePropertyUpdate}
        />
      </div>
    </div>
  );
}
