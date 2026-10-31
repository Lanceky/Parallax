import { NextResponse } from "next/server";
import {
  authenticateMcpToken,
  callMcpTool,
  listMcpTools,
} from "@/lib/mcp";

export const runtime = "nodejs";

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
}

export async function GET() {
  return NextResponse.json({
    name: "parallax",
    version: "0.1.0",
    transport: "Streamable HTTP",
    endpoint: "/mcp",
    authentication: "Bearer token from /api/mcp/token",
  });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: {
      name?: string;
      arguments?: Record<string, unknown>;
    };
  };

  if (body.method === "initialize") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: body.id ?? null,
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "parallax", version: "0.1.0" },
      },
    });
  }

  let token;
  try {
    token = authenticateMcpToken(bearerToken(request));
  } catch (error) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: body.id ?? null, error: { code: -32001, message: error instanceof Error ? error.message : "Unauthorized" } },
      { status: 401 },
    );
  }

  if (body.method === "tools/list") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: body.id ?? null,
      result: { tools: listMcpTools() },
    });
  }

  if (body.method === "tools/call" && body.params?.name) {
    try {
      const result = await callMcpTool(token, body.params.name, body.params.arguments ?? {});
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id ?? null,
        result: {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
        },
      });
    } catch (error) {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id ?? null,
        error: { code: -32602, message: error instanceof Error ? error.message : "Tool call failed" },
      });
    }
  }

  return NextResponse.json({
    jsonrpc: "2.0",
    id: body.id ?? null,
    error: { code: -32601, message: `Unsupported MCP method: ${body.method ?? "unknown"}` },
  });
}
