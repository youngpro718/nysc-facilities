import { useCallback } from 'react';
import { Node, useReactFlow } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignCenterVertical,
  AlignCenterHorizontal,
  GripHorizontal,
  GripVertical,
  Rows3,
  Columns3,
} from 'lucide-react';

interface AlignmentToolbarProps {
  selectedNodeIds: string[];
  onNodesChange: (changes: any[]) => void;
}

const STACK_GAP = 10;

function getNodeRect(node: Node) {
  const w = node.data?.size?.width ?? 150;
  const h = node.data?.size?.height ?? 100;
  return {
    x: node.position.x,
    y: node.position.y,
    w,
    h,
    cx: node.position.x + w / 2,
    cy: node.position.y + h / 2,
    right: node.position.x + w,
    bottom: node.position.y + h,
  };
}

export function AlignmentToolbar({ selectedNodeIds, onNodesChange }: AlignmentToolbarProps) {
  const { getNodes, setNodes } = useReactFlow();

  const applyPositions = useCallback(
    (updates: Map<string, { x: number; y: number }>) => {
      setNodes((nds) =>
        nds.map((n) => {
          const pos = updates.get(n.id);
          return pos ? { ...n, position: pos } : n;
        })
      );
      // Trigger DB save for each moved node
      const changes = Array.from(updates.entries()).map(([id, position]) => ({
        id,
        type: 'position' as const,
        position,
      }));
      onNodesChange(changes);
    },
    [setNodes, onNodesChange]
  );

  const getSelected = useCallback(() => {
    const all = getNodes();
    return all.filter((n) => selectedNodeIds.includes(n.id));
  }, [getNodes, selectedNodeIds]);

  const alignLeft = useCallback(() => {
    const nodes = getSelected();
    if (nodes.length < 2) return;
    const minX = Math.min(...nodes.map((n) => n.position.x));
    const updates = new Map<string, { x: number; y: number }>();
    nodes.forEach((n) => updates.set(n.id, { x: minX, y: n.position.y }));
    applyPositions(updates);
  }, [getSelected, applyPositions]);

  const alignRight = useCallback(() => {
    const nodes = getSelected();
    if (nodes.length < 2) return;
    const rects = nodes.map((n) => ({ node: n, rect: getNodeRect(n) }));
    const maxRight = Math.max(...rects.map((r) => r.rect.right));
    const updates = new Map<string, { x: number; y: number }>();
    rects.forEach(({ node, rect }) =>
      updates.set(node.id, { x: maxRight - rect.w, y: node.position.y })
    );
    applyPositions(updates);
  }, [getSelected, applyPositions]);

  const alignTop = useCallback(() => {
    const nodes = getSelected();
    if (nodes.length < 2) return;
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const updates = new Map<string, { x: number; y: number }>();
    nodes.forEach((n) => updates.set(n.id, { x: n.position.x, y: minY }));
    applyPositions(updates);
  }, [getSelected, applyPositions]);

  const alignBottom = useCallback(() => {
    const nodes = getSelected();
    if (nodes.length < 2) return;
    const rects = nodes.map((n) => ({ node: n, rect: getNodeRect(n) }));
    const maxBottom = Math.max(...rects.map((r) => r.rect.bottom));
    const updates = new Map<string, { x: number; y: number }>();
    rects.forEach(({ node, rect }) =>
      updates.set(node.id, { x: node.position.x, y: maxBottom - rect.h })
    );
    applyPositions(updates);
  }, [getSelected, applyPositions]);

  const alignCenterH = useCallback(() => {
    const nodes = getSelected();
    if (nodes.length < 2) return;
    const rects = nodes.map((n) => ({ node: n, rect: getNodeRect(n) }));
    const avgCx = rects.reduce((s, r) => s + r.rect.cx, 0) / rects.length;
    const updates = new Map<string, { x: number; y: number }>();
    rects.forEach(({ node, rect }) =>
      updates.set(node.id, { x: avgCx - rect.w / 2, y: node.position.y })
    );
    applyPositions(updates);
  }, [getSelected, applyPositions]);

  const alignCenterV = useCallback(() => {
    const nodes = getSelected();
    if (nodes.length < 2) return;
    const rects = nodes.map((n) => ({ node: n, rect: getNodeRect(n) }));
    const avgCy = rects.reduce((s, r) => s + r.rect.cy, 0) / rects.length;
    const updates = new Map<string, { x: number; y: number }>();
    rects.forEach(({ node, rect }) =>
      updates.set(node.id, { x: node.position.x, y: avgCy - rect.h / 2 })
    );
    applyPositions(updates);
  }, [getSelected, applyPositions]);

  const distributeH = useCallback(() => {
    const nodes = getSelected();
    if (nodes.length < 3) return;
    const rects = nodes.map((n) => ({ node: n, rect: getNodeRect(n) }));
    rects.sort((a, b) => a.rect.x - b.rect.x);
    const totalWidth = rects.reduce((s, r) => s + r.rect.w, 0);
    const span = rects[rects.length - 1].rect.right - rects[0].rect.x;
    const gap = (span - totalWidth) / (rects.length - 1);
    let cursor = rects[0].rect.x;
    const updates = new Map<string, { x: number; y: number }>();
    rects.forEach(({ node, rect }) => {
      updates.set(node.id, { x: cursor, y: node.position.y });
      cursor += rect.w + gap;
    });
    applyPositions(updates);
  }, [getSelected, applyPositions]);

  const distributeV = useCallback(() => {
    const nodes = getSelected();
    if (nodes.length < 3) return;
    const rects = nodes.map((n) => ({ node: n, rect: getNodeRect(n) }));
    rects.sort((a, b) => a.rect.y - b.rect.y);
    const totalHeight = rects.reduce((s, r) => s + r.rect.h, 0);
    const span = rects[rects.length - 1].rect.bottom - rects[0].rect.y;
    const gap = (span - totalHeight) / (rects.length - 1);
    let cursor = rects[0].rect.y;
    const updates = new Map<string, { x: number; y: number }>();
    rects.forEach(({ node, rect }) => {
      updates.set(node.id, { x: node.position.x, y: cursor });
      cursor += rect.h + gap;
    });
    applyPositions(updates);
  }, [getSelected, applyPositions]);

  const stackRow = useCallback(() => {
    const nodes = getSelected();
    if (nodes.length < 2) return;
    const rects = nodes.map((n) => ({ node: n, rect: getNodeRect(n) }));
    rects.sort((a, b) => a.rect.x - b.rect.x);
    const baseY = rects[0].rect.y;
    let cursor = rects[0].rect.x;
    const updates = new Map<string, { x: number; y: number }>();
    rects.forEach(({ node, rect }) => {
      updates.set(node.id, { x: cursor, y: baseY });
      cursor += rect.w + STACK_GAP;
    });
    applyPositions(updates);
  }, [getSelected, applyPositions]);

  const stackColumn = useCallback(() => {
    const nodes = getSelected();
    if (nodes.length < 2) return;
    const rects = nodes.map((n) => ({ node: n, rect: getNodeRect(n) }));
    rects.sort((a, b) => a.rect.y - b.rect.y);
    const baseX = rects[0].rect.x;
    let cursor = rects[0].rect.y;
    const updates = new Map<string, { x: number; y: number }>();
    rects.forEach(({ node, rect }) => {
      updates.set(node.id, { x: baseX, y: cursor });
      cursor += rect.h + STACK_GAP;
    });
    applyPositions(updates);
  }, [getSelected, applyPositions]);

  const actions = [
    { icon: AlignStartVertical, label: 'Align Left', action: alignLeft, group: 'align' },
    { icon: AlignEndVertical, label: 'Align Right', action: alignRight, group: 'align' },
    { icon: AlignStartHorizontal, label: 'Align Top', action: alignTop, group: 'align' },
    { icon: AlignEndHorizontal, label: 'Align Bottom', action: alignBottom, group: 'align' },
    { icon: AlignCenterVertical, label: 'Center Horizontally', action: alignCenterH, group: 'align' },
    { icon: AlignCenterHorizontal, label: 'Center Vertically', action: alignCenterV, group: 'align' },
    { icon: GripHorizontal, label: 'Distribute Horizontally', action: distributeH, group: 'distribute' },
    { icon: GripVertical, label: 'Distribute Vertically', action: distributeV, group: 'distribute' },
    { icon: Columns3, label: 'Stack in Row', action: stackRow, group: 'stack' },
    { icon: Rows3, label: 'Stack in Column', action: stackColumn, group: 'stack' },
  ];

  const groups = ['align', 'distribute', 'stack'];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-0.5 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-1.5 py-1">
        {groups.map((group, gi) => (
          <div key={group} className="flex items-center">
            {gi > 0 && <div className="w-px h-5 bg-border mx-1" />}
            {actions
              .filter((a) => a.group === group)
              .map((a) => (
                <Tooltip key={a.label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={a.action}
                    >
                      <a.icon className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {a.label}
                  </TooltipContent>
                </Tooltip>
              ))}
          </div>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <span className="text-[10px] text-muted-foreground px-1">
          {selectedNodeIds.length} selected
        </span>
      </div>
    </TooltipProvider>
  );
}
