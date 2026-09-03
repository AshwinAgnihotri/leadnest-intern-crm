import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/lib/crm";

export const INTERN_STATUSES = ["Active", "Inactive"] as const;
export const LOGIN_STATUSES = ["Online", "Offline"] as const;

export const DEPARTMENTS = [
  "Business Development",
  "Sales",
  "Marketing",
  "Research",
  "Customer Success",
  "Other",
];

export interface Intern {
  id: string;
  intern_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  status: string;
  join_date: string;
  current_login_status: string;
  current_login_time: string | null;
  last_login: string | null;
  last_logout: string | null;
  created_at: string;
  updated_at: string;
}

export type InternInput = Omit<Intern, "id" | "intern_id" | "created_at" | "updated_at">;

export const internsQueryKey = ["interns"] as const;

export async function fetchInterns(): Promise<Intern[]> {
  const { data, error } = await supabase
    .from("interns")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error("Failed to load interns");
  return (data ?? []) as Intern[];
}

export async function fetchIntern(id: string): Promise<Intern> {
  const { data, error } = await supabase.from("interns").select("*").eq("id", id).single();
  if (error) throw new Error("Failed to load intern");
  return data as Intern;
}

export async function createIntern(input: Partial<InternInput> & { name: string }) {
  const { data, error } = await supabase.from("interns").insert(input).select().single();
  if (error) throw new Error("Failed to create intern");
  return data as Intern;
}

export async function updateIntern(id: string, input: Partial<InternInput>) {
  const { data, error } = await supabase
    .from("interns")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error("Failed to update intern");
  return data as Intern;
}

/* ---------- performance ---------- */

export interface InternStats {
  assigned: number;
  contacted: number;
  followUps: number;
  qualified: number;
  converted: number;
  lost: number;
}

export function leadsForIntern(leads: Lead[], intern: Intern): Lead[] {
  return leads.filter(
    (l) => (l.intern_id ? l.intern_id === intern.id : l.assigned_intern === intern.name),
  );
}

export function internStats(leads: Lead[], intern: Intern): InternStats {
  const own = leadsForIntern(leads, intern);
  const byStatus = (s: string) => own.filter((l) => l.status === s).length;
  return {
    assigned: own.length,
    contacted: own.filter((l) => Boolean(l.last_contacted)).length,
    followUps: byStatus("Follow-up"),
    qualified: byStatus("Qualified"),
    converted: byStatus("Converted"),
    lost: byStatus("Lost"),
  };
}

export function statusBadgeClass(status: string): string {
  return `crm-badge ${status === "Active" ? "crm-badge-qualified" : "crm-badge-lost"}`;
}

export function loginBadgeClass(status: string): string {
  return `crm-badge ${status === "Online" ? "crm-badge-converted" : "crm-badge-cold"}`;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
