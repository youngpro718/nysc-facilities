
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
  backgroundColor = 'rgba(255, 255, 255, 0.85)',
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
        className="px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap select-none"
        style={{ 
          color, 
          backgroundColor,
          border: '1px solid rgba(209, 213, 219, 0.5)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transform: 'translateY(-100%)',
          marginBottom: '5px',
          pointerEvents: 'none'
        }}
      >
        <span className="text-xs opacity-70">{type}:</span> {label}
      </div>
    </Html>
  );
}
