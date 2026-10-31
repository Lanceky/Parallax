export const QLOO_ENTITY_TYPES = [
  "urn:entity:artist",
  "urn:entity:book",
  "urn:entity:brand",
  "urn:entity:destination",
  "urn:entity:movie",
  "urn:entity:person",
  "urn:entity:place",
  "urn:entity:podcast",
  "urn:entity:tv_show",
  "urn:entity:video_game",
] as const;

export type QlooEntityType = (typeof QLOO_ENTITY_TYPES)[number];

export type QlooDomain =
  | "Music"
  | "Film/TV"
  | "Food"
  | "Fashion"
  | "Games"
  | "Places";

export interface QlooTag {
  id: string;
  name?: string;
  type?: string;
}

export interface QlooEntity {
  id: string;
  name: string;
  type: QlooEntityType | string;
  subtype?: string;
  domain?: QlooDomain;
  description?: string;
  imageUrl?: string;
  releaseYear?: number;
  popularity?: number;
  tags: QlooTag[];
  raw: Record<string, unknown>;
}

export interface QlooResponseMeta {
  success?: boolean;
  duration?: number;
  page?: number;
  take?: number;
  query?: Record<string, unknown>;
}

export interface QlooEntityResponse {
  entities: QlooEntity[];
  meta: QlooResponseMeta;
}

export interface QlooSearchParams {
  query: string;
  types?: QlooEntityType[];
  page?: number;
  take?: number;
  location?: string;
  radius?: number;
  tags?: string[];
  popularityMin?: number;
  sortBy?: "match" | "distance" | "popularity";
}

export interface QlooInsightsParams {
  type: QlooEntityType;
  signalEntityIds?: string[];
  signalTagIds?: string[];
  filterTagIds?: string[];
  filterEntityIds?: string[];
  excludeEntityIds?: string[];
  popularityMin?: number;
  popularityMax?: number;
  releaseYearMin?: number;
  releaseYearMax?: number;
  publicationYearMin?: number;
  publicationYearMax?: number;
  location?: string;
  locationRadius?: number;
  take?: number;
  offset?: number;
  trends?: "off" | "very_low" | "low" | "mid" | "medium" | "high" | "very_high";
  explainability?: boolean;
}

export interface EraPoolParams {
  year: number;
  domain: QlooDomain;
  take?: number;
}

export interface QlooClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  cacheTtlMs?: number;
  fetcher?: typeof fetch;
}

export interface QlooRecommendation {
  entity: QlooEntity;
  score: number;
  explainability?: Record<string, unknown>;
}

export interface QlooAffinity {
  entityId: string;
  score: number;
  source: "qloo" | "unavailable";
  contributingEntityIds: string[];
}

export function isQlooEntityType(value: string): value is QlooEntityType {
  return QLOO_ENTITY_TYPES.includes(value as QlooEntityType);
}
