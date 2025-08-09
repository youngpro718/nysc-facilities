
import { LightingFixturesList } from "@/components/lighting/LightingFixturesList";
import { CreateLightingDialog } from "@/components/lighting/CreateLightingDialog";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";
import { Lightbulb } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function Lighting() {
  const { fixtures, isLoading, refetch } = useLightingFixtures();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || undefined;
  
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="h-8 w-8" />
            Lighting Management
          </h1>
          <p className="text-muted-foreground">
            Simple, practical lighting management - track what's out, what needs an electrician, and when things get fixed.
          </p>
        </div>
        <CreateLightingDialog 
          onFixtureCreated={refetch}
          onZoneCreated={() => {}}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading lights...</div>
        </div>
      ) : (
        <LightingFixturesList 
          statusFilter={statusFilter}
          fixtures={fixtures || []}
          isLoading={isLoading}
          refetch={refetch}
        />
      )}
    </div>
  );
}
