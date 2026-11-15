"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TIERS } from "@/lib/pricing";
import type { SubscriptionTier } from "@/lib/supabase/types";

interface Props {
  userName: string;
  tier: SubscriptionTier;
}

const LINKS = [
  { href: "/dashboard", label: "Projects", icon: "📋" },
  { href: "/billing", label: "Billing & Settings", icon: "💳" },
  { href: "/onboarding", label: "How it works", icon: "✨" },
];

export default function SidebarNav({ userName, tier }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:min-h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="px-5 py-5">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-slate-900">
          📥 Revision Inbox
        </Link>
        <div className="mt-1 text-xs font-medium text-slate-400">
          {TIERS[tier].name} plan
        </div>
      </div>

      <nav className="flex flex-row gap-1 px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
        {LINKS.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-100 px-5 py-4 md:block">
        <div className="mb-2 truncate text-sm font-medium text-slate-700">{userName}</div>
        <button
          onClick={handleSignOut}
          className="text-sm text-slate-400 transition-colors hover:text-slate-700"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
