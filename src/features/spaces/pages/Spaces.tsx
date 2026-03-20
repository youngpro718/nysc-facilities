import SpacesTabs from "@features/spaces/components/spaces/SpacesTabs";
import { CreateSpaceDialog } from "@features/spaces/components/spaces/CreateSpaceDialog";
import { MobileSpaceFAB } from "@features/spaces/components/spaces/MobileSpaceFAB";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";

const Spaces = () => {
  const isMobile = useIsMobile();
  const { canAdmin } = useRolePermissions();
  const canManageSpaces = canAdmin('spaces');

  return (
    <div className="space-y-4 sm:space-y-8 relative" data-tour="space-list">
      <div className="flex items-center justify-between">
        {/* Hide desktop Add Space button on mobile but keep in DOM for mobile trigger */}
        {canManageSpaces && (
          <div className={`flex gap-2 ${isMobile ? 'hidden' : ''}`} data-tour="add-space-btn">
            <CreateSpaceDialog />
          </div>
        )}
      </div>

      <div className="mt-6">
        <SpacesTabs />
      </div>

      {/* Mobile FAB */}
      {canManageSpaces && <MobileSpaceFAB />}
    </div>
  );
};

export default Spaces;
