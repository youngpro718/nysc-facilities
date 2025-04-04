
import { Object3DEventMap } from 'three';

declare module 'three' {
  interface Object3DEventMap {
    click: { type: 'click' };
  }
}

// Add any other type declarations needed
