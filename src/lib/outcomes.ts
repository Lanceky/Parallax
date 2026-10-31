export type OutcomeValue = -1 | 1 | 2;

export interface SelfTrust {
  eraId: string;
  domain: string;
  alpha: number;
  beta: number;
  accuracy: number;
  sampleSize: number;
}

export function updateSelfTrust(input: {
  current?: Pick<SelfTrust, "alpha" | "beta">;
  wasRight: boolean;
  eraId: string;
  domain: string;
}): SelfTrust {
  const alpha = (input.current?.alpha ?? 1) + (input.wasRight ? 1 : 0);
  const beta = (input.current?.beta ?? 1) + (input.wasRight ? 0 : 1);

  return {
    eraId: input.eraId,
    domain: input.domain,
    alpha,
    beta,
    accuracy: Math.round((alpha / (alpha + beta)) * 100),
    sampleSize: alpha + beta - 2,
  };
}

export function outcomeWasRight(outcome: OutcomeValue, vote: "love" | "meh" | "no"): boolean {
  if (outcome === 2) {
    return vote === "love";
  }
  if (outcome === -1) {
    return vote === "no";
  }
  return vote === "meh" || vote === "love";
}
