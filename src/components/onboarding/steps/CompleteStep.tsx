import { CheckCircle, Wrench, LayoutDashboard, Package, User, ChevronRight } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Report an Issue",
    description: "Something broken? Get help quickly",
    icon: Wrench,
    iconBg: "bg-red-500/10 text-red-500"
  },
  {
    title: "View Dashboard",
    description: "Your personalized overview",
    icon: LayoutDashboard,
    iconBg: "bg-blue-500/10 text-blue-500"
  },
  {
    title: "Request Supplies",
    description: "Order materials you need",
    icon: Package,
    iconBg: "bg-green-500/10 text-green-500"
  },
  {
    title: "Update Profile",
    description: "Add more details about you",
    icon: User,
    iconBg: "bg-purple-500/10 text-purple-500"
  }
];

export function CompleteStep() {
  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">You're All Set!</h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
            Your account is ready. Here are some things you can do right away.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-xl border bg-card active:bg-accent/50 transition-colors"
            >
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${action.iconBg}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {action.description}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          Account Verified
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          You have full access to submit requests, report issues, and use all available features.
        </p>
      </div>
    </div>
  );
}