
import { LucideIcon } from "lucide-react";

export interface NavigationTab {
  title?: string;
  icon?: LucideIcon;
  type?: 'separator';
}

export interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType;
  adminOnly: boolean;
}
