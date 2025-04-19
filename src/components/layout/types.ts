
import { LucideIcon } from "lucide-react";

export type DeviceInfo = {
  name: string;
  platform: string;
  language: string;
};

export interface UserSession {
  id: string;
  user_id: string;
  device_info: DeviceInfo;
  last_active_at: string;
  created_at: string;
  ip_address?: string;
  location?: string;
}

export interface Tab {
  title: string;
  icon: LucideIcon;
  type?: undefined;
}

export interface Separator {
  type: "separator";
}

export type NavigationTab = Tab | Separator;

export interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType;
  adminOnly: boolean;
}
