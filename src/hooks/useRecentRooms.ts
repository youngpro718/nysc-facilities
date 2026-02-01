/**
 * useRecentRooms Hook
 * Tracks last 8 rooms used for issue reporting in localStorage
 */

import { useState, useCallback, useEffect } from 'react';

export interface RecentRoom {
  id: string;
  roomNumber: string;
  roomName: string | null;
  buildingId: string | null;
  floorId: string | null;
  lastUsed: number;
}

const STORAGE_KEY = 'recent-issue-rooms';
const MAX_RECENT_ROOMS = 8;

function loadRecentRooms(): RecentRoom[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentRooms(rooms: RecentRoom[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    // Ignore storage errors
  }
}

export function useRecentRooms() {
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>(loadRecentRooms);

  // Sync with storage on mount
  useEffect(() => {
    setRecentRooms(loadRecentRooms());
  }, []);

  const addRecentRoom = useCallback((room: Omit<RecentRoom, 'lastUsed'>) => {
    setRecentRooms((prev) => {
      // Remove if already exists
      const filtered = prev.filter((r) => r.id !== room.id);
      
      // Add to front with timestamp
      const updated = [
        { ...room, lastUsed: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_ROOMS);
      
      saveRecentRooms(updated);
      return updated;
    });
  }, []);

  const clearRecentRooms = useCallback(() => {
    setRecentRooms([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    recentRooms,
    addRecentRoom,
    clearRecentRooms,
  };
}
