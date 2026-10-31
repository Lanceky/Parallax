import { describe, expect, it } from "vitest";
import { detectImportSource, parseSpotifyHistory, parseWhatsAppExport, summarizeActivities } from "./importers";

describe("dated importers", () => {
  it("detects Spotify exports from content", () => {
    expect(detectImportSource("history.json", '[{"ms_played":120000,"trackName":"Song"}]')).toBe("spotify");
  });

  it("filters short Spotify plays and extracts artist plus track signals", () => {
    const activities = parseSpotifyHistory([
      {
        ts: "2020-04-04T20:00:00Z",
        master_metadata_track_name: "Intro",
        master_metadata_album_artist_name: "Artist",
        ms_played: 180000,
      },
      {
        ts: "2020-04-04T20:00:00Z",
        trackName: "Skip",
        artistName: "Artist",
        ms_played: 12000,
      },
    ]);

    expect(activities).toHaveLength(2);
    expect(activities.map((activity) => activity.surface)).toEqual(["Artist", "Intro"]);
  });

  it("keeps only the selected WhatsApp author", () => {
    const text = [
      "[12/03/2020, 14:22:10] Me: I played Little Simz all week",
      "[12/03/2020, 14:23:10] Other: same here",
      "12/03/20, 14:24 - Me: and watched Atlanta",
    ].join("\n");
    const activities = parseWhatsAppExport(text, "Me");

    expect(activities).toHaveLength(2);
    expect(activities.every((activity) => activity.author === "Me")).toBe(true);
  });

  it("creates a year histogram and ranked entity summary", () => {
    const summary = summarizeActivities("spotify", [
      { timestamp: "2020", year: 2020, surface: "Artist", typeHint: "artist", source: "spotify", mentions: 3 },
      { timestamp: "2020", year: 2020, surface: "Artist", typeHint: "artist", source: "spotify", mentions: 1 },
    ]);

    expect(summary.years["2020"]).toBe(4);
    expect(summary.entities[0]).toMatchObject({ surface: "artist", mentions: 4 });
  });
});
