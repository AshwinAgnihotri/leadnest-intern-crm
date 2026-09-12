import { createFileRoute } from "@tanstack/react-router";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_QUALITIES } from "@/lib/crm";
import { useQuery } from "@tanstack/react-query";
import { fetchInterns, internsQueryKey } from "@/lib/interns";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Pixel AI Intern CRM" },
      {
        name: "description",
        content: "Reference list of the statuses, qualities, sources and interns used in the CRM.",
      },
      { property: "og:title", content: "Settings — Pixel AI Intern CRM" },
      {
        property: "og:description",
        content: "CRM configuration reference for the intern lead workspace.",
      },
    ],
  }),
  component: SettingsPage,
});

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="crm-card-interactive">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className="rounded-md border border-border/70 bg-muted/60 px-2.5 py-1 text-sm text-foreground">
            {i}
          </span>
        ))}
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  const { data: interns = [] } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });
  return (
    <CrmLayout title="Settings">
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        This MVP uses a fixed configuration. Sample leads are fictional demo data.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <List title="Lead statuses" items={[...LEAD_STATUSES]} />
        <List title="Lead qualities" items={[...LEAD_QUALITIES]} />
        <List title="Lead sources" items={LEAD_SOURCES} />
        <List title="Interns" items={interns.map((i) => `${i.intern_id} · ${i.name}`)} />
      </div>
    </CrmLayout>
  );
}
