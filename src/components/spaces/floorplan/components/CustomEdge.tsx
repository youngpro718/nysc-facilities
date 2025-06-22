import React, { useState } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { X } from 'lucide-react';

/**
 * CustomEdge renders a directional edge with an inline delete/edit menu.
 * It shows an arrow and, on click, displays a small popover for actions.
 */
export function CustomEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data, selected }: EdgeProps) {
  const [showMenu, setShowMenu] = useState(false);
  const edgePath = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  // Center for label/menu
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        onClick={e => {
          e.stopPropagation();
          setShowMenu(v => !v);
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 10,
            background: selected ? '#f1f5f9' : 'white',
            border: selected ? '1px solid #3b82f6' : '1px solid #d1d5db',
            borderRadius: 6,
            padding: '2px 6px',
            minWidth: 24,
            minHeight: 24,
            display: showMenu ? 'flex' : 'none',
            alignItems: 'center',
            gap: 4,
            boxShadow: selected ? '0 2px 8px #3b82f633' : '0 1px 2px #0001',
            cursor: 'pointer',
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              color: '#dc2626',
            }}
            title="Delete connection"
            onClick={() => {
              if (data && typeof data.onDelete === 'function') {
                data.onDelete(id);
              }
              setShowMenu(false);
            }}
          >
            <X size={16} />
          </button>
          {/* Add more actions here if needed */}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default CustomEdge;
