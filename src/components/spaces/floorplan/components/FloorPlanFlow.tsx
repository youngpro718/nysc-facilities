
import { ReactFlow, Background, Controls, MiniMap, Panel, Node, Connection, Edge } from 'reactflow';
import { panelStyle } from '../styles/flowStyles';
import { useState, useCallback } from 'react';
import { Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [isPanning, setIsPanning] = useState(false);
  const defaultViewport = { x: 0, y: 0, zoom };

  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // Don't allow connections between the same node
    if (connection.source === connection.target) return false;

    // Don't allow doors to connect to doors
    if (sourceNode.type === 'door' && targetNode.type === 'door') return false;

    // Don't allow more than one connection between the same nodes
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
      minZoom={0.1}
      maxZoom={4}
      fitView
      fitViewOptions={{ 
        padding: 0.3,
        duration: 800,
        includeHiddenNodes: false,
        minZoom: 0.1,
        maxZoom: 2
      }}
      snapGrid={[10, 10]}
      snapToGrid
      selectNodesOnDrag={false}
      panOnDrag={isPanning ? [0, 1, 2] : [1, 2]}
      zoomOnScroll={!isPanning}
      zoomOnPinch={true}
      preventScrolling={true}
      nodesDraggable={!isPanning}
      nodesConnectable={!isPanning}
      elementsSelectable={!isPanning}
      style={{ width: '100%', height: '100%' }}
      onNodeDragStop={(event, node) => {
        // This ensures the final position is saved after dragging stops
        onNodesChange([{
          id: node.id,
          type: 'position',
          position: node.position
        }]);
      }}
    >
      <Panel position="top-left" className="space-y-2">
        <div style={panelStyle} className="text-gray-700">
          Objects: {nodes.length}
        </div>
        <Button
          variant={isPanning ? "secondary" : "outline"}
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setIsPanning(!isPanning)}
        >
          <Move className="h-4 w-4" />
          <span>Move</span>
        </Button>
      </Panel>
      <Controls showInteractive={true} />
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
      <Background gap={20} size={1} />
    </ReactFlow>
  );
}
