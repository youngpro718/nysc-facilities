
import { useState } from "react";
import { useDialogManager } from "@/hooks/useDialogManager";
import { IssueFiltersType } from "./types/FilterTypes";
import { IssueStats } from "./components/IssueStats";
import { IssueDialogManager } from "./components/IssueDialogManager";
import { IssueTabs } from "./tabs/IssueTabs";

export const IssuesList = () => {
  const { dialogState, openDialog, closeDialog } = useDialogManager();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeTab, setActiveTab] = useState<'active' | 'historical'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<IssueFiltersType>({
    type: 'all_types',
    status: activeTab === 'active' ? 'all_statuses' : 'resolved',
    priority: 'all_priorities',
    assigned_to: 'all_assignments',
    lightingType: 'all_lighting_types',
    fixtureStatus: 'all_fixture_statuses',
    electricalIssue: 'all_electrical_issues'
  });

  const handleTabChange = (tab: 'active' | 'historical') => {
    setActiveTab(tab);
    setFilters(prev => ({
      ...prev,
      status: tab === 'historical' ? 'resolved' : 'all_statuses'
    }));
  };

  return (
    <>
      <IssueStats />
      
      <IssueTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        setFilters={setFilters}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        openDialog={openDialog}
      />

      <IssueDialogManager 
        dialogState={dialogState}
        onClose={closeDialog}
      />
    </>
  );
};
