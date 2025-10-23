import { TermSheetBoard } from "@/components/court-operations/personnel/TermSheetBoard";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Public Term Sheet Page
 * Accessible to all users to view current court term assignments
 * Uses the same TermSheetBoard component as Court Operations
 */
export default function TermSheet() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Criminal Term Sheet</h1>
          <p className="text-sm text-muted-foreground">
            Current court assignments and personnel
          </p>
        </div>
      </div>
      
      {/* Use the same TermSheetBoard component from Court Operations */}
      <TermSheetBoard />
    </div>
  );
}
