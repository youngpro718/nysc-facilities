
import { ReactFlow, Background, Controls, MiniMap, Panel, Node, Connection, Edge } from 'reactflow';
import { panelStyle } from '../styles/flowStyles';
import { useState, useCallback, useRef } from 'react';
import { Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlignmentToolbar } from './AlignmentToolbar';

const SNAP_THRESHOLD = 15;

interface FloorPlanFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  onNodeClick: any;
  nodeTypes: any;
  zoom?: number;
}

export function FloorPlanFlow({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  nodeTypes,
  zoom = 1,
}: FloorPlanFlowProps) {
  const isMobile = useIsMobile();
  const [isPanning, setIsPanning] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }[]>([]);
  const defaultViewport = { x: 0, y: 0, zoom };

  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;
    if (connection.source === connection.target) return false;
    if (sourceNode.type === 'door' && targetNode.type === 'door') return false;

    const existingConnection = edges.find(
      edge => 
        (edge.source === connection.source && edge.target === connection.target) ||
        (edge.source === connection.target && edge.target === connection.source)
    );
    if (existingConnection) return false;

    return true;
  }, [nodes, edges]);

  const handleConnect = useCallback(
    (params: Connection | Edge) => {
      if (isValidConnection(params as Connection)) {
        onConnect(params);
      }
    },
    [onConnect, isValidConnection]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    setSelectedNodeIds(selectedNodes.map(n => n.id));
  }, []);

  // Snap-to-neighbor during drag
  const onNodeDrag = useCallback((_event: React.MouseEvent, draggedNode: Node) => {
    const dw = draggedNode.data?.size?.width ?? 150;
    const dh = draggedNode.data?.size?.height ?? 100;
    const dRight = draggedNode.position.x + dw;
    const dBottom = draggedNode.position.y + dh;

    const lines: { x?: number; y?: number }[] = [];

    for (const other of nodes) {
      if (other.id === draggedNode.id) continue;
      const ow = other.data?.size?.width ?? 150;
      const oh = other.data?.size?.height ?? 100;
      const oRight = other.position.x + ow;
      const oBottom = other.position.y + oh;

      // Vertical alignment checks (x-axis)
      if (Math.abs(draggedNode.position.x - other.position.x) < SNAP_THRESHOLD) {
        lines.push({ x: other.position.x });
      }
      if (Math.abs(dRight - oRight) < SNAP_THRESHOLD) {
        lines.push({ x: oRight });
      }
      if (Math.abs(draggedNode.position.x - oRight) < SNAP_THRESHOLD) {
        lines.push({ x: oRight });
      }
      if (Math.abs(dRight - other.position.x) < SNAP_THRESHOLD) {
        lines.push({ x: other.position.x });
      }

      // Horizontal alignment checks (y-axis)
      if (Math.abs(draggedNode.position.y - other.position.y) < SNAP_THRESHOLD) {
        lines.push({ y: other.position.y });
      }
      if (Math.abs(dBottom - oBottom) < SNAP_THRESHOLD) {
        lines.push({ y: oBottom });
      }
      if (Math.abs(draggedNode.position.y - oBottom) < SNAP_THRESHOLD) {
        lines.push({ y: oBottom });
      }
      if (Math.abs(dBottom - other.position.y) < SNAP_THRESHOLD) {
        lines.push({ y: other.position.y });
      }
    }

    setSnapLines(lines.slice(0, 4)); // limit to avoid clutter
  }, [nodes]);

  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    setSnapLines([]);
    onNodesChange([{
      id: node.id,
      type: 'position',
      position: node.position
    }]);
  }, [onNodesChange]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      defaultViewport={defaultViewport}
      minZoom={0.2}
      maxZoom={3}
      fitView
      fitViewOptions={{ 
        padding: 0.3,
        duration: 800,
        includeHiddenNodes: false,
        minZoom: 0.2,
        maxZoom: 2
      }}
      snapGrid={[10, 10]}
      snapToGrid
      selectNodesOnDrag={true}
      panOnDrag={isPanning ? [0, 1, 2] : true}
      zoomOnScroll={true}
      zoomOnPinch={true}
      zoomOnDoubleClick={true}
      preventScrolling={true}
      nodesDraggable={!isPanning}
      nodesConnectable={!isPanning}
      elementsSelectable={true}
      multiSelectionKeyCode="Shift"
      selectionOnDrag={!isPanning}
      style={{ width: '100%', height: '100%' }}
      onSelectionChange={onSelectionChange}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
    >
      {/* Snap guide lines */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        {snapLines.map((line, i) =>
          line.x !== undefined ? (
            <line
              key={`snap-x-${i}`}
              x1={line.x}
              y1={-10000}
              x2={line.x}
              y2={10000}
              stroke="hsl(var(--primary))"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.6}
            />
          ) : line.y !== undefined ? (
            <line
              key={`snap-y-${i}`}
              x1={-10000}
              y1={line.y}
              x2={10000}
              y2={line.y}
              stroke="hsl(var(--primary))"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.6}
            />
          ) : null
        )}
      </svg>

      {/* Hide panel on mobile - not needed */}
      {!isMobile && (
        <Panel position="top-left" className="space-y-2">
          <div style={panelStyle} className="text-gray-700 text-sm">
            Objects: {nodes.length}
          </div>
          <Button
            variant={isPanning ? "secondary" : "outline"}
            size="sm"
            className="flex items-center gap-2 touch-target"
            onClick={() => setIsPanning(!isPanning)}
            aria-label={isPanning ? "Disable pan mode" : "Enable pan mode"}
          >
            <Move className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Move</span>
          </Button>
        </Panel>
      )}

      {/* Alignment toolbar when 2+ nodes selected */}
      {selectedNodeIds.length >= 2 && (
        <Panel position="bottom-center">
          <AlignmentToolbar
            selectedNodeIds={selectedNodeIds}
            onNodesChange={onNodesChange}
          />
        </Panel>
      )}

      <Controls showInteractive={true} />
      {/* Hide MiniMap on mobile to save screen space */}
      {!isMobile && (
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'door':
                return '#94a3b8';
              case 'hallway':
                return '#cbd5e1';
              default:
                return '#e2e8f0';
            }
          }}
          maskColor="#ffffff50"
        />
      )}
      <Background gap={20} size={1} />
    </ReactFlow>
  );
}
