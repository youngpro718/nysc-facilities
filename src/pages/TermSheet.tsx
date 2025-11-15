import { TermSheetBoard } from "@/components/court-operations/personnel/TermSheetBoard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

/**
 * Public Term Sheet Page
 * Accessible to all users to view current court term assignments
 * Uses the same TermSheetBoard component as Court Operations
 */
export default function TermSheet() {
  return (
    <div className="space-y-4 pb-20 md:pb-8">
      <Breadcrumb />
      <div>
        <h1 className="text-2xl font-semibold">Criminal Term Sheet</h1>
        <p className="text-sm text-muted-foreground">
          Current court assignments and personnel
        </p>
      </div>
      
      {/* Use the same TermSheetBoard component from Court Operations */}
      <TermSheetBoard />
    </div>
  );
}
