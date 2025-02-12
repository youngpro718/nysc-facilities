
import { useState, useCallback } from 'react';
import { DrawingState, DrawingMode, Position, Size, GRID_SIZE, MIN_ROOM_SIZE } from '../types/floorPlanTypes';

const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

const snapPositionToGrid = (position: Position): Position => {
  return {
    x: snapToGrid(position.x),
    y: snapToGrid(position.y)
  };
};

const validateSize = (size: Size): boolean => {
  return size.width >= MIN_ROOM_SIZE.width && size.height >= MIN_ROOM_SIZE.height;
};

export function useDrawingState(initialMode: DrawingMode = 'view') {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    mode: initialMode,
    operation: 'none',
    startPosition: null,
    currentPosition: null,
    snapPoints: [],
    isValid: false,
    previewDimensions: null
  });

  const startDrawing = useCallback((position: Position) => {
    const snappedPosition = snapPositionToGrid(position);
    setDrawingState(prev => ({
      ...prev,
      operation: 'start',
      startPosition: snappedPosition,
      currentPosition: snappedPosition,
      isValid: true,
      previewDimensions: { width: 0, height: 0 }
    }));
  }, []);

  const updateDrawing = useCallback((position: Position) => {
    if (!drawingState.startPosition) return;

    const snappedPosition = snapPositionToGrid(position);
    const width = Math.abs(snappedPosition.x - drawingState.startPosition.x);
    const height = Math.abs(snappedPosition.y - drawingState.startPosition.y);
    
    const newSize = { width, height };
    const isValid = validateSize(newSize);

    setDrawingState(prev => ({
      ...prev,
      operation: 'drawing',
      currentPosition: snappedPosition,
      previewDimensions: newSize,
      isValid
    }));
  }, [drawingState.startPosition]);

  const completeDrawing = useCallback(() => {
    if (!drawingState.isValid) return null;

    const result = {
      startPosition: drawingState.startPosition,
      endPosition: drawingState.currentPosition,
      dimensions: drawingState.previewDimensions
    };

    setDrawingState(prev => ({
      ...prev,
      operation: 'none',
      startPosition: null,
      currentPosition: null,
      previewDimensions: null,
      isValid: false
    }));

    return result;
  }, [drawingState]);

  const cancelDrawing = useCallback(() => {
    setDrawingState(prev => ({
      ...prev,
      operation: 'none',
      startPosition: null,
      currentPosition: null,
      previewDimensions: null,
      isValid: false
    }));
  }, []);

  const setMode = useCallback((mode: DrawingMode) => {
    setDrawingState(prev => ({
      ...prev,
      mode,
      operation: 'none',
      startPosition: null,
      currentPosition: null,
      previewDimensions: null,
      isValid: false
    }));
  }, []);

  return {
    drawingState,
    startDrawing,
    updateDrawing,
    completeDrawing,
    cancelDrawing,
    setMode
  };
}
