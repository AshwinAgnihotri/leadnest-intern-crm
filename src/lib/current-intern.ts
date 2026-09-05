import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchInterns, internsQueryKey, type Intern } from "@/lib/interns";

const STORAGE_KEY = "pixel-crm.current-intern";

function readStored(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setCurrentInternId(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new Event("pixel-crm-intern-change"));
  } catch {
    /* ignore */
  }
}

/** The intern acting in the CRM right now (demo mode: chosen in the header). */
export function useCurrentIntern(): { intern: Intern | null; interns: Intern[] } {
  const { data: interns = [] } = useQuery({
    queryKey: internsQueryKey,
    queryFn: fetchInterns,
  });
  const [storedId, setStoredId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setStoredId(readStored());
    sync();
    window.addEventListener("pixel-crm-intern-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pixel-crm-intern-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const intern = interns.find((i) => i.id === storedId) ?? interns[0] ?? null;
  return { intern, interns };
}

export function initials(name?: string | null): string {
  if (!name) return "PA";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "PA";
}
