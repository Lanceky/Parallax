import { describe, expect, it, vi } from "vitest";
import {
  PrivacyError,
  assertAdult,
  buildConsentEvent,
  canAccessScope,
  sanitizeExtractedEvidence,
  wipeUserData,
} from "./privacy";

describe("privacy boundaries", () => {
  it("blocks under-18 profiles", () => {
    expect(() => assertAdult(false)).toThrow(PrivacyError);
  });

  it("allows only equal or broader scopes", () => {
    expect(canAccessScope("private", "trusted")).toBe(false);
    expect(canAccessScope("trusted", "private")).toBe(true);
    expect(canAccessScope("public", "private")).toBe(true);
  });

  it("keeps extracted evidence bounded and structured", () => {
    expect(
      sanitizeExtractedEvidence({
        surface: "Little Simz",
        typeHint: "artist",
        sentiment: 2,
      }),
    ).toMatchObject({ surface: "Little Simz", sentiment: 2 });
    expect(() => sanitizeExtractedEvidence({ surface: "", typeHint: "artist" })).toThrow(
      PrivacyError,
    );
  });

  it("records consent without accepting an anonymous user", () => {
    expect(buildConsentEvent("user-1", "entity_confirmed")).toMatchObject({
      userId: "user-1",
      action: "entity_confirmed",
    });
    expect(() => buildConsentEvent(" ", "entity_confirmed")).toThrow(PrivacyError);
  });

  it("delegates a wipe and does not swallow repository errors", async () => {
    const repository = { deleteUserData: vi.fn().mockResolvedValue(undefined) };
    await wipeUserData(repository, "user-1");
    expect(repository.deleteUserData).toHaveBeenCalledWith("user-1");

    const failingRepository = {
      deleteUserData: vi.fn().mockRejectedValue(new Error("database unavailable")),
    };
    await expect(wipeUserData(failingRepository, "user-1")).rejects.toThrow("database unavailable");
  });
});
