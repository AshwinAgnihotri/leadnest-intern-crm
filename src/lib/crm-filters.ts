import type { Lead } from "@/lib/crm";

export const ANY = "__any__";

export const DATE_FIELDS = [
  { value: "created_date", label: "Created Date" },
  { value: "last_updated", label: "Last Updated" },
  { value: "last_contacted", label: "Last Contacted" },
  { value: "next_follow_up", label: "Next Follow-up" },
] as const;

export type DateField = (typeof DATE_FIELDS)[number]["value"];

export const DATE_PRESETS = [
  { value: ANY, label: "Any time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "prevMonth", label: "Previous Month" },
  { value: "custom", label: "Custom Date Range" },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number]["value"];

export const SORT_FIELDS = [
  { value: "company_name", label: "Company Name", type: "text" },
  { value: "contact_person", label: "Contact Person", type: "text" },
  { value: "industry", label: "Industry", type: "text" },
  { value: "location", label: "Location", type: "text" },
  { value: "assigned_intern", label: "Assigned Intern", type: "text" },
  { value: "lead_id", label: "Lead ID", type: "text" },
  { value: "created_date", label: "Created Date", type: "date" },
  { value: "last_updated", label: "Last Updated", type: "date" },
  { value: "last_contacted", label: "Last Contacted", type: "date" },
  { value: "next_follow_up", label: "Next Follow-up", type: "date" },
] as const;

export type SortField = (typeof SORT_FIELDS)[number]["value"];
export type SortOrder = "asc" | "desc";

export const ARCHIVE_VIEWS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

export type ArchiveView = (typeof ARCHIVE_VIEWS)[number]["value"];

export interface LeadFilters {
  archive: ArchiveView;
  status: string;
  quality: string;
  source: string;
  industry: string;
  intern: string;
  dateField: DateField;
  datePreset: DatePreset;
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  fromTime: string; // HH:mm
  toTime: string; // HH:mm
}

export const defaultFilters: LeadFilters = {
  archive: "active",
  status: ANY,
  quality: ANY,
  source: ANY,
  industry: ANY,
  intern: ANY,
  dateField: "created_date",
  datePreset: ANY,
  from: "",
  to: "",
  fromTime: "",
  toTime: "",
};

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Resolve a preset into inclusive [from, to] local dates (yyyy-mm-dd). */
export function resolveRange(f: LeadFilters): { from: string; to: string } | null {
  const now = new Date();
  switch (f.datePreset) {
    case "today":
      return { from: toISODate(now), to: toISODate(now) };
    case "yesterday": {
      const y = addDays(now, -1);
      return { from: toISODate(y), to: toISODate(y) };
    }
    case "last7":
      return { from: toISODate(addDays(now, -6)), to: toISODate(now) };
    case "last30":
      return { from: toISODate(addDays(now, -29)), to: toISODate(now) };
    case "thisMonth":
      return {
        from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case "prevMonth":
      return {
        from: toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toISODate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "custom":
      if (!f.from && !f.to) return null;
      return { from: f.from || "0000-01-01", to: f.to || "9999-12-31" };
    default:
      return null;
  }
}

const SEARCH_KEYS: (keyof Lead)[] = [
  "lead_id",
  "company_name",
  "contact_person",
  "email",
  "phone",
  "industry",
  "location",
  "assigned_intern",
];

export function matchesSearch(lead: Lead, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return SEARCH_KEYS.some((k) => String(lead[k] ?? "").toLowerCase().includes(t));
}

function timeOfDay(value: string): string | null {
  // Only timestamps carry a time component.
  if (value.length <= 10) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function localDate(value: string): string {
  if (value.length <= 10) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : toISODate(d);
}

export function matchesDate(lead: Lead, f: LeadFilters): boolean {
  const range = resolveRange(f);
  const hasTime = Boolean(f.fromTime || f.toTime);
  if (!range && !hasTime) return true;

  const raw = lead[f.dateField];
  if (!raw) return false;

  if (range) {
    const day = localDate(raw);
    if (!day || day < range.from || day > range.to) return false;
  }

  if (hasTime) {
    const t = timeOfDay(raw);
    if (t === null) return false;
    if (f.fromTime && t < f.fromTime) return false;
    if (f.toTime && t > f.toTime) return false;
  }

  return true;
}

export function matchesArchive(lead: Lead, view: ArchiveView = "active"): boolean {
  const archived = Boolean(lead.is_archived);
  if (view === "active") return !archived;
  if (view === "archived") return archived;
  return true;
}

export function matchesFilters(lead: Lead, f: LeadFilters): boolean {
  return (
    matchesArchive(lead, f.archive ?? "active") &&
    (f.status === ANY || lead.status === f.status) &&
    (f.quality === ANY || lead.lead_quality === f.quality) &&
    (f.source === ANY || lead.lead_source === f.source) &&
    (f.industry === ANY || lead.industry === f.industry) &&
    (f.intern === ANY || lead.assigned_intern === f.intern) &&
    matchesDate(lead, f)
  );
}

export function activeFilterCount(f: LeadFilters): number {
  let n = 0;
  for (const k of ["status", "quality", "source", "industry", "intern"] as const) {
    if (f[k] !== ANY) n += 1;
  }
  if (resolveRange(f)) n += 1;
  if (f.fromTime || f.toTime) n += 1;
  return n;
}

export function sortLeads(leads: Lead[], field: SortField, order: SortOrder): Lead[] {
  const meta = SORT_FIELDS.find((s) => s.value === field);
  const dir = order === "asc" ? 1 : -1;
  return [...leads].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (!av && !bv) return 0;
    if (!av) return 1; // empty values always last
    if (!bv) return -1;
    if (meta?.type === "date") {
      return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
    }
    return String(av).localeCompare(String(bv), undefined, { sensitivity: "base" }) * dir;
  });
}

export function uniqueValues(leads: Lead[], key: keyof Lead, base: readonly string[] = []) {
  const set = new Set<string>(base);
  for (const l of leads) {
    const v = l[key];
    if (typeof v === "string" && v.trim()) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
