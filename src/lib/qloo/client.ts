import { parseServerEnv } from "@/lib/env";
import {
  type EraPoolParams,
  type QlooAffinity,
  type QlooClientOptions,
  type QlooDomain,
  type QlooEntity,
  type QlooEntityResponse,
  type QlooEntityType,
  type QlooInsightsParams,
  type QlooRecommendation,
  type QlooResponseMeta,
  type QlooSearchParams,
} from "./types";

export const DEFAULT_QLOO_BASE_URL = "https://hackathon.api.qloo.com";

const domainEntityTypes: Record<QlooDomain, QlooEntityType> = {
  Music: "urn:entity:artist",
  "Film/TV": "urn:entity:movie",
  Food: "urn:entity:place",
  Fashion: "urn:entity:brand",
  Games: "urn:entity:video_game",
  Places: "urn:entity:destination",
};

const yearFilterTypes = new Set<QlooEntityType>([
  "urn:entity:book",
  "urn:entity:movie",
  "urn:entity:tv_show",
]);

export class QlooApiError extends Error {
  readonly status: number;
  readonly path: string;
  readonly responseBody: unknown;

  constructor(message: string, options: { status: number; path: string; responseBody?: unknown }) {
    super(message);
    this.name = "QlooApiError";
    this.status = options.status;
    this.path = options.path;
    this.responseBody = options.responseBody;
  }
}

export class QlooNetworkError extends Error {
  readonly path: string;

  constructor(message: string, path: string) {
    super(message);
    this.name = "QlooNetworkError";
    this.path = path;
  }
}

interface RawQlooResult {
  entity_id?: unknown;
  id?: unknown;
  name?: unknown;
  type?: unknown;
  subtype?: unknown;
  properties?: Record<string, unknown>;
  popularity?: unknown;
  tags?: unknown;
  query?: Record<string, unknown>;
  [key: string]: unknown;
}

interface RawQlooPayload {
  success?: unknown;
  duration?: unknown;
  results?: {
    entities?: unknown;
  };
  entities?: unknown;
  query?: Record<string, unknown>;
  [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function toNumberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeTags(value: unknown): QlooEntity["tags"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((tag) => {
    if (!isRecord(tag)) {
      return [];
    }

    const id = toStringOrUndefined(tag.id);
    return id
      ? [
          {
            id,
            name: toStringOrUndefined(tag.name),
            type: toStringOrUndefined(tag.type),
          },
        ]
      : [];
  });
}

export function normalizeQlooEntity(value: unknown): QlooEntity | null {
  if (!isRecord(value)) {
    return null;
  }

  const raw = value as RawQlooResult;
  const properties = isRecord(raw.properties) ? raw.properties : {};
  const id = toStringOrUndefined(raw.entity_id) ?? toStringOrUndefined(raw.id);
  const name = toStringOrUndefined(raw.name);
  const type = toStringOrUndefined(raw.subtype) ?? toStringOrUndefined(raw.type);

  if (!id || !name || !type) {
    return null;
  }

  const image = isRecord(properties.image) ? properties.image : undefined;
  const imageUrl =
    toStringOrUndefined(image?.url) ?? toStringOrUndefined(properties.image_url);

  return {
    id,
    name,
    type,
    subtype: toStringOrUndefined(raw.subtype),
    description:
      toStringOrUndefined(properties.description) ??
      toStringOrUndefined(properties.short_description),
    imageUrl,
    releaseYear:
      toNumberOrUndefined(properties.release_year) ??
      toNumberOrUndefined(properties.publication_year),
    popularity: toNumberOrUndefined(raw.popularity),
    tags: normalizeTags(raw.tags),
    raw,
  };
}

function normalizeResponse(payload: unknown): QlooEntityResponse {
  const raw = isRecord(payload) ? (payload as RawQlooPayload) : {};
  const candidateEntities = Array.isArray(raw.results?.entities)
    ? raw.results.entities
    : Array.isArray(raw.entities)
      ? raw.entities
      : [];
  const entities = candidateEntities.flatMap((entity) => {
    const normalized = normalizeQlooEntity(entity);
    return normalized ? [normalized] : [];
  });

  return {
    entities,
    meta: {
      success: raw.success === true ? true : raw.success === false ? false : undefined,
      duration: toNumberOrUndefined(raw.duration),
      query: isRecord(raw.query) ? raw.query : undefined,
    },
  };
}

function setArrayParam(params: URLSearchParams, key: string, values?: string[]) {
  if (values && values.length > 0) {
    params.set(key, values.join(","));
  }
}

function buildSearchParams(input: QlooInsightsParams): URLSearchParams {
  const params = new URLSearchParams();
  params.set("filter.type", input.type);

  setArrayParam(params, "signal.interests.entities", input.signalEntityIds);
  setArrayParam(params, "signal.interests.tags", input.signalTagIds);
  setArrayParam(params, "filter.tags", input.filterTagIds);
  setArrayParam(params, "filter.results.entities", input.filterEntityIds);
  setArrayParam(params, "filter.exclude.entities", input.excludeEntityIds);

  if (input.releaseYearMin !== undefined) {
    params.set("filter.release_year.min", String(input.releaseYearMin));
  }
  if (input.releaseYearMax !== undefined) {
    params.set("filter.release_year.max", String(input.releaseYearMax));
  }
  if (input.popularityMin !== undefined) {
    params.set("filter.popularity.min", String(input.popularityMin));
  }
  if (input.popularityMax !== undefined) {
    params.set("filter.popularity.max", String(input.popularityMax));
  }
  if (input.publicationYearMin !== undefined) {
    params.set("filter.publication_year.min", String(input.publicationYearMin));
  }
  if (input.publicationYearMax !== undefined) {
    params.set("filter.publication_year.max", String(input.publicationYearMax));
  }
  if (input.location) {
    params.set("filter.location", input.location);
  }
  if (input.locationRadius !== undefined) {
    params.set("filter.location.radius", String(input.locationRadius));
  }
  if (input.take !== undefined) {
    params.set("take", String(input.take));
  }
  if (input.offset !== undefined) {
    params.set("offset", String(input.offset));
  }
  if (input.trends) {
    params.set("bias.trends", input.trends);
  }
  if (input.explainability !== undefined) {
    params.set("feature.explainability", String(input.explainability));
  }

  return params;
}

function buildSearchEntityParams(input: QlooSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  params.set("query", input.query);
  setArrayParam(params, "types", input.types);
  setArrayParam(params, "filter.tags", input.tags);

  if (input.page !== undefined) {
    params.set("page", String(input.page));
  }
  if (input.take !== undefined) {
    params.set("take", String(input.take));
  }
  if (input.location) {
    params.set("filter.location", input.location);
  }
  if (input.radius !== undefined) {
    params.set("filter.radius", String(input.radius));
  }
  if (input.popularityMin !== undefined) {
    params.set("filter.popularity", String(input.popularityMin));
  }
  if (input.sortBy) {
    params.set("sort_by", input.sortBy);
  }

  return params;
}

function urlFor(baseUrl: string, path: string, params: URLSearchParams): URL {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(path.replace(/^\//, ""), base);
  url.search = params.toString();
  return url;
}

function scoreFromEntity(entity: QlooEntity): number {
  return Math.max(0, Math.min(1, entity.popularity ?? 0));
}

export class QlooClient {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly cacheTtlMs: number;
  private readonly fetcher: typeof fetch;
  private readonly responseCache = new Map<
    string,
    { expiresAt: number; response: QlooEntityResponse }
  >();

  constructor(options: QlooClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_QLOO_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? 8000;
    this.cacheTtlMs = options.cacheTtlMs ?? 300000;
    this.fetcher = options.fetcher ?? fetch;
  }

  private async request(path: string, params: URLSearchParams): Promise<QlooEntityResponse> {
    const url = urlFor(this.baseUrl, path, params);
    const cacheKey = `${url.origin}${url.pathname}?${url.searchParams.toString()}`;
    const cached = this.responseCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.response;
    }

    if (cached) {
      this.responseCache.delete(cacheKey);
    }

    const requestId = globalThis.crypto?.randomUUID?.() ?? `qloo-${Date.now()}-${Math.random()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetcher(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(this.apiKey ? { "X-Api-Key": this.apiKey } : {}),
        },
        signal: controller.signal,
      });
      const responseBody: unknown = await response.json().catch(() => undefined);

      if (!response.ok) {
        throw new QlooApiError(`Qloo request failed with HTTP ${response.status}`, {
          status: response.status,
          path,
          responseBody,
        });
      }

      const normalized = normalizeResponse(responseBody);
      this.responseCache.set(cacheKey, {
        expiresAt: Date.now() + this.cacheTtlMs,
        response: normalized,
      });
      return normalized;
    } catch (error) {
      if (error instanceof QlooApiError) {
        console.error("Qloo request failed", {
          requestId,
          path,
          status: error.status,
        });
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        console.error("Qloo request timed out", { requestId, path });
        throw new QlooNetworkError(`Qloo request timed out after ${this.timeoutMs}ms`, path);
      }

      console.error("Qloo network request failed", { requestId, path });
      throw new QlooNetworkError(
        `Qloo request could not be completed: ${error instanceof Error ? error.message : "unknown error"}`,
        path,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async searchEntities(input: QlooSearchParams): Promise<QlooEntityResponse> {
    if (!input.query.trim()) {
      throw new TypeError("Qloo entity search requires a non-empty query.");
    }

    return this.request("/search", buildSearchEntityParams(input));
  }

  async getEntityDetails(entityIds: string[]): Promise<QlooEntityResponse> {
    const ids = entityIds.map((id) => id.trim()).filter(Boolean);

    if (ids.length === 0) {
      throw new TypeError("Qloo entity details requires at least one entity ID.");
    }

    const params = new URLSearchParams();
    params.set("entity_ids", ids.join(","));
    return this.request("/entities", params);
  }

  async insights(input: QlooInsightsParams): Promise<QlooEntityResponse> {
    return this.request("/v2/insights", buildSearchParams(input));
  }

  async getRecommendations(input: {
    type: QlooEntityType;
    signalEntityIds: string[];
    location?: string;
    take?: number;
    explainability?: boolean;
  }): Promise<QlooRecommendation[]> {
    const response = await this.insights({
      type: input.type,
      signalEntityIds: input.signalEntityIds,
      location: input.location,
      take: input.take ?? 10,
      explainability: input.explainability ?? true,
    });

    return response.entities.map((entity) => ({
      entity,
      score: scoreFromEntity(entity),
      explainability: isRecord(entity.raw.query) ? entity.raw.query : undefined,
    }));
  }

  async eraPool(input: EraPoolParams): Promise<QlooEntityResponse> {
    const type = domainEntityTypes[input.domain];
    const yearFilters = yearFilterTypes.has(type)
      ? {
          releaseYearMin: type === "urn:entity:book" ? undefined : input.year,
          releaseYearMax: type === "urn:entity:book" ? undefined : input.year,
          publicationYearMin: type === "urn:entity:book" ? input.year : undefined,
          publicationYearMax: type === "urn:entity:book" ? input.year : undefined,
        }
      : {};

    return this.insights({
      type,
      ...yearFilters,
      popularityMin: 0.45,
      take: input.take ?? 12,
      trends: "medium",
    });
  }

  async affinity(input: {
    type: QlooEntityType;
    profileEntityIds: string[];
    optionEntityId: string;
  }): Promise<QlooAffinity> {
    const response = await this.insights({
      type: input.type,
      signalEntityIds: input.profileEntityIds,
      filterEntityIds: [input.optionEntityId],
      take: 1,
      explainability: true,
    });
    const entity = response.entities.find((candidate) => candidate.id === input.optionEntityId);

    return {
      entityId: input.optionEntityId,
      score: entity ? scoreFromEntity(entity) : 0,
      source: "qloo",
      contributingEntityIds: entity && isRecord(entity.raw.query)
        ? Object.keys(entity.raw.query)
        : input.profileEntityIds,
    };
  }

  async similarity(input: {
    type: QlooEntityType;
    profileEntityIds: string[];
    comparisonEntityIds: string[];
  }): Promise<number> {
    const response = await this.insights({
      type: input.type,
      signalEntityIds: input.profileEntityIds,
      filterEntityIds: input.comparisonEntityIds,
      take: input.comparisonEntityIds.length,
    });
    const scores = response.entities
      .filter((entity) => input.comparisonEntityIds.includes(entity.id))
      .map(scoreFromEntity);

    return scores.length === 0 ? 0 : scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  async maxMinCandidates(input: {
    type: QlooEntityType;
    profiles: string[][];
    location?: string;
    take?: number;
  }): Promise<QlooRecommendation[]> {
    const recommendations = await Promise.all(
      input.profiles.map((profile) =>
        this.getRecommendations({
          type: input.type,
          signalEntityIds: profile,
          location: input.location,
          take: input.take ?? 20,
        }),
      ),
    );
    const byEntity = new Map<string, QlooRecommendation[]>();

    for (const profileRecommendations of recommendations) {
      for (const recommendation of profileRecommendations) {
        const existing = byEntity.get(recommendation.entity.id) ?? [];
        existing.push(recommendation);
        byEntity.set(recommendation.entity.id, existing);
      }
    }

    return Array.from(byEntity.values())
      .filter((values) => values.length === input.profiles.length)
      .map((values) => ({
        entity: values[0].entity,
        score: Math.min(...values.map((value) => value.score)),
        explainability: {
          profileScores: values.map((value) => value.score),
        },
      }))
      .sort((a, b) => b.score - a.score);
  }
}

export function createQlooClient(options: Partial<QlooClientOptions> = {}): QlooClient {
  const env = parseServerEnv(process.env);

  return new QlooClient({
    apiKey: options.apiKey ?? env.QLOO_API_KEY,
    baseUrl: options.baseUrl ?? env.QLOO_BASE_URL ?? DEFAULT_QLOO_BASE_URL,
    timeoutMs: options.timeoutMs ?? env.QLOO_TIMEOUT_MS,
    cacheTtlMs: options.cacheTtlMs,
    fetcher: options.fetcher,
  });
}

export function getQlooDomainType(domain: QlooDomain): QlooEntityType {
  return domainEntityTypes[domain];
}

export function getQlooResponseMeta(response: QlooEntityResponse): QlooResponseMeta {
  return response.meta;
}
