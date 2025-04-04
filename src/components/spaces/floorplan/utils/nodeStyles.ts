
import { NodeResizeControl } from "reactflow";
import { FloorPlanObjectData, FloorPlanObjectType } from "../types/floorPlanTypes";

export function getNodeBaseStyle(type: string, data: FloorPlanObjectData, isSelected: boolean): React.CSSProperties {
  const baseStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    transition: 'all 0.3s ease',
    transform: data.rotation ? `rotate(${data.rotation}deg)` : 'none',
    ...data.style
  };

  if (isSelected) {
    return {
      ...baseStyle,
      boxShadow: '0 0 0 2px #3b82f6',
      zIndex: 10,
    };
  }

  return baseStyle;
}

export function getResizerConfig(nodeType: string) {
  return {
    minWidth: nodeType === 'door' ? 30 : 80,
    minHeight: nodeType === 'door' ? 15 : 60,
    keepAspectRatio: false,
    handleStyle: { 
      width: '10px', 
      height: '10px',
      backgroundColor: '#3b82f6', 
      border: '1px solid white' 
    },
    handleComponent: NodeResizeControl,
  };
}
