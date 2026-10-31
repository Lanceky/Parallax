import { createHash, randomBytes } from "node:crypto";
import { buildCouncil } from "./council";
import { demoSelves } from "./demo-data";
import { compareProfiles, getDemoSelf } from "./timeline";

export type McpScope = "private" | "trusted" | "public";

export interface McpToken {
  id: string;
  tokenHash: string;
  scope: McpScope;
  allowedTools: string[];
  label: string;
  createdAt: string;
  revokedAt?: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const tools: McpTool[] = [
  {
    name: "list_eras",
    description: "List the user's taste eras and completeness.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_era_profile",
    description: "Get the top confirmed entities for one taste era.",
    inputSchema: {
      type: "object",
      properties: { era_id: { type: "string" } },
      required: ["era_id"],
    },
  },
  {
    name: "ask_past_self",
    description: "Ask one approximation of a past self to react to an option.",
    inputSchema: {
      type: "object",
      properties: { era_id: { type: "string" }, option: { type: "string" } },
      required: ["era_id", "option"],
    },
  },
  {
    name: "convene_council",
    description: "Run a grounded council across selected selves.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string" },
        options: { type: "array", items: { type: "string" } },
        era_ids: { type: "array", items: { type: "string" } },
      },
      required: ["question", "options", "era_ids"],
    },
  },
  {
    name: "compare_eras",
    description: "Compare what changed, stayed, and was acquired between two eras.",
    inputSchema: {
      type: "object",
      properties: { from_era_id: { type: "string" }, to_era_id: { type: "string" } },
      required: ["from_era_id", "to_era_id"],
    },
  },
  {
    name: "recommend_for_all_selves",
    description: "Return candidates that keep the selected selves in the same cultural neighborhood.",
    inputSchema: {
      type: "object",
      properties: { era_ids: { type: "array", items: { type: "string" } }, domain: { type: "string" } },
      required: ["era_ids"],
    },
  },
];

const tokens = new Map<string, McpToken>();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function assertScope(scope: McpScope, required: McpScope): void {
  const rank: Record<McpScope, number> = { private: 3, trusted: 2, public: 1 };
  if (rank[scope] < rank[required]) {
    throw new Error("This MCP token does not have enough scope for the requested tool.");
  }
}

export function listMcpTools(): McpTool[] {
  return tools;
}

export function createMcpToken(input: {
  scope: McpScope;
  allowedTools?: string[];
  label?: string;
}): { token: string; record: McpToken } {
  const token = `px_${randomBytes(24).toString("base64url")}`;
  const record: McpToken = {
    id: randomBytes(12).toString("hex"),
    tokenHash: hashToken(token),
    scope: input.scope,
    allowedTools: input.allowedTools?.length ? input.allowedTools : tools.map((tool) => tool.name),
    label: input.label?.trim() || "Parallax connection",
    createdAt: new Date().toISOString(),
  };
  tokens.set(record.tokenHash, record);
  return { token, record };
}

export function authenticateMcpToken(token: string | null): McpToken {
  if (!token) {
    throw new Error("A Parallax MCP bearer token is required.");
  }
  const record = tokens.get(hashToken(token));
  if (!record || record.revokedAt) {
    throw new Error("This Parallax MCP token is invalid or revoked.");
  }
  return record;
}

export function revokeMcpToken(token: string): void {
  const record = tokens.get(hashToken(token));
  if (record) {
    record.revokedAt = new Date().toISOString();
  }
}

function getArgumentString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${key} is required.`);
  }
  return value.trim();
}

function getArgumentStrings(args: Record<string, unknown>, key: string): string[] {
  const value = args[key];
  if (!Array.isArray(value)) {
    throw new TypeError(`${key} must be an array.`);
  }
  const result = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
  if (result.length === 0) {
    throw new TypeError(`${key} must contain at least one value.`);
  }
  return result;
}

export async function callMcpTool(
  token: McpToken,
  name: string,
  argumentsValue: Record<string, unknown>,
): Promise<unknown> {
  if (!token.allowedTools.includes(name)) {
    throw new Error(`Tool ${name} is not allowed for this token.`);
  }

  if (name === "list_eras") {
    assertScope(token.scope, "public");
    return demoSelves.map((self) => ({
      id: self.id,
      label: self.label,
      years: self.years,
      completeness: self.completeness,
      kind: self.kind,
    }));
  }

  if (name === "get_era_profile") {
    assertScope(token.scope, "trusted");
    const self = getDemoSelf(getArgumentString(argumentsValue, "era_id"));
    return {
      id: self.id,
      label: self.label,
      years: self.years,
      entities: self.entities,
      disclosure: "Approximation built from user-approved data.",
    };
  }

  if (name === "ask_past_self") {
    assertScope(token.scope, "trusted");
    const eraId = getArgumentString(argumentsValue, "era_id");
    const option = getArgumentString(argumentsValue, "option");
    const result = buildCouncil({
      question: `Would ${eraId} approve this?`,
      options: [option, "Pass"],
      selfIds: [eraId],
    });
    return {
      eraId,
      option,
      score: result.options.find((item) => item.option === option)?.scores[0],
      disclosure: "This self is an approximation, not the real person.",
    };
  }

  if (name === "convene_council") {
    assertScope(token.scope, "trusted");
    const question = getArgumentString(argumentsValue, "question");
    const options = getArgumentStrings(argumentsValue, "options");
    const eraIds = getArgumentStrings(argumentsValue, "era_ids");
    return buildCouncil({ question, options, selfIds: eraIds, qlooEnabled: true }, { qlooMode: "demo" });
  }

  if (name === "compare_eras") {
    assertScope(token.scope, "trusted");
    const from = getDemoSelf(getArgumentString(argumentsValue, "from_era_id"));
    const to = getDemoSelf(getArgumentString(argumentsValue, "to_era_id"));
    return compareProfiles(from, to);
  }

  if (name === "recommend_for_all_selves") {
    assertScope(token.scope, "trusted");
    const eraIds = getArgumentStrings(argumentsValue, "era_ids");
    const selves = eraIds.map(getDemoSelf);
    const shared = selves
      .flatMap((self) => self.entities)
      .reduce<Map<string, { name: string; count: number }>>((map, entity) => {
        const current = map.get(entity.name) ?? { name: entity.name, count: 0 };
        current.count += 1;
        map.set(entity.name, current);
        return map;
      }, new Map());
    return Array.from(shared.values())
      .filter((entity) => entity.count === selves.length)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  throw new Error(`Unknown MCP tool: ${name}`);
}
