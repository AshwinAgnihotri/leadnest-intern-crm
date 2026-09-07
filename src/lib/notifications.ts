import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/lib/crm";
import { todayISO } from "@/lib/crm";
import type { Intern } from "@/lib/interns";
import { nowParts } from "@/lib/activity";

export const NOTIFICATION_TYPES = [
  "Follow-up",
  "Lead",
  "Note",
  "General",
] as const;

export interface AppNotification {
  id: string;
  notification_id: string;
  user_or_intern_id: string | null;
  intern_name: string | null;
  lead_id: string | null;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  dedupe_key: string | null;
  created_date: string;
  created_time: string;
  created_at: string;
}

export const notificationsQueryKey = ["notifications"] as const;

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Failed to load notifications");
  return (data ?? []) as AppNotification[];
}

export interface NotifyInput {
  title: string;
  message: string;
  type: (typeof NOTIFICATION_TYPES)[number];
  intern?: Intern | null;
  internName?: string | null;
  internId?: string | null;
  lead?: Pick<Lead, "id"> | null;
  dedupeKey?: string;
}

/** Creates a notification. Never throws; duplicate dedupe keys are ignored. */
export async function notify(input: NotifyInput) {
  try {
    await supabase.from("notifications").insert({
      title: input.title,
      message: input.message,
      type: input.type,
      user_or_intern_id: input.intern?.id ?? input.internId ?? null,
      intern_name: input.intern?.name ?? input.internName ?? null,
      lead_id: input.lead?.id ?? null,
      dedupe_key: input.dedupeKey ?? null,
      ...nowParts(),
    });
  } catch {
    /* ignore */
  }
}

export async function markRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw new Error("Failed to update notification");
}

export async function markAllRead() {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  if (error) throw new Error("Failed to update notifications");
}

export async function removeNotification(id: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw new Error("Failed to delete notification");
}

const UPCOMING_DAYS = 3;

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Creates follow-up notifications for overdue / due-today / upcoming leads.
 * The dedupe key (lead + bucket + date + follow-up date) keeps repeated runs
 * from producing duplicates.
 */
export async function syncFollowUpNotifications(leads: Lead[], interns: Intern[]) {
  const today = todayISO();
  const rows = leads
    .filter((l) => Boolean(l.next_follow_up))
    .map((lead) => {
      const due = lead.next_follow_up as string;
      const diff = daysBetween(today, due);
      let bucket: "overdue" | "today" | "upcoming" | null = null;
      if (diff < 0) bucket = "overdue";
      else if (diff === 0) bucket = "today";
      else if (diff <= UPCOMING_DAYS) bucket = "upcoming";
      if (!bucket) return null;

      const intern = interns.find((i) =>
        lead.intern_id ? i.id === lead.intern_id : i.name === lead.assigned_intern,
      );
      const titles = {
        overdue: "Follow-up overdue",
        today: "Follow-up due today",
        upcoming: "Upcoming follow-up",
      } as const;
      const messages = {
        overdue: `${lead.company_name} follow-up was due on ${due}.`,
        today: `${lead.company_name} needs a follow-up today.`,
        upcoming: `${lead.company_name} follow-up is scheduled for ${due}.`,
      } as const;

      return {
        title: titles[bucket],
        message: messages[bucket],
        type: "Follow-up",
        user_or_intern_id: intern?.id ?? null,
        intern_name: intern?.name ?? lead.assigned_intern ?? null,
        lead_id: lead.id,
        dedupe_key: `followup:${lead.id}:${bucket}:${due}:${today}`,
        ...nowParts(),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return 0;
  const { data, error } = await supabase
    .from("notifications")
    .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true })
    .select("id");
  if (error) return 0;
  return data?.length ?? 0;
}

export function notificationDateTime(n: AppNotification): string {
  const d = new Date(n.created_at);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
