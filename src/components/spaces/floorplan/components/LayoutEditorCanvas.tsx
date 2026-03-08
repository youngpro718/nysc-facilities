import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Pen, MousePointer, Trash2, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { HallwayNameDialog, DrawnLine } from './HallwayNameDialog';

interface LayoutObject {
  id: string;
  type: string;
  name?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
}

interface LayoutEditorCanvasProps {
  floorId: string | null;
  objects: LayoutObject[];
  onRefresh: () => void;
}

type Tool = 'select' | 'draw-hallway';

interface DrawnSegment {
  id: string;
  line: DrawnLine;
  saved: boolean; // true once persisted
}

const DEFAULT_HALLWAY_WIDTH = 50;
const GRID_SNAP = 10;

function snapToGrid(val: number): number {
  return Math.round(val / GRID_SNAP) * GRID_SNAP;
}

export function LayoutEditorCanvas({ floorId, objects, onRefresh }: LayoutEditorCanvasProps) {
  const queryClient = useQueryClient();
  const svgRef = useRef<SVGSVGElement>(null);

  // Tool state
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drawn (unsaved) segments
  const [segments, setSegments] = useState<DrawnSegment[]>([]);

  // Naming dialog
  const [namingLine, setNamingLine] = useState<DrawnLine | null>(null);
  const [hallwayCounter, setHallwayCounter] = useState(1);

  // Pan & zoom
  const [viewBox, setViewBox] = useState({ x: -100, y: -100, w: 1200, h: 800 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  // Compute SVG coordinates from mouse event
  const toSvgCoords = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
      const y = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
      return { x: snapToGrid(x), y: snapToGrid(y) };
    },
    [viewBox]
  );

  // Handle canvas click
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'draw-hallway') return;
      const pos = toSvgCoords(e);

      if (!drawStart) {
        // First click: start
        setDrawStart(pos);
      } else {
        // Second click: end → open naming dialog
        const line: DrawnLine = {
          startX: drawStart.x,
          startY: drawStart.y,
          endX: pos.x,
          endY: pos.y,
        };
        // Only create if length > 20px
        const len = Math.sqrt(
          Math.pow(line.endX - line.startX, 2) + Math.pow(line.endY - line.startY, 2)
        );
        if (len > 20) {
          setNamingLine(line);
        }
        setDrawStart(null);
      }
    },
    [activeTool, drawStart, toSvgCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = toSvgCoords(e);
      setMousePos(pos);

      // Panning with middle button or when select tool + dragging
      if (isPanning.current) {
        const dx = ((e.clientX - panStart.current.x) / (svgRef.current?.getBoundingClientRect().width || 1)) * viewBox.w;
        const dy = ((e.clientY - panStart.current.y) / (svgRef.current?.getBoundingClientRect().height || 1)) * viewBox.h;
        setViewBox((v) => ({
          ...v,
          x: panStart.current.vx - dx,
          y: panStart.current.vy - dy,
        }));
      }
    },
    [toSvgCoords, viewBox.w, viewBox.h]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse or right mouse for panning
      if (e.button === 1 || (e.button === 0 && activeTool === 'select' && e.shiftKey)) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
        e.preventDefault();
      }
    },
    [activeTool, viewBox.x, viewBox.y]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Zoom with scroll
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      const pos = toSvgCoords(e as any);
      setViewBox((v) => {
        const newW = v.w * factor;
        const newH = v.h * factor;
        const newX = pos.x - (pos.x - v.x) * factor;
        const newY = pos.y - (pos.y - v.y) * factor;
        return { x: newX, y: newY, w: newW, h: newH };
      });
    },
    [toSvgCoords]
  );

  // ESC to cancel drawing
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawStart(null);
        if (activeTool === 'draw-hallway') setActiveTool('select');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTool]);

  // Save hallway to Supabase
  const handleConfirmHallway = useCallback(
    async (name: string, section: string, type: string) => {
      if (!namingLine || !floorId) return;

      const { startX, startY, endX, endY } = namingLine;
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

      // Position is top-left corner of the bounding rectangle
      // The hallway goes from start to end with a width of DEFAULT_HALLWAY_WIDTH
      const centerX = (startX + endX) / 2;
      const centerY = (startY + endY) / 2;
      const position = {
        x: Math.round(centerX - length / 2),
        y: Math.round(centerY - DEFAULT_HALLWAY_WIDTH / 2),
      };
      const size = {
        width: Math.round(length),
        height: DEFAULT_HALLWAY_WIDTH,
      };

      try {
        const { data, error } = await supabase.from('hallways').insert({
          name,
          floor_id: floorId,
          type: type as any,
          section: section as any,
          position,
          size,
          rotation: Math.round(rotation),
          status: 'active',
        }).select('id').single();

        if (error) throw error;

        // Add to local segments as "saved"
        setSegments((prev) => [
          ...prev,
          {
            id: data.id,
            line: namingLine,
            saved: true,
          },
        ]);

        setHallwayCounter((c) => c + 1);
        toast.success(`Hallway "${name}" created`);

        // Refresh floor plan data
        queryClient.invalidateQueries({ queryKey: ['floorplan-objects', floorId] });
        queryClient.invalidateQueries({ queryKey: ['hallways'] });
        onRefresh();
      } catch (err) {
        logger.error('Failed to create hallway:', err);
        toast.error('Failed to create hallway');
      } finally {
        setNamingLine(null);
      }
    },
    [namingLine, floorId, queryClient, onRefresh]
  );

  // Undo last unsaved segment
  const handleUndo = useCallback(() => {
    setSegments((prev) => {
      const last = prev[prev.length - 1];
      if (last && !last.saved) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);

  // Color helpers
  const getObjectColor = (type: string) => {
    switch (type) {
      case 'room':
        return 'hsl(var(--primary) / 0.15)';
      case 'hallway':
        return 'hsl(var(--accent) / 0.3)';
      case 'door':
        return 'hsl(var(--destructive) / 0.3)';
      default:
        return 'hsl(var(--muted) / 0.3)';
    }
  };

  const getObjectStroke = (type: string) => {
    switch (type) {
      case 'room':
        return 'hsl(var(--primary))';
      case 'hallway':
        return 'hsl(var(--accent-foreground))';
      case 'door':
        return 'hsl(var(--destructive))';
      default:
        return 'hsl(var(--border))';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b bg-background/80 backdrop-blur">
        <Button
          size="sm"
          variant={activeTool === 'select' ? 'default' : 'ghost'}
          onClick={() => { setActiveTool('select'); setDrawStart(null); }}
          className="h-7 px-2 gap-1 text-[11px]"
        >
          <MousePointer className="h-3.5 w-3.5" />
          Select
        </Button>
        <Button
          size="sm"
          variant={activeTool === 'draw-hallway' ? 'default' : 'ghost'}
          onClick={() => setActiveTool('draw-hallway')}
          className="h-7 px-2 gap-1 text-[11px]"
        >
          <Pen className="h-3.5 w-3.5" />
          Draw Hallway
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUndo}
          className="h-7 px-2 gap-1 text-[11px]"
          disabled={segments.length === 0}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        {activeTool === 'draw-hallway' && (
          <span className="text-[11px] text-muted-foreground ml-2">
            {drawStart ? 'Click to place end point' : 'Click to place start point'}
          </span>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          className={cn(
            "w-full h-full",
            activeTool === 'draw-hallway' ? 'cursor-crosshair' : 'cursor-default'
          )}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid-small" width={GRID_SNAP} height={GRID_SNAP} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SNAP} 0 L 0 0 0 ${GRID_SNAP}`} fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.4" />
            </pattern>
            <pattern id="grid-large" width={GRID_SNAP * 10} height={GRID_SNAP * 10} patternUnits="userSpaceOnUse">
              <rect width={GRID_SNAP * 10} height={GRID_SNAP * 10} fill="url(#grid-small)" />
              <path d={`M ${GRID_SNAP * 10} 0 L 0 0 0 ${GRID_SNAP * 10}`} fill="none" stroke="hsl(var(--border))" strokeWidth="0.6" opacity="0.6" />
            </pattern>
          </defs>
          <rect x={viewBox.x - 2000} y={viewBox.y - 2000} width={viewBox.w + 4000} height={viewBox.h + 4000} fill="url(#grid-large)" />

          {/* Existing objects */}
          {objects.map((obj) => (
            <g key={obj.id} transform={`translate(${obj.position.x}, ${obj.position.y})${obj.rotation ? ` rotate(${obj.rotation}, ${obj.size.width / 2}, ${obj.size.height / 2})` : ''}`}>
              <rect
                x={0}
                y={0}
                width={obj.size.width}
                height={obj.size.height}
                fill={getObjectColor(obj.type)}
                stroke={getObjectStroke(obj.type)}
                strokeWidth={1.5}
                rx={obj.type === 'door' ? 2 : 4}
              />
              {obj.name && (
                <text
                  x={obj.size.width / 2}
                  y={obj.size.height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-foreground"
                  fontSize={Math.min(12, obj.size.width / 8)}
                  fontWeight={500}
                >
                  {obj.name}
                </text>
              )}
            </g>
          ))}

          {/* Saved drawn segments */}
          {segments.filter(s => s.saved).map((seg) => (
            <line
              key={seg.id}
              x1={seg.line.startX}
              y1={seg.line.startY}
              x2={seg.line.endX}
              y2={seg.line.endY}
              stroke="hsl(var(--primary))"
              strokeWidth={DEFAULT_HALLWAY_WIDTH}
              strokeLinecap="round"
              opacity={0.25}
            />
          ))}

          {/* Active drawing preview */}
          {drawStart && activeTool === 'draw-hallway' && (
            <>
              {/* Width preview */}
              <line
                x1={drawStart.x}
                y1={drawStart.y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="hsl(var(--primary))"
                strokeWidth={DEFAULT_HALLWAY_WIDTH}
                strokeLinecap="round"
                opacity={0.15}
              />
              {/* Center line */}
              <line
                x1={drawStart.x}
                y1={drawStart.y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="8 4"
                opacity={0.8}
              />
              {/* Start dot */}
              <circle
                cx={drawStart.x}
                cy={drawStart.y}
                r={5}
                fill="hsl(var(--primary))"
              />
              {/* End dot (follows mouse) */}
              <circle
                cx={mousePos.x}
                cy={mousePos.y}
                r={5}
                fill="hsl(var(--primary))"
                opacity={0.6}
              />
              {/* Length label */}
              <text
                x={(drawStart.x + mousePos.x) / 2}
                y={(drawStart.y + mousePos.y) / 2 - 30}
                textAnchor="middle"
                className="fill-foreground"
                fontSize={11}
                fontWeight={600}
              >
                {Math.round(
                  Math.sqrt(
                    Math.pow(mousePos.x - drawStart.x, 2) +
                      Math.pow(mousePos.y - drawStart.y, 2)
                  )
                )}
                px
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Naming Dialog */}
      <HallwayNameDialog
        open={!!namingLine}
        line={namingLine}
        defaultName={`Hallway ${String.fromCharCode(64 + hallwayCounter)}`}
        onConfirm={handleConfirmHallway}
        onCancel={() => {
          setNamingLine(null);
        }}
      />
    </div>
  );
}
