"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userName: string;
  isSubscribed: boolean;
}

export default function DashboardNav({ userName, isSubscribed }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/dashboard", label: "Home" },
    { href: "/modules",   label: "Modules" },
    { href: "/playground", label: "Playground" },
    { href: "/ide",       label: "IDE" },
  ];

  return (
    <nav
      className="sticky top-0 z-40"
      style={{ borderBottom: "1px solid rgba(52,52,52,0.5)", background: "rgba(17,17,17,0.7)", backdropFilter: "blur(8px)" }}
    >
      <div className="max-w-[1107px] mx-auto px-8 py-4 flex items-center justify-between">
        {/* Left: logo + links */}
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="font-bold text-[#cacaca] hover:text-white transition-colors duration-150"
            style={{ fontSize: 15, letterSpacing: "-0.025em" }}
          >
            Futureproof
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-bold transition-colors duration-150"
                  style={{
                    fontSize: 13,
                    letterSpacing: "-0.016em",
                    padding: "6px 12px",
                    borderRadius: 9,
                    color: active ? "#cacaca" : "#666666",
                    background: active ? "#343434" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#999999"; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#666666"; }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: upgrade + user */}
        <div className="flex items-center gap-4">
          {!isSubscribed && (
            <Link
              href="/api/stripe/checkout"
              className="hidden sm:inline-flex font-bold text-white active:scale-95 transition-all duration-150"
              style={{ background: "#ff4300", borderRadius: 15, padding: "7px 16px", fontSize: 12, letterSpacing: "-0.016em" }}
            >
              Upgrade — $5/mo
            </Link>
          )}

          {/* User dropdown */}
          <div className="relative group">
            <button
              className="flex items-center gap-2 font-bold text-[#666666] hover:text-[#999999] transition-colors duration-150"
              style={{ fontSize: 13, letterSpacing: "-0.016em" }}
            >
              <div
                className="flex items-center justify-center font-bold text-[#cacaca]"
                style={{ width: 32, height: 32, borderRadius: "50%", background: "#343434", fontSize: 13, letterSpacing: "-0.016em" }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block max-w-[120px] truncate">{userName}</span>
            </button>
            <div
              className="absolute right-0 top-full mt-2 w-40 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
              style={{ background: "#181818", border: "1px solid #343434", borderRadius: 12 }}
            >
              <button
                onClick={handleSignOut}
                className="w-full text-left font-bold text-[#666666] hover:text-[#999999] transition-colors"
                style={{ padding: "8px 16px", fontSize: 13, letterSpacing: "-0.016em" }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
