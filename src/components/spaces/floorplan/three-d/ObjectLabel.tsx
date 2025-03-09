
import React from 'react';
import { Html } from '@react-three/drei';

interface ObjectLabelProps {
  position: [number, number, number]; 
  label: string; 
  color?: string;
  backgroundColor?: string;
  type: string;
  onHover?: (isHovered: boolean) => void;
}

export function ObjectLabel({ 
  position, 
  label, 
  color = '#1f2937', 
  backgroundColor = 'rgba(255, 255, 255, 0.95)', // More opaque for better visibility
  type,
  onHover 
}: ObjectLabelProps) {
  return (
    <Html
      position={position}
      center
      occlude
      distanceFactor={15}
      onPointerOver={() => onHover && onHover(true)}
      onPointerOut={() => onHover && onHover(false)}
    >
      <div 
        className="px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap select-none"
        style={{ 
          color, 
          backgroundColor,
          border: '1px solid rgba(209, 213, 219, 0.8)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-100%)',
          marginBottom: '5px',
          pointerEvents: 'none'
        }}
      >
        <span className="text-xs opacity-80 font-bold">{type}:</span> {label}
      </div>
    </Html>
  );
}
