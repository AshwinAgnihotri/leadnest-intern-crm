import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Eye } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { activeLeads, fetchLeads, leadsQueryKey } from "@/lib/crm";
import {
  fetchInterns,
  internsQueryKey,
  internStats,
  statusBadgeClass,
  loginBadgeClass,
} from "@/lib/interns";
import { ANY } from "@/lib/crm-filters";
import { formatMinutes, workingMinutes } from "@/lib/admin";

const SORTS = [
  { value: "name", label: "Name" },
  { value: "intern_id", label: "Intern ID" },
  { value: "assigned", label: "Total Leads" },
  { value: "converted", label: "Converted" },
  { value: "time", label: "Working Time" },
] as const;

type SortKey = (typeof SORTS)[number]["value"];

export const Route = createFileRoute("/_authenticated/admin/interns/")({
  head: () => ({
    meta: [
      { title: "Admin · Interns — LeadNest Intern CRM" },
      {
        name: "description",
        content: "Every intern with lead performance, follow-ups and working time.",
      },
      { property: "og:title", content: "Admin · Interns — LeadNest Intern CRM" },
      {
        property: "og:description",
        content: "Admin view of all interns and their CRM performance.",
      },
    ],
  }),
  component: AdminInterns,
});

function AdminInterns() {
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState(ANY);
  const [sort, setSort] = useState<SortKey>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const { data: interns = [], isLoading } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });
  const { data: leads = [] } = useQuery({ queryKey: leadsQueryKey, queryFn: fetchLeads, select: activeLeads });

  const t = term.trim().toLowerCase();
  const rows = interns
    .filter(
      (i) =>
        (!t ||
          [i.name, i.intern_id, i.email, i.department].some((v) =>
            String(v ?? "").toLowerCase().includes(t),
          )) &&
        (status === ANY || i.status === status),
    )
    .map((i) => ({ intern: i, stats: internStats(leads, i), minutes: workingMinutes(i) }))
    .sort((a, b) => {
      const dir = order === "asc" ? 1 : -1;
      if (sort === "assigned") return (a.stats.assigned - b.stats.assigned) * dir;
      if (sort === "converted") return (a.stats.converted - b.stats.converted) * dir;
      if (sort === "time") return (a.minutes - b.minutes) * dir;
      return (
        String(a.intern[sort] ?? "").localeCompare(String(b.intern[sort] ?? ""), undefined, {
          sensitivity: "base",
        }) * dir
      );
    });

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search name, intern ID, email..."
              className="pl-8"
              aria-label="Search interns"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-44" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setOrder(order === "asc" ? "desc" : "asc")}>
            {order === "asc" ? "A → Z / Oldest first" : "Z → A / Newest first"}
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="m-4 h-40" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intern</TableHead>
                    <TableHead>Intern ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Contacted</TableHead>
                    <TableHead className="text-right">Follow-ups</TableHead>
                    <TableHead className="text-right">Qualified</TableHead>
                    <TableHead className="text-right">Converted</TableHead>
                    <TableHead className="text-right">Working Time</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ intern, stats, minutes }) => (
                    <TableRow key={intern.id}>
                      <TableCell className="font-medium">{intern.name}</TableCell>
                      <TableCell>{intern.intern_id}</TableCell>
                      <TableCell className="text-muted-foreground">{intern.email ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <span className={statusBadgeClass(intern.status)}>{intern.status}</span>
                          <span className={loginBadgeClass(intern.current_login_status)}>
                            {intern.current_login_status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{stats.assigned}</TableCell>
                      <TableCell className="text-right">{stats.contacted}</TableCell>
                      <TableCell className="text-right">{stats.followUps}</TableCell>
                      <TableCell className="text-right">{stats.qualified}</TableCell>
                      <TableCell className="text-right">{stats.converted}</TableCell>
                      <TableCell className="text-right">{formatMinutes(minutes)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" aria-label="View intern">
                          <Link to="/admin/interns/$internId" params={{ internId: intern.id }}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="py-14 text-center text-muted-foreground">
                        <span className="block font-medium text-foreground">No matching interns</span>
                        <span className="mt-1 block text-sm">Try changing the search or status filter.</span>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
