import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchLeads, leadsQueryKey } from "@/lib/crm";
import { useInterns } from "@/lib/use-interns";
import {
  fetchNotifications,
  markAllRead,
  markRead,
  notificationDateTime,
  notificationsQueryKey,
  removeNotification,
  syncFollowUpNotifications,
  type AppNotification,
} from "@/lib/notifications";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const interns = useInterns();
  const { data: leads = [] } = useQuery({ queryKey: leadsQueryKey, queryFn: fetchLeads });
  const { data: notifications = [] } = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: fetchNotifications,
  });

  // Generate follow-up notifications once leads and interns are available.
  useEffect(() => {
    if (leads.length === 0) return;
    let cancelled = false;
    void syncFollowUpNotifications(leads, interns).then((created) => {
      if (!cancelled && created > 0) {
        queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [leads, interns, queryClient]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey });

  const readMutation = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const readAllMutation = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      refresh();
      toast.success("All notifications marked as read");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeNotification(id),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unread} unread)`}>
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={unread === 0 || readAllMutation.isPending}
            onClick={() => readAllMutation.mutate()}
          >
            <CheckCheck className="size-4" />
            Mark all as read
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n: AppNotification) => (
                <li
                  key={n.id}
                  className={`px-3 py-3 ${n.is_read ? "bg-transparent" : "bg-accent/40"}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${n.is_read ? "bg-muted-foreground/30" : "bg-primary"}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {notificationDateTime(n)}
                        {n.intern_name ? ` · ${n.intern_name}` : ""} ·{" "}
                        {n.is_read ? "Read" : "Unread"}
                      </p>
                      <div className="mt-1 flex gap-1">
                        {!n.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => readMutation.mutate(n.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete notification"
                          onClick={() => deleteMutation.mutate(n.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
