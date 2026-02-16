// @ts-nocheck
import React, { useMemo } from 'react';
import { logger } from '@/lib/logger';
import * as THREE from 'three';

interface SimpleConnectionProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type?: 'direct' | 'hallway' | 'emergency';
  isHighlighted?: boolean;
}

export function SimpleConnection({ 
  from, 
  to, 
  type = 'direct', 
  isHighlighted = false 
}: SimpleConnectionProps) {
  // Prepare safe coordinates and validation flags (checked after hooks)
  const hasEndpoints = !!from && !!to;
  const fromX = hasEndpoints ? (from as Record<string, unknown>)?.x : NaN;
  const fromY = hasEndpoints ? (from as Record<string, unknown>)?.y : NaN;
  const toX = hasEndpoints ? (to as Record<string, unknown>)?.x : NaN;
  const toY = hasEndpoints ? (to as Record<string, unknown>)?.y : NaN;
  const coordsValid =
    typeof fromX === 'number' && typeof fromY === 'number' &&
    typeof toX === 'number' && typeof toY === 'number' &&
    !Number.isNaN(fromX) && !Number.isNaN(fromY) &&
    !Number.isNaN(toX) && !Number.isNaN(toY);

  const getConnectionColor = () => {
    switch (type) {
      case 'emergency':
        return '#ef4444';
      case 'hallway':
        return '#10b981';
      default:
        return isHighlighted ? '#3b82f6' : '#64748b';
    }
  };

  // Memoize the line creation to prevent recreation on every render
  const line = useMemo(() => {
    try {
      // Create Vector3 objects separately to avoid inline creation
      const startPoint = new THREE.Vector3();
      startPoint.set(fromX as number, 25, fromY as number);
      const endPoint = new THREE.Vector3();
      endPoint.set(toX as number, 25, toY as number);
      const points = [startPoint, endPoint];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: getConnectionColor(),
        linewidth: isHighlighted ? 3 : 2,
        transparent: true,
        opacity: 0.8
      });
      
      return new THREE.Line(geometry, material);
    } catch (error) {
      logger.error('SimpleConnection: Error creating line object', error, { from, to, type, isHighlighted });
      return null;
    }
  }, [fromX, fromY, toX, toY, type, isHighlighted]);

  // Post-hook validation
  if (!coordsValid) {
    logger.warn('SimpleConnection: Invalid from/to coordinates', { from, to });
    return null;
  }
  if (!line) {
    return null;
  }

  return (
    <primitive object={line} />
  );
}