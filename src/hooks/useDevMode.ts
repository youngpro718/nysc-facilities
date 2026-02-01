import { useState, useEffect, useCallback } from 'react';
import type { UserRole } from '@/config/roles';

const DEV_MODE_KEY = 'dev_mode_enabled';
const DEV_MODE_POSITION_KEY = 'dev_mode_panel_position';

export interface DevModePosition {
  x: number;
  y: number;
}

export function useDevMode() {
  const [isDevModeOpen, setIsDevModeOpen] = useState(false);
  const [position, setPosition] = useState<DevModePosition>({ x: 20, y: 20 });
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Load saved position on mount
  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem(DEV_MODE_POSITION_KEY);
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
      }
      const savedState = localStorage.getItem(DEV_MODE_KEY);
      if (savedState === 'true') {
        setIsDevModeOpen(true);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Save position when it changes
  const updatePosition = useCallback((newPosition: DevModePosition) => {
    setPosition(newPosition);
    try {
      localStorage.setItem(DEV_MODE_POSITION_KEY, JSON.stringify(newPosition));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Toggle dev mode
  const toggleDevMode = useCallback(() => {
    setIsDevModeOpen(prev => {
      const newState = !prev;
      try {
        localStorage.setItem(DEV_MODE_KEY, String(newState));
      } catch (e) {
        // Ignore localStorage errors
      }
      return newState;
    });
  }, []);

  const closeDevMode = useCallback(() => {
    setIsDevModeOpen(false);
    try {
      localStorage.setItem(DEV_MODE_KEY, 'false');
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDevMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDevMode]);

  // Mobile: 5 taps in bottom-right corner within 3 seconds
  const handleMobileTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const target = 'touches' in e ? e.touches[0] : e;
    
    // Check if tap is in bottom-right quadrant
    const isBottomRight = 
      target.clientX > window.innerWidth * 0.75 && 
      target.clientY > window.innerHeight * 0.75;
    
    if (!isBottomRight) {
      setTapCount(0);
      return;
    }

    // Reset if more than 3 seconds since last tap
    if (now - lastTapTime > 3000) {
      setTapCount(1);
    } else {
      setTapCount(prev => prev + 1);
    }
    
    setLastTapTime(now);

    // Activate on 5 taps
    if (tapCount >= 4) {
      toggleDevMode();
      setTapCount(0);
    }
  }, [tapCount, lastTapTime, toggleDevMode]);

  // Preview role management
  const setPreviewRole = useCallback((role: UserRole | null) => {
    if (role) {
      localStorage.setItem('preview_role', role);
    } else {
      localStorage.removeItem('preview_role');
    }
    // Dispatch event for useRolePermissions to pick up
    window.dispatchEvent(new CustomEvent('preview_role_changed'));
  }, []);

  const getPreviewRole = useCallback((): UserRole | null => {
    try {
      return localStorage.getItem('preview_role') as UserRole | null;
    } catch {
      return null;
    }
  }, []);

  const clearPreviewRole = useCallback(() => {
    localStorage.removeItem('preview_role');
    window.dispatchEvent(new CustomEvent('preview_role_changed'));
  }, []);

  return {
    isDevModeOpen,
    position,
    updatePosition,
    toggleDevMode,
    closeDevMode,
    handleMobileTap,
    setPreviewRole,
    getPreviewRole,
    clearPreviewRole,
  };
}
