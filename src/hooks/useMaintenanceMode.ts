import { useState, useEffect, useCallback } from 'react';

interface MaintenanceSettings {
  enabled: boolean;
  enabledAt?: string;
  enabledBy?: string;
  reason?: string;
}

const MAINTENANCE_KEY = 'nysc_maintenance_mode';
const MAINTENANCE_USER_KEY = 'nysc_maintenance_user';

export function useMaintenanceMode() {
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceSettings>({
    enabled: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load maintenance mode state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MAINTENANCE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMaintenanceMode(parsed);
      }
    } catch (error) {
      console.error('Error loading maintenance mode:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save maintenance mode state to localStorage
  const saveMaintenanceMode = useCallback((settings: MaintenanceSettings) => {
    try {
      localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(settings));
      setMaintenanceMode(settings);
    } catch (error) {
      console.error('Error saving maintenance mode:', error);
    }
  }, []);

  // Enable maintenance mode
  const enableMaintenanceMode = useCallback((reason?: string) => {
    const settings: MaintenanceSettings = {
      enabled: true,
      enabledAt: new Date().toISOString(),
      enabledBy: 'admin',
      reason: reason || 'System maintenance'
    };
    saveMaintenanceMode(settings);
    
    // Clear any existing auth state
    localStorage.removeItem('supabase.auth.token');
    
    // Set maintenance user
    const maintenanceUser = {
      id: 'maintenance-admin',
      email: 'maintenance@nysc.gov',
      role: 'admin',
      access_level: 'full',
      departments: ['all'],
      isMaintenanceMode: true,
      created_at: new Date().toISOString()
    };
    localStorage.setItem(MAINTENANCE_USER_KEY, JSON.stringify(maintenanceUser));
    
    console.log('🔧 Maintenance mode enabled');
  }, [saveMaintenanceMode]);

  // Disable maintenance mode
  const disableMaintenanceMode = useCallback(() => {
    const settings: MaintenanceSettings = {
      enabled: false
    };
    saveMaintenanceMode(settings);
    
    // Clear maintenance user
    localStorage.removeItem(MAINTENANCE_USER_KEY);
    
    console.log('✅ Maintenance mode disabled');
  }, [saveMaintenanceMode]);

  // Get maintenance user
  const getMaintenanceUser = useCallback(() => {
    try {
      const stored = localStorage.getItem(MAINTENANCE_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting maintenance user:', error);
      return null;
    }
  }, []);

  // Check if currently in maintenance mode
  const isMaintenanceMode = maintenanceMode.enabled;

  // Get maintenance info
  const getMaintenanceInfo = useCallback(() => {
    return {
      ...maintenanceMode,
      user: getMaintenanceUser()
    };
  }, [maintenanceMode, getMaintenanceUser]);

  return {
    isMaintenanceMode,
    maintenanceSettings: maintenanceMode,
    isLoading,
    enableMaintenanceMode,
    disableMaintenanceMode,
    getMaintenanceUser,
    getMaintenanceInfo
  };
}
