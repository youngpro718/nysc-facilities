import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Connection,
  Edge,
  NodeChange,
  EdgeChange,
  Node,
  NodeTypes,
  EdgeTypes,
  NodeDragHandler,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  MiniMap,
  Panel,
  Viewport
} from 'reactflow';
import 'reactflow/dist/style.css';
import { panelStyle } from '../styles/flowStyles';
import { RoomNode } from './nodes/RoomNode';
import { HallwayNode } from './nodes/HallwayNode';

const nodeTypes: NodeTypes = {
  room: RoomNode,
  hallway: HallwayNode
};

interface FloorPlanFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeDragStop: NodeDragHandler;
  onNodeClick: any;
  nodeTypes?: NodeTypes;
  defaultZoom?: number;
  defaultViewport?: Viewport;
  panOnDrag?: boolean;
  zoomOnScroll?: boolean;
  zoomOnPinch?: boolean;
  snapToGrid?: boolean;
  snapGrid?: [number, number];
}

export function FloorPlanFlow({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStop,
  onNodeClick,
  nodeTypes: customNodeTypes = nodeTypes,
  defaultZoom = 1,
  defaultViewport,
  panOnDrag = true,
  zoomOnScroll = true,
  zoomOnPinch = true,
  snapToGrid = true,
  snapGrid = [15, 15]
}: FloorPlanFlowProps) {
  const initialViewport = defaultViewport || { x: 0, y: 0, zoom: defaultZoom };

  return (
    <div style={{ width: '100%', height: '100%', background: '#1a1a1a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        nodeTypes={customNodeTypes}
        defaultViewport={initialViewport}
        fitView
        minZoom={0.1}
        maxZoom={4}
        attributionPosition="bottom-left"
        panOnDrag={panOnDrag}
        zoomOnScroll={zoomOnScroll}
        zoomOnPinch={zoomOnPinch}
        snapToGrid={snapToGrid}
        snapGrid={snapGrid}
      >
        <Background gap={15} color="#333" variant="lines" />
        <Controls className="bg-gray-800 border-gray-700" />
        <MiniMap className="bg-gray-800" />
        <Panel position="top-right" style={panelStyle}>
          <div className="text-sm text-gray-400">
            Zoom: {Math.round(defaultZoom * 100)}%
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
