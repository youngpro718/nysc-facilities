import { TermSheetBoard } from "@features/court/components/term-sheet/TermSheetBoard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { useAuth } from "@features/auth/hooks/useAuth";

/**
 * Term Sheet Page
 * - All authenticated users can view
 * - admin / system_admin / court_liaison can edit (DB RLS enforces this too)
 */
export default function TermSheet() {
  const { profile } = useAuth();
  const role = profile?.role;
  const canEdit = role === 'admin' || role === 'system_admin' || role === 'court_liaison';

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      <Breadcrumb />
      <div>
        <h1 className="text-2xl font-semibold">Criminal Term Sheet</h1>
        <p className="text-sm text-muted-foreground">
          Current court assignments and personnel
        </p>
      </div>

      <TermSheetBoard isAdmin={canEdit} />
    </div>
  );
}
