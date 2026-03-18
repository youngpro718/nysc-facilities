import { useState, useCallback } from 'react';
import { LightingTab, LightingPageState, QuickFilterState } from '../types';

const defaultState: LightingPageState = {
  activeTab: 'overview',
  quickFilters: {}
};

export const useLightingTabs = () => {
  const [state, setState] = useState<LightingPageState>(defaultState);

  const setActiveTab = useCallback((tab: LightingTab) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const setSelectedBuilding = useCallback((building?: string) => {
    setState(prev => ({ ...prev, selectedBuilding: building }));
  }, []);

  const setSelectedFloor = useCallback((floor?: string) => {
    setState(prev => ({ ...prev, selectedFloor: floor }));
  }, []);

  const setQuickFilters = useCallback((filters: QuickFilterState) => {
    setState(prev => ({ ...prev, quickFilters: filters }));
  }, []);

  const toggleQuickFilter = useCallback((filterKey: keyof QuickFilterState) => {
    setState(prev => ({
      ...prev,
      quickFilters: {
        ...prev.quickFilters,
        [filterKey]: !prev.quickFilters[filterKey]
      }
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(prev => ({ ...prev, quickFilters: {} }));
  }, []);

  return {
    state,
    setActiveTab,
    setSelectedBuilding,
    setSelectedFloor,
    setQuickFilters,
    toggleQuickFilter,
    resetFilters
  };
};