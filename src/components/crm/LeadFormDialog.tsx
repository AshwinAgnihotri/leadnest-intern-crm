import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createLead,
  updateLead,
  leadsQueryKey,
  INDUSTRIES,
  LEAD_QUALITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  type Lead,
  type LeadInput,
} from "@/lib/crm";
import { fetchInterns, internsQueryKey } from "@/lib/interns";
import { activitiesQueryKey, logActivity } from "@/lib/activity";
import { notificationsQueryKey, notify } from "@/lib/notifications";
import { useCurrentIntern } from "@/lib/current-intern";

const emptyForm: LeadInput = {
  company_name: "",
  contact_person: "",
  email: "",
  phone: "",
  website: "",
  linkedin: "",
  location: "",
  industry: "",
  lead_source: "",
  lead_quality: "Cold",
  status: "New",
  assigned_intern: "",
  intern_id: null,
  last_contacted: null,
  next_follow_up: null,
};

function validate(form: LeadInput) {
  const errors: Record<string, string> = {};
  if (!form.company_name.trim()) errors['company_name'] = "Company name is required";
  if (!form.contact_person.trim()) errors['contact_person'] = "Contact person is required";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email))
    errors['email'] = "Enter a valid email address";
  if (form.phone && !/^[+]?[\d\s()-]{7,20}$/.test(form.phone))
    errors['phone'] = "Enter a valid phone number";
  if (form.website && !/^https?:\/\/.{3,}/.test(form.website))
    errors['website'] = "Enter a valid URL (https://...)";
  if (form.linkedin && !/^https?:\/\/.{3,}/.test(form.linkedin))
    errors['linkedin'] = "Enter a valid URL (https://...)";
  return errors;
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}) {
  const [form, setForm] = useState<LeadInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const isEdit = Boolean(lead);
  const { data: interns = [] } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });
  const { intern: currentIntern } = useCurrentIntern();

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (lead) {
      const { id, lead_id, created_date, last_updated, ...rest } = lead;
      void id;
      void lead_id;
      void created_date;
      void last_updated;
      setForm({ ...emptyForm, ...rest });
    } else {
      setForm(emptyForm);
    }
  }, [open, lead]);

  const mutation = useMutation({
    mutationFn: async (payload: LeadInput) => {
      const clean: Partial<LeadInput> = { ...payload };
      (Object.keys(clean) as (keyof LeadInput)[]).forEach((k) => {
        if (clean[k] === "") (clean as Record<string, unknown>)[k] = null;
      });
      const saved = lead
        ? await updateLead(lead.id, clean)
        : await createLead(clean as Parameters<typeof createLead>[0]);

      await logActivity({
        action: lead ? "Edit Lead" : "Add Lead",
        description: `${lead ? "Updated" : "Created"} lead ${saved.company_name}`,
        intern: currentIntern ?? null,
        lead: saved,
      });

      const assignedChanged = saved.assigned_intern && saved.assigned_intern !== lead?.assigned_intern;
      if (assignedChanged) {
        const owner = interns.find((i) => i.name === saved.assigned_intern);
        await logActivity({
          action: "Assign Lead",
          description: `Assigned ${saved.company_name} to ${saved.assigned_intern}`,
          intern: currentIntern ?? null,
          lead: saved,
        });
        await notify({
          title: "New Lead Assigned",
          message: `${saved.company_name} has been assigned to you.`,
          type: "Lead",
          intern: owner ?? null,
          internName: saved.assigned_intern,
          lead: saved,
        });
      }

      if (saved.next_follow_up && saved.next_follow_up !== lead?.next_follow_up) {
        await logActivity({
          action: "Schedule Follow-up",
          description: `Follow-up for ${saved.company_name} set to ${saved.next_follow_up}`,
          intern: currentIntern ?? null,
          lead: saved,
        });
      }
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKey });
      queryClient.invalidateQueries({ queryKey: activitiesQueryKey });
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      toast.success(isEdit ? "Lead updated successfully" : "Lead added successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = (key: keyof LeadInput, value: string | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const field = (
    key: keyof LeadInput,
    label: string,
    type = "text",
    placeholder?: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={type}
        value={(form[key] as string | null) ?? ""}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value)}
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  const dropdown = (key: keyof LeadInput, label: string, options: string[]) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        {...(form[key] ? { value: form[key] as string } : {})}
        onValueChange={(v) => set(key, v)}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${lead?.lead_id}` : "Add new lead"}</DialogTitle>
          <DialogDescription>
            Lead ID, created date and last updated are generated automatically.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const found = validate(form);
            setErrors(found);
            if (Object.keys(found).length > 0) {
              toast.error("Please fix the highlighted fields");
              return;
            }
            mutation.mutate(form);
          }}
        >
          <section className="space-y-3 rounded-xl border border-border/70 bg-background/30 p-4">
            <div><p className="crm-kicker">Company</p><p className="mt-1 text-xs text-muted-foreground">Business identity and location</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
            {field("company_name", "Company name *")}
            {field("website", "Website", "text", "https://company.com")}
            {field("location", "Location", "text", "City, Country")}
            {dropdown("industry", "Industry", INDUSTRIES)}
            </div>
          </section>
          <section className="space-y-3 rounded-xl border border-border/70 bg-background/30 p-4">
            <div><p className="crm-kicker">Contact</p><p className="mt-1 text-xs text-muted-foreground">The person you are speaking with</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
            {field("contact_person", "Contact person *")}
            {field("email", "Email", "email", "name@company.com")}
            {field("phone", "Phone", "tel", "+91 98000 00000")}
            {field("linkedin", "LinkedIn", "text", "https://linkedin.com/company/...")}
            </div>
          </section>
          <section className="space-y-3 rounded-xl border border-border/70 bg-background/30 p-4">
            <div><p className="crm-kicker">Lead information</p><p className="mt-1 text-xs text-muted-foreground">Ownership and pipeline position</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
            {dropdown("lead_source", "Lead source", LEAD_SOURCES)}
            <div className="space-y-1.5">
              <Label>Assigned intern</Label>
              <Select
                {...(form.assigned_intern ? { value: form.assigned_intern } : {})}
                onValueChange={(v) => {
                  const match = interns.find((i) => i.name === v);
                  setForm((prev) => ({
                    ...prev,
                    assigned_intern: v,
                    intern_id: match?.id ?? null,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select intern" />
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
            {dropdown("lead_quality", "Lead quality", LEAD_QUALITIES)}
            {dropdown("status", "Status", LEAD_STATUSES)}
            </div>
          </section>
          <section className="space-y-3 rounded-xl border border-border/70 bg-background/30 p-4">
            <div><p className="crm-kicker">Follow-up</p><p className="mt-1 text-xs text-muted-foreground">Keep your next conversation on track</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
            {field("last_contacted", "Last contacted", "date")}
            {field("next_follow_up", "Next follow-up", "date")}
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
