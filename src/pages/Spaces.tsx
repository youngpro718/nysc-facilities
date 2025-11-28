import SpacesTabs from "@/components/spaces/SpacesTabs";
import { CreateSpaceDialog } from "@/components/spaces/CreateSpaceDialog";
import { MobileSpaceFAB } from "@/components/spaces/MobileSpaceFAB";
import { useIsMobile } from "@/hooks/use-mobile";

const Spaces = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Space Management</h2>
        </div>
        {/* Hide desktop Add Space button on mobile but keep in DOM for mobile trigger */}
        <div className={`flex gap-2 ${isMobile ? 'hidden' : ''}`}>
          <CreateSpaceDialog />
        </div>
      </div>
      
      <div className="mt-6">
        <SpacesTabs />
      </div>

      {/* Mobile FAB */}
      <MobileSpaceFAB />
    </div>
  );
};

export default Spaces;
