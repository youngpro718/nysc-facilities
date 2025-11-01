
import { OccupantListView } from "@/components/occupants/views/OccupantListView";
import { RoleBasedRoute } from "@/components/layout/RoleBasedRoute";

const Occupants = () => {
  return (
    <RoleBasedRoute feature="occupants">
      <OccupantListView />
    </RoleBasedRoute>
  );
};

export default Occupants;
