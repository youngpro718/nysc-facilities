import { TermSheetBoard } from "@features/court/components/term-sheet/TermSheetBoard";
import { KeyPersonnelPanel } from "@features/court/components/personnel/KeyPersonnelPanel";
import { useAuth } from "@features/auth/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileTextIcon, PersonIcon } from "@radix-ui/react-icons";
import { PageHeader } from "@/components/layout/PageHeader";

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
      <PageHeader
        title="Court Operations"
        description="Current assignments and the personnel needed to run them"
        className="mb-0"
      >
        {!canEdit && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Read-only
          </span>
        )}
      </PageHeader>

      {canEdit ? (
        <Tabs defaultValue="assignments" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="assignments" className="gap-2">
              <FileTextIcon className="h-4 w-4" />
              Term assignments
            </TabsTrigger>
            <TabsTrigger value="personnel" className="gap-2">
              <PersonIcon className="h-4 w-4" />
              Key personnel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="mt-0">
            <TermSheetBoard isAdmin={canEdit} />
          </TabsContent>

          <TabsContent value="personnel" className="mt-0">
            <KeyPersonnelPanel canEdit={canEdit} />
          </TabsContent>
        </Tabs>
      ) : (
        <TermSheetBoard isAdmin={canEdit} />
      )}
    </div>
  );
}
