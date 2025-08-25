import SpacesTabs from "@/components/spaces/SpacesTabs";
import { CreateSpaceDialog } from "@/components/spaces/CreateSpaceDialog";

const Spaces = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Space Management</h2>
        </div>
        <div className="flex gap-2">
          <CreateSpaceDialog />
        </div>
      </div>
      
      <div className="mt-6">
        <SpacesTabs />
      </div>
    </div>
  );
};

export default Spaces;
