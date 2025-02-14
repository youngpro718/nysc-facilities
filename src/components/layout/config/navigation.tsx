
import {
  Building2,
  Users,
  Key,
  AlertCircle,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import { NavigationTab } from "../types";

export const adminNavigation: NavigationTab[] = [
  { title: "Dashboard", icon: LayoutDashboard },
  { title: "Spaces", icon: Building2 },
  { title: "Occupants", icon: Users },
  { type: "separator" },
  { title: "Keys", icon: Key },
  { title: "Issues", icon: AlertCircle },
  { type: "separator" },
  { title: "Admin Profile", icon: UserRound },
];

export const userNavigation: NavigationTab[] = [
  { title: "Dashboard", icon: LayoutDashboard },
  { type: "separator" },
  { title: "Profile", icon: UserRound },
];

export const getNavigationRoutes = (isAdmin: boolean) => {
  if (isAdmin) {
    return ['/', '/spaces', '/occupants', null, '/keys', '/issues', null, '/admin-profile'];
  }
  return ['/dashboard', null, '/profile'];
};
