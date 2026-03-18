
import { useState, useMemo, useCallback } from 'react';
import { LayoutGrid, ArrowRight, Rows3, Save, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface RoomObj {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    size: { width: number; height: number };
    properties?: Record<string, unknown>;
  };
}

interface BulkPositionToolProps {
  objects: RoomObj[];
  floorId: string | null;
  onApply: (updates: { id: string; position: { x: number; y: number } }[]) => void;
  onRefresh: () => void;
}

type LayoutMode = 'grid' | 'row' | 'column';

export function BulkPositionTool({ objects, floorId, onApply, onRefresh }: BulkPositionToolProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [spacing, setSpacing] = useState(40);
  const [startX, setStartX] = useState(100);
  const [startY, setStartY] = useState(100);

  // Find rooms stuck at 0,0
  const unpositioned = useMemo(() => {
    return objects.filter(obj => {
      if (obj.type === 'door') return false;
      const p = obj.position;
      return !p || (p.x === 0 && p.y === 0);
    });
  }, [objects]);

  const positionedCount = objects.filter(o => o.type !== 'door' && o.position && (o.position.x !== 0 || o.position.y !== 0)).length;

  // Generate positions based on layout mode
  const generatePositions = useCallback((rooms: RoomObj[]): { id: string; position: { x: number; y: number } }[] => {
    if (!rooms.length) return [];

    const sorted = [...rooms].sort((a, b) => {
      const nameA = a.data?.label || a.data?.properties?.room_number as string || '';
      const nameB = b.data?.label || b.data?.properties?.room_number as string || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true });
    });

    if (layoutMode === 'row') {
      let x = startX;
      return sorted.map(room => {
        const w = room.data?.size?.width || 150;
        const pos = { id: room.id, position: { x, y: startY } };
        x += w + spacing;
        return pos;
      });
    }

    if (layoutMode === 'column') {
      let y = startY;
      return sorted.map(room => {
        const h = room.data?.size?.height || 100;
        const pos = { id: room.id, position: { x: startX, y } };
        y += h + spacing;
        return pos;
      });
    }

    // Grid layout (default)
    const cols = Math.max(1, Math.ceil(Math.sqrt(sorted.length)));
    let rowY = startY;
    let rowMaxH = 0;
    let colX = startX;
    let colIdx = 0;

    return sorted.map((room) => {
      const w = room.data?.size?.width || 150;
      const h = room.data?.size?.height || 100;

      if (colIdx >= cols) {
        colIdx = 0;
        colX = startX;
        rowY += rowMaxH + spacing;
        rowMaxH = 0;
      }

      const pos = { id: room.id, position: { x: colX, y: rowY } };
      colX += w + spacing;
      rowMaxH = Math.max(rowMaxH, h);
      colIdx++;
      return pos;
    });
  }, [layoutMode, spacing, startX, startY]);

  const handlePreview = () => {
    const updates = generatePositions(unpositioned);
    if (!updates.length) {
      toast.info('No unpositioned rooms to arrange');
      return;
    }
    onApply(updates);
    toast.success(`Arranged ${updates.length} rooms — click Save to persist`);
  };

  const handleSave = async () => {
    if (!floorId) return;
    const updates = generatePositions(unpositioned);
    if (!updates.length) return;

    setIsSaving(true);
    try {
      // Batch update via floor_plan_objects table
      const promises = updates.map(u =>
        supabase
          .from('floor_plan_objects')
          .update({ position: u.position })
          .eq('id', u.id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        logger.error('Bulk position errors:', errors.map(e => e.error));
        toast.error(`${errors.length} rooms failed to save`);
      } else {
        toast.success(`Saved positions for ${updates.length} rooms`);
        onRefresh();
      }
    } catch (err) {
      logger.error('Bulk save error:', err);
      toast.error('Failed to save positions');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePositionAll = async () => {
    if (!floorId) return;
    const allRooms = objects.filter(o => o.type !== 'door');
    const updates = generatePositions(allRooms);
    if (!updates.length) return;

    setIsSaving(true);
    try {
      const promises = updates.map(u =>
        supabase
          .from('floor_plan_objects')
          .update({ position: u.position })
          .eq('id', u.id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        toast.error(`${errors.length} rooms failed`);
      } else {
        toast.success(`Re-arranged all ${updates.length} rooms`);
        onRefresh();
      }
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (!objects.length) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          size="sm" 
          variant={unpositioned.length > 0 ? 'default' : 'ghost'}
          className={cn(
            "h-7 px-2 text-[11px] gap-1",
            unpositioned.length > 0 && "bg-amber-600 hover:bg-amber-700 text-white"
          )}
        >
          <LayoutGrid className="h-3 w-3" />
          <span className="hidden sm:inline">Position</span>
          {unpositioned.length > 0 && (
            <span className="bg-white/20 rounded px-1 text-[10px]">{unpositioned.length}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Bulk Position Tool</span>
            <span className="text-[10px] text-muted-foreground">
              {unpositioned.length} unpositioned / {positionedCount} placed
            </span>
          </div>

          {/* Layout mode selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-muted-foreground">Layout</span>
            <div className="flex gap-1">
              {([
                { mode: 'grid' as LayoutMode, icon: LayoutGrid, label: 'Grid' },
                { mode: 'row' as LayoutMode, icon: ArrowRight, label: 'Row' },
                { mode: 'column' as LayoutMode, icon: Rows3, label: 'Column' },
              ]).map(({ mode, icon: Icon, label }) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={layoutMode === mode ? 'default' : 'outline'}
                  onClick={() => setLayoutMode(mode)}
                  className="h-7 flex-1 text-[11px] gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Spacing */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Spacing</span>
              <span className="text-[10px] text-muted-foreground">{spacing}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={spacing}
              onChange={(e) => setSpacing(parseInt(e.target.value))}
              className="w-full h-1 accent-primary"
            />
          </div>

          {/* Start position */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground">Start X</span>
              <input
                type="number"
                value={startX}
                onChange={(e) => setStartX(parseInt(e.target.value) || 0)}
                className="w-full h-6 px-1.5 text-[11px] rounded border border-border bg-background"
              />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground">Start Y</span>
              <input
                type="number"
                value={startY}
                onChange={(e) => setStartY(parseInt(e.target.value) || 0)}
                className="w-full h-6 px-1.5 text-[11px] rounded border border-border bg-background"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-border">
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-[11px] gap-1"
                onClick={handlePreview}
                disabled={unpositioned.length === 0}
              >
                <RotateCcw className="h-3 w-3" />
                Preview ({unpositioned.length})
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-[11px] gap-1"
                onClick={handleSave}
                disabled={unpositioned.length === 0 || isSaving}
              >
                <Save className="h-3 w-3" />
                {isSaving ? 'Saving...' : `Save (${unpositioned.length})`}
              </Button>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-[11px] gap-1 w-full"
              onClick={handlePositionAll}
              disabled={isSaving}
            >
              <LayoutGrid className="h-3 w-3" />
              Re-arrange ALL rooms ({objects.filter(o => o.type !== 'door').length})
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
