import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchLeads, formatDate, leadsQueryKey } from "@/lib/crm";
import {
  fetchIntern,
  fetchInterns,
  formatDateTime,
  internsQueryKey,
  loginBadgeClass,
  statusBadgeClass,
} from "@/lib/interns";
import { activitiesQueryKey, fetchActivities } from "@/lib/activity";
import {
  allNotesQueryKey,
  fetchAllNotes,
  followUpSplit,
  formatMinutes,
  leadsOfIntern,
  workingMinutes,
} from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/interns/$internId")({
  head: () => ({
    meta: [
      { title: "Admin · Intern Details — LeadNest Intern CRM" },
      {
        name: "description",
        content: "Full work summary for one intern: leads, follow-ups, notes, activity and time.",
      },
      { property: "og:title", content: "Admin · Intern Details — LeadNest Intern CRM" },
      {
        property: "og:description",
        content: "Lead activity, follow-ups, notes, recent CRM activity and working time.",
      },
    ],
  }),
  component: AdminInternDetails,
  errorComponent: () => (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        This intern could not be loaded.
      </CardContent>
    </Card>
  ),
  notFoundComponent: () => (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">Intern not found.</CardContent>
    </Card>
  ),
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AdminInternDetails() {
  const { internId } = Route.useParams();

  const { data: intern, isLoading } = useQuery({
    queryKey: [...internsQueryKey, internId],
    queryFn: () => fetchIntern(internId),
  });
  const { data: leads = [] } = useQuery({ queryKey: leadsQueryKey, queryFn: fetchLeads });
  const { data: notes = [] } = useQuery({ queryKey: allNotesQueryKey, queryFn: fetchAllNotes });
  const { data: activities = [] } = useQuery({
    queryKey: activitiesQueryKey,
    queryFn: fetchActivities,
  });
  useQuery({ queryKey: internsQueryKey, queryFn: fetchInterns });

  if (isLoading || !intern) return <Skeleton className="h-64 w-full" />;

  const own = leadsOfIntern(leads, intern);
  const byStatus = (s: string) => own.filter((l) => l.status === s).length;
  const follow = followUpSplit(own);
  const ownNotes = notes.filter((n) => n.intern_id === intern.id);
  const ownActivities = activities.filter((a) => a.intern_id === intern.id).slice(0, 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/interns">
            <ArrowLeft className="size-4" /> All interns
          </Link>
        </Button>
        <h2 className="text-lg font-semibold text-foreground">
          {intern.name} · {intern.intern_id}
        </h2>
        <span className={statusBadgeClass(intern.status)}>{intern.status}</span>
        <span className={loginBadgeClass(intern.current_login_status)}>
          {intern.current_login_status}
        </span>
        <span className="text-sm text-muted-foreground">{intern.email ?? "—"}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lead Activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <Stat label="Total Leads" value={own.length} />
          <Stat label="New" value={byStatus("New")} />
          <Stat label="Contacted" value={byStatus("Contacted")} />
          <Stat label="Follow-up" value={byStatus("Follow-up")} />
          <Stat label="Qualified" value={byStatus("Qualified")} />
          <Stat label="Converted" value={byStatus("Converted")} />
          <Stat label="Lost" value={byStatus("Lost")} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Follow-ups</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Stat label="Upcoming" value={follow.upcoming} />
            <Stat label="Overdue" value={follow.overdue} />
            <Stat label="Completed" value={follow.completed} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Work Time</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Stat label="Last Login" value={formatDateTime(intern.last_login)} />
            <Stat label="Last Logout" value={formatDateTime(intern.last_logout)} />
            <Stat label="Total Working Time" value={formatMinutes(workingMinutes(intern))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notes created ({ownNotes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Note ID</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownNotes.slice(0, 20).map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.note_id}</TableCell>
                    <TableCell className="max-w-md truncate">{n.note_text}</TableCell>
                    <TableCell>{formatDate(n.created_date)}</TableCell>
                    <TableCell>{n.created_time?.slice(0, 5)}</TableCell>
                  </TableRow>
                ))}
                {ownNotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                      No notes yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownActivities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.action}</TableCell>
                    <TableCell>{a.lead_name ?? "—"}</TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {a.description ?? "—"}
                    </TableCell>
                    <TableCell>{formatDate(a.created_date)}</TableCell>
                    <TableCell>{a.created_time?.slice(0, 5)}</TableCell>
                  </TableRow>
                ))}
                {ownActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      No activity recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
