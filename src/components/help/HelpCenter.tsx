import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, BookOpen, Building2, AlertTriangle, Zap, Gavel, KeyRound,
  Package2, Users, LayoutDashboard, ClipboardList, Warehouse,
  CheckCircle2, Search, ChevronDown, ChevronRight, LucideIcon, Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTour } from './TourProvider';
import { allTours } from './tours/tourSteps';
import { guideSections } from './guides/guideData';
import { cn } from '@/lib/utils';

const tourIcons: Record<string, LucideIcon> = {
  'admin-dashboard': LayoutDashboard,
  'spaces': Building2,
  'operations': AlertTriangle,
  'lighting': Zap,
  'court-ops': Gavel,
  'keys': KeyRound,
  'inventory': Package2,
  'access': Users,
  'user-dashboard': LayoutDashboard,
  'tasks': ClipboardList,
  'supply-room': Warehouse,
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="w-full text-left py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start gap-2">
        {isOpen ? (
          <ChevronDown className="h-4 w-4 mt-1 shrink-0 text-primary" />
        ) : (
          <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
        )}
        <div className="flex-1">
          <p className={cn('text-sm font-medium', isOpen && 'text-primary')}>{question}</p>
          {isOpen && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{answer}</p>
          )}
        </div>
      </div>
    </button>
  );
}

export function HelpCenter() {
  const navigate = useNavigate();
  const { startTourForRoute } = useTour();
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]');

  const filteredTours = search
    ? allTours.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase())
      )
    : allTours;

  const filteredGuides = search
    ? guideSections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.question.toLowerCase().includes(search.toLowerCase()) ||
              item.answer.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0)
    : guideSections;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground mt-1">
          Interactive tours, guides, and answers to common questions.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search guides and tours..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Start */}
      {!search && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">New here?</h3>
              <p className="text-sm text-muted-foreground">
                Start an interactive tour of the page you are on. Click the{' '}
                <span className="font-medium text-foreground">?</span> button in the
                bottom-right corner of any page, or launch a tour below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Tours */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Interactive Page Tours
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTours.map((tour) => {
            const Icon = tourIcons[tour.id] || BookOpen;
            const isCompleted = completedTours.includes(tour.path);
            return (
              <Card
                key={tour.id}
                className="cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => startTourForRoute(tour.path)}
              >
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">{tour.title}</h3>
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {tour.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {tour.steps.length} steps
                        </Badge>
                        <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Start tour →
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {filteredTours.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No tours match your search.</p>
        )}
      </div>

      {/* Written Guides / FAQ */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Guides & FAQ
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredGuides.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <Card key={section.id}>
                <CardHeader
                  className="cursor-pointer py-4"
                  onClick={() => setActiveSection(isActive ? null : section.id)}
                >
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5 text-primary" />
                    {section.title}
                    <Badge variant="outline" className="ml-auto text-xs">
                      {section.items.length} topics
                    </Badge>
                    {isActive ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
                {isActive && (
                  <CardContent className="pt-0 pb-2">
                    <div className="space-y-1">
                      {section.items.map((item, idx) => (
                        <FAQItem key={idx} question={item.question} answer={item.answer} />
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
        {filteredGuides.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No guides match your search.</p>
        )}
      </div>

      {/* Tips */}
      {!search && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Tips & FYIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Auto-save:</strong> Most forms and status changes save automatically. Watch for the toast notification.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Real-time:</strong> Notifications update in real-time. No need to refresh the page.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Mobile:</strong> The app works on tablets and phones. Lighting Floor View is optimized for tablet walkthroughs.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Stale data?</strong> Navigate away and back. Do NOT hard-refresh — the app manages its own cache.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Exports:</strong> Most list views support CSV export. Look for the Export button.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Access denied?</strong> Your role may not have permission. Contact an admin to request access.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
