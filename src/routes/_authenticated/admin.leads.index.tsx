import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import {
  fetchLeads,
  formatDate,
  leadsQueryKey,
  LEAD_QUALITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  INDUSTRIES,
} from "@/lib/crm";
import { fetchInterns, internsQueryKey } from "@/lib/interns";
import {
  ANY,
  DATE_FIELDS,
  DATE_PRESETS,
  SORT_FIELDS,
  defaultFilters,
  matchesFilters,
  matchesSearch,
  sortLeads,
  type DateField,
  type DatePreset,
  type SortField,
  type SortOrder,
} from "@/lib/crm-filters";

export const Route = createFileRoute("/_authenticated/admin/leads/")({
  head: () => ({
    meta: [
      { title: "Admin · All Leads — LeadNest Intern CRM" },
      {
        name: "description",
        content:
          "Company-wide lead table for admins: filter by intern, status, quality, industry, source and date.",
      },
      { property: "og:title", content: "Admin · All Leads — LeadNest Intern CRM" },
      {
        property: "og:description",
        content: "Every CRM lead with its assigned intern, quality, status and follow-up dates.",
      },
    ],
  }),
  component: AdminLeads,
});

function AdminLeads() {
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState({ ...defaultFilters });
  const [internId, setInternId] = useState(ANY);
  const [sort, setSort] = useState<SortField>("created_date");
  const [order, setOrder] = useState<SortOrder>("desc");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: leadsQueryKey,
    queryFn: fetchLeads,
  });
  const { data: interns = [] } = useQuery({ queryKey: internsQueryKey, queryFn: fetchInterns });

  const internById = useMemo(
    () => new Map(interns.map((i) => [i.id, i] as const)),
    [interns],
  );

  const set = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const rows = sortLeads(
    leads.filter((l) => {
      if (internId !== ANY) {
        const owner = l.intern_id
          ? l.intern_id
          : interns.find((i) => i.name === l.assigned_intern)?.id;
        if (owner !== internId) return false;
      }
      const searchable =
        matchesSearch(l, term) ||
        (term.trim()
          ? [internById.get(l.intern_id ?? "")?.intern_id, internById.get(l.intern_id ?? "")?.name]
              .some((v) => String(v ?? "").toLowerCase().includes(term.trim().toLowerCase()))
          : true);
      return searchable && matchesFilters(l, { ...filters, intern: ANY });
    }),
    sort,
    order,
  );

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search lead ID, company, contact, email, intern..."
              className="pl-8"
              aria-label="Search leads"
            />
          </div>

          <Select value={internId} onValueChange={setInternId}>
            <SelectTrigger className="w-48" aria-label="Filter by intern">
              <SelectValue placeholder="Intern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All interns</SelectItem>
              {interns.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.intern_id} · {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger className="w-40" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All statuses</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.quality} onValueChange={(v) => set("quality", v)}>
            <SelectTrigger className="w-36" aria-label="Filter by quality">
              <SelectValue placeholder="Quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All qualities</SelectItem>
              {LEAD_QUALITIES.map((q) => (
                <SelectItem key={q} value={q}>
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.industry} onValueChange={(v) => set("industry", v)}>
            <SelectTrigger className="w-40" aria-label="Filter by industry">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All industries</SelectItem>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.source} onValueChange={(v) => set("source", v)}>
            <SelectTrigger className="w-40" aria-label="Filter by source">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All sources</SelectItem>
              {LEAD_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.dateField}
            onValueChange={(v) => set("dateField", v as DateField)}
          >
            <SelectTrigger className="w-44" aria-label="Date field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FIELDS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.datePreset}
            onValueChange={(v) => set("datePreset", v as DatePreset)}
          >
            <SelectTrigger className="w-44" aria-label="Date range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filters.datePreset === "custom" && (
            <>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => set("from", e.target.value)}
                className="w-40"
                aria-label="From date"
              />
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => set("to", e.target.value)}
                className="w-40"
                aria-label="To date"
              />
            </>
          )}

          <Select value={sort} onValueChange={(v) => setSort(v as SortField)}>
            <SelectTrigger className="w-44" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_FIELDS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setOrder(order === "asc" ? "desc" : "asc")}>
            {order === "asc" ? "A → Z / Oldest first" : "Z → A / Newest first"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setFilters({ ...defaultFilters });
              setInternId(ANY);
              setTerm("");
            }}
          >
            Reset
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
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Intern</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Contacted</TableHead>
                    <TableHead>Next Follow-up</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((l) => {
                    const owner =
                      internById.get(l.intern_id ?? "") ??
                      interns.find((i) => i.name === l.assigned_intern);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.lead_id}</TableCell>
                        <TableCell>{l.company_name}</TableCell>
                        <TableCell>{l.contact_person}</TableCell>
                        <TableCell className="text-muted-foreground">{l.email ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{l.phone ?? "—"}</TableCell>
                        <TableCell>{l.industry ?? "—"}</TableCell>
                        <TableCell>{l.lead_source ?? "—"}</TableCell>
                        <TableCell>{l.lead_quality}</TableCell>
                        <TableCell>{l.status}</TableCell>
                        <TableCell>
                          {owner ? `${owner.intern_id} · ${owner.name}` : l.assigned_intern ?? "—"}
                        </TableCell>
                        <TableCell>{formatDate(l.created_date)}</TableCell>
                        <TableCell>{formatDate(l.last_contacted)}</TableCell>
                        <TableCell>{formatDate(l.next_follow_up)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="icon" aria-label="View lead">
                            <Link to="/leads/$leadId" params={{ leadId: l.id }}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={14} className="py-14 text-center text-muted-foreground">
                        <span className="block font-medium text-foreground">No matching leads</span>
                        <span className="mt-1 block text-sm">Try widening the current filters.</span>
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
