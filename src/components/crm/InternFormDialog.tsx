import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  DEPARTMENTS,
  INTERN_STATUSES,
  LOGIN_STATUSES,
  createIntern,
  internsQueryKey,
  updateIntern,
  type Intern,
  type InternInput,
} from "@/lib/interns";
import { todayISO } from "@/lib/crm";

const emptyForm: InternInput = {
  name: "",
  email: "",
  phone: "",
  department: "",
  status: "Active",
  join_date: todayISO(),
  current_login_status: "Offline",
  current_login_time: null,
  last_login: null,
  last_logout: null,
};

export function InternFormDialog({
  open,
  onOpenChange,
  intern,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intern?: Intern | null;
}) {
  const [form, setForm] = useState<InternInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const isEdit = Boolean(intern);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (intern) {
      setForm({
        name: intern.name,
        email: intern.email,
        phone: intern.phone,
        department: intern.department,
        status: intern.status,
        join_date: intern.join_date,
        current_login_status: intern.current_login_status,
        current_login_time: intern.current_login_time,
        last_login: intern.last_login,
        last_logout: intern.last_logout,
      });
    } else {
      setForm({ ...emptyForm, join_date: todayISO() });
    }
  }, [open, intern]);

  const mutation = useMutation({
    mutationFn: async (payload: InternInput) => {
      const clean: Record<string, unknown> = { ...payload };
      Object.keys(clean).forEach((k) => {
        if (clean[k] === "") clean[k] = null;
      });
      return intern
        ? updateIntern(intern.id, clean as Partial<InternInput>)
        : createIntern(clean as Partial<InternInput> & { name: string });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internsQueryKey });
      toast.success(isEdit ? "Intern updated successfully" : "Intern added successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = (key: keyof InternInput, value: string | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${intern?.intern_id}` : "Add new intern"}</DialogTitle>
          <DialogDescription>Intern ID is generated automatically.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const found: Record<string, string> = {};
            if (!form.name.trim()) found['name'] = "Name is required";
            if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email))
              found['email'] = "Enter a valid email address";
            if (form.phone && !/^[+]?[\d\s()-]{7,20}$/.test(form.phone))
              found['phone'] = "Enter a valid phone number";
            setErrors(found);
            if (Object.keys(found).length > 0) {
              toast.error("Please fix the highlighted fields");
              return;
            }
            mutation.mutate(form);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
              {errors['name'] && <p className="text-xs text-destructive">{errors['name']}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={form.email ?? ""}
                placeholder="name@pixelai.example"
                onChange={(e) => set("email", e.target.value)}
              />
              {errors['email'] && <p className="text-xs text-destructive">{errors['email']}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone ?? ""}
                placeholder="+91 98100 00000"
                onChange={(e) => set("phone", e.target.value)}
              />
              {errors['phone'] && <p className="text-xs text-destructive">{errors['phone']}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                {...(form.department ? { value: form.department } : {})}
                onValueChange={(v) => set("department", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Login status</Label>
              <Select
                value={form.current_login_status}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    current_login_status: v,
                    current_login_time: v === "Online" ? new Date().toISOString() : null,
                    last_login: v === "Online" ? new Date().toISOString() : prev.last_login,
                    last_logout: v === "Offline" ? new Date().toISOString() : prev.last_logout,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOGIN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="join_date">Join date</Label>
              <Input
                id="join_date"
                type="date"
                value={form.join_date ?? ""}
                onChange={(e) => set("join_date", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save intern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
