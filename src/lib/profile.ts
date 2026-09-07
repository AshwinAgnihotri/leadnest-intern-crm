import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "intern" | "admin" | "owner";

export interface Profile {
  user_id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
  intern_id: string | null;
  created_at: string;
}

export const profileQueryKey = ["profile"] as const;

/** The profile row of the signed-in account (RLS returns only your own). */
export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) return null;
  return (data as Profile | null) ?? null;
}

export function useMyProfile() {
  return useQuery({ queryKey: profileQueryKey, queryFn: fetchMyProfile });
}
