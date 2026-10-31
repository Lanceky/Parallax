import { z } from "zod";

export const dataScopes = ["private", "trusted", "public"] as const;
export type DataScope = (typeof dataScopes)[number];

export const sourceKinds = [
  "whatsapp",
  "telegram",
  "spotify",
  "youtube",
  "netflix",
  "instagram",
  "screenshot",
  "photo",
  "anchor",
] as const;
export type SourceKind = (typeof sourceKinds)[number];

export const extractedEvidenceSchema = z.object({
  surface: z.string().trim().min(1).max(240),
  typeHint: z.string().trim().min(1).max(80),
  sentiment: z.number().int().min(-2).max(2).default(1),
  year: z.number().int().min(1900).max(2200).optional(),
});

export type ExtractedEvidence = z.infer<typeof extractedEvidenceSchema>;

export interface ConsentEvent {
  userId: string;
  action: "source_received" | "entity_confirmed" | "entity_deleted" | "profile_wiped" | "scope_changed";
  detail: Record<string, unknown>;
}

export class PrivacyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivacyError";
  }
}

export function assertAdult(over18: boolean): void {
  if (!over18) {
    throw new PrivacyError("Parallax is available to adults 18 and over.");
  }
}

export function canAccessScope(requested: DataScope, stored: DataScope): boolean {
  if (requested === "private") {
    return stored === "private";
  }
  if (requested === "trusted") {
    return stored === "private" || stored === "trusted";
  }
  return true;
}

export function sanitizeExtractedEvidence(input: unknown): ExtractedEvidence {
  const parsed = extractedEvidenceSchema.safeParse(input);

  if (!parsed.success) {
    throw new PrivacyError("Evidence must contain a short, confirmed entity surface and type.");
  }

  return {
    surface: parsed.data.surface,
    typeHint: parsed.data.typeHint,
    sentiment: parsed.data.sentiment,
    year: parsed.data.year,
  };
}

export function buildConsentEvent(
  userId: string,
  action: ConsentEvent["action"],
  detail: Record<string, unknown> = {},
): ConsentEvent {
  if (!userId.trim()) {
    throw new PrivacyError("A consent event requires a user ID.");
  }

  return { userId, action, detail };
}

export interface WipeRepository {
  deleteUserData(userId: string): Promise<void>;
}

export async function wipeUserData(repository: WipeRepository, userId: string): Promise<void> {
  if (!userId.trim()) {
    throw new PrivacyError("A profile wipe requires a user ID.");
  }

  await repository.deleteUserData(userId);
}
