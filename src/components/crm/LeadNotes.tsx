import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Lead } from "@/lib/crm";
import { formatDate } from "@/lib/crm";
import { createNote, deleteNote, fetchNotes, notesQueryKey, updateNote, type Note } from "@/lib/notes";
import { formatTime, logActivity, activitiesQueryKey } from "@/lib/activity";
import { notificationsQueryKey, notify } from "@/lib/notifications";
import { useCurrentIntern } from "@/lib/current-intern";
import { useInterns } from "@/lib/use-interns";
import { EmptyState } from "@/components/crm/EmptyState";

export function LeadNotes({ lead }: { lead: Lead }) {
  const queryClient = useQueryClient();
  const { intern } = useCurrentIntern();
  const interns = useInterns();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [toDelete, setToDelete] = useState<Note | null>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: [...notesQueryKey, lead.id],
    queryFn: () => fetchNotes(lead.id),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [...notesQueryKey, lead.id] });
    queryClient.invalidateQueries({ queryKey: activitiesQueryKey });
    queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
  };

  const owner = interns.find((i) =>
    lead.intern_id ? i.id === lead.intern_id : i.name === lead.assigned_intern,
  );

  const addMutation = useMutation({
    mutationFn: async (text: string) => {
      await createNote({
        lead_id: lead.id,
        note_text: text,
        created_by: intern?.name ?? "CRM User",
        intern_id: intern?.id ?? null,
      });
      await logActivity({
        action: "Add Note",
        description: `Added a note on ${lead.company_name}`,
        intern: intern ?? null,
        lead,
      });
      if (owner) {
        await notify({
          title: "New note added",
          message: `${intern?.name ?? "Someone"} added a note to ${lead.company_name}.`,
          type: "Note",
          intern: owner,
          lead,
        });
      }
    },
    onSuccess: () => {
      refresh();
      setDraft("");
      setAdding(false);
      toast.success("Note added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      await updateNote(id, text);
      await logActivity({
        action: "Edit Note",
        description: `Edited a note on ${lead.company_name}`,
        intern: intern ?? null,
        lead,
      });
    },
    onSuccess: () => {
      refresh();
      setEditingId(null);
      toast.success("Note updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (note: Note) => {
      await deleteNote(note.id);
      await logActivity({
        action: "Delete Note",
        description: `Deleted a note on ${lead.company_name}`,
        intern: intern ?? null,
        lead,
      });
    },
    onSuccess: () => {
      refresh();
      setToDelete(null);
      toast.success("Note deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Notes</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
          <Plus className="size-4" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a note about this lead..."
              rows={3}
              aria-label="New note"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!draft.trim() || addMutation.isPending}
                onClick={() => addMutation.mutate(draft.trim())}
              >
                Save Note
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2"><div className="crm-skeleton h-20 rounded-lg" /><div className="crm-skeleton h-20 rounded-lg" /></div>
        ) : notes.length === 0 ? (
          <EmptyState icon={MessageSquareText} title="No notes yet" description="Add context, call outcomes, or useful details for the next conversation." />
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-xl border border-border/70 bg-background/30 p-4 transition-all hover:border-primary/20 hover:bg-accent/20">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {note.created_by ?? "CRM User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.created_date)} — {formatTime(note.created_time)}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit note"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditText(note.note_text);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete note"
                      onClick={() => setToDelete(note)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {editingId === note.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      aria-label="Edit note"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!editText.trim() || editMutation.isPending}
                        onClick={() =>
                          editMutation.mutate({ id: note.id, text: editText.trim() })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {note.note_text}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>This note will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && deleteMutation.mutate(toDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
