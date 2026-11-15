import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { TIERS } from "@/lib/pricing";
import NotificationsToggle from "@/components/dashboard/NotificationsToggle";
import type { SubscriptionTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, stripe_subscription_id, email_notifications_enabled")
    .eq("id", user!.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const plan = TIERS[tier];

  // Renewal date for paid plans (best-effort; page still renders if Stripe is down)
  let renewsAt: string | null = null;
  if (tier === "solo" && profile?.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      renewsAt = new Date(sub.current_period_end * 1000).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (err) {
      console.error("[billing] failed to fetch subscription", err);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Billing & Settings</h1>

      {/* Current plan */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              {plan.name} Plan
              {renewsAt && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  — renews {renewsAt}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{plan.blurb}</p>
          </div>
          <span className="text-lg font-bold text-slate-900">
            ${plan.price}
            <span className="text-sm font-normal text-slate-400">/mo</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {tier === "free" ? (
            <a
              href="/api/billing/checkout"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Upgrade to Solo — ${TIERS.solo.price}/mo
            </a>
          ) : (
            <a
              href="/api/billing/portal"
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Manage subscription
            </a>
          )}
        </div>
        {tier === "solo" && (
          <p className="mt-3 text-xs text-slate-400">
            Billing history, payment method, and cancellation are handled in the
            Stripe customer portal via “Manage subscription”.
          </p>
        )}
      </div>

      {/* Plan comparison for free users */}
      {tier === "free" && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Object.values(TIERS).map((t) => (
            <div
              key={t.key}
              className={`rounded-2xl border p-5 ${
                t.key === tier
                  ? "border-slate-200 bg-white"
                  : "border-indigo-200 bg-indigo-50/50"
              }`}
            >
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-semibold text-slate-900">{t.name}</span>
                <span className="font-bold text-slate-900">
                  ${t.price}
                  <span className="text-xs font-normal text-slate-400">/mo</span>
                </span>
              </div>
              <p className="text-sm text-slate-500">{t.blurb}</p>
              {t.key === tier && (
                <p className="mt-2 text-xs font-semibold text-slate-400">Current plan</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notification settings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Notifications</h2>
        <NotificationsToggle
          initialEnabled={profile?.email_notifications_enabled ?? true}
        />
      </div>
    </div>
  );
}
