import { describe, expect, it } from "vitest";
import { outcomeWasRight, updateSelfTrust } from "./outcomes";

describe("decision outcomes", () => {
  it("updates Beta trust without inventing a baseline", () => {
    expect(updateSelfTrust({ eraId: "campus", domain: "Food", wasRight: true })).toMatchObject({
      alpha: 2,
      beta: 1,
      accuracy: 67,
      sampleSize: 1,
    });
  });

  it("maps outcome feedback to the self vote", () => {
    expect(outcomeWasRight(2, "love")).toBe(true);
    expect(outcomeWasRight(-1, "love")).toBe(false);
    expect(outcomeWasRight(1, "meh")).toBe(true);
  });
});
