
import { LucideIcon } from "lucide-react";

export interface NavigationTab {
  title: string;
  href: string;
  icon: LucideIcon;
}

export type NavigationItem = NavigationTab;
