import { useState } from 'react';
import { APP_INFO, APP_COPYRIGHT } from '@/lib/appInfo';
import {
  Play, BookOpen, Building2, AlertTriangle, Gavel, KeyRound,
  Package2, Users, LayoutDashboard, ClipboardList, Warehouse,
  CheckCircle2, Search, LucideIcon, Lightbulb,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTour } from './TourProvider';
import { allTours } from './tours/tourSteps';
import { guideSections, filterGuidesForRole } from './guides/guideData';

import { useRolePermissions } from '@/features/auth/hooks/useRolePermissions';
import { getToursForRole } from './tours/roleTourMapping';

const tourIcons: Record<string, LucideIcon> = {
  'admin-dashboard': LayoutDashboard,
  'spaces': Building2,
  'operations': AlertTriangle,
  'court-ops': Gavel,
  'keys': KeyRound,
  'inventory': Package2,
  'access': Users,
  'user-dashboard': LayoutDashboard,
  'tasks': ClipboardList,
  'supply-room': Warehouse,
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  // Always-expanded card. Help content is more useful when you can scan
  // questions AND answers at a glance — collapsed accordions made the page
  // feel empty to users who didn't realize they had to click to see content.
  return (
    <div className="py-3 px-4 rounded-md border border-border/40 bg-card/50">
      <p className="text-sm font-medium text-foreground">{question}</p>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{answer}</p>
    </div>
  );
}

export function HelpCenter() {
  const { startTourForRoute } = useTour();
  const { userRole } = useRolePermissions();
  const [search, setSearch] = useState('');

  const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]');

  // Filter tours based on user role
  const allowedTourIds = getToursForRole(userRole);
  const roleFilteredTours = allTours.filter((tour) => allowedTourIds.includes(tour.id));

  const filteredTours = search
    ? roleFilteredTours.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase())
      )
    : roleFilteredTours;

  // Hide guide items the current role can't act on, then optionally narrow by search.
  const roleFilteredGuides = filterGuidesForRole(guideSections, userRole);
  const filteredGuides = search
    ? roleFilteredGuides
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.question.toLowerCase().includes(search.toLowerCase()) ||
              item.answer.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0)
    : roleFilteredGuides;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground mt-1">
          Interactive tours, guides, and answers to common questions.
        </p>
      </div>

      {/* Search — shared across both tabs so users don't have to retype. */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search guides and tours..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList>
          <TabsTrigger value="faq">Guides &amp; FAQ</TabsTrigger>
          <TabsTrigger value="tours">Interactive Tours</TabsTrigger>
        </TabsList>

        {/* Interactive Tours Tab */}
        <TabsContent value="tours" className="space-y-6">

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
        </TabsContent>


        {/* FAQ Tab — always-visible content, grouped by topic. */}
        <TabsContent value="faq" className="space-y-6">
          {filteredGuides.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No guides match your search.
            </p>
          ) : (
            filteredGuides.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.id}>
                  <CardHeader className="py-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-5 w-5 text-primary" />
                      {section.title}
                      <Badge variant="outline" className="ml-auto text-xs">
                        {section.items.length} {section.items.length === 1 ? 'topic' : 'topics'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <div className="space-y-2">
                      {section.items.map((item, idx) => (
                        <FAQItem key={idx} question={item.question} answer={item.answer} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Contact & Support */}
      {!search && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5 text-primary" />
              Still need help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 rounded-lg border bg-muted/30 p-4 space-y-1">
                <p className="text-sm font-medium">AI Support Chat</p>
                <p className="text-xs text-muted-foreground">
                  Click the{' '}
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary/10 mx-0.5">
                    <MessageCircle className="h-2.5 w-2.5 text-primary" />
                  </span>{' '}
                  button in the bottom-left corner for instant AI-powered answers.
                </p>
              </div>
              <div className="flex-1 rounded-lg border bg-muted/30 p-4 space-y-1">
                <p className="text-sm font-medium">Email Support</p>
                <p className="text-xs text-muted-foreground">
                  For account issues, access problems, or anything the AI can't resolve:
                </p>
                <a
                  href={APP_INFO.support.emailHref}
                  className="text-xs font-mono text-primary underline hover:no-underline break-all"
                >
                  {APP_INFO.support.email}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attribution footer */}
      <p className="text-center text-[11px] text-muted-foreground pt-4 border-t border-border/50">
        {APP_INFO.name} v{APP_INFO.version} &nbsp;·&nbsp; {APP_COPYRIGHT}
      </p>
    </div>
  );
}
