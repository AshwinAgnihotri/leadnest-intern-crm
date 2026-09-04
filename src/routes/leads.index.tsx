import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import { LeadFilterBar } from "@/components/crm/LeadFilterBar";
import { SortControls } from "@/components/crm/SortControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  LEAD_QUALITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  type Lead,
} from "@/lib/crm";
import {
  defaultFilters,
  matchesFilters,
  matchesSearch,
  sortLeads,
  uniqueValues,
  type LeadFilters,
  type SortField,
  type SortOrder,
} from "@/lib/crm-filters";
import { fetchInterns, internsQueryKey } from "@/lib/interns";

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

function LeadsPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [filters, setFilters] = useState<LeadFilters>({ ...defaultFilters });
  const [sortField, setSortField] = useState<SortField>("created_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: leadsQueryKey,
    queryFn: fetchLeads,
  });

  const { data: interns = [] } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
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

  const filtered = sortLeads(
    leads.filter((lead) => matchesSearch(lead, q) && matchesFilters(lead, filters)),
    sortField,
    sortOrder,
  );

  const industryOptions = uniqueValues(leads, "industry", INDUSTRIES);
  const internOptions = uniqueValues(
    leads,
    "assigned_intern",
    interns.map((i) => i.name),
  );
  const sourceOptions = uniqueValues(leads, "lead_source", LEAD_SOURCES);

  return (
    <CrmLayout title="Leads">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => navigate({ to: "/leads", search: { q: e.target.value } })}
            placeholder="Search leads by ID, company, contact, email, phone, industry, location or intern"
            className="pl-8"
            aria-label="Search leads"
          />
        </div>

        <LeadFilterBar
          filters={filters}
          onChange={setFilters}
          industries={industryOptions}
          interns={internOptions}
          sources={sourceOptions}
          statuses={LEAD_STATUSES}
          qualities={LEAD_QUALITIES}
        />

        <SortControls
          field={sortField}
          order={sortOrder}
          onFieldChange={setSortField}
          onOrderChange={setSortOrder}
        />

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
