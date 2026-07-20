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
    <div className="relative" data-tour="space-list">
      {/* Add Room lives in the Spaces header row instead of floating alone
          above it; mobile keeps the FAB. */}
      <SpacesTabs
        actions={
          canManageSpaces && !isMobile ? (
            <div data-tour="add-space-btn">
              <CreateSpaceDialog />
            </div>
          ) : undefined
        }
      />

      {/* Mobile FAB */}
      {canManageSpaces && <MobileSpaceFAB />}
    </div>
  );
};

export default Spaces;
