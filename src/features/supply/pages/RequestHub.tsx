/**
 * RequestHub - Unified entry point for all user requests
 */

import { useNavigate } from 'react-router-dom';
import { Package, HelpCircle, AlertTriangle, Key, ArrowLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  accentClass: string;
  iconBgClass: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'issue',
    title: 'Report an Issue',
    description: 'Something broken, unsafe, or needs maintenance? Let us know.',
    icon: AlertTriangle,
    path: '/my-issues?new=1',
    accentClass: 'border-l-orange-500',
    iconBgClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  {
    id: 'supplies',
    title: 'Order Supplies',
    description: 'Office supplies, paper, toner, and other materials.',
    icon: Package,
    path: '/request/supplies',
    accentClass: 'border-l-emerald-500',
    iconBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'help',
    title: 'Request Help',
    description: 'Furniture moves, deliveries, room setup, or general assistance.',
    icon: HelpCircle,
    path: '/request/help',
    accentClass: 'border-l-blue-500',
    iconBgClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'key',
    title: 'Request a Key',
    description: 'New key, replacement, or additional access.',
    icon: Key,
    path: '/my-requests?new=1',
    accentClass: 'border-l-violet-500',
    iconBgClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
];

export default function RequestHub() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">How can we help?</h1>
          <p className="text-sm text-muted-foreground">Choose what you need below</p>
        </div>
      </div>

      {/* Action Cards — stacked list on mobile, clean and tappable */}
      <div className="space-y-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl border border-l-4
                bg-card hover:bg-accent/50 transition-colors
                text-left touch-manipulation active:scale-[0.99]
                ${action.accentClass}
              `}
            >
              <div className={`shrink-0 p-3 rounded-xl ${action.iconBgClass}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[15px] leading-tight">{action.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{action.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Track existing requests */}
      <button
        onClick={() => navigate('/my-activity')}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-muted-foreground/20 hover:bg-muted/50 transition-colors touch-manipulation"
      >
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">View your existing requests</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto" />
      </button>
    </div>
  );
}
