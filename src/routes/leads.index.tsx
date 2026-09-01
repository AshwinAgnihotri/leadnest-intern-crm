import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, Filter, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  deleteLead,
  leadsQueryKey,
  formatDate,
  statusClass,
  qualityClass,
  INDUSTRIES,
  INTERNS,
  LEAD_QUALITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  type Lead,
} from "@/lib/crm";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/leads/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Leads — Pixel AI Intern CRM" },
      {
        name: "description",
        content: "Browse, search and filter every business lead collected by the intern team.",
      },
      { property: "og:title", content: "Leads — Pixel AI Intern CRM" },
      {
        property: "og:description",
        content: "A searchable table of all leads with quality, status and follow-up tracking.",
      },
    ],
  }),
  component: LeadsPage,
});

const ANY = "__any__";

function LeadsPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    quality: ANY,
    status: ANY,
    industry: ANY,
    intern: ANY,
    source: ANY,
  });

  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: leadsQueryKey,
    queryFn: fetchLeads,
  });

  const removeMutation = useMutation({
    mutationFn: (lead: Lead) => deleteLead(lead.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKey });
      toast.success("Lead deleted successfully");
      setToDelete(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const term = q.trim().toLowerCase();
  const filtered = leads.filter((lead) => {
    const matchesTerm =
      !term ||
      [lead.company_name, lead.contact_person, lead.email ?? "", lead.lead_id].some((v) =>
        v.toLowerCase().includes(term),
      );
    const f = filters;
    return (
      matchesTerm &&
      (f.quality === ANY || lead.lead_quality === f.quality) &&
      (f.status === ANY || lead.status === f.status) &&
      (f.industry === ANY || lead.industry === f.industry) &&
      (f.intern === ANY || lead.assigned_intern === f.intern) &&
      (f.source === ANY || lead.lead_source === f.source)
    );
  });

  const activeFilters = Object.values(filters).filter((v) => v !== ANY).length;

  const filterSelect = (
    key: keyof typeof filters,
    label: string,
    options: readonly string[],
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={filters[key]}
        onValueChange={(v) => setFilters((prev) => ({ ...prev, [key]: v }))}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <CrmLayout title="Leads">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => navigate({ to: "/leads", search: { q: e.target.value } })}
            placeholder="Search by company, contact, email or lead ID"
            className="pl-8"
            aria-label="Search leads"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="size-4" />
              Filter{activeFilters ? ` (${activeFilters})` : ""}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3" align="end">
            {filterSelect("quality", "Lead quality", LEAD_QUALITIES)}
            {filterSelect("status", "Status", LEAD_STATUSES)}
            {filterSelect("industry", "Industry", INDUSTRIES)}
            {filterSelect("intern", "Assigned intern", INTERNS)}
            {filterSelect("source", "Lead source", LEAD_SOURCES)}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() =>
                setFilters({ quality: ANY, status: ANY, industry: ANY, intern: ANY, source: ANY })
              }
            >
              Clear filters
            </Button>
          </PopoverContent>
        </Popover>

        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Lead
        </Button>
      </div>

      {isError && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load leads. Please refresh the page.
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">No leads found</p>
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add Your First Lead
              </Button>
            </div>
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
                    <TableHead>Location</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Intern</TableHead>
                    <TableHead>Last Contacted</TableHead>
                    <TableHead>Next Follow-up</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.lead_id}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {lead.company_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{lead.contact_person}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.email ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.phone ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.industry ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.location ?? "—"}</TableCell>
                      <TableCell>
                        <span className={qualityClass(lead.lead_quality)}>{lead.lead_quality}</span>
                      </TableCell>
                      <TableCell>
                        <span className={statusClass(lead.status)}>{lead.status}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {lead.assigned_intern ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(lead.last_contacted)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(lead.next_follow_up)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" aria-label="View lead">
                            <Link to="/leads/$leadId" params={{ leadId: lead.id }}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit lead"
                            onClick={() => {
                              setEditing(lead);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete lead"
                            onClick={() => setToDelete(lead)}
                          >
                            <Trash2 className="size-4 text-destructive" />
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

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={editing} />

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.company_name} ({toDelete?.lead_id}) will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && removeMutation.mutate(toDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrmLayout>
  );
}
