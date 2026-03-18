import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pen, MousePointer, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { HallwayNameDialog, DrawnLine } from './HallwayNameDialog';
import { ConnectionTypeDialog, ConnectionTypeValue } from './ConnectionTypeDialog';

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
  name: string;
  saved: boolean;
  connectionType?: ConnectionTypeValue;
  parentId?: string;
}

interface PendingConnection {
  parentSegment: DrawnSegment;
  snapPoint: { x: number; y: number };
}

const DEFAULT_HALLWAY_WIDTH = 50;
const GRID_SNAP = 10;
const SNAP_RADIUS = 30;

function snapToGrid(val: number): number {
  return Math.round(val / GRID_SNAP) * GRID_SNAP;
}

/** Distance from point to line segment */
function pointToSegmentDist(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): { dist: number; nearest: { x: number; y: number } } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const d = Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    return { dist: d, nearest: { x: x1, y: y1 } };
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const nx = x1 + t * dx;
  const ny = y1 + t * dy;
  return { dist: Math.sqrt((px - nx) ** 2 + (py - ny) ** 2), nearest: { x: nx, y: ny } };
}

export function LayoutEditorCanvas({ floorId, objects, onRefresh }: LayoutEditorCanvasProps) {
  const queryClient = useQueryClient();
  const svgRef = useRef<SVGSVGElement>(null);

  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [segments, setSegments] = useState<DrawnSegment[]>([]);

  // Naming dialog
  const [namingLine, setNamingLine] = useState<DrawnLine | null>(null);
  const [hallwayCounter, setHallwayCounter] = useState(1);

  // Connection dialog
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  // Stores the confirmed connection type before naming
  const [confirmedConnection, setConfirmedConnection] = useState<{
    parentId: string;
    parentName: string;
    type: ConnectionTypeValue;
    snapPoint: { x: number; y: number };
  } | null>(null);

  // Pan & zoom
  const [viewBox, setViewBox] = useState({ x: -100, y: -100, w: 1200, h: 800 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  // Snap indicator for live feedback
  const [snapIndicator, setSnapIndicator] = useState<{ x: number; y: number; parentName: string } | null>(null);

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

  /** Find closest saved segment endpoint/body within SNAP_RADIUS */
  const findNearbySegment = useCallback(
    (px: number, py: number): PendingConnection | null => {
      const saved = segments.filter((s) => s.saved);
      let best: PendingConnection | null = null;
      let bestDist = SNAP_RADIUS;

      for (const seg of saved) {
        // Check endpoints first (higher priority)
        for (const pt of [
          { x: seg.line.startX, y: seg.line.startY },
          { x: seg.line.endX, y: seg.line.endY },
        ]) {
          const d = Math.sqrt((px - pt.x) ** 2 + (py - pt.y) ** 2);
          if (d < bestDist) {
            bestDist = d;
            best = { parentSegment: seg, snapPoint: pt };
          }
        }

        // Check body
        const { dist, nearest } = pointToSegmentDist(
          px, py,
          seg.line.startX, seg.line.startY,
          seg.line.endX, seg.line.endY
        );
        if (dist < bestDist) {
          bestDist = dist;
          best = { parentSegment: seg, snapPoint: { x: snapToGrid(nearest.x), y: snapToGrid(nearest.y) } };
        }
      }

      return best;
    },
    [segments]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'draw-hallway') return;
      const pos = toSvgCoords(e);

      if (!drawStart) {
        setDrawStart(pos);
      } else {
        const line: DrawnLine = {
          startX: drawStart.x,
          startY: drawStart.y,
          endX: pos.x,
          endY: pos.y,
        };
        const len = Math.sqrt(
          (line.endX - line.startX) ** 2 + (line.endY - line.startY) ** 2
        );
        if (len > 20) {
          // Check if either endpoint is near an existing segment
          const nearStart = findNearbySegment(line.startX, line.startY);
          const nearEnd = findNearbySegment(line.endX, line.endY);
          const nearby = nearStart || nearEnd;

          if (nearby) {
            // Snap the touching endpoint
            if (nearStart) {
              line.startX = nearby.snapPoint.x;
              line.startY = nearby.snapPoint.y;
            } else {
              line.endX = nearby.snapPoint.x;
              line.endY = nearby.snapPoint.y;
            }
            setPendingConnection(nearby);
            setNamingLine(line);
            setConnectionDialogOpen(true);
          } else {
            // No connection — go straight to naming
            setNamingLine(line);
          }
        }
        setDrawStart(null);
        setSnapIndicator(null);
      }
    },
    [activeTool, drawStart, toSvgCoords, findNearbySegment]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = toSvgCoords(e);
      setMousePos(pos);

      // Show snap indicator while drawing
      if (activeTool === 'draw-hallway' && drawStart) {
        const nearby = findNearbySegment(pos.x, pos.y);
        if (nearby) {
          setSnapIndicator({
            x: nearby.snapPoint.x,
            y: nearby.snapPoint.y,
            parentName: nearby.parentSegment.name || 'Hallway',
          });
        } else {
          setSnapIndicator(null);
        }
      }

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
    [toSvgCoords, viewBox.w, viewBox.h, activeTool, drawStart, findNearbySegment]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawStart(null);
        setSnapIndicator(null);
        if (activeTool === 'draw-hallway') setActiveTool('select');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTool]);

  // Connection type confirmed → proceed to naming (or skip for bends)
  const handleConnectionTypeConfirm = useCallback(
    (type: ConnectionTypeValue) => {
      if (!pendingConnection) return;
      setConnectionDialogOpen(false);

      const parentName = pendingConnection.parentSegment.name || 'Hallway';
      setConfirmedConnection({
        parentId: pendingConnection.parentSegment.id,
        parentName,
        type,
        snapPoint: pendingConnection.snapPoint,
      });

      if (type === 'bend') {
        // For bends, auto-name with parent name and go straight to save
        // Still show naming dialog but pre-filled
      }
      // namingLine is already set, so the HallwayNameDialog will show
      setPendingConnection(null);
    },
    [pendingConnection]
  );

  const handleConnectionTypeCancel = useCallback(() => {
    setConnectionDialogOpen(false);
    setPendingConnection(null);
    setNamingLine(null);
    setConfirmedConnection(null);
  }, []);

  // Save hallway + optional connection
  const handleConfirmHallway = useCallback(
    async (name: string, section: string, type: string) => {
      if (!namingLine || !floorId) return;

      const { startX, startY, endX, endY } = namingLine;
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

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
        // If bend, set main_hallway_id to parent
        const mainHallwayId = confirmedConnection?.type === 'bend'
          ? confirmedConnection.parentId
          : undefined;

        const { data, error } = await supabase.from('hallways').insert({
          name,
          floor_id: floorId,
          type: type as any,
          section: section as any,
          position,
          size,
          rotation: Math.round(rotation),
          status: 'active',
          ...(mainHallwayId ? { main_hallway_id: mainHallwayId } : {}),
        }).select('id').single();

        if (error) throw error;

        // Save connection if we have one
        if (confirmedConnection) {
          const { error: connError } = await supabase.from('hallway_connections').insert({
            main_hallway_id: confirmedConnection.parentId,
            connected_hallway_id: data.id,
            connection_type: confirmedConnection.type,
            connection_point: {
              x: confirmedConnection.snapPoint.x,
              y: confirmedConnection.snapPoint.y,
              position: 'endpoint',
              access_type: confirmedConnection.type === 'transition_door' ? 'door' : 'standard',
            },
          });

          if (connError) {
            logger.error('Failed to save hallway connection:', connError);
            toast.error('Hallway created but connection failed to save');
          }
        }

        setSegments((prev) => [
          ...prev,
          {
            id: data.id,
            line: namingLine,
            name,
            saved: true,
            connectionType: confirmedConnection?.type,
            parentId: confirmedConnection?.parentId,
          },
        ]);

        setHallwayCounter((c) => c + 1);
        toast.success(`Hallway "${name}" created`);

        queryClient.invalidateQueries({ queryKey: ['floorplan-objects', floorId] });
        queryClient.invalidateQueries({ queryKey: ['hallways'] });
        onRefresh();
      } catch (err) {
        logger.error('Failed to create hallway:', err);
        toast.error('Failed to create hallway');
      } finally {
        setNamingLine(null);
        setConfirmedConnection(null);
      }
    },
    [namingLine, floorId, queryClient, onRefresh, confirmedConnection]
  );

  const handleUndo = useCallback(() => {
    setSegments((prev) => {
      const last = prev[prev.length - 1];
      if (last && !last.saved) return prev.slice(0, -1);
      return prev;
    });
  }, []);

  // --- Connection point colors ---
  const connectionColor = (type?: ConnectionTypeValue) => {
    switch (type) {
      case 'bend': return 'hsl(var(--primary))'; // blue
      case 'connected': return 'hsl(142 76% 36%)'; // green
      case 'transition_door': return 'hsl(25 95% 53%)'; // orange
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getObjectColor = (type: string) => {
    switch (type) {
      case 'room': return 'hsl(var(--primary) / 0.15)';
      case 'hallway': return 'hsl(var(--accent) / 0.3)';
      case 'door': return 'hsl(var(--destructive) / 0.3)';
      default: return 'hsl(var(--muted) / 0.3)';
    }
  };

  const getObjectStroke = (type: string) => {
    switch (type) {
      case 'room': return 'hsl(var(--primary))';
      case 'hallway': return 'hsl(var(--accent-foreground))';
      case 'door': return 'hsl(var(--destructive))';
      default: return 'hsl(var(--border))';
    }
  };

  // Find connection points to draw indicators
  const connectionPoints = segments
    .filter((s) => s.saved && s.connectionType && s.parentId)
    .map((seg) => {
      const parent = segments.find((p) => p.id === seg.parentId);
      if (!parent) return null;
      // Find the shared endpoint
      for (const pt of [
        { x: seg.line.startX, y: seg.line.startY },
        { x: seg.line.endX, y: seg.line.endY },
      ]) {
        const { dist } = pointToSegmentDist(
          pt.x, pt.y,
          parent.line.startX, parent.line.startY,
          parent.line.endX, parent.line.endY
        );
        if (dist < SNAP_RADIUS) {
          return { x: pt.x, y: pt.y, type: seg.connectionType! };
        }
      }
      return null;
    })
    .filter(Boolean) as { x: number; y: number; type: ConnectionTypeValue }[];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b bg-background/80 backdrop-blur">
        <Button
          size="sm"
          variant={activeTool === 'select' ? 'default' : 'ghost'}
          onClick={() => { setActiveTool('select'); setDrawStart(null); setSnapIndicator(null); }}
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
            'w-full h-full',
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
                x={0} y={0}
                width={obj.size.width} height={obj.size.height}
                fill={getObjectColor(obj.type)}
                stroke={getObjectStroke(obj.type)}
                strokeWidth={1.5}
                rx={obj.type === 'door' ? 2 : 4}
              />
              {obj.name && (
                <text
                  x={obj.size.width / 2} y={obj.size.height / 2}
                  textAnchor="middle" dominantBaseline="central"
                  className="fill-foreground"
                  fontSize={Math.min(12, obj.size.width / 8)}
                  fontWeight={500}
                >{obj.name}</text>
              )}
            </g>
          ))}

          {/* Saved drawn segments */}
          {segments.filter((s) => s.saved).map((seg) => (
            <g key={seg.id}>
              <line
                x1={seg.line.startX} y1={seg.line.startY}
                x2={seg.line.endX} y2={seg.line.endY}
                stroke="hsl(var(--primary))"
                strokeWidth={DEFAULT_HALLWAY_WIDTH}
                strokeLinecap="round"
                opacity={0.25}
              />
              {/* Label */}
              <text
                x={(seg.line.startX + seg.line.endX) / 2}
                y={(seg.line.startY + seg.line.endY) / 2}
                textAnchor="middle" dominantBaseline="central"
                className="fill-foreground"
                fontSize={11} fontWeight={600}
              >{seg.name}</text>
            </g>
          ))}

          {/* Connection point indicators */}
          {connectionPoints.map((cp, i) => (
            <g key={`cp-${i}`}>
              {/* Outer ring */}
              <circle cx={cp.x} cy={cp.y} r={10} fill="none" stroke={connectionColor(cp.type)} strokeWidth={2} />
              {/* Inner fill */}
              <circle cx={cp.x} cy={cp.y} r={5} fill={connectionColor(cp.type)} />
              {/* Door icon for transition doors */}
              {cp.type === 'transition_door' && (
                <rect
                  x={cp.x - 3} y={cp.y - 8}
                  width={6} height={16}
                  fill="none"
                  stroke={connectionColor(cp.type)}
                  strokeWidth={1.5}
                  rx={1}
                />
              )}
            </g>
          ))}

          {/* Active drawing preview */}
          {drawStart && activeTool === 'draw-hallway' && (
            <>
              <line
                x1={drawStart.x} y1={drawStart.y}
                x2={mousePos.x} y2={mousePos.y}
                stroke="hsl(var(--primary))"
                strokeWidth={DEFAULT_HALLWAY_WIDTH}
                strokeLinecap="round"
                opacity={0.15}
              />
              <line
                x1={drawStart.x} y1={drawStart.y}
                x2={mousePos.x} y2={mousePos.y}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="8 4"
                opacity={0.8}
              />
              <circle cx={drawStart.x} cy={drawStart.y} r={5} fill="hsl(var(--primary))" />
              <circle cx={mousePos.x} cy={mousePos.y} r={5} fill="hsl(var(--primary))" opacity={0.6} />
              <text
                x={(drawStart.x + mousePos.x) / 2}
                y={(drawStart.y + mousePos.y) / 2 - 30}
                textAnchor="middle" className="fill-foreground"
                fontSize={11} fontWeight={600}
              >
                {Math.round(Math.sqrt((mousePos.x - drawStart.x) ** 2 + (mousePos.y - drawStart.y) ** 2))}px
              </text>
            </>
          )}

          {/* Snap indicator */}
          {snapIndicator && drawStart && activeTool === 'draw-hallway' && (
            <>
              <circle
                cx={snapIndicator.x} cy={snapIndicator.y} r={14}
                fill="none" stroke="hsl(var(--primary))" strokeWidth={2}
                strokeDasharray="4 2" opacity={0.8}
              />
              <text
                x={snapIndicator.x} y={snapIndicator.y - 20}
                textAnchor="middle" className="fill-primary"
                fontSize={10} fontWeight={600}
              >
                Snap: {snapIndicator.parentName}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Connection Type Dialog — shown first when snapped */}
      <ConnectionTypeDialog
        open={connectionDialogOpen}
        parentHallwayName={pendingConnection?.parentSegment.name || 'Hallway'}
        onConfirm={handleConnectionTypeConfirm}
        onCancel={handleConnectionTypeCancel}
      />

      {/* Naming Dialog — shown after connection type is chosen (or directly if no connection) */}
      <HallwayNameDialog
        open={!!namingLine && !connectionDialogOpen}
        line={namingLine}
        defaultName={
          confirmedConnection?.type === 'bend'
            ? `${confirmedConnection.parentName} (cont.)`
            : `Hallway ${String.fromCharCode(64 + hallwayCounter)}`
        }
        onConfirm={handleConfirmHallway}
        onCancel={() => {
          setNamingLine(null);
          setConfirmedConnection(null);
        }}
      />
    </div>
  );
}
