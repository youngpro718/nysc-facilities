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
