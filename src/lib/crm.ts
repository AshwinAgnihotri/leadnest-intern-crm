import { supabase } from "@/integrations/supabase/client";

export type LeadStatus = "New" | "Contacted" | "Follow-up" | "Qualified" | "Converted" | "Lost";
export type LeadQuality = "Hot" | "Warm" | "Cold";

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Follow-up",
  "Qualified",
  "Converted",
  "Lost",
];

export const LEAD_QUALITIES: LeadQuality[] = ["Hot", "Warm", "Cold"];

export const LEAD_SOURCES = [
  "LinkedIn",
  "Website",
  "Referral",
  "Email",
  "Phone",
  "Event",
  "Social Media",
  "Other",
];

export const INTERNS = ["Intern 1", "Intern 2", "Intern 3", "Intern 4"];

export const CUSTOM_INDUSTRY = "Custom Industry";

export const INDUSTRIES = [
  "Software",
  "SaaS",
  "Cloud Services",
  "Analytics",
  "Fintech",
  "Manufacturing",
  "Consulting",
  "Media",
  "Biotech",
  "Retail",
  "Education",
  CUSTOM_INDUSTRY,
];

/** Legacy leads may still carry the old "Other"/"Others" value — keep them working. */
export const LEGACY_INDUSTRY_VALUES = ["Other", "Others"];

export function isPresetIndustry(value?: string | null): boolean {
  if (!value) return false;
  return INDUSTRIES.includes(value) || LEGACY_INDUSTRY_VALUES.includes(value);
}

export interface Lead {
  id: string;
  lead_id: string;
  company_name: string;
  contact_person: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin: string | null;
  location: string | null;
  industry: string | null;
  lead_source: string | null;
  lead_quality: string;
  status: string;
  assigned_intern: string | null;
  intern_id: string | null;
  created_date: string;
  last_updated: string;
  last_contacted: string | null;
  next_follow_up: string | null;
}

export type LeadInput = Omit<Lead, "id" | "lead_id" | "created_date" | "last_updated">;

export const leadsQueryKey = ["leads"] as const;

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_date", { ascending: false });
  if (error) throw new Error("Failed to load leads");
  return (data ?? []) as Lead[];
}

export async function createLead(
  input: Partial<LeadInput> & { company_name: string; contact_person: string },
): Promise<Lead> {
  const { data, error } = await supabase.from("leads").insert(input).select().single();
  if (error) throw new Error("Failed to create lead");
  return data as Lead;
}

export async function updateLead(id: string, input: Partial<LeadInput>): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error("Failed to update lead");
  return data as Lead;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw new Error("Failed to delete lead");
}

/* ---------- helpers ---------- */

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function statusClass(status: string): string {
  const map: Record<string, string> = {
    New: "crm-badge-new",
    Contacted: "crm-badge-contacted",
    "Follow-up": "crm-badge-followup",
    Qualified: "crm-badge-qualified",
    Converted: "crm-badge-converted",
    Lost: "crm-badge-lost",
  };
  return `crm-badge ${map[status] ?? "crm-badge-new"}`;
}

export function qualityClass(quality: string): string {
  const map: Record<string, string> = {
    Hot: "crm-badge-hot",
    Warm: "crm-badge-warm",
    Cold: "crm-badge-cold",
  };
  return `crm-badge ${map[quality] ?? "crm-badge-cold"}`;
}

export type FollowUpBucket = "overdue" | "today" | "upcoming" | "none";

export function followUpBucket(lead: Lead): FollowUpBucket {
  if (!lead.next_follow_up) return "none";
  const today = todayISO();
  if (lead.next_follow_up < today) return "overdue";
  if (lead.next_follow_up === today) return "today";
  return "upcoming";
}

export function isFollowUpDue(lead: Lead): boolean {
  const b = followUpBucket(lead);
  return b === "overdue" || b === "today";
}

export function countBy<T extends string>(leads: Lead[], key: (l: Lead) => T, keys: T[]) {
  return keys.map((k) => ({ name: k, value: leads.filter((l) => key(l) === k).length }));
}
