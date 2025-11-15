import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
import { type SidebarMenuItemProps } from "../types"

export const SidebarMenuItem = React.forwardRef<HTMLAnchorElement, SidebarMenuItemProps>(
  (
    {
      className,
      asChild = false,
      isActive = false,
      icon,
      label,
      description,
      shortcut,
      disabled = false,
      size = "md",
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "a"

    return (
      <Comp
        ref={ref}
        className={cn(
          "group/menu-item flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
          "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground",
          "focus-visible:bg-sidebar-hover focus-visible:text-sidebar-hover-foreground focus-visible:outline-none",
          isActive && "bg-sidebar-active text-sidebar-active-foreground",
          disabled && "pointer-events-none opacity-50",
          size === "sm" && "gap-1.5 px-1.5 py-1 text-xs",
          className
        )}
        {...props}
      >
        {icon && (
          <span
            className={cn(
              "shrink-0",
              size === "sm" ? "h-4 w-4" : "h-5 w-5"
            )}
          >
            {icon}
          </span>
        )}
        {children ?? (
          <>
            <span className="flex-1 truncate">
              {label}
              {description && (
                <span className="block truncate text-xs font-normal opacity-60">
                  {description}
                </span>
              )}
            </span>
            {shortcut && (
              <span className="ml-auto text-xs tracking-widest opacity-60">
                {shortcut}
              </span>
            )}
          </>
        )}
      </Comp>
    )
  }
)

SidebarMenuItem.displayName = "SidebarMenuItem"
