import type { SubscriptionTier } from "@/lib/supabase/types";

export interface Tier {
  key: SubscriptionTier;
  name: string;
  /** USD per month */
  price: number;
  /** null = unlimited */
  maxActiveProjects: number | null;
  blurb: string;
}

export const TIERS: Record<SubscriptionTier, Tier> = {
  free: {
    key: "free",
    name: "Free",
    price: 0,
    maxActiveProjects: 1,
    blurb: "1 active project · AI feedback parsing · client status view",
  },
  solo: {
    key: "solo",
    name: "Solo",
    price: 15,
    maxActiveProjects: null,
    blurb: "Unlimited active projects · all features · email notifications",
  },
};

/** Stripe Price ID for the Solo plan (create in Stripe Dashboard, $15/mo recurring). */
export const SOLO_PRICE_ID = process.env.STRIPE_PRICE_ID_SOLO;

export function canCreateProject(tier: SubscriptionTier, activeProjectCount: number): boolean {
  const max = TIERS[tier].maxActiveProjects;
  return max === null || activeProjectCount < max;
}
