import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/lib/crm";
import type { Intern } from "@/lib/interns";

export const ACTIVITY_ACTIONS = [
  "Add Lead",
  "Edit Lead",
  "Delete Lead",
  "Contact Lead",
  "Add Note",
  "Edit Note",
  "Delete Note",
  "Change Lead Status",
  "Change Lead Quality",
  "Assign Lead",
  "Schedule Follow-up",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export interface Activity {
  id: string;
  activity_id: string;
  intern_id: string | null;
  intern_name: string | null;
  lead_id: string | null;
  lead_name: string | null;
  action: string;
  description: string | null;
  created_date: string;
  created_time: string;
  created_at: string;
}

/** Local date (yyyy-mm-dd) and time (HH:mm:ss) for stamping new rows. */
export function nowParts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    created_date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    created_time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
  };
}

export const activitiesQueryKey = ["activities"] as const;

export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("Failed to load activity log");
  return (data ?? []) as Activity[];
}

export interface LogInput {
  action: ActivityAction;
  description: string;
  intern?: Intern | null;
  lead?: Pick<Lead, "id" | "company_name"> | null;
}

/** Records an activity. Never throws — logging must not break the main action. */
export async function logActivity({ action, description, intern, lead }: LogInput) {
  try {
    await supabase.from("activities").insert({
      action,
      description,
      intern_id: intern?.id ?? null,
      intern_name: intern?.name ?? null,
      lead_id: lead?.id ?? null,
      lead_name: lead?.company_name ?? null,
      ...nowParts(),
    });
  } catch {
    /* ignore logging failures */
  }
}

export function formatTime(value?: string | null): string {
  if (!value) return "—";
  const [h = "0", m = "0"] = value.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
