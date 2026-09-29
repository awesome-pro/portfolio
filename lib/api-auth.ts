import { createClient } from "@/lib/supabase/server";

/**
 * The session check for the admin API routes.
 *
 * proxy.ts guards `/admin/*` but not `/api/*`, so any route that touches
 * personal data has to verify the session itself. `getUser()` rather than
 * `getSession()`: it validates the token with the auth server instead of
 * trusting the cookie.
 */
export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Postgres: undefined_table — the migration has not been run yet. */
export const UNDEFINED_TABLE = "42P01";
