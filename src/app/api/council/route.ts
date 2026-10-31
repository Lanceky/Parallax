import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/env";
import { buildCouncil, normalizeCouncilRequest, type CouncilRequest } from "@/lib/council";
import { createQlooClient } from "@/lib/qloo";
import { isQlooEntityType, type QlooEntity } from "@/lib/qloo/types";
import { demoSelves } from "@/lib/demo-data";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asCouncilRequest(value: unknown): CouncilRequest {
  if (!isRecord(value)) {
    throw new TypeError("Council request must be a JSON object.");
  }

  return normalizeCouncilRequest({
    question: typeof value.question === "string" ? value.question : "",
    options: Array.isArray(value.options) ? value.options.filter((item): item is string => typeof item === "string") : [],
    selfIds: Array.isArray(value.selfIds) ? value.selfIds.filter((item): item is string => typeof item === "string") : [],
    mode: value.mode === "approve" || value.mode === "all-love" ? value.mode : "compare",
    qlooEnabled: value.qlooEnabled !== false,
    stakes: isRecord(value.stakes)
      ? {
          price: typeof value.stakes.price === "number" ? value.stakes.price : undefined,
          budget: typeof value.stakes.budget === "number" ? value.stakes.budget : undefined,
          reversible: typeof value.stakes.reversible === "boolean" ? value.stakes.reversible : undefined,
          frequency: value.stakes.frequency === "once" || value.stakes.frequency === "monthly" || value.stakes.frequency === "often"
            ? value.stakes.frequency
            : undefined,
        }
      : {},
  });
}

async function buildLiveScores(request: CouncilRequest): Promise<Map<string, number>> {
  const client = createQlooClient();
  const selectedSelves = request.selfIds
    .map((id) => demoSelves.find((self) => self.id === id))
    .filter((self): self is (typeof demoSelves)[number] => Boolean(self));
  const optionEntities = new Map<string, QlooEntity>();

  await Promise.all(
    request.options.map(async (option) => {
      const result = await client.searchEntities({ query: option, take: 1 });
      if (result.entities[0]) {
        optionEntities.set(option, result.entities[0]);
      }
    }),
  );

  const profileEntityIds = new Map<string, string[]>();
  await Promise.all(
    selectedSelves.map(async (self) => {
      const ids = await Promise.all(
        self.entities.slice(0, 5).map(async (entity) => {
          const result = await client.searchEntities({ query: entity.name, take: 1 });
          return result.entities[0]?.id;
        }),
      );
      profileEntityIds.set(self.id, ids.filter((id): id is string => Boolean(id)));
    }),
  );

  const scores = new Map<string, number>();
  await Promise.all(
    selectedSelves.flatMap((self) =>
      request.options.map(async (option) => {
        const optionEntity = optionEntities.get(option);
        const entityType = optionEntity?.subtype;
        const profileIds = profileEntityIds.get(self.id) ?? [];
        if (!optionEntity || !entityType || !isQlooEntityType(entityType) || profileIds.length === 0) {
          return;
        }

        const affinity = await client.affinity({
          type: entityType,
          profileEntityIds: profileIds,
          optionEntityId: optionEntity.id,
        });
        scores.set(`${self.id}::${option}`, affinity.score * 100);
      }),
    ),
  );

  return scores;
}

export async function POST(request: Request) {
  try {
    const councilRequest = asCouncilRequest(await request.json());
    const integration = getIntegrationStatus();
    const wantsQloo = councilRequest.qlooEnabled !== false;
    let externalScores: Map<string, number> | undefined;
    let qlooMode: "live" | "demo" | "off" = wantsQloo ? "demo" : "off";

    if (wantsQloo && integration.qloo) {
      externalScores = await buildLiveScores(councilRequest);
      qlooMode = "live";
    }

    return NextResponse.json(
      buildCouncil(councilRequest, {
        externalScores,
        qlooMode,
      }),
    );
  } catch (error) {
    console.error("Council request failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Council request failed." },
      { status: error instanceof TypeError ? 400 : 502 },
    );
  }
}
