/**
 * RequestHub - Unified entry point for all user requests
 * 
 * Simple, mobile-first hub with 4 large action cards:
 * - Order Supplies
 * - Request Help (moves, deliveries, tasks)
 * - Report Issue
 * - Request Key
 */

import { useNavigate } from 'react-router-dom';
import { Package, HelpCircle, AlertTriangle, Key, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  bgClass: string;
  iconClass: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'supplies',
    title: 'Order Supplies',
    description: 'Office supplies & materials',
    icon: Package,
    path: '/request/supplies', // New streamlined path
    bgClass: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30',
    iconClass: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'help',
    title: 'Request Help',
    description: 'Move furniture, deliveries, setup',
    icon: HelpCircle,
    path: '/request/help',
    bgClass: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'issue',
    title: 'Report Issue',
    description: 'Problems, safety, maintenance',
    icon: AlertTriangle,
    path: '/forms/issue-report',
    bgClass: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30',
    iconClass: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'key',
    title: 'Request Key',
    description: 'New key or replacement',
    icon: Key,
    path: '/forms/key-request',
    bgClass: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
    iconClass: 'text-purple-600 dark:text-purple-400',
  },
];

export default function RequestHub() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Request</h1>
          <p className="text-muted-foreground text-sm">What do you need help with?</p>
        </div>
      </div>

      {/* Action Cards Grid - 2 columns on mobile for quick access */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                text-center w-full min-h-[100px] touch-manipulation active:scale-[0.98]
                ${action.bgClass}
              `}
            >
              <div className={`p-2.5 rounded-full bg-background/80 ${action.iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm leading-tight">{action.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Track Requests Link */}
      <div className="mt-8 text-center">
        <Button
          variant="link"
          onClick={() => navigate('/my-activity')}
          className="text-muted-foreground"
        >
          View your existing requests →
        </Button>
      </div>
    </div>
  );
}
