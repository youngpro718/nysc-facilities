
import { useState } from "react";
import { IssueListContent } from "./components/IssueListContent";
import { IssueDialogManager } from "./components/IssueDialogManager";
import { useDialogManager } from "@/hooks/useDialogManager";
import { IssueFiltersType } from "./types/FilterTypes";
import { IssueStats } from "./components/IssueStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => handleTabChange(value as 'active' | 'historical')}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="active">Active Issues</TabsTrigger>
          <TabsTrigger value="historical">Historical Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <IssueListContent
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={filters}
            setFilters={setFilters}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            openDialog={openDialog}
          />
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <IssueListContent
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={filters}
            setFilters={setFilters}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            openDialog={openDialog}
          />
        </TabsContent>
      </Tabs>

      <IssueDialogManager 
        dialogState={dialogState}
        onClose={closeDialog}
      />
    </>
  );
};
