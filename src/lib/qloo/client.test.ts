import { describe, expect, it, vi } from "vitest";
import { QlooApiError, QlooClient, normalizeQlooEntity } from "./client";

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("Qloo client", () => {
  it("uses the hackathon auth header and documented endpoint for search", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      response({
        success: true,
        results: {
          entities: [
            {
              entity_id: "artist-1",
              name: "Little Simz",
              subtype: "urn:entity:artist",
              properties: { image: { url: "https://example.com/image.jpg" } },
              popularity: 0.91,
            },
          ],
        },
      }),
    );
    const client = new QlooClient({
      apiKey: "secret-test-key",
      baseUrl: "https://hackathon.api.qloo.com",
      fetcher,
    });

    const result = await client.searchEntities({
      query: "Little Simz",
      types: ["urn:entity:artist"],
      take: 5,
    });
    const [url, init] = fetcher.mock.calls[0];

    expect(new URL(String(url)).pathname).toBe("/search");
    expect(new URL(String(url)).searchParams.get("types")).toBe("urn:entity:artist");
    expect((init?.headers as Record<string, string>)["X-Api-Key"]).toBe("secret-test-key");
    expect(result.entities[0]).toMatchObject({
      id: "artist-1",
      name: "Little Simz",
      imageUrl: "https://example.com/image.jpg",
    });
  });

  it("uses insights instead of the unsupported legacy recommendation paths", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      response({ results: { entities: [] } }),
    );
    const client = new QlooClient({ apiKey: "key", fetcher });

    await client.getRecommendations({
      type: "urn:entity:movie",
      signalEntityIds: ["artist-1"],
    });

    expect(new URL(String(fetcher.mock.calls[0][0])).pathname).toBe("/v2/insights");
  });

  it("caches identical successful requests within a client", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      response({ results: { entities: [] } }),
    );
    const client = new QlooClient({ apiKey: "key", fetcher, cacheTtlMs: 10000 });

    await client.searchEntities({ query: "Kyoto" });
    await client.searchEntities({ query: "Kyoto" });

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("passes documented release-year filters only to year-aware entity pools", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      response({ results: { entities: [] } }),
    );
    const client = new QlooClient({ apiKey: "key", fetcher });

    await client.eraPool({ year: 2019, domain: "Film/TV" });
    const movieUrl = new URL(String(fetcher.mock.calls[0][0]));
    expect(movieUrl.searchParams.get("filter.release_year.min")).toBe("2019");
    expect(movieUrl.searchParams.get("filter.release_year.max")).toBe("2019");

    await client.eraPool({ year: 2019, domain: "Music" });
    const artistUrl = new URL(String(fetcher.mock.calls[1][0]));
    expect(artistUrl.searchParams.get("filter.release_year.min")).toBeNull();
  });

  it("surfaces non-success responses as typed errors", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      response({ error: "unauthorized" }, { status: 401 }),
    );
    const client = new QlooClient({ apiKey: "bad", fetcher });

    await expect(client.searchEntities({ query: "test" })).rejects.toBeInstanceOf(QlooApiError);
  });

  it("rejects malformed entity payloads instead of inventing IDs", () => {
    expect(normalizeQlooEntity({ name: "No ID", subtype: "urn:entity:movie" })).toBeNull();
  });
});
