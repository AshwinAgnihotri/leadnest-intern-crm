import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLeads, leadsQueryKey, isFollowUpDue } from "@/lib/crm";
import { fetchInterns, internsQueryKey, leadsForIntern } from "@/lib/interns";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Intern Profile — LeadNest Intern CRM" },
      {
        name: "description",
        content: "See how many leads each intern owns and how many follow-ups are due.",
      },
      { property: "og:title", content: "Intern Profile — LeadNest Intern CRM" },
      {
        property: "og:description",
        content: "Per-intern lead workload inside the LeadNest Intern CRM.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: leads = [] } = useQuery({ queryKey: leadsQueryKey, queryFn: fetchLeads });
  const { data: interns = [] } = useQuery({ queryKey: internsQueryKey, queryFn: fetchInterns });

  return (
    <CrmLayout title="Intern Profile">
      <p className="crm-kicker mb-3">Personal workspace</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="crm-card-interactive">
          <CardHeader>
            <CardTitle className="text-base">Signed in as</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full border border-primary/20 bg-accent text-sm font-semibold text-accent-foreground shadow-[var(--shadow-action)]">
              I1
            </div>
            <div>
              <p className="font-medium">Intern 1</p>
              <p className="text-sm text-muted-foreground">Business Development Intern</p>
            </div>
          </CardContent>
        </Card>

        <Card className="crm-card-interactive">
          <CardHeader>
            <CardTitle className="text-base">Team workload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {interns.map((intern) => {
              const owned = leadsForIntern(leads, intern);
              return (
                <div key={intern.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5 text-sm">
                  <span>{intern.name}</span>
                  <span className="text-muted-foreground">
                    {owned.length} leads · {owned.filter(isFollowUpDue).length} due
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </CrmLayout>
  );
}
