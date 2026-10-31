import { describe, expect, it } from "vitest";
import {
  authenticateMcpToken,
  callMcpTool,
  createMcpToken,
  listMcpTools,
  revokeMcpToken,
} from "./mcp";

describe("MCP surface", () => {
  it("creates a scoped token and exposes the six judge tools", async () => {
    const created = createMcpToken({ scope: "trusted", label: "test connection" });
    const token = authenticateMcpToken(created.token);

    expect(created.record.label).toBe("test connection");
    expect(listMcpTools()).toHaveLength(6);
    await expect(callMcpTool(token, "list_eras", {})).resolves.toHaveLength(3);
  });

  it("enforces public scope and revocation", async () => {
    const created = createMcpToken({ scope: "public" });
    const token = authenticateMcpToken(created.token);

    await expect(callMcpTool(token, "get_era_profile", { era_id: "now" })).rejects.toThrow(
      "enough scope",
    );
    revokeMcpToken(created.token);
    expect(() => authenticateMcpToken(created.token)).toThrow("invalid or revoked");
  });
});
