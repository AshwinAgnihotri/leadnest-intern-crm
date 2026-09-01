import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PhoneCall, Plus } from "lucide-react";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { MarkContactedDialog } from "@/components/crm/MarkContactedDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchLeads,
  leadsQueryKey,
  formatDate,
  followUpBucket,
  statusClass,
  type Lead,
} from "@/lib/crm";

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
      <CardContent className="space-y-3">
        {leads.length === 0 && (
          <p className="text-sm text-muted-foreground">No follow-ups scheduled</p>
        )}
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                to="/leads/$leadId"
                params={{ leadId: lead.id }}
                className="text-sm font-semibold hover:underline"
              >
                {lead.company_name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {lead.contact_person} · {lead.phone ?? "no phone"} · {lead.email ?? "no email"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lead.assigned_intern ?? "Unassigned"} · follow-up {formatDate(lead.next_follow_up)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={statusClass(lead.status)}>{lead.status}</span>
              <Button size="sm" variant="outline" onClick={() => onContact(lead)}>
                <PhoneCall className="size-4" />
                Mark as Contacted
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FollowUpsPage() {
  const [active, setActive] = useState<Lead | null>(null);
  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: leadsQueryKey,
    queryFn: fetchLeads,
  });

  const byBucket = (bucket: string) =>
    leads
      .filter((l) => followUpBucket(l) === bucket)
      .sort((a, b) => (a.next_follow_up! < b.next_follow_up! ? -1 : 1));

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
          <FollowUpSection title="Overdue Follow-ups" leads={overdue} onContact={setActive} />
          <FollowUpSection title="Today's Follow-ups" leads={today} onContact={setActive} />
          <FollowUpSection title="Upcoming Follow-ups" leads={upcoming} onContact={setActive} />
        </div>
      )}

      <MarkContactedDialog lead={active} onOpenChange={(o) => !o && setActive(null)} />
    </CrmLayout>
  );
}
