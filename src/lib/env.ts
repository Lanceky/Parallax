import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

const serverEnvSchema = z.object({
  QLOO_API_KEY: nonEmptyString.optional(),
  QLOO_BASE_URL: z.string().url().optional(),
  QLOO_TIMEOUT_MS: z.coerce.number().int().positive().max(60000).default(8000),
  DATABASE_URL: nonEmptyString.optional(),
  ANTHROPIC_API_KEY: nonEmptyString.optional(),
  NEXT_PUBLIC_DEMO_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvironmentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentConfigError";
  }
}

const productionRequirements = [
  "QLOO_API_KEY",
  "QLOO_BASE_URL",
  "DATABASE_URL",
  "ANTHROPIC_API_KEY",
] as const;

function formatIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("; ");
}

export function parseServerEnv(
  input: Record<string, string | undefined>,
  options: { strict?: boolean } = {},
): ServerEnv {
  const parsed = serverEnvSchema.safeParse(input);

  if (!parsed.success) {
    throw new EnvironmentConfigError(formatIssues(parsed.error.issues));
  }

  if (options.strict) {
    const missing = productionRequirements.filter((key) => !input[key]?.trim());

    if (missing.length > 0) {
      throw new EnvironmentConfigError(
        `Missing production environment variables: ${missing.join(", ")}`,
      );
    }
  }

  return parsed.data;
}

export function getServerEnv(): ServerEnv {
  return parseServerEnv(process.env, {
    strict: process.env.NODE_ENV === "production",
  });
}

export function getIntegrationStatus(input: Record<string, string | undefined> = process.env) {
  const result = serverEnvSchema.safeParse(input);
  const errors = result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
  const values = result.success ? result.data : undefined;

  return {
    valid: result.success,
    errors,
    demoMode: values?.NEXT_PUBLIC_DEMO_MODE ?? true,
    qloo: Boolean(values?.QLOO_API_KEY && values.QLOO_BASE_URL),
    database: Boolean(values?.DATABASE_URL),
    llm: Boolean(values?.ANTHROPIC_API_KEY),
  };
}
