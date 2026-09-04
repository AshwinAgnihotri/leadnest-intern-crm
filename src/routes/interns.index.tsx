import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, Eye, Pencil } from "lucide-react";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { InternFormDialog } from "@/components/crm/InternFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchLeads, leadsQueryKey, formatDate } from "@/lib/crm";
import {
  fetchInterns,
  internsQueryKey,
  internStats,
  loginBadgeClass,
  statusBadgeClass,
  formatDateTime,
  INTERN_STATUSES,
  LOGIN_STATUSES,
  type Intern,
} from "@/lib/interns";
import { ANY, DATE_PRESETS, resolveRange, type DatePreset } from "@/lib/crm-filters";

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "department", label: "Department" },
  { value: "status", label: "Status" },
  { value: "current_login_status", label: "Login Status" },
  { value: "assigned", label: "Leads Assigned" },
  { value: "converted", label: "Converted Leads" },
] as const;

type InternSort = (typeof SORT_OPTIONS)[number]["value"];

export const Route = createFileRoute("/interns/")({
  head: () => ({
    meta: [
      { title: "Interns — Pixel AI Intern CRM" },
      {
        name: "description",
        content:
          "Manage the intern team: status, login activity and lead performance for every intern.",
      },
      { property: "og:title", content: "Interns — Pixel AI Intern CRM" },
      {
        property: "og:description",
        content: "Intern directory with lead assignment and conversion performance.",
      },
    ],
  }),
  component: InternsPage,
});

function InternsPage() {
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<string>(ANY);
  const [login, setLogin] = useState<string>(ANY);
  const [preset, setPreset] = useState<DatePreset>(ANY);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<InternSort>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Intern | null>(null);

  const { data: interns = [], isLoading } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });
  const { data: leads = [] } = useQuery({ queryKey: leadsQueryKey, queryFn: fetchLeads });

  const range = resolveRange({
    datePreset: preset,
    from,
    to,
  } as Parameters<typeof resolveRange>[0]);

  const t = term.trim().toLowerCase();
  const rows = interns
    .filter((i) => {
      const matchesTerm =
        !t ||
        [i.intern_id, i.name, i.email, i.phone, i.department].some((v) =>
          String(v ?? "").toLowerCase().includes(t),
        );
      const matchesStatus = status === ANY || i.status === status;
      const matchesLogin = login === ANY || i.current_login_status === login;
      const matchesDate = !range || (i.join_date >= range.from && i.join_date <= range.to);
      return matchesTerm && matchesStatus && matchesLogin && matchesDate;
    })
    .map((i) => ({ intern: i, stats: internStats(leads, i) }))
    .sort((a, b) => {
      const dir = order === "asc" ? 1 : -1;
      if (sort === "assigned") return (a.stats.assigned - b.stats.assigned) * dir;
      if (sort === "converted") return (a.stats.converted - b.stats.converted) * dir;
      const av = String(a.intern[sort] ?? "");
      const bv = String(b.intern[sort] ?? "");
      return av.localeCompare(bv, undefined, { sensitivity: "base" }) * dir;
    });

  return (
    <CrmLayout title="Interns">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search interns by ID, name, email, phone or department"
            className="pl-8"
            aria-label="Search interns"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All statuses</SelectItem>
              {INTERN_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Login</Label>
          <Select value={login} onValueChange={setLogin}>
            <SelectTrigger className="w-36" aria-label="Filter by login status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All</SelectItem>
              {LOGIN_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Join date</Label>
          <Select value={preset} onValueChange={(v) => setPreset(v as DatePreset)}>
            <SelectTrigger className="w-44" aria-label="Filter by join date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preset === "custom" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sort by</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as InternSort)}>
            <SelectTrigger className="w-44" aria-label="Sort interns by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
          aria-label="Toggle sort order"
        >
          {order === "asc" ? "A → Z" : "Z → A"}
        </Button>

        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Intern
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No interns found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intern ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Last Logout</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="text-right">Contacted</TableHead>
                    <TableHead className="text-right">Converted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ intern, stats }) => (
                    <TableRow key={intern.id}>
                      <TableCell className="font-medium">{intern.intern_id}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{intern.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{intern.email ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{intern.department ?? "—"}</TableCell>
                      <TableCell>
                        <span className={statusBadgeClass(intern.status)}>{intern.status}</span>
                      </TableCell>
                      <TableCell>
                        <span className={loginBadgeClass(intern.current_login_status)}>
                          {intern.current_login_status}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(intern.last_login)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(intern.last_logout)}
                      </TableCell>
                      <TableCell className="text-right">{stats.assigned}</TableCell>
                      <TableCell className="text-right">{stats.contacted}</TableCell>
                      <TableCell className="text-right">{stats.converted}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" aria-label="View intern">
                            <Link to="/interns/$internId" params={{ internId: intern.id }}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit intern"
                            onClick={() => {
                              setEditing(intern);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
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

      <p className="mt-3 text-xs text-muted-foreground">
        Showing {rows.length} of {interns.length} interns · joined dates from{" "}
        {formatDate(interns[0]?.join_date)}
      </p>

      <InternFormDialog open={formOpen} onOpenChange={setFormOpen} intern={editing} />
    </CrmLayout>
  );
}
