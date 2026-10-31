import { demoSelves, type DemoSelf } from "./demo-data";

export type CouncilMode = "compare" | "approve" | "all-love";
export type Vote = "love" | "meh" | "no";

export interface CouncilStakes {
  price?: number;
  budget?: number;
  reversible?: boolean;
  frequency?: "once" | "monthly" | "often";
}

export interface CouncilRequest {
  question: string;
  options: string[];
  selfIds: string[];
  mode?: CouncilMode;
  qlooEnabled?: boolean;
  stakes?: CouncilStakes;
}

export interface CouncilScore {
  selfId: string;
  selfLabel: string;
  option: string;
  score: number;
  vote: Vote;
  evidence: string[];
  statement: string;
  qlooGrounded: boolean;
}

export interface CouncilOptionResult {
  option: string;
  averageScore: number;
  votes: Record<Vote, number>;
  scores: CouncilScore[];
}

export interface CouncilResult {
  question: string;
  mode: CouncilMode;
  options: CouncilOptionResult[];
  verdict: string;
  compromise: string | null;
  dissent: string;
  regretForecast: string;
  qlooEnabled: boolean;
  qlooMode: "live" | "demo" | "off";
  stakes: CouncilStakes;
}

export function normalizeCouncilRequest(input: CouncilRequest): CouncilRequest {
  const question = input.question.trim();
  const options = Array.from(
    new Set(input.options.map((option) => option.trim()).filter(Boolean)),
  ).slice(0, 5);
  const selfIds = Array.from(new Set(input.selfIds)).slice(0, 6);

  if (question.length < 8) {
    throw new TypeError("The Council needs a specific question.");
  }
  if (options.length < 2) {
    throw new TypeError("Add at least two options for the Council to compare.");
  }
  if (selfIds.length === 0) {
    throw new TypeError("Choose at least one self for the Council table.");
  }

  return {
    question,
    options,
    selfIds,
    mode: input.mode ?? "compare",
    qlooEnabled: input.qlooEnabled ?? true,
    stakes: input.stakes ?? {},
  };
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 2);
}

function scoreOptionAgainstSelf(option: string, self: DemoSelf): {
  score: number;
  evidence: string[];
} {
  const optionTokens = new Set(tokenize(option));
  const evidence = self.entities
    .filter((entity) => {
      const entityTokens = tokenize(entity.name);
      return entityTokens.some((token) => optionTokens.has(token));
    })
    .slice(0, 3)
    .map((entity) => entity.name);
  const domainMatches = self.entities.filter((entity) =>
    optionTokens.has(entity.domain.toLowerCase().replace(/[^a-z0-9]+/g, "")),
  ).length;
  const affinityBoost = evidence.length * 13 + domainMatches * 4;
  const variance = stableHash(`${self.id}:${option}`) % 18;

  return {
    score: Math.min(96, 48 + affinityBoost + variance),
    evidence,
  };
}

function voteForScore(score: number): Vote {
  if (score >= 74) {
    return "love";
  }
  if (score >= 57) {
    return "meh";
  }
  return "no";
}

function statementFor(
  self: DemoSelf,
  option: string,
  score: number,
  evidence: string[],
  qlooGrounded: boolean,
): string {
  const stance = score >= 74 ? "I am in" : score >= 57 ? "I could be persuaded" : "I would pass";
  const evidenceLine = qlooGrounded && evidence.length > 0
    ? ` It connects to ${evidence.join(", ")} in my profile.`
    : qlooGrounded
      ? " The Qloo affinity is present, but my profile has no single decisive anchor."
      : " I am judging this without cultural profile evidence.";

  return `${stance} on ${option}.${evidenceLine}`;
}

function scoreWithQloo(
  local: { score: number; evidence: string[] },
  externalScore: number | undefined,
): { score: number; qlooGrounded: boolean } {
  if (externalScore === undefined) {
    return { score: local.score, qlooGrounded: false };
  }

  return {
    score: Math.round(Math.min(100, Math.max(0, externalScore)) * 10) / 10,
    qlooGrounded: true,
  };
}

export function buildCouncil(
  input: CouncilRequest,
  options: {
    externalScores?: Map<string, number>;
    qlooMode?: "live" | "demo" | "off";
  } = {},
): CouncilResult {
  const request = normalizeCouncilRequest(input);
  const selves = request.selfIds
    .map((id) => demoSelves.find((self) => self.id === id))
    .filter((self): self is DemoSelf => Boolean(self));

  if (selves.length === 0) {
    throw new TypeError("The selected selves are not available.");
  }

  const optionResults = request.options.map((option) => {
    const scores = selves.map((self) => {
      const local = scoreOptionAgainstSelf(option, self);
      const grounded = scoreWithQloo(
        local,
        options.externalScores?.get(`${self.id}::${option}`),
      );
      const vote = voteForScore(grounded.score);

      return {
        selfId: self.id,
        selfLabel: self.label,
        option,
        score: grounded.score,
        vote,
        evidence: local.evidence,
        statement: statementFor(self, option, grounded.score, local.evidence, grounded.qlooGrounded),
        qlooGrounded: grounded.qlooGrounded,
      };
    });
    const votes = scores.reduce<Record<Vote, number>>(
      (counts, score) => ({ ...counts, [score.vote]: counts[score.vote] + 1 }),
      { love: 0, meh: 0, no: 0 },
    );

    return {
      option,
      averageScore: Math.round((scores.reduce((sum, score) => sum + score.score, 0) / scores.length) * 10) / 10,
      votes,
      scores,
    };
  });

  const ranked = [...optionResults].sort((a, b) => b.averageScore - a.averageScore);
  const winningOption = ranked[0];
  const runnerUp = ranked[1];
  const winningVotes = winningOption.votes.love;
  const compromise =
    runnerUp && winningOption.averageScore - runnerUp.averageScore < 8 ? runnerUp.option : null;
  const dissentingSelfs = winningOption.scores
    .filter((score) => score.vote === "no")
    .map((score) => score.selfLabel);
  const lowestScore = [...winningOption.scores].sort((a, b) => a.score - b.score)[0];
  const stakes = request.stakes ?? {};
  const highStakes = (stakes.price ?? 0) > (stakes.budget ?? Number.POSITIVE_INFINITY) || stakes.reversible === false;

  return {
    question: request.question,
    mode: request.mode ?? "compare",
    options: ranked,
    verdict: winningVotes === selves.length
      ? `${winningOption.option} is unanimous.`
      : `${winningOption.option} wins with a ${winningOption.averageScore}/100 average affinity.`,
    compromise,
    dissent: dissentingSelfs.length > 0
      ? `${dissentingSelfs.join(" and ")} disagree${dissentingSelfs.length === 1 ? "s" : ""} with the room.`
      : "No self is strongly opposed.",
    regretForecast: highStakes
      ? `${lowestScore.selfLabel} has the highest regret risk at this price or commitment (${lowestScore.score}/100).`
      : `${lowestScore.selfLabel} is least convinced (${lowestScore.score}/100), so check that perspective before deciding.`,
    qlooEnabled: request.qlooEnabled ?? true,
    qlooMode: options.qlooMode ?? (request.qlooEnabled ? "demo" : "off"),
    stakes,
  };
}
