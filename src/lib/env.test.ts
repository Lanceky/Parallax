import { describe, expect, it } from "vitest";
import { EnvironmentConfigError, getIntegrationStatus, parseServerEnv } from "./env";

const completeEnv = {
  QLOO_API_KEY: "qloo-test-key",
  QLOO_BASE_URL: "https://api.qloo.com",
  DATABASE_URL: "postgres://localhost/parallax",
  ANTHROPIC_API_KEY: "anthropic-test-key",
  NEXT_PUBLIC_DEMO_MODE: "false",
};

describe("server environment", () => {
  it("parses a complete production configuration", () => {
    expect(parseServerEnv(completeEnv, { strict: true })).toMatchObject({
      QLOO_API_KEY: "qloo-test-key",
      QLOO_BASE_URL: "https://api.qloo.com",
      NEXT_PUBLIC_DEMO_MODE: false,
    });
  });

  it("rejects malformed URLs before a request can be made", () => {
    expect(() =>
      parseServerEnv({
        ...completeEnv,
        QLOO_BASE_URL: "not-a-url",
      }),
    ).toThrow(EnvironmentConfigError);
  });

  it("requires integrations in strict production mode", () => {
    expect(() => parseServerEnv({}, { strict: true })).toThrow(
      "Missing production environment variables",
    );
  });

  it("reports an unconfigured demo-friendly runtime without exposing values", () => {
    expect(getIntegrationStatus({})).toMatchObject({
      valid: true,
      demoMode: true,
      qloo: false,
      database: false,
      llm: false,
    });
  });
});
