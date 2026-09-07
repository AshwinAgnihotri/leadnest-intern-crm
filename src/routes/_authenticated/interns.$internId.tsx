import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { InternFormDialog } from "@/components/crm/InternFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchLeads, leadsQueryKey, formatDate, statusClass } from "@/lib/crm";
import {
  fetchInterns,
  internsQueryKey,
  internStats,
  leadsForIntern,
  loginBadgeClass,
  statusBadgeClass,
  formatDateTime,
} from "@/lib/interns";

export const Route = createFileRoute("/_authenticated/interns/$internId")({
  head: () => ({
    meta: [
      { title: "Intern Profile — Pixel AI Intern CRM" },
      {
        name: "description",
        content: "Personal details, CRM performance and login activity for a single intern.",
      },
      { property: "og:title", content: "Intern Profile — Pixel AI Intern CRM" },
      {
        property: "og:description",
        content: "Intern details with assigned, contacted and converted lead counts.",
      },
    ],
  }),
  component: InternProfilePage,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function InternProfilePage() {
  const { internId } = useParams({ from: "/interns/$internId" });
  const [editOpen, setEditOpen] = useState(false);

  const { data: interns = [], isLoading } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });
  const { data: leads = [] } = useQuery({ queryKey: leadsQueryKey, queryFn: fetchLeads });

  const intern = interns.find((i) => i.id === internId);

  if (isLoading) {
    return (
      <CrmLayout title="Intern Profile">
        <Skeleton className="h-64 w-full" />
      </CrmLayout>
    );
  }

  if (!intern) {
    return (
      <CrmLayout title="Intern Profile">
        <p className="text-sm text-muted-foreground">Intern not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/interns">Back to interns</Link>
        </Button>
      </CrmLayout>
    );
  }

  const stats = internStats(leads, intern);
  const own = leadsForIntern(leads, intern);

  return (
    <CrmLayout title={`${intern.intern_id} · ${intern.name}`}>
      <div className="mb-4 flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/interns">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Intern ID" value={intern.intern_id} />
            <Row label="Name" value={intern.name} />
            <Row label="Email" value={intern.email ?? "—"} />
            <Row label="Phone" value={intern.phone ?? "—"} />
            <Row label="Department" value={intern.department ?? "—"} />
            <Row label="Join Date" value={formatDate(intern.join_date)} />
            <Row
              label="Status"
              value={<span className={statusBadgeClass(intern.status)}>{intern.status}</span>}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">CRM Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Leads Assigned" value={stats.assigned} />
            <Row label="Leads Contacted" value={stats.contacted} />
            <Row label="Follow-ups" value={stats.followUps} />
            <Row label="Qualified Leads" value={stats.qualified} />
            <Row label="Converted Leads" value={stats.converted} />
            <Row label="Lost Leads" value={stats.lost} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Work Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Row
              label="Login Status"
              value={
                <span className={loginBadgeClass(intern.current_login_status)}>
                  {intern.current_login_status}
                </span>
              }
            />
            <Row label="Current Login Time" value={formatDateTime(intern.current_login_time)} />
            <Row label="Last Login" value={formatDateTime(intern.last_login)} />
            <Row label="Last Logout" value={formatDateTime(intern.last_logout)} />
            <p className="pt-3 text-xs text-muted-foreground">
              Work-time tracking arrives in the next phase.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Assigned Leads ({own.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {own.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No leads assigned yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Contacted</TableHead>
                    <TableHead>Next Follow-up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {own.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <Link to="/leads/$leadId" params={{ leadId: lead.id }} className="underline-offset-2 hover:underline">
                          {lead.lead_id}
                        </Link>
                      </TableCell>
                      <TableCell>{lead.company_name}</TableCell>
                      <TableCell>{lead.contact_person}</TableCell>
                      <TableCell>
                        <span className={statusClass(lead.status)}>{lead.status}</span>
                      </TableCell>
                      <TableCell>{formatDate(lead.last_contacted)}</TableCell>
                      <TableCell>{formatDate(lead.next_follow_up)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <InternFormDialog open={editOpen} onOpenChange={setEditOpen} intern={intern} />
    </CrmLayout>
  );
}
