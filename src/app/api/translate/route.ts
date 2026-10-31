import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/env";
import { createQlooClient } from "@/lib/qloo";
import { translateEntity } from "@/lib/timeline";
import { isQlooEntityType } from "@/lib/qloo/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      entityName?: string;
      entityType?: string;
      targetYear?: number;
      direction?: "to_past" | "to_present";
    };
    const entityName = body.entityName?.trim();
    const targetYear = body.targetYear;
    const direction = body.direction;

    if (!entityName || !Number.isInteger(targetYear) || (direction !== "to_past" && direction !== "to_present")) {
      return NextResponse.json({ error: "Entity name, target year, and direction are required." }, { status: 400 });
    }
    const parsedTargetYear = targetYear as number;

    const integration = getIntegrationStatus();
    if (!integration.qloo || !body.entityType || !isQlooEntityType(body.entityType)) {
      return NextResponse.json({
        translation: translateEntity({ entityName, targetYear: parsedTargetYear, direction }),
        source: "demo",
      });
    }

    const client = createQlooClient();
    const search = await client.searchEntities({ query: entityName, take: 1 });
    const source = search.entities[0];
    const sourceType = source?.subtype ?? source?.type;
    if (!source || !sourceType || !isQlooEntityType(sourceType)) {
      return NextResponse.json({
        translation: translateEntity({ entityName, targetYear: parsedTargetYear, direction }),
        source: "demo",
      });
    }

    const recommendations = await client.insights({
      type: sourceType,
      signalEntityIds: [source.id],
      releaseYearMin: direction === "to_past" ? undefined : parsedTargetYear,
      releaseYearMax: direction === "to_past" ? parsedTargetYear : undefined,
      take: 3,
    });
    const candidates = recommendations.entities.map((entity) => entity.name);

    return NextResponse.json({
      translation: translateEntity({ entityName, targetYear: parsedTargetYear, direction, candidates, qlooGrounded: true }),
      source: "qloo",
    });
  } catch (error) {
    console.error("Translation request failed", error);
    return NextResponse.json({ error: "Translation could not be completed." }, { status: 502 });
  }
}
