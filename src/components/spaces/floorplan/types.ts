/* eslint-disable @typescript-eslint/no-namespace */
import { Canvas } from 'fabric';

declare global {
  namespace fabric {
    interface IPoint {
      x: number;
      y: number;
    }
    
    interface Pattern {
      repeat: string;
    }

    interface Gradient {
      type: string;
    }

    // Base object options
    interface IObjectOptions {
      left?: number;
      top?: number;
      width?: number;
      height?: number;
      fill?: string | Pattern | Gradient;
      stroke?: string;
      strokeWidth?: number;
      selectable?: boolean;
      hasControls?: boolean;
      originX?: string;
      originY?: string;
      fontSize?: number;
      cornerStyle?: "rect" | "circle";
      evented?: boolean;
      data?: any;
    }

    // Object properties including inherited ones
    interface FabricObjectProps extends IObjectOptions {
      type?: string;
      lockMovementX?: boolean;
      lockMovementY?: boolean;
      lockRotation?: boolean;
      lockScalingX?: boolean;
      lockScalingY?: boolean;
      lockSkewingX?: boolean;
      lockSkewingY?: boolean;
      evented?: boolean;
      visible?: boolean;
      hasControls?: boolean;
      hasBorders?: boolean;
      hasRotatingPoint?: boolean;
      transparentCorners?: boolean;
      cornerSize?: number;
      touchCornerSize?: number;
      cornerColor?: string;
    }

    interface SerializedObjectProps extends IObjectOptions {
      type?: string;
    }

    interface ObjectEvents {
      added?: () => void;
      removed?: () => void;
      selected?: () => void;
      deselected?: () => void;
      modified?: () => void;
      rotated?: () => void;
      scaled?: () => void;
      moved?: () => void;
      mousedown?: (event?: unknown) => void;
      mouseup?: (event?: unknown) => void;
      mouseover?: (event?: unknown) => void;
      mouseout?: (event?: unknown) => void;
    }

    interface Object extends FabricObjectProps {
      canvas?: Canvas;
    }

    interface Line extends Object {}
    interface Rect extends Object {}
    interface Text extends Object {}
    interface Group extends Object {
      addWithUpdate(object: Object): Group;
      removeWithUpdate(object: Object): Group;
    }
  }
}

export type { Canvas };
