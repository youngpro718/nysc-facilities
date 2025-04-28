
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
  return (
    <div className="overflow-x-auto">
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
