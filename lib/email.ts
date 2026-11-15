/**
 * Email notifications via Resend's REST API (no SDK dependency).
 * If RESEND_API_KEY is unset, logs to console instead — v1-friendly.
 * Failures never block the caller; they're logged and swallowed.
 */

interface NewFeedbackEmailArgs {
  to: string;
  projectName: string;
  projectId: string;
  counts: { urgent: number; normal: number; low: number };
}

export async function sendNewFeedbackEmail({
  to,
  projectName,
  projectId,
  counts,
}: NewFeedbackEmailArgs): Promise<void> {
  const total = counts.urgent + counts.normal + counts.low;
  const summaryParts = [
    counts.urgent > 0 ? `${counts.urgent} urgent` : null,
    counts.normal > 0 ? `${counts.normal} normal` : null,
    counts.low > 0 ? `${counts.low} low` : null,
  ].filter(Boolean);

  const subject = `New feedback on ${projectName}`;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${projectId}`;
  const text = `Your client just sent feedback on "${projectName}".

${total} new item${total === 1 ? "" : "s"}: ${summaryParts.join(", ")}.

Review the checklist: ${dashboardUrl}

— Revision Inbox
(You can turn these emails off from your Billing & Settings page.)`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Revision Inbox <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[email] (no RESEND_API_KEY — would send)\nTo: ${to}\nSubject: ${subject}\n${text}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!res.ok) {
      console.error(`[email] Resend error ${res.status}: ${await res.text().catch(() => "")}`);
    }
  } catch (err) {
    console.error("[email] Failed to send notification", err);
  }
}
