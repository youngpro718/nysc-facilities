
import { createStore } from "zustand/vanilla";
import { FloorPlanState } from "../types/floorPlanTypes";

// Initial state
const initialState: FloorPlanState = {
  nodes: [],
  edges: [],
  layers: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedLayerId: null,
  zoomLevel: 1,
  panPosition: { x: 0, y: 0 }
};

// Create the store
export const floorPlanState = createStore<FloorPlanState>()(() => initialState);

// Action creators
export const actions = {
  setNodes: (nodes: any[]) => {
    floorPlanState.setState({ nodes });
  },
  setEdges: (edges: any[]) => {
    floorPlanState.setState({ edges });
  },
  setSelectedNodeId: (id: string | null) => {
    floorPlanState.setState({ selectedNodeId: id });
  },
  updateNode: (id: string, data: any) => {
    floorPlanState.setState(state => ({
      nodes: state.nodes.map(node => 
        node.id === id ? { ...node, ...data } : node
      )
    }));
  }
};
