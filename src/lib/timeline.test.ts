import { describe, expect, it } from "vitest";
import { compareProfiles, calculateProfileSimilarity, translateEntity } from "./timeline";
import { demoSelves } from "./demo-data";

describe("timeline traversal", () => {
  it("calculates a bounded similarity and explicit drift sets", () => {
    const campus = demoSelves.find((self) => self.id === "campus")!;
    const now = demoSelves.find((self) => self.id === "now")!;
    const summary = compareProfiles(campus, now);

    expect(calculateProfileSimilarity(campus, now)).toBe(summary.similarity);
    expect(summary.similarity).toBeGreaterThanOrEqual(0);
    expect(summary.similarity).toBeLessThanOrEqual(100);
    expect(summary.dropped.length + summary.acquired.length).toBeGreaterThan(0);
  });

  it("translates with visible confidence and direction", () => {
    expect(
      translateEntity({
        entityName: "Little Simz",
        targetYear: 2012,
        direction: "to_past",
        candidates: ["Lauryn Hill"],
        qlooGrounded: true,
      }),
    ).toMatchObject({
      source: "Little Simz",
      target: "Lauryn Hill",
      confidence: 0.86,
      qlooGrounded: true,
    });
  });
});
