
import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <text
          x={labelX}
          y={labelY}
          className="react-flow__edge-text"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {data.label}
        </text>
      )}
    </>
  );
}
