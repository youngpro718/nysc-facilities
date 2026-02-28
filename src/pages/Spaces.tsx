import SpacesTabs from "@/components/spaces/SpacesTabs";
import { CreateSpaceDialog } from "@/components/spaces/CreateSpaceDialog";
import { MobileSpaceFAB } from "@/components/spaces/MobileSpaceFAB";
import { useIsMobile } from "@/hooks/use-mobile";

const Spaces = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4 sm:space-y-8 relative" data-tour="space-list">
      <div className="flex items-center justify-between">
        {/* Hide desktop Add Space button on mobile but keep in DOM for mobile trigger */}
        <div className={`flex gap-2 ${isMobile ? 'hidden' : ''}`} data-tour="add-space-btn">
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
