import { supabase } from "@/integrations/supabase/client";

export interface Note {
  id: string;
  note_id: string;
  lead_id: string;
  created_by: string | null;
  intern_id: string | null;
  note_text: string;
  created_date: string;
  created_time: string;
  created_at: string;
  updated_at: string;
}

export const notesQueryKey = ["notes"] as const;

export async function fetchNotes(leadId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Failed to load notes");
  return (data ?? []) as Note[];
}

export async function createNote(input: {
  lead_id: string;
  note_text: string;
  created_by: string | null;
  intern_id: string | null;
}): Promise<Note> {
  const { data, error } = await supabase.from("notes").insert(input).select().single();
  if (error) throw new Error("Failed to add note");
  return data as Note;
}

export async function updateNote(id: string, note_text: string): Promise<Note> {
  const { data, error } = await supabase
    .from("notes")
    .update({ note_text })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error("Failed to update note");
  return data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw new Error("Failed to delete note");
}
