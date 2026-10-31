import { describe, expect, it } from "vitest";
import { demoSelves, timelineYears } from "./demo-data";

describe("demo persona", () => {
  it("ships three distinct selves for a no-login judge path", () => {
    expect(demoSelves).toHaveLength(3);
    expect(new Set(demoSelves.map((self) => self.id)).size).toBe(3);
    expect(demoSelves.every((self) => self.entities.length >= 5)).toBe(true);
  });

  it("connects every timeline marker to a seeded self", () => {
    const selfIds = new Set(demoSelves.map((self) => self.id));
    expect(timelineYears.every((marker) => selfIds.has(marker.selfId))).toBe(true);
  });
});
