import { demoSelves, type DemoSelf } from "./demo-data";

export interface TranslatedEntity {
  source: string;
  target: string;
  direction: "to_past" | "to_present";
  targetYear: number;
  confidence: number;
  reason: string;
  qlooGrounded: boolean;
}

export interface DriftSummary {
  from: string;
  to: string;
  kept: string[];
  dropped: string[];
  acquired: string[];
  similarity: number;
}

const translationSeeds: Record<string, string[]> = {
  "Little Simz": ["Burna Boy", "Lauryn Hill", "J. Cole"],
  Tems: ["Burna Boy", "Sade", "Aaliyah"],
  "The Bear": ["Atlanta", "Chef's Table", "Ratatouille"],
  "A.P.C.": ["Carhartt WIP", "Uniqlo U", "Margaret Howell"],
  Kyoto: ["Lisbon", "Lagos", "Seoul"],
  Tacos: ["Jollof rice", "Ramen", "Small plates"],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function calculateProfileSimilarity(
  left: Pick<DemoSelf, "entities">,
  right: Pick<DemoSelf, "entities">,
): number {
  const leftNames = new Set(left.entities.map((entity) => normalize(entity.name)));
  const rightNames = new Set(right.entities.map((entity) => normalize(entity.name)));
  const union = new Set([...leftNames, ...rightNames]);
  if (union.size === 0) {
    return 0;
  }
  const intersection = [...leftNames].filter((name) => rightNames.has(name)).length;
  return Math.round((intersection / union.size) * 100);
}

export function compareProfiles(
  from: Pick<DemoSelf, "label" | "entities">,
  to: Pick<DemoSelf, "label" | "entities">,
): DriftSummary {
  const fromNames = new Set(from.entities.map((entity) => normalize(entity.name)));
  const toNames = new Set(to.entities.map((entity) => normalize(entity.name)));
  const names = new Map([
    ...from.entities.map((entity) => [normalize(entity.name), entity.name] as const),
    ...to.entities.map((entity) => [normalize(entity.name), entity.name] as const),
  ]);

  return {
    from: from.label,
    to: to.label,
    kept: [...fromNames].filter((name) => toNames.has(name)).map((name) => names.get(name) ?? name),
    dropped: [...fromNames].filter((name) => !toNames.has(name)).map((name) => names.get(name) ?? name),
    acquired: [...toNames].filter((name) => !fromNames.has(name)).map((name) => names.get(name) ?? name),
    similarity: calculateProfileSimilarity(from, to),
  };
}

export function translateEntity(input: {
  entityName: string;
  targetYear: number;
  direction: "to_past" | "to_present";
  candidates?: string[];
  qlooGrounded?: boolean;
}): TranslatedEntity {
  const candidates = input.candidates?.length ? input.candidates : translationSeeds[input.entityName] ?? [];
  const target = candidates[0] ?? `${input.entityName} in another era`;

  return {
    source: input.entityName,
    target,
    direction: input.direction,
    targetYear: input.targetYear,
    confidence: input.qlooGrounded ? 0.86 : candidates.length > 0 ? 0.62 : 0.35,
    reason: input.direction === "to_past"
      ? `A closest cultural bridge available by ${input.targetYear}.`
      : `A current-day bridge for the taste signal carried forward from ${input.targetYear}.`,
    qlooGrounded: input.qlooGrounded ?? false,
  };
}

export function getDemoSelf(id: string): DemoSelf {
  const self = demoSelves.find((candidate) => candidate.id === id);
  if (!self) {
    throw new TypeError(`Unknown self: ${id}`);
  }
  return self;
}
