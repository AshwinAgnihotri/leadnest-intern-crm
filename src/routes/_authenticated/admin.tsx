import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ShieldAlert, LayoutDashboard, Users, Table2, UserCog } from "lucide-react";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/interns", label: "Interns", icon: Users, exact: false },
  { to: "/admin/leads", label: "All Leads", icon: Table2, exact: false },
  { to: "/admin/users", label: "User Management", icon: UserCog, exact: false },
] as const;

function AdminLayout() {
  const { isAdmin, loading, role } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading) {
    return (
      <CrmLayout title="Admin Panel">
        <Skeleton className="h-40 w-full" />
      </CrmLayout>
    );
  }

  if (!isAdmin) {
    return (
      <CrmLayout title="Access denied">
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <ShieldAlert className="size-10 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Access denied</h2>
            <p className="text-sm text-muted-foreground">
              The Admin Panel is available to admin and owner accounts only. Your account role is
              “{role ?? "intern"}”. Your own CRM workspace is unaffected.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </CrmLayout>
    );
  }

  return (
    <CrmLayout title="Admin Panel">
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-border/70 bg-card/55 p-1.5 shadow-[var(--shadow-card)] backdrop-blur-xl">
        {tabs.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? "border-primary/25 bg-primary/10 text-primary shadow-sm"
                  : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </CrmLayout>
  );
}
