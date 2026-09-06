import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { leadsQueryKey, todayISO, updateLead, type Lead } from "@/lib/crm";
import { activitiesQueryKey, logActivity } from "@/lib/activity";
import { notificationsQueryKey, notify } from "@/lib/notifications";
import { useCurrentIntern } from "@/lib/current-intern";

export function MarkContactedDialog({
  lead,
  onOpenChange,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [nextFollowUp, setNextFollowUp] = useState("");
  const queryClient = useQueryClient();
  const { intern: currentIntern } = useCurrentIntern();

  useEffect(() => {
    if (lead) setNextFollowUp(lead.next_follow_up ?? "");
  }, [lead]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!lead) return;
      await updateLead(lead.id, {
        last_contacted: todayISO(),
        next_follow_up: nextFollowUp || null,
        status: lead.status === "New" ? "Contacted" : lead.status,
      });
      await logActivity({
        action: "Contact Lead",
        description: `Contacted ${lead.company_name}`,
        intern: currentIntern ?? null,
        lead,
      });
      if (nextFollowUp && nextFollowUp !== lead.next_follow_up) {
        await logActivity({
          action: "Schedule Follow-up",
          description: `Follow-up for ${lead.company_name} set to ${nextFollowUp}`,
          intern: currentIntern ?? null,
          lead,
        });
        await notify({
          title: "Upcoming follow-up",
          message: `${lead.company_name} follow-up is scheduled for ${nextFollowUp}.`,
          type: "Follow-up",
          intern: currentIntern ?? null,
          lead,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKey });
      queryClient.invalidateQueries({ queryKey: activitiesQueryKey });
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      toast.success("Marked as contacted");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={Boolean(lead)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as contacted</DialogTitle>
          <DialogDescription>
            {lead?.company_name} — last contacted will be set to today.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="next-follow-up">Next follow-up date</Label>
          <Input
            id="next-follow-up"
            type="date"
            value={nextFollowUp}
            onChange={(e) => setNextFollowUp(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
