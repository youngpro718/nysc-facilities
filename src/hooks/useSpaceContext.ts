import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface SpaceContext {
  buildingId: string | null;
  floorId: string | null;
  buildingName: string | null;
  floorName: string | null;
}

const STORAGE_KEY = 'lastUsedSpaceContext';

/**
 * Hook to detect and manage current space context (building/floor)
 * Priority: URL params > localStorage > null
 */
export function useSpaceContext(): SpaceContext {
  const [searchParams] = useSearchParams();
  const [context, setContext] = useState<SpaceContext>({
    buildingId: null,
    floorId: null,
    buildingName: null,
    floorName: null
  });

  useEffect(() => {
    // Try to get from URL params first
    const urlBuildingId = searchParams.get('building');
    const urlFloorId = searchParams.get('floor');

    if (urlBuildingId || urlFloorId) {
      setContext({
        buildingId: urlBuildingId,
        floorId: urlFloorId,
        buildingName: null,
        floorName: null
      });
      return;
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setContext(parsed);
      }
    } catch (error) {
      console.error('Error reading space context from storage:', error);
    }
  }, [searchParams]);

  return context;
}

/**
 * Save the current space context to localStorage
 */
export function saveSpaceContext(context: SpaceContext) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch (error) {
    console.error('Error saving space context:', error);
  }
}
