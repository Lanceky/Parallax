import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/env";
import { eraGridPools, type EraGridCard } from "@/lib/demo-data";
import { createQlooClient } from "@/lib/qloo";
import { QLOO_ENTITY_TYPES, type QlooDomain } from "@/lib/qloo/types";

const domains: QlooDomain[] = ["Music", "Film/TV", "Food", "Fashion", "Games", "Places"];

function isDomain(value: string): value is QlooDomain {
  return domains.includes(value as QlooDomain);
}

function fallbackCards(year: number, domain?: QlooDomain): EraGridCard[] {
  const nearestYear = Object.keys(eraGridPools)
    .map(Number)
    .sort((a, b) => Math.abs(a - year) - Math.abs(b - year))[0];

  return (eraGridPools[nearestYear] ?? []).filter((card) => !domain || card.domain === domain);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year") ?? 2019);
  const domainParam = url.searchParams.get("domain") ?? "All";
  const domain = domainParam === "All" ? undefined : isDomain(domainParam) ? domainParam : null;

  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) {
    return NextResponse.json({ error: "Year must be a valid integer in the supported range." }, { status: 400 });
  }
  if (domain === null) {
    return NextResponse.json({ error: "Domain is not supported." }, { status: 400 });
  }

  const integration = getIntegrationStatus();

  if (!integration.qloo) {
    return NextResponse.json({
      source: "demo",
      year,
      domain: domain ?? "All",
      cards: fallbackCards(year, domain),
    });
  }

  try {
    const client = createQlooClient();
    const requestedDomains = domain ? [domain] : domains;
    const responses = await Promise.all(
      requestedDomains.map((selectedDomain) =>
        client.eraPool({ year, domain: selectedDomain, take: 8 }),
      ),
    );
    const cards = responses.flatMap((response, index) =>
      response.entities.map((entity) => ({
        id: entity.id,
        name: entity.name,
        domain: requestedDomains[index],
        type: entity.subtype ?? entity.type,
        year,
        description: entity.description ?? "A Qloo cultural signal for this era.",
        tags: entity.tags.slice(0, 3).map((tag) => tag.name ?? tag.id),
        imageUrl: entity.imageUrl,
        popularity: entity.popularity ?? 0,
        provenance: "qloo" as const,
      })),
    );

    return NextResponse.json({
      source: "qloo",
      year,
      domain: domain ?? "All",
      supportedEntityTypes: QLOO_ENTITY_TYPES,
      cards,
    });
  } catch (error) {
    console.error("Qloo era pool request failed", error);
    return NextResponse.json(
      {
        error: "Qloo could not load this era pool. Check the API key, base URL, and documented parameters.",
      },
      { status: 502 },
    );
  }
}
