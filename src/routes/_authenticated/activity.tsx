import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";

import { CrmLayout } from "@/components/crm/CrmLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/crm";
import {
  ACTIVITY_ACTIONS,
  activitiesQueryKey,
  fetchActivities,
  formatTime,
  type Activity,
} from "@/lib/activity";
import { ANY, DATE_PRESETS, resolveRange, type DatePreset } from "@/lib/crm-filters";
import { useInterns } from "@/lib/use-interns";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: "Activity Log — LeadNest Intern CRM" },
      {
        name: "description",
        content:
          "Track every intern action on leads: adds, edits, contacts, notes, status changes and follow-ups.",
      },
      { property: "og:title", content: "Activity Log — LeadNest Intern CRM" },
      {
        property: "og:description",
        content: "A searchable, filterable history of intern activity across all CRM leads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivityPage,
});

type SortKey = "created" | "intern_name" | "action" | "lead_name";

function ActivityPage() {
  const interns = useInterns();
  const { data: activities = [], isLoading } = useQuery({
    queryKey: activitiesQueryKey,
    queryFn: fetchActivities,
  });

  const [intern, setIntern] = useState<string>(ANY);
  const [action, setAction] = useState<string>(ANY);
  const [lead, setLead] = useState<string>(ANY);
  const [preset, setPreset] = useState<DatePreset>(ANY);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const leadOptions = useMemo(
    () =>
      [...new Set(activities.map((a) => a.lead_name).filter((v): v is string => Boolean(v)))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [activities],
  );

  const rows = useMemo(() => {
    const range = resolveRange({
      datePreset: preset,
      from,
      to,
    } as Parameters<typeof resolveRange>[0]);

    const filtered = activities.filter((a) => {
      if (intern !== ANY && a.intern_name !== intern) return false;
      if (action !== ANY && a.action !== action) return false;
      if (lead !== ANY && a.lead_name !== lead) return false;
      if (range && (a.created_date < range.from || a.created_date > range.to)) return false;
      const time = a.created_time?.slice(0, 5) ?? "";
      if (fromTime && time < fromTime) return false;
      if (toTime && time > toTime) return false;
      return true;
    });

    const dir = order === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "created") {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return av.localeCompare(bv, undefined, { sensitivity: "base" }) * dir;
    });
  }, [activities, intern, action, lead, preset, from, to, fromTime, toTime, sortKey, order]);

  const clear = () => {
    setIntern(ANY);
    setAction(ANY);
    setLead(ANY);
    setPreset(ANY);
    setFrom("");
    setTo("");
    setFromTime("");
    setToTime("");
  };

  return (
    <CrmLayout title="Activity">
      <Card className="mb-4 overflow-hidden">
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Intern</Label>
            <Select value={intern} onValueChange={setIntern}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All interns</SelectItem>
                {interns.map((i) => (
                  <SelectItem key={i.id} value={i.name}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All actions</SelectItem>
                {ACTIVITY_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Lead</Label>
            <Select value={lead} onValueChange={setLead}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All leads</SelectItem>
                {leadOptions.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Date range</Label>
            <Select value={preset} onValueChange={(v) => setPreset(v as DatePreset)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {preset === "custom" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="act-from">From date</Label>
                <Input
                  id="act-from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="act-to">To date</Label>
                <Input id="act-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="act-from-time">From time</Label>
            <Input
              id="act-from-time"
              type="time"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-to-time">To time</Label>
            <Input
              id="act-to-time"
              type="time"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-end gap-2 lg:col-span-2">
            <div className="space-y-1.5">
              <Label>Sort by</Label>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Date &amp; time</SelectItem>
                  <SelectItem value="intern_name">Intern</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="lead_name">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
            >
              {order === "asc" ? (
                <ArrowDownAZ className="size-4" />
              ) : (
                <ArrowUpAZ className="size-4" />
              )}
              {sortKey === "created"
                ? order === "asc"
                  ? "Oldest first"
                  : "Newest first"
                : order === "asc"
                  ? "A → Z"
                  : "Z → A"}
            </Button>
            <Button variant="ghost" onClick={clear}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <div className="crm-empty-state py-16">
              <p className="font-medium text-foreground">No activity recorded yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Updates will appear here as work is completed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intern</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Related Lead</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a: Activity) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {a.intern_name ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{a.action}</TableCell>
                      <TableCell className="whitespace-nowrap">{a.lead_name ?? "—"}</TableCell>
                      <TableCell>{a.description ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(a.created_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatTime(a.created_time)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </CrmLayout>
  );
}
