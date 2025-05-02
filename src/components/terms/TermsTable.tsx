
import React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TermRow } from "./TermRow";
import { Term } from "@/types/terms";

interface TermsTableProps {
  terms: Term[];
}

export function TermsTable({ terms }: TermsTableProps) {
  if (terms.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-muted-foreground">No terms found matching your filters.</p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Term</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignments</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {terms.map((term) => (
            <TermRow key={term.id} term={term} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
