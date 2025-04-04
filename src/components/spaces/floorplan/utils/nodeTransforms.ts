
import { Position } from "reactflow";
import { FloorPlanObjectType, RawFloorPlanObject } from "../types/floorPlanTypes";

const ROOM_COLORS = {
  default: '#e2e8f0',
  active: '#bfdbfe',
  inactive: '#f1f5f9',
  under_maintenance: '#fde68a',
  selected: '#93c5fd',
};

export function transformSpaceToNode(obj: RawFloorPlanObject, index: number) {
  // Set default style based on object type
  const defaultStyle = {
    backgroundColor: ROOM_COLORS.default,
    border: '1px solid #cbd5e1'
  };

  // Customize style based on object status if available
  const status = obj.status || 'active';
  const backgroundColor = ROOM_COLORS[status as keyof typeof ROOM_COLORS] || ROOM_COLORS.default;
  
  // Apply custom styling from object if available
  const style = {
    ...defaultStyle,
    backgroundColor,
    ...(obj.style || {})
  };

  return {
    id: obj.id,
    type: obj.type,
    position: obj.position,
    data: {
      label: obj.name || obj.label || `${obj.type} ${index + 1}`,
      type: obj.type,
      size: obj.size,
      style,
      properties: obj.properties || {},
      rotation: obj.rotation
    },
    // Apply rotation if available, used for node positioning
    rotation: obj.rotation || 0,
    // Use z-index for layering, doors on top
    zIndex: obj.type === 'door' ? 5 : (obj.z_index || 0)
  };
}

// Function to get connection handles for different node types
export function getNodeHandles(nodeType: string) {
  switch (nodeType) {
    case 'door':
      return {
        source: [Position.Right, Position.Left],
        target: [Position.Left, Position.Right]
      };
    case 'hallway':
      return {
        source: [Position.Top, Position.Right, Position.Bottom, Position.Left],
        target: [Position.Top, Position.Right, Position.Bottom, Position.Left]
      };
    case 'room':
    default:
      return {
        source: [Position.Top, Position.Right, Position.Bottom, Position.Left],
        target: [Position.Top, Position.Right, Position.Bottom, Position.Left]
      };
  }
}
