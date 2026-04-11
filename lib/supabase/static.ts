// Cookie-free Supabase client for use at build time (generateStaticParams, sitemap).
// Only works with public data (is_published = true via RLS).
import { createClient } from "@supabase/supabase-js";

export function createStaticClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
