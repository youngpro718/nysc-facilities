
import { ReactFlow, Background, Controls, MiniMap, Panel, Node } from 'reactflow';
import { panelStyle } from '../styles/flowStyles';

interface FloorPlanFlowProps {
  nodes: Node[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  onNodeClick: any;
  nodeTypes: any;
}

export function FloorPlanFlow({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  nodeTypes,
}: FloorPlanFlowProps) {
  const defaultViewport = { x: 50, y: 50, zoom: 0.8 };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      defaultViewport={defaultViewport}
      minZoom={0.1}
      maxZoom={4}
      fitView
      fitViewOptions={{ 
        padding: 0.2,
        duration: 800,
        includeHiddenNodes: true
      }}
      snapGrid={[20, 20]}
      snapToGrid
    >
      <Panel position="top-left">
        <div style={panelStyle} className="text-gray-700">
          Rooms: {nodes.length}
        </div>
      </Panel>
      <Controls />
      <MiniMap />
      <Background gap={20} size={1} />
    </ReactFlow>
  );
}
