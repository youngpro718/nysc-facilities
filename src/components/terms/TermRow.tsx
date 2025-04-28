
import React from "react";
import { format } from "date-fns";
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, 
  FileTextIcon,
  ClipboardListIcon,
  UsersIcon,
  ChevronRightIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Term } from "@/types/terms";

interface TermRowProps {
  term: Term;
}

export function TermRow({ term }: TermRowProps) {
  const navigate = useNavigate();
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const viewAssignments = (termId: string) => {
    navigate(`/term-assignments/${termId}`);
  };
  
  const viewPersonnel = (termId: string) => {
    navigate(`/term-personnel/${termId}`);
  };
  
  const downloadPdf = (pdfUrl: string, termName: string) => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${termName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{term.term_name}</div>
        {term.term_number && (
          <div className="text-xs text-muted-foreground">{term.term_number}</div>
        )}
      </TableCell>
      <TableCell>{term.location}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(term.start_date), "MMM d")} - {format(new Date(term.end_date), "MMM d, yyyy")}
          </span>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(term.status)}</TableCell>
      <TableCell>
        {term.assignment_count !== undefined ? (
          <Badge variant="outline">{term.assignment_count}</Badge>
        ) : (
          <Badge variant="outline">-</Badge>
        )}
      </TableCell>
      <TableCell className="text-right space-x-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={() => downloadPdf(term.pdf_url, term.term_name)}
              >
                <FileTextIcon className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download PDF</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={() => viewAssignments(term.id)}
              >
                <ClipboardListIcon className="h-4 w-4 mr-1" />
                Assignments
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Assignments</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={() => viewPersonnel(term.id)}
              >
                <UsersIcon className="h-4 w-4 mr-1" />
                Personnel
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Personnel</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={() => navigate(`/terms/${term.id}`)}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
}
