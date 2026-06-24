import { useMemo, useState } from 'react';
import { APP_INFO, APP_COPYRIGHT } from '@/lib/appInfo';
import {
  Play, BookOpen, Building2, AlertTriangle, Gavel, KeyRound,
  Package2, Users, LayoutDashboard, ClipboardList, Warehouse,
  CheckCircle2, Search, LucideIcon, MessageCircle, ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

/**
 * Split text on case-insensitive matches of `query` and wrap matches in <mark>.
 * Empty query short-circuits to the original string. Used for live search
 * highlighting on FAQ questions + answers.
 */
function highlight(text: string, query: string) {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const parts: Array<{ value: string; match: boolean }> = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx === -1) {
      parts.push({ value: text.slice(i), match: false });
      break;
    }
    if (idx > i) parts.push({ value: text.slice(i, idx), match: false });
    parts.push({ value: text.slice(idx, idx + ql.length), match: true });
    i = idx + ql.length;
  }
  return parts.map((p, k) =>
    p.match ? (
      <mark
        key={k}
        className="bg-amber-200/40 dark:bg-amber-300/15 text-foreground rounded-sm px-0.5"
      >
        {p.value}
      </mark>
    ) : (
      <span key={k}>{p.value}</span>
    ),
  );
}

function FAQItem({
  question,
  answer,
  query,
}: {
  question: string;
  answer: string;
  query: string;
}) {
  return (
    <div className="py-3 px-4 rounded-md border border-border/40 bg-card/50 hover:border-border/70 transition-colors">
      <p className="text-sm font-medium text-foreground">{highlight(question, query)}</p>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
        {highlight(answer, query)}
      </p>
    </div>
  );
}

function scrollToSection(id: string) {
  const el = document.getElementById(`help-section-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function HelpCenter() {
  const { startTourForRoute } = useTour();
  const { userRole } = useRolePermissions();
  const [search, setSearch] = useState('');

  const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]');

  // Filter tours based on user role.
  const allowedTourIds = getToursForRole(userRole);
  const roleFilteredTours = allTours.filter((tour) => allowedTourIds.includes(tour.id));

  const filteredTours = useMemo(() => {
    if (!search) return roleFilteredTours;
    const q = search.toLowerCase();
    return roleFilteredTours.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [roleFilteredTours, search]);

  // Hide guide items the current role can't act on, then optionally narrow by search.
  const roleFilteredGuides = useMemo(
    () => filterGuidesForRole(guideSections, userRole),
    [userRole],
  );

  const filteredGuides = useMemo(() => {
    if (!search) return roleFilteredGuides;
    const q = search.toLowerCase();
    return roleFilteredGuides
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [roleFilteredGuides, search]);

  // Pull the quick-start section out so we can render it as a hero card at the top
  // and skip it in the main loop. If a role filter excludes it (unlikely), the
  // header hides naturally.
  const quickStart = roleFilteredGuides.find((s) => s.id === 'quick-start');
  const otherGuides = filteredGuides.filter((s) => s.id !== 'quick-start');
  // For search, quick-start participates like every other section.
  const quickStartMatchesSearch =
    !!search &&
    !!quickStart &&
    filteredGuides.some((s) => s.id === 'quick-start');

  const totalMatches = search
    ? filteredGuides.reduce((sum, s) => sum + s.items.length, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground mt-1">
          Guides, FAQs, and quick walkthroughs for everything in the app.
        </p>
      </div>

      {/* Shared search — filters BOTH tabs */}
      <div className="space-y-2">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guides and tours…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        {search && (
          <p className="text-xs text-muted-foreground">
            {totalMatches === 0
              ? 'No matches.'
              : `${totalMatches} match${totalMatches === 1 ? '' : 'es'} in ${filteredGuides.length} ${
                  filteredGuides.length === 1 ? 'topic' : 'topics'
                }.`}
          </p>
        )}
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList>
          <TabsTrigger value="faq">Guides &amp; FAQ</TabsTrigger>
          <TabsTrigger value="tours">Interactive tours</TabsTrigger>
        </TabsList>

        {/* ─────────── FAQ TAB ─────────── */}
        <TabsContent value="faq" className="space-y-6">
          {/* Quick-start hero — skipped while searching to keep results focused */}
          {!search && quickStart && (
            <Card
              id={`help-section-${quickStart.id}`}
              className="border-primary/30 bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent scroll-mt-24"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <quickStart.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{quickStart.title}</CardTitle>
                    {quickStart.blurb && (
                      <p className="text-sm text-muted-foreground mt-0.5">{quickStart.blurb}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <ol className="space-y-2">
                  {quickStart.items.map((item, idx) => (
                    <li key={idx} className="flex gap-3 py-2 px-3 rounded-md bg-background/60 border border-border/40">
                      <span className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">
                          {item.question.replace(/^\d+\.\s*/, '')}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Jump-to-section chip strip (no chips when searching — context is the result list) */}
          {!search && otherGuides.length > 1 && (
            <div className="hidden md:block">
              <div className="flex flex-wrap gap-1.5 -mt-1">
                {otherGuides.map((s) => (
                  <Button
                    key={s.id}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 gap-1.5"
                    onClick={() => scrollToSection(s.id)}
                  >
                    <s.icon className="h-3 w-3 text-muted-foreground" />
                    {s.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          {filteredGuides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No guides match your search. Try a different keyword, or clear the search to
                  browse all topics.
                </p>
              </CardContent>
            </Card>
          ) : (
            (search ? filteredGuides : otherGuides).map((section) => {
              // While searching, render quick-start the same way as other sections so its
              // matches are visible inline alongside everything else.
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  id={`help-section-${section.id}`}
                  className="scroll-mt-24"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-base">
                      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span>{highlight(section.title, search)}</span>
                        {section.blurb && (
                          <p className="text-xs font-normal text-muted-foreground mt-0.5">
                            {section.blurb}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {section.items.length}{' '}
                        {section.items.length === 1 ? 'topic' : 'topics'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <div className="space-y-2">
                      {section.items.map((item, idx) => (
                        <FAQItem
                          key={idx}
                          question={item.question}
                          answer={item.answer}
                          query={search}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ─────────── TOURS TAB ─────────── */}
        <TabsContent value="tours" className="space-y-6">
          <Card className="border-primary/20 bg-primary/[0.04]">
            <CardContent className="flex items-start gap-4 py-5">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Page-specific walkthroughs</h3>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  Tours run on the actual page they describe, calling out each control as
                  it appears. You can also launch one anytime by clicking the{' '}
                  <span className="font-medium text-foreground">?</span> button in the
                  bottom-right corner of any page.
                </p>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Tours available for your role
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTours.map((tour) => {
                const Icon = tourIcons[tour.id] || BookOpen;
                const isCompleted = completedTours.includes(tour.path);
                return (
                  <Card
                    key={tour.id}
                    className="cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors group"
                    onClick={() => startTourForRoute(tour.path)}
                  >
                    <CardContent className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                          <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold truncate">
                              {highlight(tour.title, search)}
                            </h3>
                            {isCompleted && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {highlight(tour.description, search)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {tour.steps.length} steps
                            </Badge>
                            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Start tour <ArrowRight className="h-3 w-3" />
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
      </Tabs>

      {/* Contact & Support */}
      {!search && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5 text-primary" />
              Still need help?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-md border border-border/60 bg-muted/30 p-4">
                <p className="text-sm font-medium">AI support chat</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Click the chat bubble in the bottom-left of any page for instant answers
                  about how to do something in the app.
                </p>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/30 p-4">
                <p className="text-sm font-medium">Email support</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  For account problems or anything urgent the chat can't resolve:
                </p>
                <a
                  href={APP_INFO.support.emailHref}
                  className="text-xs font-mono text-primary underline-offset-2 hover:underline mt-1.5 inline-block break-all"
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
