import { type VariantProps } from "class-variance-authority"

export type SidebarState = "expanded" | "collapsed"
export type SidebarSide = "left" | "right"
export type SidebarVariant = "default" | "floating" | "inset"

export interface SidebarContext {
  state: SidebarState
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

export interface SidebarProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: SidebarSide
  variant?: SidebarVariant
  collapsible?: boolean
}

export interface SidebarMenuItemProps extends React.ComponentProps<"a"> {
  asChild?: boolean
  isActive?: boolean
  icon?: React.ReactNode
  label?: string
  description?: string
  shortcut?: string
  disabled?: boolean
  size?: "sm" | "md"
}

export const SIDEBAR_CONSTANTS = {
  COOKIE_NAME: "sidebar:state",
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7,
  WIDTH: "16rem",
  WIDTH_MOBILE: "18rem",
  WIDTH_ICON: "3rem",
  KEYBOARD_SHORTCUT: "b"
} as const
