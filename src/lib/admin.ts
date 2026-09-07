import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/lib/crm";
import type { Intern } from "@/lib/interns";
import type { Note } from "@/lib/notes";
import { useMyProfile } from "@/lib/profile";

/** True when the signed-in account may open the admin panel. */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean; role: string | null } {
  const { data: profile, isLoading } = useMyProfile();
  const role = profile?.role ?? null;
  return { isAdmin: role === "admin" || role === "owner", loading: isLoading, role };
}

export const allNotesQueryKey = ["admin", "notes"] as const;

/** Every note the signed-in account may read (all notes for admin/owner). */
export async function fetchAllNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Failed to load notes");
  return (data ?? []) as Note[];
}

export function useAllNotes() {
  return useQuery({ queryKey: allNotesQueryKey, queryFn: fetchAllNotes });
}

/* ---------- working time (reuses the intern login columns) ---------- */

/** Minutes worked, derived from the existing login/logout tracking columns. */
export function workingMinutes(intern: Intern): number {
  let total = 0;
  if (intern.last_login && intern.last_logout) {
    const start = new Date(intern.last_login).getTime();
    const end = new Date(intern.last_logout).getTime();
    if (end > start) total += (end - start) / 60000;
  }
  if (intern.current_login_status === "Online" && intern.current_login_time) {
    const start = new Date(intern.current_login_time).getTime();
    if (Date.now() > start) total += (Date.now() - start) / 60000;
  }
  return Math.round(total);
}

export function formatMinutes(min: number): string {
  if (!min) return "0m";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/* ---------- lead helpers ---------- */

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface FollowUpSplit {
  upcoming: number;
  overdue: number;
  completed: number;
}

export function followUpSplit(leads: Lead[]): FollowUpSplit {
  const today = todayISO();
  let upcoming = 0;
  let overdue = 0;
  let completed = 0;
  for (const l of leads) {
    if (l.next_follow_up) {
      if (l.next_follow_up < today) overdue += 1;
      else upcoming += 1;
    } else if (l.last_contacted) {
      completed += 1;
    }
  }
  return { upcoming, overdue, completed };
}

export function leadsOfIntern(leads: Lead[], intern: Intern): Lead[] {
  return leads.filter(
    (l) => (l.intern_id ? l.intern_id === intern.id : l.assigned_intern === intern.name),
  );
}

export function countByStatus(leads: Lead[], status: string): number {
  return leads.filter((l) => l.status === status).length;
}
