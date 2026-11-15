// Database row types for Revision Inbox tables (snake_case, mirrors Postgres)

export type ProjectStatus = "active" | "completed" | "archived";
export type FeedbackCategory = "copy" | "layout" | "color" | "bug" | "other";
export type FeedbackPriority = "urgent" | "normal" | "low";
export type FeedbackItemStatus = "open" | "in_progress" | "done";
export type SubmissionParseStatus = "pending" | "parsed" | "failed";
export type SubscriptionTier = "free" | "solo";

export interface Annotation {
  /** Percentage 0–100 relative to image width */
  x: number;
  /** Percentage 0–100 relative to image height */
  y: number;
  note: string;
}

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  client_name: string;
  target_url: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientLinkRow {
  id: string;
  project_id: string;
  token: string;
  created_at: string;
}

export interface FeedbackSubmissionRow {
  id: string;
  project_id: string;
  raw_text: string;
  screenshot_url: string | null;
  screenshot_annotations: Annotation[] | null;
  client_ip: string | null;
  parse_status: SubmissionParseStatus;
  submitted_at: string;
}

export interface FeedbackItemRow {
  id: string;
  submission_id: string | null;
  project_id: string;
  category: FeedbackCategory;
  section: string;
  priority: FeedbackPriority;
  summary: string;
  raw_feedback: string;
  status: FeedbackItemStatus;
  created_at: string;
  marked_done_at: string | null;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  is_subscribed: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_tier: SubscriptionTier;
  email_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}
