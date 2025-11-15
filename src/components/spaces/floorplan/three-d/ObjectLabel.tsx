
import React from 'react';
import { Html } from '@react-three/drei';
import { Building2Icon, HomeIcon, GitForkIcon, DoorClosedIcon, LinkIcon } from 'lucide-react';

interface ObjectLabelProps {
  position: [number, number, number]; 
  label: string; 
  color?: string;
  backgroundColor?: string;
  type: string;
  onHover?: (isHovered: boolean) => void;
  icon?: React.ReactNode;
}

export function ObjectLabel({ 
  position, 
  label, 
  color = '#1f2937', 
  backgroundColor = 'rgba(255, 255, 255, 0.95)', 
  type,
  onHover,
  icon
}: ObjectLabelProps) {
  // Determine icon based on type if not provided
  const getTypeIcon = () => {
    if (icon) return icon;
    
    switch(type.toLowerCase()) {
      case 'room':
        return <HomeIcon className="h-3 w-3" />;
      case 'hallway':
      case 'emergency hallway':
        return <GitForkIcon className="h-3 w-3" />;
      case 'door':
        return <DoorClosedIcon className="h-3 w-3" />;
      case 'building':
        return <Building2Icon className="h-3 w-3" />;
      case 'connection':
        return <LinkIcon className="h-3 w-3" />;
      default:
        return null;
    }
  };
  
  // Convert simple type to display name
  const getTypeDisplay = () => {
    if (type.toLowerCase() === 'emergency hallway') return 'Emergency';
    return type;
  };
  
  return (
    <Html
      position={position}
      center
      occlude
      distanceFactor={15}
      onPointerOver={() => onHover && onHover(true)}
      onPointerOut={() => onHover && onHover(false)}
      zIndexRange={[100, 500]} // Ensure labels are above other elements
    >
      <div 
        className="px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap select-none transition-all"
        style={{ 
          color, 
          backgroundColor,
          border: '1px solid rgba(209, 213, 219, 0.8)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-100%)',
          marginBottom: '8px',
          pointerEvents: 'none',
          maxWidth: '240px',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        <div className="flex items-center gap-1.5">
          {getTypeIcon() && <span className="text-xs opacity-90">{getTypeIcon()}</span>}
          <span className="text-xs opacity-80 font-bold">{getTypeDisplay()}:</span> 
          <span className="truncate">{label}</span>
        </div>
      </div>
    </Html>
  );
}
