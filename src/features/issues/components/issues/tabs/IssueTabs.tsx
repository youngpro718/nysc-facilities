
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueFiltersType } from "../types/FilterTypes";
import { IssueTabContent } from "./IssueTabContent";

interface IssueTabsProps {
  activeTab: 'active' | 'historical';
  onTabChange: (tab: 'active' | 'historical') => void;
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  filters: IssueFiltersType;
  setFilters: (filters: IssueFiltersType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  openDialog: (type: 'issueDetails' | 'resolution', data?: unknown) => void;
}

export const IssueTabs = ({
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  openDialog,
}: IssueTabsProps) => {
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(value) => onTabChange(value as 'active' | 'historical')}
      className="w-full"
    >
      <TabsList>
        <TabsTrigger value="active">Active Issues</TabsTrigger>
        <TabsTrigger value="historical">Historical Issues</TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4">
        <IssueTabContent
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          filters={filters}
          setFilters={setFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab="active"
          openDialog={openDialog}
        />
      </TabsContent>

      <TabsContent value="historical" className="space-y-4">
        <IssueTabContent
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          filters={filters}
          setFilters={setFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab="historical"
          openDialog={openDialog}
        />
      </TabsContent>
    </Tabs>
  );
};
