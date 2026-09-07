import { useQuery } from "@tanstack/react-query";

import { fetchInterns, internsQueryKey, type Intern } from "@/lib/interns";

/**
 * The intern acting in the CRM right now.
 * Row level security means the interns table only ever returns the signed-in
 * intern's own record, so there is no manual switching between interns.
 */
export function useCurrentIntern(): { intern: Intern | null } {
  const { data: interns = [] } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });

  return { intern: interns[0] ?? null };
}

export function initials(name?: string | null): string {
  if (!name) return "PA";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "PA";
}
