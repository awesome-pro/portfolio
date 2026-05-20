import { createServiceClient } from "@/lib/supabase/service";

export type RevenueConfidence = "high" | "medium" | "low" | null;

export interface ProductOpportunity {
  id: string;
  created_at: string;
  discovered_on: string;
  product_name: string;
  website_url: string | null;
  canonical_domain: string;
  target_customer: string | null;
  core_product_idea: string | null;
  business_model: string | null;
  pricing_summary: string | null;
  revenue_raw_text: string | null;
  revenue_confidence: RevenueConfidence;
  clone_opportunity_score: number | null;
  why_this_is_cloneable: string | null;
  simpler_cheaper_angle: string | null;
  likely_distribution_channels: unknown[] | null;
  main_risks: string | null;
  source_urls: unknown[] | null;
}

export async function getAllProductOpportunities(): Promise<
  ProductOpportunity[]
> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_opportunities")
    .select("*")
    .order("discovered_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as ProductOpportunity[]) ?? [];
}

export async function getProductOpportunityById(
  id: string
): Promise<ProductOpportunity | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ProductOpportunity;
}
