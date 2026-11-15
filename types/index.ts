// Shared app-facing types (camelCase, used in API responses + components)

import type {
  ProjectRow,
  FeedbackItemRow,
  ProjectStatus,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackItemStatus,
} from "@/lib/supabase/types";

export type {
  ProjectStatus,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackItemStatus,
  Annotation,
  SubscriptionTier,
} from "@/lib/supabase/types";

export interface Project {
  id: string;
  name: string;
  clientName: string;
  targetUrl: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackItem {
  id: string;
  submissionId: string | null;
  projectId: string;
  category: FeedbackCategory;
  section: string;
  priority: FeedbackPriority;
  summary: string;
  rawFeedback: string;
  status: FeedbackItemStatus;
  createdAt: string;
  markedDoneAt: string | null;
}

export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    targetUrl: row.target_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toFeedbackItem(row: FeedbackItemRow): FeedbackItem {
  return {
    id: row.id,
    submissionId: row.submission_id,
    projectId: row.project_id,
    category: row.category,
    section: row.section,
    priority: row.priority,
    summary: row.summary,
    rawFeedback: row.raw_feedback,
    status: row.status,
    createdAt: row.created_at,
    markedDoneAt: row.marked_done_at,
  };
}
