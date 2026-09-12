import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Building2, CalendarDays, Contact, Pencil, Trash2, PhoneCall, Workflow } from "lucide-react";
import { toast } from "sonner";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import { MarkContactedDialog } from "@/components/crm/MarkContactedDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  fetchLeads,
  deleteLead,
  updateLead,
  leadsQueryKey,
  formatDate,
  statusClass,
  qualityClass,
  LEAD_STATUSES,
  LEAD_QUALITIES,
  type Lead,
} from "@/lib/crm";
import { fetchInterns, internsQueryKey } from "@/lib/interns";
import { LeadNotes } from "@/components/crm/LeadNotes";
import { activitiesQueryKey, logActivity, type ActivityAction } from "@/lib/activity";
import { notificationsQueryKey, notify } from "@/lib/notifications";
import { useCurrentIntern } from "@/lib/current-intern";

export const Route = createFileRoute("/_authenticated/leads/$leadId")({
  head: () => ({
    meta: [
      { title: "Lead details — LeadNest Intern CRM" },
      {
        name: "description",
        content: "Full company, contact and lead management details with follow-up actions.",
      },
      { property: "og:title", content: "Lead details — LeadNest Intern CRM" },
      {
        property: "og:description",
        content: "Review and update a single lead, mark it contacted and schedule follow-ups.",
      },
    ],
  }),
  component: LeadDetailsPage,
});

function Row({ label, value, href }: { label: string; value?: string | null; href?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      {href && value ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="break-all text-sm font-medium text-primary hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="break-all text-sm font-medium text-foreground">{value || "—"}</span>
      )}
    </div>
  );
}

function LeadDetailsPage() {
  const { leadId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: leadsQueryKey,
    queryFn: fetchLeads,
  });
  const { data: interns = [] } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });
  const lead = leads.find((l: Lead) => l.id === leadId);
  const { intern: currentIntern } = useCurrentIntern();

  const fieldMutation = useMutation({
    mutationFn: async ({
      patch,
      action,
      description,
      notification,
    }: {
      patch: Partial<Lead>;
      action: ActivityAction;
      description: string;
      notification?: { title: string; message: string; internName?: string | null };
    }) => {
      const saved = await updateLead(leadId, patch);
      await logActivity({
        action,
        description,
        intern: currentIntern ?? null,
        lead: saved,
      });
      if (notification) {
        const target =
          interns.find((i) => i.name === notification.internName) ??
          interns.find((i) => i.id === saved.intern_id) ??
          null;
        await notify({
          title: notification.title,
          message: notification.message,
          type: action === "Assign Lead" ? "Lead" : "Lead",
          intern: target,
          internName: notification.internName ?? saved.assigned_intern,
          lead: saved,
        });
      }
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKey });
      queryClient.invalidateQueries({ queryKey: activitiesQueryKey });
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      toast.success("Lead updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (lead) {
        await logActivity({
          action: "Delete Lead",
          description: `Deleted lead ${lead.company_name}`,
          intern: currentIntern ?? null,
          lead: { id: lead.id, company_name: lead.company_name },
        });
      }
      await deleteLead(leadId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKey });
      queryClient.invalidateQueries({ queryKey: activitiesQueryKey });
      toast.success("Lead deleted successfully");
      navigate({ to: "/leads", search: { q: "" } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <CrmLayout title="Lead details">
        <Skeleton className="h-64 w-full" />
      </CrmLayout>
    );
  }

  if (!lead) {
    return (
      <CrmLayout title="Lead details">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-muted-foreground">This lead no longer exists.</p>
            <Button asChild>
              <Link to="/leads" search={{ q: "" }}>Back to leads</Link>
            </Button>
          </CardContent>
        </Card>
      </CrmLayout>
    );
  }

  return (
    <CrmLayout title={lead.company_name}>
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/55 p-3 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <Button asChild variant="ghost" size="sm">
          <Link to="/leads" search={{ q: "" }}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <span className={statusClass(lead.status)}>{lead.status}</span>
        <span className={qualityClass(lead.lead_quality)}>{lead.lead_quality}</span>

        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setContactOpen(true)}>
            <PhoneCall className="size-4" />
            Mark as Contacted
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit Lead
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" />
            Delete Lead
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="crm-card-interactive">
          <CardHeader>
            <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-4" /></div><CardTitle className="text-base">Company Information</CardTitle></div>
          </CardHeader>
          <CardContent>
            <Row label="Company name" value={lead.company_name} />
            <Row label="Website" value={lead.website} href={lead.website} />
            <Row label="LinkedIn" value={lead.linkedin} href={lead.linkedin} />
            <Row label="Industry" value={lead.industry} />
            <Row label="Location" value={lead.location} />
          </CardContent>
        </Card>

        <Card className="crm-card-interactive">
          <CardHeader>
            <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Contact className="size-4" /></div><CardTitle className="text-base">Contact Information</CardTitle></div>
          </CardHeader>
          <CardContent>
            <Row label="Contact person" value={lead.contact_person} />
            <Row
              label="Email"
              value={lead.email}
              href={lead.email ? `mailto:${lead.email}` : null}
            />
            <Row label="Phone" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : null} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3"><Workflow className="size-4" /></div><div><CardTitle className="text-base">Lead Management</CardTitle><p className="mt-1 text-xs text-muted-foreground"><CalendarDays className="mr-1 inline size-3" />Created {formatDate(lead.created_date)}</p></div></div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Row label="Lead ID" value={lead.lead_id} />
              <Row label="Lead source" value={lead.lead_source} />
              <Row label="Created date" value={formatDate(lead.created_date)} />
              <Row label="Last updated" value={formatDate(lead.last_updated)} />
              <Row label="Last contacted" value={formatDate(lead.last_contacted)} />
              <Row label="Next follow-up" value={formatDate(lead.next_follow_up)} />
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Status</p>
                <Select
                  value={lead.status}
                  onValueChange={(v) =>
                    fieldMutation.mutate({
                      patch: { status: v },
                      action: "Change Lead Status",
                      description: `${lead.company_name} status changed to ${v}`,
                      ...(v === "Converted" || v === "Lost"
                        ? {
                            notification: {
                              title: v === "Converted" ? "Lead converted" : "Lead marked as lost",
                              message: `${lead.company_name} is now ${v}.`,
                              internName: lead.assigned_intern,
                            },
                          }
                        : {
                            notification: {
                              title: "Lead status changed",
                              message: `${lead.company_name} moved to ${v}.`,
                              internName: lead.assigned_intern,
                            },
                          }),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Lead quality</p>
                <Select
                  value={lead.lead_quality}
                  onValueChange={(v) =>
                    fieldMutation.mutate({
                      patch: { lead_quality: v },
                      action: "Change Lead Quality",
                      description: `${lead.company_name} quality changed to ${v}`,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_QUALITIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Assigned intern</p>
                <Select
                  {...(lead.assigned_intern ? { value: lead.assigned_intern } : {})}
                  onValueChange={(v) =>
                    fieldMutation.mutate({
                      patch: {
                        assigned_intern: v,
                        intern_id: interns.find((i) => i.name === v)?.id ?? null,
                      },
                      action: "Assign Lead",
                      description: `${lead.company_name} assigned to ${v}`,
                      notification: {
                        title: "New Lead Assigned",
                        message: `${lead.company_name} has been assigned to you.`,
                        internName: v,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {interns.map((i) => (
                      <SelectItem key={i.id} value={i.name}>
                        {i.intern_id} · {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4">
        <LeadNotes lead={lead} />
      </div>

      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} />
      <MarkContactedDialog
        lead={contactOpen ? lead : null}
        onOpenChange={(o) => setContactOpen(o)}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {lead.company_name} ({lead.lead_id}) will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeMutation.mutate()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrmLayout>
  );
}
