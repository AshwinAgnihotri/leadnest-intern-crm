import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PhoneCall, Plus } from "lucide-react";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { MarkContactedDialog } from "@/components/crm/MarkContactedDialog";
import { SortControls } from "@/components/crm/SortControls";
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
import {
  fetchLeads,
  leadsQueryKey,
  formatDate,
  followUpBucket,
  statusClass,
  type Lead,
} from "@/lib/crm";
import { sortLeads, type SortField, type SortOrder } from "@/lib/crm-filters";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups — Pixel AI Intern CRM" },
      {
        name: "description",
        content: "See today's, upcoming and overdue lead follow-ups and mark leads as contacted.",
      },
      { property: "og:title", content: "Follow-ups — Pixel AI Intern CRM" },
      {
        property: "og:description",
        content: "Stay on top of overdue and upcoming lead follow-ups.",
      },
    ],
  }),
  component: FollowUpsPage,
});

function FollowUpSection({
  title,
  leads,
  onContact,
}: {
  title: string;
  leads: Lead[];
  onContact: (lead: Lead) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title} <span className="text-muted-foreground">({leads.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        {leads.length === 0 ? (
          <p className="px-6 text-sm text-muted-foreground">No follow-ups in this bucket</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Intern</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      <Link
                        to="/leads/$leadId"
                        params={{ leadId: lead.id }}
                        className="hover:underline"
                      >
                        {lead.company_name}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{lead.contact_person}</TableCell>
                    <TableCell>
                      <span className={statusClass(lead.status)}>{lead.status}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {lead.assigned_intern ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(lead.next_follow_up)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => onContact(lead)}>
                          <PhoneCall className="size-4" />
                          Mark as Contacted
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FollowUpsPage() {
  const [active, setActive] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<SortField>("next_follow_up");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: leadsQueryKey,
    queryFn: fetchLeads,
  });

  const byBucket = (bucket: string) =>
    sortLeads(
      leads.filter((l) => followUpBucket(l) === bucket),
      sortField,
      sortOrder,
    );

  const today = byBucket("today");
  const upcoming = byBucket("upcoming");
  const overdue = byBucket("overdue");

  return (
    <CrmLayout title="Follow-ups">
      {isError && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load leads. Please refresh the page.
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <SortControls
          field={sortField}
          order={sortOrder}
          onFieldChange={setSortField}
          onOrderChange={setSortOrder}
          fields={[
            "company_name",
            "contact_person",
            "assigned_intern",
            "next_follow_up",
            "last_contacted",
          ]}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-muted-foreground">No follow-ups scheduled</p>
            <Button asChild>
              <Link to="/leads" search={{ q: "" }}>
                <Plus className="size-4" />
                Add Your First Lead
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <FollowUpSection title="Overdue" leads={overdue} onContact={setActive} />
          <FollowUpSection title="Today" leads={today} onContact={setActive} />
          <FollowUpSection title="Upcoming" leads={upcoming} onContact={setActive} />
        </div>
      )}

      <MarkContactedDialog lead={active} onOpenChange={(o) => !o && setActive(null)} />
    </CrmLayout>
  );
}
