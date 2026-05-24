import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { IssuesSidebarList } from "./IssuesSidebarList";
import { IssueDetailPanel } from "./IssueDetailPanel";
import type { EnhancedIssue } from "@features/dashboard/hooks/useAdminIssuesData";
import type { StatusFilter, PriorityFilter } from "@features/issues/types/issues";

interface IssuesMasterDetailProps {
  issues: EnhancedIssue[];
  searchQuery: string;
  onIssueUpdate: () => void;
  isLoading: boolean;
  buildingId?: string | null;
  filter?: string | null;
  statusFilter?: StatusFilter;
  priorityFilter?: PriorityFilter;
  roomId?: string | null;
}

export function IssuesMasterDetail({
  issues,
  searchQuery,
  onIssueUpdate,
  isLoading,
  buildingId,
  filter,
  statusFilter = "all",
  priorityFilter = "all",
  roomId,
}: IssuesMasterDetailProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("issue");

  const filteredIssues = useMemo(() => {
    let result = issues;
    if (buildingId) result = result.filter((i) => i.building_id === buildingId);
    if (roomId) result = result.filter((i) => i.room_id === roomId);
    if (filter === "active") result = result.filter((i) => i.status !== "resolved");
    if (statusFilter && statusFilter !== "all")
      result = result.filter((i) => i.status === statusFilter);
    if (priorityFilter && priorityFilter !== "all")
      result = result.filter((i) => i.priority === priorityFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.rooms?.name?.toLowerCase().includes(q) ||
          i.rooms?.room_number?.toLowerCase().includes(q) ||
          `${i.reporter?.first_name} ${i.reporter?.last_name}`
            .toLowerCase()
            .includes(q)
      );
    }
    return result;
  }, [issues, buildingId, roomId, filter, statusFilter, priorityFilter, searchQuery]);

  const selectedIssue = useMemo(
    () => filteredIssues.find((i) => i.id === selectedId) ?? null,
    [filteredIssues, selectedId]
  );

  // Auto-select first issue when none selected
  useEffect(() => {
    if (!isLoading && filteredIssues.length > 0 && !selectedIssue) {
      const params = new URLSearchParams(searchParams);
      params.set("issue_id", filteredIssues[0].id);
      setSearchParams(params, { replace: true });
    }
  }, [isLoading, filteredIssues, selectedIssue, searchParams, setSearchParams]);

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("issue_id", id);
    setSearchParams(params, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-[calc(100svh-440px)] min-h-[480px] rounded-md border bg-card"
    >
      <ResizablePanel defaultSize={32} minSize={22} maxSize={50}>
        <IssuesSidebarList
          issues={filteredIssues}
          selectedIssueId={selectedId}
          onSelect={handleSelect}
          isLoading={isLoading}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={68} minSize={50}>
        <IssueDetailPanel issue={selectedIssue} onUpdate={onIssueUpdate} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
