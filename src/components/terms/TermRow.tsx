
import React, { useState } from "react";
import { format } from "date-fns";
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileTextIcon,
  ClipboardListIcon,
  UsersIcon,
  ChevronRightIcon,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Term } from "@/types/terms";
import { useToast } from "@/hooks/use-toast";

interface TermRowProps {
  term: Term;
}

export function TermRow({ term }: TermRowProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  
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
  
  const viewAssignments = () => {
    navigate(`/terms/${term.id}`);
  };
  
  const viewPersonnel = () => {
    navigate(`/terms/${term.id}`);
  };
  
  const downloadPdf = async (pdfUrl: string, termName: string) => {
    try {
      setLoading('pdf');
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${termName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
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
                disabled={loading === 'pdf'}
              >
                {loading === 'pdf' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <FileTextIcon className="h-4 w-4 mr-1" />
                )}
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
                onClick={viewAssignments}
                disabled={loading === 'assignments'}
              >
                {loading === 'assignments' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <ClipboardListIcon className="h-4 w-4 mr-1" />
                )}
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
                onClick={viewPersonnel}
                disabled={loading === 'personnel'}
              >
                {loading === 'personnel' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <UsersIcon className="h-4 w-4 mr-1" />
                )}
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
