import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { fetchInterns, internsQueryKey, formatDateTime } from "@/lib/interns";
import { useMyProfile, type Profile } from "@/lib/profile";
import {
  createAccount,
  sendPasswordReset,
  setInternActive,
} from "@/lib/user-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users/")({
  head: () => ({
    meta: [
      { title: "Admin · User Management — LeadNest Intern CRM" },
      {
        name: "description",
        content: "Owner tools to create intern and admin login accounts and manage their status.",
      },
      { property: "og:title", content: "Admin · User Management — LeadNest Intern CRM" },
      {
        property: "og:description",
        content: "Create and manage intern and admin accounts for the Pixel AI CRM.",
      },
    ],
  }),
  component: UserManagement,
});

const profilesQueryKey = ["admin", "profiles"] as const;

async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Failed to load accounts");
  return (data ?? []) as Profile[];
}

function UserManagement() {
  const { data: me, isLoading: loadingMe } = useMyProfile();
  const isOwner = me?.role === "owner";
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading: lp } = useQuery({
    queryKey: profilesQueryKey,
    queryFn: fetchProfiles,
  });
  const { data: interns = [], isLoading: li } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });

  const [dialogRole, setDialogRole] = useState<"intern" | "admin" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const create = useServerFn(createAccount);
  const reset = useServerFn(sendPasswordReset);
  const toggleActive = useServerFn(setInternActive);

  const internById = new Map(interns.map((i) => [i.id, i]));

  async function handleReset(email: string | null) {
    if (!email) return;
    setBusyId(email);
    try {
      await reset({ data: { email, redirectTo: `${window.location.origin}/auth` } });
      toast.success(`Password setup email sent to ${email}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggle(internUuid: string, active: boolean) {
    setBusyId(internUuid);
    try {
      await toggleActive({ data: { internId: internUuid, active } });
      await queryClient.invalidateQueries({ queryKey: internsQueryKey });
      toast.success(active ? "Account activated" : "Account deactivated");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (loadingMe || lp || li) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/55 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UsersRound className="size-5" /></div>
        <div><p className="crm-kicker">Accounts</p><h2 className="mt-0.5 text-lg font-semibold text-foreground">User Management</h2></div>
        {isOwner ? (
          <div className="ml-auto flex gap-2">
            <Button onClick={() => setDialogRole("intern")}>
              <UserPlus className="mr-2 size-4" /> Create Intern
            </Button>
            <Button variant="outline" onClick={() => setDialogRole("admin")}>
              <ShieldCheck className="mr-2 size-4" /> Create Admin
            </Button>
          </div>
        ) : (
          <p className="ml-auto text-sm text-muted-foreground">
            Only the owner can create or change accounts.
          </p>
        )}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Intern ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                {isOwner && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No accounts yet.
                  </TableCell>
                </TableRow>
              )}
              {profiles.map((p) => {
                const intern = p.intern_id ? internById.get(p.intern_id) : undefined;
                const status =
                  p.role === "intern" ? (intern?.status ?? "Unknown") : "Active";
                return (
                  <TableRow key={p.user_id}>
                    <TableCell className="font-medium">{p.name ?? "—"}</TableCell>
                    <TableCell>{p.email ?? "—"}</TableCell>
                    <TableCell><span className={`crm-badge ${p.role === "owner" ? "crm-badge-hot" : p.role === "admin" ? "crm-badge-contacted" : "crm-badge-cold"}`}>{p.role}</span></TableCell>
                    <TableCell>{intern?.intern_id ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`crm-badge ${
                          status === "Active" ? "crm-badge-qualified" : "crm-badge-lost"
                        }`}
                      >
                        {status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDateTime(p.created_at)}</TableCell>
                    {isOwner && (
                      <TableCell className="space-x-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === p.email}
                          onClick={() => handleReset(p.email)}
                        >
                          <KeyRound className="mr-1 size-3.5" /> Reset password
                        </Button>
                        {intern && p.role === "intern" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === intern.id}
                            onClick={() => handleToggle(intern.id, intern.status !== "Active")}
                          >
                            {intern.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateAccountDialog
        role={dialogRole}
        onClose={() => setDialogRole(null)}
        onCreate={async (input) => {
          await create({ data: input });
          await queryClient.invalidateQueries({ queryKey: profilesQueryKey });
          await queryClient.invalidateQueries({ queryKey: internsQueryKey });
        }}
      />
    </div>
  );
}

function CreateAccountDialog({
  role,
  onClose,
  onCreate,
}: {
  role: "intern" | "admin" | null;
  onClose: () => void;
  onCreate: (input: {
    role: "intern" | "admin";
    name: string;
    email: string;
    password: string;
    internId?: string | null;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [internId, setInternId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setName("");
    setEmail("");
    setInternId("");
    setPassword("");
    setError(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate({ role, name, email, password, internId: internId || null });
      toast.success(`${role === "admin" ? "Admin" : "Intern"} account created`);
      close();
    } catch (err) {
      setError((err as Error).message || "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={role !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {role === "admin" ? "Create Admin Account" : "Create Intern Account"}
          </DialogTitle>
          <DialogDescription>
            The person signs in with this email and temporary password, then can change it from the
            sign-in page.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="ua-name">Full name</Label>
            <Input id="ua-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ua-email">Email</Label>
            <Input
              id="ua-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {role === "intern" && (
            <div className="space-y-1.5">
              <Label htmlFor="ua-intern-id">Intern ID (optional)</Label>
              <Input
                id="ua-intern-id"
                value={internId}
                onChange={(e) => setInternId(e.target.value)}
                placeholder="Leave empty to generate automatically"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="ua-password">Temporary password</Label>
            <Input
              id="ua-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
