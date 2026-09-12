import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Users,
  Sparkles,
  PhoneCall,
  CalendarClock,
  BadgeCheck,
  Trophy,
  XCircle,
  ArrowRight,
  Plus,
  StickyNote,
  History,
} from "lucide-react";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { SortControls } from "@/components/crm/SortControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  fetchLeads,
  leadsQueryKey,
  formatDate,
  isFollowUpDue,
  statusClass,
  qualityClass,
  countBy,
  LEAD_STATUSES,
  LEAD_QUALITIES,
  LEAD_SOURCES,
  type Lead,
} from "@/lib/crm";
import { sortLeads, type SortField, type SortOrder } from "@/lib/crm-filters";
import {
  fetchInterns,
  internsQueryKey,
  internStats,
  loginBadgeClass,
  statusBadgeClass,
} from "@/lib/interns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link as RouterLink } from "@tanstack/react-router";
import { useCurrentIntern } from "@/lib/current-intern";
import { activitiesQueryKey, fetchActivities, formatTime } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — LeadNest Intern CRM" },
      {
        name: "description",
        content:
          "Track leads, follow-ups and conversions at a glance in the LeadNest Intern CRM dashboard.",
      },
      { property: "og:title", content: "Dashboard — LeadNest Intern CRM" },
      {
        property: "og:description",
        content: "Lead statistics, recent leads and upcoming follow-ups for interns.",
      },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  loading: boolean;
}) {
  return (
    <Card className="crm-card-interactive overflow-hidden">
      <CardContent className="relative flex items-center gap-4 p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/70 to-transparent" />
        <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-10" />
          ) : (
            <p className="text-3xl font-semibold text-foreground">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownList({ items, total }: { items: { name: string; value: number }[]; total: number }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-foreground">{item.name}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${total ? (item.value / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardPage() {
  const { intern } = useCurrentIntern();
  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: leadsQueryKey,
    queryFn: fetchLeads,
    select: activeLeads,
  });

  const { data: interns = [] } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });
  const { data: activities = [] } = useQuery({
    queryKey: activitiesQueryKey,
    queryFn: fetchActivities,
  });

  const [recentField, setRecentField] = useState<SortField>("created_date");
  const [recentOrder, setRecentOrder] = useState<SortOrder>("desc");
  const [followField, setFollowField] = useState<SortField>("next_follow_up");
  const [followOrder, setFollowOrder] = useState<SortOrder>("asc");

  const count = (status: string) => leads.filter((l: Lead) => l.status === status).length;
  const due = leads.filter(isFollowUpDue);

  const recent = sortLeads(leads, recentField, recentOrder).slice(0, 5);
  const upcoming = sortLeads(
    leads.filter((l) => l.next_follow_up),
    followField,
    followOrder,
  ).slice(0, 5);

  const internRows = interns
    .map((intern) => ({ intern, stats: internStats(leads, intern) }))
    .sort((a, b) => b.stats.assigned - a.stats.assigned);

  const sourceItems = LEAD_SOURCES.map((s) => ({
    name: s,
    value: leads.filter((l) => l.lead_source === s).length,
  }));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = intern?.name?.trim().split(/\s+/)[0] ?? "there";

  return (
    <CrmLayout title="Dashboard">
      {isError && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load leads. Please refresh the page.
        </p>
      )}

      <section className="mb-7 flex flex-col gap-5 rounded-xl border border-border/70 bg-card/55 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-7">
        <div>
          <p className="crm-kicker">Today at LeadNest</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl">
            {greeting}, {firstName} <span aria-hidden>👋</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your leads today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/leads" search={{ q: "" }}><Plus className="size-4" /> Add lead</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/follow-ups"><CalendarClock className="size-4" /> Follow-ups</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/leads" search={{ q: "" }}>View leads <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </section>

      <p className="crm-kicker mb-3">Pipeline at a glance</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Leads" value={leads.length} icon={Users} loading={isLoading} />
        <StatCard label="New Leads" value={count("New")} icon={Sparkles} loading={isLoading} />
        <StatCard label="Follow-ups Due" value={due.length} icon={CalendarClock} loading={isLoading} />
        <StatCard label="Qualified" value={count("Qualified")} icon={BadgeCheck} loading={isLoading} />
        <StatCard label="Converted" value={count("Converted")} icon={Trophy} loading={isLoading} />
        <StatCard label="Lost" value={count("Lost")} icon={XCircle} loading={isLoading} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="crm-card-interactive">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Recent Leads</CardTitle>
            <div className="flex items-center gap-2">
              <SortControls
                field={recentField}
                order={recentOrder}
                onFieldChange={setRecentField}
                onOrderChange={setRecentOrder}
                fields={["company_name", "contact_person", "industry", "location", "assigned_intern", "created_date", "last_updated"]}
              />
              <Button asChild variant="ghost" size="sm">
                <Link to="/leads" search={{ q: "" }}>View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <Skeleton className="h-24 w-full" />}
            {!isLoading && recent.length === 0 && (
              <p className="text-sm text-muted-foreground">No leads found</p>
            )}
            {recent.map((lead) => (
              <Link
                key={lead.id}
                to="/leads/$leadId"
                params={{ leadId: lead.id }}
                className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 transition-all hover:border-primary/25 hover:bg-accent/35"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{lead.company_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.lead_id} · {lead.contact_person}
                  </p>
                </div>
                <span className={statusClass(lead.status)}>{lead.status}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="crm-card-interactive">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
            <div className="flex items-center gap-2">
              <SortControls
                field={followField}
                order={followOrder}
                onFieldChange={setFollowField}
                onOrderChange={setFollowOrder}
                fields={["company_name", "contact_person", "assigned_intern", "next_follow_up"]}
              />
              <Button asChild variant="ghost" size="sm">
                <Link to="/follow-ups">Open</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <Skeleton className="h-24 w-full" />}
            {!isLoading && upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">No follow-ups scheduled</p>
            )}
            {upcoming.map((lead) => (
              <Link
                key={lead.id}
                to="/leads/$leadId"
                params={{ leadId: lead.id }}
                className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 transition-all hover:border-primary/25 hover:bg-accent/35"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{lead.company_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.assigned_intern ?? "Unassigned"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(lead.next_follow_up)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="crm-card-interactive">
          <CardHeader>
            <CardTitle className="text-base">Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList
              items={countBy(leads, (l) => l.status, LEAD_STATUSES as unknown as string[])}
              total={leads.length}
            />
          </CardContent>
        </Card>

        <Card className="crm-card-interactive">
          <CardHeader>
            <CardTitle className="text-base">Quality Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {countBy(leads, (l) => l.lead_quality, LEAD_QUALITIES as unknown as string[]).map(
              (item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className={qualityClass(item.name)}>{item.name}</span>
                  <span className="text-sm text-muted-foreground">{item.value} leads</span>
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card className="crm-card-interactive lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lead Source Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList items={sourceItems} total={leads.length} />
          </CardContent>
        </Card>

        <Card className="crm-card-interactive lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <p className="crm-kicker">Live workspace</p>
              <CardTitle className="mt-1 text-base">Recent Activity</CardTitle>
            </div>
            <History className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex gap-3 rounded-lg border border-border/60 p-3">
                <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <StickyNote className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{activity.description ?? activity.action}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activity.intern_name ?? "CRM user"} · {formatTime(activity.created_time)}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">No activity recorded yet.</p>}
          </CardContent>
        </Card>
      </div>

      <p className="crm-kicker mb-3 mt-8">Team overview</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total Interns" value={interns.length} icon={Users} loading={isLoading} />
        <StatCard
          label="Active Interns"
          value={interns.filter((i) => i.status === "Active").length}
          icon={BadgeCheck}
          loading={isLoading}
        />
        <StatCard
          label="Online"
          value={interns.filter((i) => i.current_login_status === "Online").length}
          icon={Sparkles}
          loading={isLoading}
        />
        <StatCard
          label="Offline"
          value={interns.filter((i) => i.current_login_status !== "Online").length}
          icon={XCircle}
          loading={isLoading}
        />
        <StatCard
          label="Leads Assigned"
          value={internRows.reduce((n, r) => n + r.stats.assigned, 0)}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          label="Leads Contacted"
          value={internRows.reduce((n, r) => n + r.stats.contacted, 0)}
          icon={PhoneCall}
          loading={isLoading}
        />
        <StatCard
          label="Converted"
          value={internRows.reduce((n, r) => n + r.stats.converted, 0)}
          icon={Trophy}
          loading={isLoading}
        />
      </div>

      <Card className="mt-4">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Intern Performance</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <RouterLink to="/interns">View all</RouterLink>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intern</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead className="text-right">Leads Assigned</TableHead>
                  <TableHead className="text-right">Contacted</TableHead>
                  <TableHead className="text-right">Converted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {internRows.map(({ intern, stats }) => (
                  <TableRow key={intern.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      <RouterLink
                        to="/interns/$internId"
                        params={{ internId: intern.id }}
                        className="underline-offset-2 hover:underline"
                      >
                        {intern.intern_id} · {intern.name}
                      </RouterLink>
                    </TableCell>
                    <TableCell>
                      <span className={statusBadgeClass(intern.status)}>{intern.status}</span>
                    </TableCell>
                    <TableCell>
                      <span className={loginBadgeClass(intern.current_login_status)}>
                        {intern.current_login_status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{stats.assigned}</TableCell>
                    <TableCell className="text-right">{stats.contacted}</TableCell>
                    <TableCell className="text-right">{stats.converted}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </CrmLayout>
  );
}
