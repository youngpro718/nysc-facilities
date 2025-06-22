
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Pencil, Trash2, Key, DoorOpen } from "lucide-react";
import OccupantDetails from "./OccupantDetails";
import { OccupantQueryResponse } from "./types/occupantTypes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OccupantTableProps {
  occupants: OccupantQueryResponse[];
  expandedRows: Set<string>;
  selectedOccupants: string[];
  onToggleRow: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (occupant: OccupantQueryResponse) => void;
  onDelete: (id: string) => void;
}

export function OccupantTable({
  occupants,
  expandedRows,
  selectedOccupants,
  onToggleRow,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
}: OccupantTableProps) {
  return (
    <div className="rounded-md border">
      <ScrollArea className="w-full">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedOccupants.length === occupants?.length}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="min-w-[180px]">Name</TableHead>
                <TableHead className="hidden sm:table-cell">Department</TableHead>
                <TableHead className="hidden md:table-cell">Title</TableHead>
                <TableHead className="min-w-[200px]">Rooms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Access</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {occupants?.map((occupant) => [
                <TableRow key={`${occupant.id}-main`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedOccupants.includes(occupant.id)}
                      onCheckedChange={() => onToggleSelect(occupant.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 p-0"
                      onClick={() => onToggleRow(occupant.id)}
                    >
                      {expandedRows.has(occupant.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span>{occupant.first_name} {occupant.last_name}</span>
                      <div className="sm:hidden flex items-center gap-2">
                        <Badge variant={occupant.status === 'active' ? 'default' : 'secondary'}>
                          {occupant.status}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{occupant.department || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{occupant.title || "—"}</TableCell>
                  <TableCell className="min-w-[200px]">
                    {
                      occupant.rooms && occupant.rooms.length > 0
                        ? occupant.rooms.map(r => `${r.floors?.buildings?.name ? r.floors.buildings.name + ' - ' : ''}${r.room_number || r.name}`).join(', ')
                        : '—'
                    }
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={occupant.status === 'active' ? 'default' : 'secondary'}>
                      {occupant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex justify-center gap-4">
                      <div className="flex items-center gap-1">
                        <Key className="h-4 w-4" />
                        <span>{occupant.key_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DoorOpen className="h-4 w-4" />
                        <span>{occupant.room_count || 0}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(occupant)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(occupant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>,
                expandedRows.has(occupant.id) && (
                  <TableRow key={`${occupant.id}-details`}>
                    <TableCell colSpan={8} className="p-0">
                      <div className="p-4">
                        <OccupantDetails occupantData={occupant} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ].filter(Boolean))}
              {(!occupants || occupants.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No occupants found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
