import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { type SidebarProps } from "../types"
import { SIDEBAR_CONSTANTS } from "../types"
import { SidebarContext } from "../hooks/useSidebar"

export const SidebarProvider = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      side = "left",
      variant = "default",
      collapsible = true,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)
    const [_open, _setOpen] = React.useState(defaultOpen)
    
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        document.cookie = `${SIDEBAR_CONSTANTS.COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_CONSTANTS.COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_CONSTANTS.KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    const state = React.useMemo((): "expanded" | "collapsed" => {
      if (isMobile) return "expanded"
      return open ? "expanded" : "collapsed"
    }, [isMobile, open])

    const contextValue = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar]
    )

    if (isMobile) {
      return (
        <SidebarContext.Provider value={contextValue}>
          <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetContent
              className="w-full p-0"
              style={{
                "--sidebar-width": SIDEBAR_CONSTANTS.WIDTH_MOBILE,
              } as React.CSSProperties}
              side={side}
            >
              <div className="flex h-full w-full flex-col">{children}</div>
            </SheetContent>
          </Sheet>
        </SidebarContext.Provider>
      )
    }

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            "group peer hidden md:block text-sidebar-foreground",
            className
          )}
          data-state={state}
          data-collapsible={state === "collapsed" ? collapsible : ""}
          data-variant={variant}
          data-side={side}
          style={{
            "--sidebar-width": SIDEBAR_CONSTANTS.WIDTH,
            "--sidebar-width-icon": SIDEBAR_CONSTANTS.WIDTH_ICON,
            ...style,
          } as React.CSSProperties}
          {...props}
        >
          <div
            className={cn(
              "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
              "group-data-[collapsible=offcanvas]:w-0",
              "group-data-[side=right]:rotate-180",
              variant === "floating" || variant === "inset"
                ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
                : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
            )}
          />
          <div
            className={cn(
              "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
              side === "left"
                ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
                : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
              variant === "floating" || variant === "inset"
                ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
                : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l"
            )}
          >
            <div
              data-sidebar="sidebar"
              className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
            >
              {children}
            </div>
          </div>
        </div>
      </SidebarContext.Provider>
    )
  }
)

SidebarProvider.displayName = "SidebarProvider"
