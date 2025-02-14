
import {
  Building,
  Key,
  Lightbulb,
  AlertCircle,
  Users,
  FileCheck
} from "lucide-react";
import type { NavigationTab } from "../types";

// Base navigation items shared between admin and user
const baseNavigation: NavigationTab[] = [
  {
    title: "Spaces",
    href: "/spaces",
    icon: Building,
  },
  {
    title: "Keys",
    href: "/keys",
    icon: Key,
  },
  {
    title: "Lighting",
    href: "/lighting",
    icon: Lightbulb,
  },
  {
    title: "Issues",
    href: "/issues",
    icon: AlertCircle,
  },
];

// Admin-specific navigation
export const adminNavigation: NavigationTab[] = [
  ...baseNavigation,
  {
    title: "Occupants",
    href: "/occupants",
    icon: Users,
  },
  {
    title: "Verification",
    href: "/verification",
    icon: FileCheck,
  },
];

// User-specific navigation
export const userNavigation: NavigationTab[] = [
  ...baseNavigation,
  {
    title: "Verification",
    href: "/verification",
    icon: FileCheck,
  },
];

// Helper function to get routes
export const getNavigationRoutes = (isAdmin: boolean): string[] => {
  const routes = isAdmin ? adminNavigation : userNavigation;
  return routes.map(item => item.href);
};
