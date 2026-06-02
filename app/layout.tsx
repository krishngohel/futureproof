import type { Metadata } from "next";
import "./globals.css";

// Issue 11 — metadataBase enables Next.js to resolve relative alternates (canonical)
// into absolute URLs. Update the URL when you have a production domain.
export const metadata: Metadata = {
  metadataBase: new URL("https://futureproof.app"),
  title: "Futureproof — AI Literacy for Everyone",
  description:
    "Structured AI literacy courses for anyone who wants to understand and use AI confidently. Prompting, real-world use, coding basics, and AI safety.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Futureproof — AI Literacy for Everyone",
    description: "Learn to use AI the right way — at any age, any background, any pace.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "#111111" }}>{children}</body>
    </html>
  );
}
