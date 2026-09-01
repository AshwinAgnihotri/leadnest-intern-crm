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

export function MarkContactedDialog({
  lead,
  onOpenChange,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [nextFollowUp, setNextFollowUp] = useState("");
  const queryClient = useQueryClient();

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKey });
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
