import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreateOccupantDialog } from "./CreateOccupantDialog";
import { UserPlus, Users, Building, Key, Clock, FileSpreadsheet, Upload, MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImportOccupantsDialog } from "./dialogs/ImportOccupantsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoomAssignmentsView } from "./views/RoomAssignmentsView";
import { KeyAssignmentsView } from "./views/KeyAssignmentsView";
import { AssignmentHistoryView } from "./views/AssignmentHistoryView";
import { OccupantReportsView } from "./views/OccupantReportsView";
import { OccupantStats } from "./OccupantStats";
import { OccupantListView } from "./views/OccupantListView";

export function OccupantDashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Fetch occupant statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["occupant-stats"],
    queryFn: async () => {
      const [totalResult, activeResult, departmentsResult, roomsResult, keysResult] = await Promise.all([
        supabase.from("occupants").select("id", { count: "exact" }),
        supabase.from("occupants").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("occupants").select("department").not("department", "is", null),
        supabase.from("occupant_room_assignments").select("id", { count: "exact" }),
        supabase.from("key_assignments").select("id", { count: "exact" }).is("returned_at", null)
      ]);
      
      // Get unique departments
      const departments = new Set();
      departmentsResult.data?.forEach(item => {
        if (item.department) departments.add(item.department);
      });
      
      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        departments: departments.size,
        rooms: roomsResult.count || 0,
        keys: keysResult.count || 0
      };
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Occupant Management</h1>
          <p className="text-muted-foreground">
            Manage personnel, assign rooms and keys, and track occupancy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="mr-2 h-4 w-4" />
                Bulk Operations
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Occupants
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.alert("Export feature coming soon!")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export to CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Occupant
          </Button>
        </div>
      </div>

      <OccupantStats stats={stats} isLoading={statsLoading} />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Occupants
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-1">
            <Building className="h-4 w-4" />
            Room Assignments
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-1">
            <Key className="h-4 w-4" />
            Key Assignments
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1">
            <FileSpreadsheet className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <OccupantListView />
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <RoomAssignmentsView />
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <KeyAssignmentsView />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <AssignmentHistoryView />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <OccupantReportsView />
        </TabsContent>
      </Tabs>

      <CreateOccupantDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onSuccess={() => {
          // Refresh data
        }} 
      />
      
      <ImportOccupantsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          // Refresh data
        }}
      />
    </div>
  );
}
