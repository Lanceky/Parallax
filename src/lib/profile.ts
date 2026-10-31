import type { DemoEntity, DemoSelf, Provenance } from "./demo-data";

export type SignalSentiment = -2 | -1 | 0 | 1 | 2;

export interface EraSignal {
  qlooEntityId: string;
  name: string;
  domain: string;
  qlooType?: string;
  sentiment: SignalSentiment;
  provenance: Provenance;
  mentions?: number;
  recency?: number;
  confidence?: number;
  scope?: "private" | "trusted" | "public";
}

export interface MergedEntity {
  qlooEntityId: string;
  name: string;
  domain: string;
  qlooType?: string;
  sentiment: SignalSentiment;
  weight: number;
  positiveWeight: number;
  negativeWeight: number;
  mentions: number;
  provenance: Provenance;
  provenanceSet: Provenance[];
  confidence: number;
  scope: "private" | "trusted" | "public";
  conflict: boolean;
}

export interface EraProfile {
  eraId: string;
  label: string;
  years: string;
  completeness: number;
  entities: MergedEntity[];
  conflicts: MergedEntity[];
  topEntities: MergedEntity[];
}

export const SOURCE_TRUST: Record<Provenance, number> = {
  export: 1,
  screenshot: 0.85,
  tap: 0.8,
  photo: 0.6,
  anchor: 0.7,
  inferred: 0.4,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizedRecency(value: number | undefined): number {
  return clamp(value ?? 1, 0, 1);
}

function normalizedMentions(value: number | undefined): number {
  return Math.max(1, Math.floor(value ?? 1));
}

export function calculateSignalWeight(signal: Pick<EraSignal, "sentiment" | "provenance" | "mentions" | "recency">): number {
  return (
    signal.sentiment *
    SOURCE_TRUST[signal.provenance] *
    normalizedRecency(signal.recency) *
    Math.log1p(normalizedMentions(signal.mentions))
  );
}

export function mergeSignals(signals: EraSignal[]): MergedEntity[] {
  const grouped = new Map<string, EraSignal[]>();

  for (const signal of signals) {
    const existing = grouped.get(signal.qlooEntityId) ?? [];
    existing.push(signal);
    grouped.set(signal.qlooEntityId, existing);
  }

  return Array.from(grouped.values())
    .map((entitySignals) => {
      const first = entitySignals[0];
      let positiveWeight = 0;
      let negativeWeight = 0;
      let mentions = 0;

      for (const signal of entitySignals) {
        const weight = calculateSignalWeight(signal);
        mentions += normalizedMentions(signal.mentions);
        if (weight >= 0) {
          positiveWeight += weight;
        } else {
          negativeWeight += Math.abs(weight);
        }
      }

      const netWeight = positiveWeight - negativeWeight;
      const weightedConfidence =
        entitySignals.reduce(
          (sum, signal) =>
            sum + (signal.confidence ?? SOURCE_TRUST[signal.provenance]) * normalizedMentions(signal.mentions),
          0,
        ) / mentions;
      const provenanceSet = Array.from(new Set(entitySignals.map((signal) => signal.provenance)));
      const sentiment: SignalSentiment = netWeight > 0.05 ? 2 : netWeight < -0.05 ? -2 : 0;

      return {
        qlooEntityId: first.qlooEntityId,
        name: first.name,
        domain: first.domain,
        qlooType: first.qlooType,
        sentiment,
        weight: Math.round(netWeight * 1000) / 1000,
        positiveWeight: Math.round(positiveWeight * 1000) / 1000,
        negativeWeight: Math.round(negativeWeight * 1000) / 1000,
        mentions,
        provenance: provenanceSet[0],
        provenanceSet,
        confidence: Math.round(clamp(weightedConfidence, 0, 1) * 100) / 100,
        scope: entitySignals.some((signal) => signal.scope === "private")
          ? ("private" as const)
          : ("trusted" as const),
        conflict: positiveWeight > 0 && negativeWeight > 0,
      };
    })
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
}

export function calculateCompleteness(signals: EraSignal[], targetSignals = 10): number {
  const distinctEntities = new Set(signals.map((signal) => signal.qlooEntityId)).size;
  const sourceBonus = Math.min(0.25, new Set(signals.map((signal) => signal.provenance)).size * 0.05);
  return Math.round(clamp(distinctEntities / targetSignals + sourceBonus, 0, 1) * 100);
}

export function buildEraProfile(input: {
  eraId: string;
  label: string;
  years: string;
  signals: EraSignal[];
  targetSignals?: number;
}): EraProfile {
  const entities = mergeSignals(input.signals);

  return {
    eraId: input.eraId,
    label: input.label,
    years: input.years,
    completeness: calculateCompleteness(input.signals, input.targetSignals),
    entities,
    conflicts: entities.filter((entity) => entity.conflict),
    topEntities: entities.filter((entity) => entity.weight > 0).slice(0, 10),
  };
}

export function profileToDemoSelf(profile: EraProfile, base: Pick<DemoSelf, "kind" | "description" | "voice" | "color">): DemoSelf {
  const entities: DemoEntity[] = profile.topEntities.map((entity) => ({
    name: entity.name,
    domain: entity.domain,
    signal: entity.sentiment > 0 ? "love" : entity.sentiment < 0 ? "avoid" : "curious",
    provenance: entity.provenance,
    confidence: entity.confidence,
  }));

  return {
    id: profile.eraId,
    label: profile.label,
    years: profile.years,
    kind: base.kind,
    description: base.description,
    voice: base.voice,
    color: base.color,
    completeness: profile.completeness,
    entities,
  };
}

export function applyEntityCorrection(
  signals: EraSignal[],
  correction: { qlooEntityId: string; sentiment: SignalSentiment },
): EraSignal[] {
  const filtered = signals.filter((signal) => signal.qlooEntityId !== correction.qlooEntityId);

  if (correction.sentiment === 0) {
    return filtered;
  }

  return [
    ...filtered,
    {
      qlooEntityId: correction.qlooEntityId,
      name: signals.find((signal) => signal.qlooEntityId === correction.qlooEntityId)?.name ?? correction.qlooEntityId,
      domain: signals.find((signal) => signal.qlooEntityId === correction.qlooEntityId)?.domain ?? "Unknown",
      sentiment: correction.sentiment,
      provenance: "tap",
      mentions: 1,
      recency: 1,
      confidence: 1,
    },
  ];
}
