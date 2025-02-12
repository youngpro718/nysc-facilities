
import { DrawingState, Position, Size } from "../types/floorPlanTypes";

interface DrawingPreviewProps {
  drawingState: DrawingState;
}

export function DrawingPreview({ drawingState }: DrawingPreviewProps) {
  if (drawingState.operation === 'none' || !drawingState.startPosition || !drawingState.currentPosition) {
    return null;
  }

  // Calculate preview dimensions
  const width = Math.abs(drawingState.currentPosition.x - drawingState.startPosition.x);
  const height = Math.abs(drawingState.currentPosition.y - drawingState.startPosition.y);

  // Calculate top-left position
  const left = Math.min(drawingState.startPosition.x, drawingState.currentPosition.x);
  const top = Math.min(drawingState.startPosition.y, drawingState.currentPosition.y);

  const previewStyle = {
    position: 'absolute' as const,
    left,
    top,
    width,
    height,
    border: `2px solid ${drawingState.isValid ? '#22c55e' : '#ef4444'}`,
    backgroundColor: drawingState.isValid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    pointerEvents: 'none' as const,
    zIndex: 1000,
  };

  // Size label
  const sizeLabel = `${Math.round(width)}x${Math.round(height)}`;
  const labelStyle = {
    position: 'absolute' as const,
    top: -25,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    color: drawingState.isValid ? '#22c55e' : '#ef4444',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  };

  return (
    <div style={previewStyle}>
      <div style={labelStyle}>{sizeLabel}</div>
    </div>
  );
}
