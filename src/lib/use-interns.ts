import { useQuery } from "@tanstack/react-query";

import { fetchInterns, internsQueryKey, type Intern } from "@/lib/interns";

export function useInterns(): Intern[] {
  const { data = [] } = useQuery({ queryKey: internsQueryKey, queryFn: fetchInterns });
  return data;
}
