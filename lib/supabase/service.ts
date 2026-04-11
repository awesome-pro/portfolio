// Service-role Supabase client — bypasses RLS.
// Only use in trusted server-side code (Route Handlers, Server Actions).
// Never expose to the browser.
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
