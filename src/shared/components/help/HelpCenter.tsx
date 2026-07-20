import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
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

/** Expanded Q&A row used in search mode, where every match should be readable at once. */
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
    <div className="py-3 px-4 rounded-md border border-border/40 bg-card/50">
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
  const [activeSection, setActiveSection] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Quick-start renders as a numbered hero at the top; every other section is a
  // browsable accordion below it.
  const quickStart = roleFilteredGuides.find((s) => s.id === 'quick-start');
  const otherGuides = roleFilteredGuides.filter((s) => s.id !== 'quick-start');

  const totalMatches = search
    ? filteredGuides.reduce((sum, s) => sum + s.items.length, 0) + filteredTours.length
    : 0;

  // "/" focuses search from anywhere on the page (unless already typing somewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Scrollspy: highlight the TOC entry for the section nearest the top of the
  // viewport. Only runs while browsing — the TOC is hidden during search.
  useEffect(() => {
    if (search) return;
    const els = document.querySelectorAll('[data-help-anchor]');
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id.replace('help-section-', ''));
        }
      },
      // Consider the band just below the sticky header as "current".
      { rootMargin: '-15% 0px -65% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [search, roleFilteredGuides]);

  const tocEntries = useMemo(
    () => [
      ...(quickStart ? [{ id: quickStart.id, title: quickStart.title, icon: quickStart.icon }] : []),
      ...otherGuides.map((s) => ({ id: s.id, title: s.title, icon: s.icon })),
      ...(roleFilteredTours.length > 0
        ? [{ id: 'tours', title: 'Interactive tours', icon: Play as LucideIcon }]
        : []),
      { id: 'contact', title: 'Still need help?', icon: MessageCircle as LucideIcon },
    ],
    [quickStart, otherGuides, roleFilteredTours.length],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Help & Guides"
        description="Guides, FAQs, and quick walkthroughs for everything in the app"
      />

      {/* Search — filters guides and tours together */}
      <div className="space-y-2">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search guides and tours…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-12 h-10"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            /
          </kbd>
        </div>
        {search && (
          <p className="text-xs text-muted-foreground">
            {totalMatches === 0
              ? 'No matches.'
              : `${totalMatches} match${totalMatches === 1 ? '' : 'es'}.`}
          </p>
        )}
      </div>

      {/* ───────────── SEARCH MODE: flat, everything expanded ───────────── */}
      {search ? (
        <div className="space-y-6 max-w-3xl">
          {filteredGuides.length === 0 && filteredTours.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No guides match your search. Try a different keyword, or clear the search
                  to browse all topics.
                </p>
              </CardContent>
            </Card>
          )}
          {filteredGuides.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id}>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                  <Icon className="h-4 w-4" />
                  {section.title}
                </h2>
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
              </div>
            );
          })}
          {filteredTours.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                <Play className="h-4 w-4" />
                Interactive tours
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTours.map((tour) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    completed={completedTours.includes(tour.path)}
                    query={search}
                    onStart={() => startTourForRoute(tour.path)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ───────────── BROWSE MODE: sticky TOC + continuous page ───────────── */
        <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
          {/* Sticky table of contents (desktop) */}
          <nav
            aria-label="Help topics"
            className="hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2"
          >
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              On this page
            </p>
            <ul className="space-y-0.5">
              {tocEntries.map((entry) => {
                const active = activeSection === entry.id;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(entry.id)}
                      className={cn(
                        'w-full text-left flex items-center gap-2 rounded-md border-l-2 px-3 py-1.5 text-sm transition-colors',
                        active
                          ? 'border-l-[hsl(var(--brand-gold))] bg-accent/60 font-medium text-foreground'
                          : 'border-l-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground',
                      )}
                    >
                      <entry.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{entry.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="space-y-6 min-w-0">
            {/* Mobile: horizontal jump chips in place of the TOC */}
            <div className="lg:hidden -mx-1 overflow-x-auto">
              <div className="flex gap-1.5 px-1 pb-1 w-max">
                {tocEntries.map((entry) => (
                  <Button
                    key={entry.id}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 gap-1.5 shrink-0"
                    onClick={() => scrollToSection(entry.id)}
                  >
                    <entry.icon className="h-3 w-3 text-muted-foreground" />
                    {entry.title}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick-start hero */}
            {quickStart && (
              <Card
                id={`help-section-${quickStart.id}`}
                data-help-anchor
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
                      <li
                        key={idx}
                        className="flex gap-3 py-2 px-3 rounded-md bg-background/60 border border-border/40"
                      >
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

            {/* Guide sections — collapsed accordions so 70 answers scan as 70 questions */}
            {otherGuides.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  id={`help-section-${section.id}`}
                  data-help-anchor
                  className="scroll-mt-24"
                >
                  <CardHeader className="pb-1">
                    <CardTitle className="flex items-center gap-3 text-base">
                      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span>{section.title}</span>
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
                  <CardContent className="pt-0 pb-2">
                    <Accordion type="multiple">
                      {section.items.map((item, idx) => (
                        <AccordionItem
                          key={idx}
                          value={`${section.id}-${idx}`}
                          className={idx === section.items.length - 1 ? 'border-b-0' : undefined}
                        >
                          <AccordionTrigger className="py-3 text-sm font-medium text-left hover:no-underline hover:text-primary [&>svg]:shrink-0">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}

            {/* Interactive tours */}
            {roleFilteredTours.length > 0 && (
              <section id="help-section-tours" data-help-anchor className="scroll-mt-24 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">Interactive tours</h2>
                    <p className="text-xs text-muted-foreground">
                      Walkthroughs that run on the actual page, calling out each control — or
                      press the <span className="font-medium text-foreground">?</span> button in
                      the bottom-right corner of any page.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {roleFilteredTours.map((tour) => (
                    <TourCard
                      key={tour.id}
                      tour={tour}
                      completed={completedTours.includes(tour.path)}
                      query=""
                      onStart={() => startTourForRoute(tour.path)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Contact & Support */}
            <Card id="help-section-contact" data-help-anchor className="border-border/60 scroll-mt-24">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Still need help?
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-md border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm font-medium">Email support</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    For account problems or anything these guides don't cover:
                  </p>
                  <a
                    href={APP_INFO.support.emailHref}
                    className="text-xs font-mono text-primary underline-offset-2 hover:underline mt-1.5 inline-block break-all"
                  >
                    {APP_INFO.support.email}
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Attribution footer */}
      <p className="text-center text-[11px] text-muted-foreground pt-4 border-t border-border/50">
        {APP_INFO.name} v{APP_INFO.version} &nbsp;·&nbsp; {APP_COPYRIGHT}
      </p>
    </div>
  );
}

function TourCard({
  tour,
  completed,
  query,
  onStart,
}: {
  tour: (typeof allTours)[number];
  completed: boolean;
  query: string;
  onStart: () => void;
}) {
  const Icon = tourIcons[tour.id] || BookOpen;
  return (
    <Card
      className="cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors group"
      onClick={onStart}
    >
      <CardContent className="py-4 px-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate">{highlight(tour.title, query)}</h3>
              {completed && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {highlight(tour.description, query)}
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
}
