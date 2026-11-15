import { z } from "zod";

// ── Projects ─────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(120),
  clientName: z.string().trim().min(1, "Client name is required").max(120),
  targetUrl: z
    .string()
    .trim()
    .url("Target URL must be a valid URL (include https://)")
    .max(2048),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    clientName: z.string().trim().min(1).max(120).optional(),
    targetUrl: z.string().trim().url().max(2048).optional(),
    status: z.enum(["active", "completed", "archived"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

// ── Public feedback submission ───────────────────────────────────────────────

export const annotationSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  note: z.string().trim().max(500),
});

export const annotationsSchema = z.array(annotationSchema).max(20);

export const submissionFieldsSchema = z.object({
  token: z.string().trim().min(8).max(128),
  rawText: z
    .string()
    .trim()
    .min(10, "Please describe the change in at least 10 characters")
    .max(10_000, "Feedback is too long (max 10,000 characters)"),
});

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_SCREENSHOT_TYPES = ["image/jpeg", "image/png"];

// ── Feedback items ───────────────────────────────────────────────────────────

export const itemStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "done"]),
});

export const parseRequestSchema = z.object({
  submissionId: z.string().uuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
