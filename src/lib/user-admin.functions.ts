import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CreateAccountInput {
  role: "intern" | "admin";
  name: string;
  email: string;
  password: string;
  internId?: string | null;
}

function fail(message: string): never {
  throw new Error(message);
}

async function assertOwner(supabase: {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}) {
  const { data, error } = await supabase.rpc("is_owner");
  if (error || data !== true) fail("Only the owner can manage accounts.");
}

/** Owner-only: creates a login account plus its profile (and intern record). */
export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CreateAccountInput) => input)
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase as never);

    const role = data.role === "admin" ? "admin" : "intern";
    const name = (data.name ?? "").trim();
    const email = (data.email ?? "").trim().toLowerCase();
    const password = data.password ?? "";
    const internId = (data.internId ?? "").trim();

    if (!name) fail("Please enter a full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Please enter a valid email address.");
    if (password.length < 8) fail("The password must be at least 8 characters long.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Duplicate checks with friendly messages before touching Auth.
    if (role === "intern" && internId) {
      const { data: clash } = await supabaseAdmin
        .from("interns")
        .select("id")
        .eq("intern_id", internId)
        .maybeSingle();
      if (clash) fail(`Intern ID “${internId}” is already used by another intern.`);
    }

    const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (authError || !created?.user) {
      const msg = (authError?.message ?? "").toLowerCase();
      if (msg.includes("already")) fail("An account with this email already exists.");
      if (msg.includes("password")) fail("That password is too weak. Use at least 8 characters.");
      fail("Could not create the account. Please try again.");
    }

    const userId = created.user.id;

    try {
      let internUuid: string | null = null;

      if (role === "intern") {
        // Reuse an existing intern record for this email instead of duplicating it.
        const { data: existing } = await supabaseAdmin
          .from("interns")
          .select("*")
          .ilike("email", email)
          .maybeSingle();

        if (existing) {
          const patch: Record<string, string> = { user_id: userId, name };
          if (internId) patch['intern_id'] = internId;
          const { data: updated, error } = await supabaseAdmin
            .from("interns")
            .update(patch as never)
            .eq("id", existing.id)
            .select()
            .single();
          if (error) fail("Could not link the intern record.");
          internUuid = updated.id;
        } else {
          const insert: Record<string, string> = {
            name,
            email,
            user_id: userId,
            status: "Active",
          };
          if (internId) insert['intern_id'] = internId;
          const { data: inserted, error } = await supabaseAdmin
            .from("interns")
            .insert(insert as never)
            .select()
            .single();
          if (error) {
            if (error.message.toLowerCase().includes("duplicate")) {
              fail(`Intern ID “${internId}” is already used by another intern.`);
            }
            fail("Could not create the intern record.");
          }
          internUuid = inserted.id;
        }
      }

      const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
        {
          user_id: userId,
          name,
          email,
          role,
          intern_id: internUuid,
        },
        { onConflict: "user_id" },
      );
      if (profileError) fail("Could not save the account profile.");
    } catch (error) {
      // Never leave a half-created login behind.
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => undefined);
      throw error;
    }

    return { ok: true as const, userId };
  });

/** Owner-only: emails a password-setup / reset link to an account. */
export const sendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; redirectTo: string }) => input)
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email, {
      redirectTo: data.redirectTo,
    });
    if (error) fail("Could not send the reset email. Please try again.");
    return { ok: true as const };
  });

/** Owner-only: activates or deactivates an intern account. */
export const setInternActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { internId: string; active: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("interns")
      .update({ status: data.active ? "Active" : "Inactive" })
      .eq("id", data.internId);
    if (error) fail("Could not update the account status.");
    return { ok: true as const };
  });
