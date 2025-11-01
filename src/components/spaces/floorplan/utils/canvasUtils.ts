
import { Canvas, Line, Group, Text, Rect, Object as FabricObject } from "fabric";

export function createGrid(canvas: Canvas, gridSize: number) {
  const gridLines: Line[] = [];
  const width = canvas.getWidth();
  const height = canvas.getHeight();

  // Create vertical lines
  for (let i = 0; i <= width; i += gridSize) {
    gridLines.push(new Line([i, 0, i, height], {
      stroke: '#e5e7eb',
      selectable: false,
      evented: false
    }));
  }

  // Create horizontal lines
  for (let i = 0; i <= height; i += gridSize) {
    gridLines.push(new Line([0, i, width, i], {
      stroke: '#e5e7eb',
      selectable: false,
      evented: false
    }));
  }

  return gridLines;
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function createRoom(options: {
  width: number;
  height: number;
  label?: string;
  fill?: string;
}): Group {
  const { width, height, label, fill = '#e2e8f0' } = options;

  const rect = new Rect({
    width,
    height,
    fill,
    stroke: '#94a3b8',
    strokeWidth: 2
  });

  if (!label) {
    return new Group([rect], {
      selectable: true,
      hasControls: true
    });
  }

  const text = new Text(label, {
    fontSize: 14,
    fill: '#475569',
    originX: 'center',
    originY: 'center',
    top: height / 2,
    left: width / 2
  });

  return new Group([rect, text], {
    selectable: true,
    hasControls: true
  });
}

export function createDoor(options: {
  width?: number;
  height?: number;
  label?: string;
}): Group {
  const { width = 40, height = 10, label = 'Door' } = options;

  const door = new Rect({
    width,
    height,
    fill: '#94a3b8',
    stroke: '#475569',
    strokeWidth: 2
  });

  const text = new Text(label, {
    fontSize: 12,
    fill: '#475569',
    originX: 'center',
    originY: 'top',
    top: height + 4
  });

  return new Group([door, text], {
    selectable: true,
    hasControls: true
  });
}

export function createLayer(canvas: Canvas) {
  const layer = new Group([], {
    selectable: false,
    evented: false
  });
  canvas.add(layer);
  return layer;
}

export function updateObjectFromFloorPlan(
  obj: FabricObject,
  floorPlanObj: { position: { x: number; y: number }; rotation: number }
) {
  obj.set({
    left: floorPlanObj.position.x,
    top: floorPlanObj.position.y,
    angle: floorPlanObj.rotation
  });
  obj.setCoords();
}
