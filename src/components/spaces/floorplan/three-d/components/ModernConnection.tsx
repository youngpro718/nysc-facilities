import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

interface ModernConnectionProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type?: 'door' | 'hallway' | 'room';
  isSelected?: boolean;
  isHovered?: boolean;
}

export function ModernConnection({ 
  from, 
  to, 
  type = 'door', 
  isSelected = false, 
  isHovered = false 
}: ModernConnectionProps) {
  // Reusable Line2 factory to avoid duplication
  const buildLine = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    linewidth: number,
    opacity: number
  ): { line: Line2; geom: LineGeometry; mat: LineMaterial } => {
    const geom = new LineGeometry();
    geom.setPositions([fromX, 0, fromY, toX, 0, toY]);
    const colorValue = new THREE.Color(color).getHex();
    const mat = new LineMaterial({
      color: colorValue,
      transparent: true,
      opacity,
      linewidth,
      worldUnits: false,
    });
    mat.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    const line = new Line2(geom, mat);
    return { line, geom, mat };
  };

  // Memoize the main connection line
  const { line: mainLine, geom: mainGeom, mat: mainMat } = useMemo(() => {
    const color = isSelected ? '#0ea5e9' : (isHovered ? '#fbbf24' : '#64748b');
    const opacity = isSelected ? 1 : (isHovered ? 0.8 : 0.6);
    const width = isSelected ? 3 : 2;
    return buildLine(from.x, from.y, to.x, to.y, color, width, opacity);
  }, [from.x, from.y, to.x, to.y, isSelected, isHovered]);

  // Keep material resolution in sync and dispose resources on change/unmount
  useEffect(() => {
    const handleResize = () => {
      if (mainMat) {
        mainMat.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      // Dispose of previous resources
      try { mainGeom?.dispose(); } catch {}
      try { mainMat?.dispose(); } catch {}
    };
  }, [mainGeom, mainMat]);

  // Memoize the selection highlight line
  const highlight = useMemo(() => {
    if (!isSelected) return { line: null as unknown as Line2 | null, geom: null as LineGeometry | null, mat: null as LineMaterial | null };
    return buildLine(from.x, from.y, to.x, to.y, '#0ea5e9', 4, 0.3);
  }, [from.x, from.y, to.x, to.y, isSelected]);

  useEffect(() => {
    const handleResize = () => {
      if (highlight.mat) {
        highlight.mat.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      try { highlight.geom?.dispose(); } catch {}
      try { highlight.mat?.dispose(); } catch {}
    };
  }, [highlight.geom, highlight.mat]);

  return (
    <group>
      <primitive object={mainLine} />
      {highlight.line && (
        <primitive object={highlight.line} />
      )}
    </group>
  );
}
