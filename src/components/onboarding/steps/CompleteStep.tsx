import { CheckCircle, Rocket, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const quickActions = [
  {
    title: "Report an Issue",
    description: "Something broken? Report it to get help quickly",
    action: "/request/help",
    icon: "🔧"
  },
  {
    title: "View Your Dashboard",
    description: "See your personalized overview and recent activity",
    action: "/dashboard",
    icon: "📊"
  },
  {
    title: "Request Supplies",
    description: "Order supplies or materials you need",
    action: "/request/supplies",
    icon: "📦"
  },
  {
    title: "Update Profile",
    description: "Complete your profile with additional details",  
    action: "/profile",
    icon: "👤"
  }
];

export function CompleteStep() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">You're All Set!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Welcome to NYSC Facilities Hub. Your account is ready and you can start using all available features.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center flex items-center justify-center gap-2">
          <Rocket className="w-5 h-5" />
          Quick Actions to Get Started
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{action.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-primary">
            🎉 Account Verification Complete
          </p>
          <p className="text-xs text-muted-foreground">
            Your account has been automatically verified. You now have full access to submit requests, 
            report issues, and use all available features.
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Need help? Check out the help section or contact support anytime.
        </p>
      </div>
    </div>
  );
}