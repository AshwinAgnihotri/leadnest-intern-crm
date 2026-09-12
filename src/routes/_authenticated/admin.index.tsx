import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLeads, leadsQueryKey } from "@/lib/crm";
import { fetchInterns, internsQueryKey } from "@/lib/interns";
import { countByStatus, followUpSplit, formatMinutes, workingMinutes } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview — LeadNest Intern CRM" },
      {
        name: "description",
        content: "Company-wide CRM overview for admins and owners: interns, leads and follow-ups.",
      },
      { property: "og:title", content: "Admin Overview — LeadNest Intern CRM" },
      {
        property: "og:description",
        content: "Live totals across every intern, lead and follow-up in the CRM.",
      },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { data: interns = [], isLoading: li } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });
  const { data: leads = [], isLoading: ll } = useQuery({
    queryKey: leadsQueryKey,
    queryFn: fetchLeads,
  });

  if (li || ll) return <Skeleton className="h-48 w-full" />;

  const follow = followUpSplit(leads);
  const totalMinutes = interns.reduce((sum, i) => sum + workingMinutes(i), 0);

  const cards = [
    { label: "Total Interns", value: interns.length },
    { label: "Active Interns", value: interns.filter((i) => i.status === "Active").length },
    { label: "Total Leads", value: leads.length },
    { label: "Total Follow-ups", value: follow.upcoming + follow.overdue },
    { label: "Qualified Leads", value: countByStatus(leads, "Qualified") },
    { label: "Converted Leads", value: countByStatus(leads, "Converted") },
    { label: "Lost Leads", value: countByStatus(leads, "Lost") },
    { label: "Total Working Time", value: formatMinutes(totalMinutes) },
  ];

  return (
    <div>
      <p className="crm-kicker mb-3">Company at a glance</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="crm-card-interactive">
          <CardContent className="p-4">
            <p className="crm-kicker">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{c.value}</p>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}
