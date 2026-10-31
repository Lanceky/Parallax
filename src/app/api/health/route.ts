import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/env";

export function GET() {
  const integrations = getIntegrationStatus();

  return NextResponse.json({
    service: "parallax",
    status: integrations.valid ? "ok" : "degraded",
    demoMode: integrations.demoMode,
    integrations: {
      qloo: integrations.qloo,
      database: integrations.database,
      llm: integrations.llm,
    },
    configurationErrors: integrations.errors,
  });
}
