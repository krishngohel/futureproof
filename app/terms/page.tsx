import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Futureproof",
  description: "Read Futureproof's Terms of Service.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "#111111",
        fontFamily: "-apple-system,'Inter',ui-sans-serif,system-ui,sans-serif",
        color: "#cacaca",
      }}
    >
      {/* Nav */}
      <nav
        className="sticky top-0 z-40"
        style={{
          borderBottom: "1px solid rgba(52,52,52,0.35)",
          background: "rgba(17,17,17,0.9)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="max-w-[800px] mx-auto px-8 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="font-bold text-[#cacaca] hover:text-white transition-colors duration-150"
            style={{ fontSize: 15, letterSpacing: "-0.025em" }}
          >
            Futureproof
          </Link>
          <span style={{ color: "#444", fontSize: 14 }}>/</span>
          <span className="font-bold text-[#666666]" style={{ fontSize: 14 }}>
            Terms of Service
          </span>
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto px-8 py-16">
        <h1
          className="font-bold text-[#cacaca] mb-4"
          style={{ fontSize: 32, letterSpacing: "-0.03em", lineHeight: 1.15 }}
        >
          Terms of Service
        </h1>
        <p className="font-bold text-[#666666] mb-12" style={{ fontSize: 13 }}>
          Last updated: May 2026
        </p>

        {[
          {
            heading: "1. Acceptance of Terms",
            body: `By creating an account or using Futureproof you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the service.`,
          },
          {
            heading: "2. Description of Service",
            body: `Futureproof provides AI literacy courses, interactive exercises, and progress-tracking tools. The first module is available free of charge. Access to the full course library requires an active subscription.`,
          },
          {
            heading: "3. Accounts",
            body: `You must provide accurate information when creating your account. You are responsible for keeping your login credentials confidential and for all activity that occurs under your account.`,
          },
          {
            heading: "4. Subscriptions & Billing",
            body: `Paid subscriptions are billed monthly in advance. You may cancel at any time; cancellation takes effect at the end of the current billing period. We do not issue prorated refunds for partial months.`,
          },
          {
            heading: "5. Acceptable Use",
            body: `You agree not to misuse the service, attempt to reverse-engineer any part of it, scrape content, or use it for any unlawful purpose. Accounts found in violation may be suspended or terminated without notice.`,
          },
          {
            heading: "6. Intellectual Property",
            body: `All course content, code, and branding on Futureproof is owned by or licensed to us. You may not reproduce or redistribute it without written permission.`,
          },
          {
            heading: "7. Disclaimer of Warranties",
            body: `The service is provided "as is" without warranties of any kind, express or implied. We do not guarantee uninterrupted or error-free access.`,
          },
          {
            heading: "8. Limitation of Liability",
            body: `To the maximum extent permitted by law, Futureproof and its team are not liable for indirect, incidental, or consequential damages arising from your use of the service.`,
          },
          {
            heading: "9. Changes to Terms",
            body: `We may update these terms from time to time. Continued use of the service after changes are posted constitutes acceptance of the revised terms.`,
          },
          {
            heading: "10. Contact",
            body: `Questions about these terms? Email us at hello@futureproof.app.`,
          },
        ].map(({ heading, body }) => (
          <section key={heading} className="mb-10">
            <h2
              className="font-bold text-[#cacaca] mb-3"
              style={{ fontSize: 16, letterSpacing: "-0.02em" }}
            >
              {heading}
            </h2>
            <p
              className="font-bold text-[#999999]"
              style={{ fontSize: 14, lineHeight: 1.7, letterSpacing: "-0.014em" }}
            >
              {body}
            </p>
          </section>
        ))}

        <div className="mt-16 pt-8" style={{ borderTop: "1px solid rgba(52,52,52,0.4)" }}>
          <Link
            href="/"
            className="font-bold text-[#ff4300] hover:opacity-80 transition-opacity"
            style={{ fontSize: 14, letterSpacing: "-0.016em" }}
          >
            ← Back to Futureproof
          </Link>
        </div>
      </main>
    </div>
  );
}
