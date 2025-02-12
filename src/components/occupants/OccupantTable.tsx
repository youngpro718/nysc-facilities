
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
import { OccupantDetails } from "./OccupantDetails";
import { OccupantQueryResponse } from "./types/occupantTypes";

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
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Access</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {occupants?.map((occupant) => (
            <div key={occupant.id}>
              <TableRow>
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
                  {occupant.first_name} {occupant.last_name}
                </TableCell>
                <TableCell>{occupant.department || "—"}</TableCell>
                <TableCell>{occupant.title || "—"}</TableCell>
                <TableCell>
                  <Badge variant={occupant.status === 'active' ? 'default' : 'secondary'}>
                    {occupant.status}
                  </Badge>
                </TableCell>
                <TableCell>
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
              </TableRow>
              {expandedRows.has(occupant.id) && (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <div className="p-4">
                      <OccupantDetails occupant={occupant} />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </div>
          ))}
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
  );
}
