import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash, Copy } from "lucide-react";
import { CourtTerm } from '../types/termTypes';
import { useTerms } from '../hooks/useTerms';
import { useToast } from '@/hooks/use-toast';

interface TermActionsMenuProps {
  term: CourtTerm;
  onEdit?: () => void;
  onDeleteError?: () => void;
}

export function TermActionsMenu({ term, onEdit, onDeleteError }: TermActionsMenuProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showDeleteHelp, setShowDeleteHelp] = useState(false);
  const navigate = useNavigate();
  const { deleteTerm, isDeleting } = useTerms();
  const { toast } = useToast();

  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    } else {
      // Default behavior - navigate to edit page using correct route path
      navigate(`/court-terms/${term.id}/edit`);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteTerm(term.id, {
      onSuccess: () => {
        // Navigate back to terms list after successful deletion
        navigate('/court-terms');
      },
      onError: (error) => {
        console.error("Delete term error:", error);
        setShowDeleteHelp(true);
        
        // Call the error handler if provided
        if (onDeleteError) {
          onDeleteError();
        }
        
        // Show a helpful toast
        toast({
          title: "Cannot Delete Term",
          description: "Missing database permissions. Contact your administrator to fix this issue.",
          variant: "destructive",
        });
      }
    });
    setIsDeleteDialogOpen(false);
  };
  
  const copyPolicySQL = () => {
    const sql = `CREATE POLICY "Allow delete for authenticated users" ON court_terms FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON term_assignments FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON term_personnel FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON court_parts FOR DELETE TO authenticated USING (true);`;
    
    navigator.clipboard.writeText(sql);
    
    toast({
      title: "SQL Copied",
      description: "SQL commands copied to clipboard for your administrator.",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEditClick}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDeleteClick} 
            className="text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the court term &quot;{term.term_name}&quot; and all related assignments and personnel.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* SQL Help Dialog */}
      <AlertDialog open={showDeleteHelp} onOpenChange={setShowDeleteHelp}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Permission Required</AlertDialogTitle>
            <AlertDialogDescription>
              Your database is missing the required DELETE policies to delete court terms.
              Please provide these SQL commands to your database administrator:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
{`-- Add DELETE policy for court_terms table
CREATE POLICY "Allow delete for authenticated users" 
ON court_terms FOR DELETE 
TO authenticated 
USING (true);

-- Add DELETE policies for related tables
CREATE POLICY "Allow delete for authenticated users" 
ON term_assignments FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "Allow delete for authenticated users" 
ON term_personnel FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "Allow delete for authenticated users" 
ON court_parts FOR DELETE 
TO authenticated 
USING (true);`}
            </pre>
          </div>
          
          <AlertDialogFooter>
            <Button 
              variant="outline" 
              onClick={copyPolicySQL}
              className="mr-auto"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy SQL
            </Button>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 