import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, CalendarClock, Settings, Menu, Search, UserRound, GraduationCap, History } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationBell } from "@/components/crm/NotificationBell";
import { initials, setCurrentInternId, useCurrentIntern } from "@/lib/current-intern";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { to: "/interns", label: "Interns", icon: GraduationCap },
  { to: "/activity", label: "Activity", icon: History },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-6">
        <Link to="/" onClick={onNavigate} className="block">
          <span className="text-lg font-semibold tracking-tight">Pixel AI</span>
          <span className="ml-1 text-lg font-light">Intern CRM</span>
          <p className="mt-1 text-xs text-sidebar-foreground/60">Lead management workspace</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border px-3 py-4">
        <Link
          to="/profile"
          onClick={onNavigate}
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/70"
        >
          <UserRound className="size-4" />
          Intern Profile
        </Link>
        <Link
          to="/settings"
          onClick={onNavigate}
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/70"
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </div>
    </div>
  );
}

export function CrmLayout({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="fixed inset-y-0 w-64">
          <SidebarContent />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <h1 className="truncate text-base font-semibold text-foreground md:text-lg">{title}</h1>

          <form
            className="ml-auto hidden items-center gap-2 sm:flex"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/leads", search: { q: term } });
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search leads..."
                className="w-48 pl-8 lg:w-64"
                aria-label="Search leads"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 sm:ml-3">
            <NotificationBell />
            <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {initials(intern?.name)}
            </div>
            <Select
              value={intern?.id ?? ""}
              onValueChange={(v) => setCurrentInternId(v)}
            >
              <SelectTrigger className="hidden w-40 lg:flex" aria-label="Current intern">
                <SelectValue placeholder="Select intern" />
              </SelectTrigger>
              <SelectContent>
                {interns.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
