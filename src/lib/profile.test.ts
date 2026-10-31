import { describe, expect, it } from "vitest";
import {
  SOURCE_TRUST,
  applyEntityCorrection,
  buildEraProfile,
  calculateSignalWeight,
  mergeSignals,
} from "./profile";

describe("era profile merge engine", () => {
  it("applies the documented source trust ordering", () => {
    expect(SOURCE_TRUST.export).toBeGreaterThan(SOURCE_TRUST.screenshot);
    expect(SOURCE_TRUST.screenshot).toBeGreaterThan(SOURCE_TRUST.tap);
    expect(SOURCE_TRUST.tap).toBeGreaterThan(SOURCE_TRUST.photo);
    expect(SOURCE_TRUST.photo).toBeGreaterThan(SOURCE_TRUST.inferred);
  });

  it("weights positive signals by sentiment, trust, recency, and mentions", () => {
    expect(calculateSignalWeight({ sentiment: 2, provenance: "export", mentions: 3, recency: 1 })).toBeCloseTo(
      2 * Math.log1p(3),
    );
    expect(calculateSignalWeight({ sentiment: 2, provenance: "inferred", mentions: 3, recency: 1 })).toBeLessThan(
      calculateSignalWeight({ sentiment: 2, provenance: "tap", mentions: 3, recency: 1 }),
    );
  });

  it("merges duplicate entities and surfaces love/hate conflicts", () => {
    const entities = mergeSignals([
      {
        qlooEntityId: "artist-1",
        name: "Artist",
        domain: "Music",
        sentiment: 2,
        provenance: "tap",
        mentions: 2,
      },
      {
        qlooEntityId: "artist-1",
        name: "Artist",
        domain: "Music",
        sentiment: -2,
        provenance: "export",
        mentions: 1,
      },
    ]);

    expect(entities).toHaveLength(1);
    expect(entities[0]).toMatchObject({
      qlooEntityId: "artist-1",
      conflict: true,
      provenanceSet: ["tap", "export"],
    });
  });

  it("builds a profile with completeness and positive top entities", () => {
    const profile = buildEraProfile({
      eraId: "campus",
      label: "Campus-me",
      years: "2016 - 2019",
      signals: [
        {
          qlooEntityId: "artist-1",
          name: "Artist",
          domain: "Music",
          sentiment: 2,
          provenance: "export",
          mentions: 4,
        },
        {
          qlooEntityId: "movie-1",
          name: "Movie",
          domain: "Film/TV",
          sentiment: 1,
          provenance: "tap",
          mentions: 1,
        },
      ],
    });

    expect(profile.completeness).toBeGreaterThan(0);
    expect(profile.topEntities.map((entity) => entity.qlooEntityId)).toEqual(["artist-1", "movie-1"]);
  });

  it("replaces a disputed entity with the user's explicit correction", () => {
    const corrected = applyEntityCorrection(
      [
        {
          qlooEntityId: "food-1",
          name: "Ramen",
          domain: "Food",
          sentiment: 2,
          provenance: "export",
        },
      ],
      { qlooEntityId: "food-1", sentiment: -2 },
    );

    expect(corrected).toHaveLength(1);
    expect(corrected[0]).toMatchObject({ qlooEntityId: "food-1", sentiment: -2, provenance: "tap" });
  });
});
