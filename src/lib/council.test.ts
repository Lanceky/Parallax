import { describe, expect, it } from "vitest";
import { buildCouncil, normalizeCouncilRequest } from "./council";

describe("Council engine", () => {
  it("requires a real question, multiple options, and seats", () => {
    expect(() =>
      normalizeCouncilRequest({ question: "short", options: ["one"], selfIds: [] }),
    ).toThrow();
    expect(
      normalizeCouncilRequest({
        question: "Where should I go for dinner?",
        options: ["Ramen", "Tacos"],
        selfIds: ["campus"],
      }),
    ).toMatchObject({ mode: "compare", qlooEnabled: true });
  });

  it("returns grounded evidence and a ranked verdict", () => {
    const result = buildCouncil({
      question: "Where should I go for dinner?",
      options: ["Tacos", "Ramen"],
      selfIds: ["campus", "new-city", "now"],
    });

    expect(result.options).toHaveLength(2);
    expect(result.options[0].averageScore).toBeGreaterThanOrEqual(result.options[1].averageScore);
    expect(result.verdict).toContain(result.options[0].option);
    expect(result.options.every((option) => option.scores.length === 3)).toBe(true);
  });

  it("uses Qloo scores when supplied and reports unanimity", () => {
    const result = buildCouncil(
      {
        question: "Which jacket should I buy?",
        options: ["A.P.C.", "Carhartt WIP"],
        selfIds: ["now"],
      },
      {
        externalScores: new Map([["now::A.P.C.", 91]]),
        qlooMode: "live",
      },
    );

    expect(result.qlooMode).toBe("live");
    expect(result.options[0].option).toBe("A.P.C.");
    expect(result.options[0].scores[0].qlooGrounded).toBe(true);
    expect(result.verdict).toContain("unanimous");
  });
});
