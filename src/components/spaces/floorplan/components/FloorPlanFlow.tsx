
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
  const defaultViewport = { x: 0, y: 0, zoom: 1 };

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
        padding: 0.3,
        duration: 800,
        includeHiddenNodes: false,
        minZoom: 0.1,
        maxZoom: 2
      }}
      snapGrid={[10, 10]}
      snapToGrid
      selectNodesOnDrag={false}
      panOnDrag={[1, 2]}
      zoomOnScroll={true}
      zoomOnPinch={true}
      preventScrolling={true}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={true}
      onNodeDragStop={(event, node) => {
        // This ensures the final position is saved after dragging stops
        onNodesChange([{
          id: node.id,
          type: 'position',
          position: node.position
        }]);
      }}
    >
      <Panel position="top-left">
        <div style={panelStyle} className="text-gray-700">
          Rooms: {nodes.length}
        </div>
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
