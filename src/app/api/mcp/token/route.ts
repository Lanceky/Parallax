import { NextResponse } from "next/server";
import { createMcpToken, revokeMcpToken, type McpScope } from "@/lib/mcp";

const scopes: McpScope[] = ["private", "trusted", "public"];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      scope?: McpScope;
      label?: string;
      allowedTools?: string[];
    };
    const scope = scopes.includes(body.scope ?? "trusted") ? body.scope ?? "trusted" : "trusted";
    const result = createMcpToken({
      scope,
      label: body.label,
      allowedTools: body.allowedTools,
    });
    return NextResponse.json({
      token: result.token,
      record: {
        id: result.record.id,
        scope: result.record.scope,
        allowedTools: result.record.allowedTools,
        label: result.record.label,
        createdAt: result.record.createdAt,
      },
      endpoint: "/mcp",
    });
  } catch (error) {
    console.error("MCP token creation failed", error);
    return NextResponse.json({ error: "Token could not be created." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Bearer token is required." }, { status: 400 });
  }
  revokeMcpToken(token);
  return NextResponse.json({ revoked: true });
}
