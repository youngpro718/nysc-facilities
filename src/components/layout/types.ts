
import { LucideIcon } from "lucide-react";

export interface DeviceInfo {
  name: string;
  platform: string;
  language: string;
}

export interface NavigationItem {
  title: string;
  href: string;
  icon?: JSX.Element;
  description?: string;
  adminOnly?: boolean;
  children?: NavigationItem[];
}

export interface NavigationTab {
  label: string;
  value: string;
  icon: LucideIcon;
}
