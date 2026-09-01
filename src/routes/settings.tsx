import { createFileRoute } from "@tanstack/react-router";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INTERNS, LEAD_SOURCES, LEAD_STATUSES, LEAD_QUALITIES } from "@/lib/crm";

export const Route = createFileRoute("/settings")({
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className="rounded-md bg-muted px-2.5 py-1 text-sm text-foreground">
            {i}
          </span>
        ))}
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  return (
    <CrmLayout title="Settings">
      <p className="mb-4 text-sm text-muted-foreground">
        This MVP uses a fixed configuration. Sample leads are fictional demo data.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <List title="Lead statuses" items={[...LEAD_STATUSES]} />
        <List title="Lead qualities" items={[...LEAD_QUALITIES]} />
        <List title="Lead sources" items={LEAD_SOURCES} />
        <List title="Interns" items={INTERNS} />
      </div>
    </CrmLayout>
  );
}
